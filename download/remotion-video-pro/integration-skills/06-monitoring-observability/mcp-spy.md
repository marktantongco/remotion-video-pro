---
name: mcp-spy
description: Debug MCP server communication. Use for troubleshooting MCP integrations, viewing traffic, and analyzing latency.
remotion_stage: TEST
integration_type: monitoring
pipeline_routes: [competitor-intel, product-launch, personalized-videos, ab-testing, content-variation]
---

# MCP Spy — Remotion Integration Guide

## Overview

MCP Spy inspects Model Context Protocol traffic between Claude and MCP servers. In the Remotion Video Pro pipeline, it debugs skill orchestration latency — identifying which MCP tool calls slow the THINK and CREATE stages that feed props into Remotion compositions.

## Pipeline Role

Operates during TEST as a passive tap on MCP traffic. When a route produces stale props, MCP Spy reveals whether the bottleneck is a server timeout, slow tool response, or protocol error — without modifying pipeline code.

## Integration Pattern

Wrap MCP tool calls with timing instrumentation to surface per-skill latency:

```typescript
// mcp-spy.integration.ts — intercepts MCP calls for latency tracking
interface McpCallLog {
  tool: string;
  server: string;
  durationMs: number;
  status: "ok" | "error" | "timeout";
  timestamp: number;
  pipelineRoute: string;
}

export function createMcpSpyLogger(route: string) {
  const logs: McpCallLog[] = [];

  return {
    recordCall(tool: string, server: string, durationMs: number, status: McpCallLog["status"]) {
      logs.push({ tool, server, durationMs, status, timestamp: Date.now(), pipelineRoute: route });
    },
    getSlowCalls(thresholdMs = 5000): McpCallLog[] {
      return logs.filter((l) => l.durationMs > thresholdMs);
    },
    getFailedCalls(): McpCallLog[] {
      return logs.filter((l) => l.status !== "ok");
    },
    report() {
      console.table(
        logs.sort((a, b) => b.durationMs - a.durationMs).slice(0, 20)
      );
    },
  };
}

// Usage in pipeline route handler
const spy = createMcpSpyLogger("product-launch");
const start = Date.now();
const result = await mcpClient.callTool("firecrawl-scrape", { url });
spy.recordCall("firecrawl-scrape", "firecrawl", Date.now() - start, "ok");
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `tool` | `string` | MCP call name | Spy log + stdout |
| `server` | `string` | MCP server identifier | Spy log |
| `durationMs` | `number` | Measured delta | Spy log + latency dashboard |
| `status` | `"ok"\|"error"\|"timeout"` | MCP response | Spy log + alert trigger |
| `pipelineRoute` | `string` | Active route context | Spy log for filtering |

## Route Participation

| Route | Typical MCP Calls Monitored | Latency Threshold |
|-------|----------------------------|--------------------|
| competitor-intel | firecrawl-scrape, web-search | < 10s per call |
| product-launch | firecrawl-scrape, LLM gen | < 15s per call |
| personalized-videos | LLM gen, data-fetch | < 8s per call |
| ab-testing | LLM gen (N variants) | < 30s total |
| content-variation | LLM gen (N versions) | < 25s total |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_SPY_LOG_DIR` | `~/.claude/debug` | MCP traffic log directory |
| `MCP_SPY_LATENCY_THRESHOLD` | `5000` | Slow-call threshold (ms) |

## Example Pipeline Usage

MCP Spy reveals that `firecrawl-scrape` calls in competitor-intel average 12s — exceeding the 10s threshold. This prompts adding timeout + fallback cache.

```bash
tail -f ~/.claude/debug/mcp-*.log | grep --line-buffered "tool_use\|result"
grep -i "timeout\|slow" ~/.claude/debug/mcp-*.log | grep -oP '"duration":\K[0-9]+'
```
