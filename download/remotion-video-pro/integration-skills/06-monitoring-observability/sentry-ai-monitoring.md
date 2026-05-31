---
name: sentry-setup-ai-monitoring
description: Setup Sentry AI Agent Monitoring in any project. Use when asked to monitor LLM calls, track AI agents, track conversations, or instrument OpenAI/Anthropic/Vercel AI/LangChain/Google GenAI/Pydantic AI. Detects installed AI SDKs and configures appropriate integrations.
remotion_stage: TEST
integration_type: monitoring
pipeline_routes: [competitor-intel, product-launch, personalized-videos, ab-testing, content-variation]
---

# Sentry AI Agent Monitoring — Remotion Integration Guide

## Overview

Sentry AI Monitoring instruments LLM calls, agent executions, and tool usage with distributed tracing. In the Remotion Video Pro pipeline, it tracks every AI invocation that generates video props — scripts, scene data, image prompts, and A/B test variants — providing token-level cost attribution per rendered video.

## Pipeline Role

Wraps the THINK and CREATE stages with `gen_ai.*` span telemetry. Each LLM call that produces Remotion composition props is captured with model, token counts, latency, and pipeline context tags. This enables cost-per-video calculations and identifies bottleneck LLM calls slowing render throughput.

## Integration Pattern

Instrument the content generation layer that feeds props into Remotion compositions:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  streamGenAiSpans: true,
  integrations: [Sentry.openAIIntegration()],
});

// Track script generation for Remotion compositions
async function generateVideoProps(input: VideoInput): Promise<CompositionProps> {
  return Sentry.startSpan(
    {
      op: "gen_ai.chat",
      name: `chat ${process.env.LLM_MODEL}`,
      attributes: {
        "gen_ai.request.model": process.env.LLM_MODEL!,
        "gen_ai.operation.name": "chat",
        "gen_ai.agent.name": "video-content-generator",
        "pipeline.route": input.route,
        "pipeline.video_id": input.videoId,
      },
    },
    async (span) => {
      const result = await llm.generateScript(input.prompt);
      span.setAttribute("gen_ai.usage.input_tokens", result.inputTokens);
      span.setAttribute("gen_ai.usage.output_tokens", result.outputTokens);
      return mapToCompositionProps(result, input.route);
    }
  );
}
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `gen_ai.request.model` | `string` | LLM config | Sentry trace |
| `gen_ai.usage.input_tokens` | `number` | LLM response | Sentry + cost dashboard |
| `gen_ai.usage.output_tokens` | `number` | LLM response | Sentry + cost dashboard |
| `pipeline.route` | `string` | Input context | Sentry tag for filtering |
| `pipeline.video_id` | `string` | Render context | Sentry tag for drill-down |

## Route Participation

| Route | Monitored Calls | Key Attributes |
|-------|----------------|----------------|
| competitor-intel | Market analysis → script props | `route: competitor-intel` |
| product-launch | Product copy → launch video props | `route: product-launch` |
| personalized-videos | Per-user data → personalized props | `route: personalized-videos` |
| ab-testing | Variant generation → A/B test props | `route: ab-testing` |
| content-variation | N-version generation → variant props | `route: content-variation` |
| *(all 5 routes)* | Token cost per `pipeline.video_id` | gen_ai dashboard |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_DSN` | Yes | Sentry project DSN |
| `LLM_MODEL` | Yes | Model identifier for span naming |
| `TRACES_SAMPLE_RATE` | No | `1.0` in dev; `0.3` in prod |

## Example Pipeline Usage

```typescript
for (const user of batch) {
  const props = await Sentry.startSpan(
    { op: "gen_ai.invoke_agent", name: "invoke_agent video-personalizer" },
    async () => generateVideoProps({ ...user, route: "personalized-videos" })
  );
  renderQueue.enqueue({ compositionId: "PersonalizedVideo", inputProps: props });
}
```
