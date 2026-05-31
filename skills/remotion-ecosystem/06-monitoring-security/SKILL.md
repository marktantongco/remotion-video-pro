# 06 — Monitoring & Security

Observability, error tracking, AI call tracing, and security auditing
for the entire video production pipeline.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **sentry-ai-monitoring** | LLM call tracing, token tracking, cost attribution (1.4K installs) |
| **sentry-nextjs-sdk** | Next.js webhook service error + performance monitoring |
| **audit-analyzer** | System-wide auditing and security analysis |
| **diagnose** | Systematic debugging and problem diagnosis |
| **mcp-spy** | MCP server traffic debugging and latency analysis |

## Remotion Integration

These skills operate at Stage 5 (TEST) as a cross-cutting concern.
They monitor every stage of the pipeline and provide feedback loops.

### Monitoring Architecture

```
Every pipeline stage
  → sentry-ai-monitoring (trace LLM calls)
  → sentry-nextjs-sdk (trace webhook/API calls)
  → audit-analyzer (periodic security scan)
  → diagnose (debug failures)
  → mcp-spy (debug MCP integrations)
  → feedback loop to Stage 2 (THINK) for optimization
```

### Integration Hooks

**sentry-ai-monitoring → remotion-video-pro:**
- Every AI call during video generation is traced:
  ```javascript
  // In webhook-service/src/app/api/render/route.ts
  const scriptSpan = Sentry.startSpan({
    op: 'gen_ai.chat',
    name: 'chat claude-sonnet-4-6',
    attributes: {
      'gen_ai.request.model': 'claude-sonnet-4-6',
      'gen_ai.operation.name': 'chat',
      'remotion.composition_id': compositionId,
    },
  }, async (span) => {
    const result = await zai.chat.completions.create({...});
    span.setAttribute('gen_ai.usage.input_tokens', result.usage.input);
    span.setAttribute('gen_ai.usage.output_tokens', result.usage.output);
    return result;
  });
  ```

**sentry-nextjs-sdk → remotion-video-pro:**
- Render failures captured with full context (composition ID, props, error)
- Performance monitoring on webhook endpoint latency
- Release tracking per Remotion composition version

**audit-analyzer → fullstack-dev:**
- Weekly security audit of deployed webhook service
- Rate limit effectiveness tracking
- SSRF protection validation

**diagnose → self-improving-agent:**
- Rendering failures diagnosed systematically
- Root cause analysis feeds back to pipeline improvements
- Common failure patterns trigger preventive measures

## Key Dashboards

| Dashboard | What It Shows | Alert Threshold |
|-----------|--------------|-----------------|
| AI Token Usage | Total tokens, cost per model, cache hit rate | >$50/day |
| Render Latency | P50/P95 render time by composition | P95 > 60s |
| Error Rate | Failed renders by error type | >5% failure |
| Pipeline Throughput | Videos/hour through full pipeline | <100/hour |
| A/B Test Significance | Chi-square p-values across active tests | p < 0.05 winner |
