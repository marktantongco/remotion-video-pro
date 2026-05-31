---
name: sentry-nextjs-sdk
description: Full Sentry SDK setup for Next.js. Use when asked to "add Sentry to Next.js", "install @sentry/nextjs", or configure error monitoring, tracing, session replay, logging, profiling, AI monitoring, or crons for Next.js applications. Supports Next.js 13+ with App Router and Pages Router.
remotion_stage: DEPLOY
integration_type: monitoring
pipeline_routes: [product-launch, personalized-videos]
---

# Sentry Next.js SDK — Remotion Integration Guide

## Overview

Full-stack Sentry observability across browser, Node.js server, and Edge runtimes. In the Remotion Video Pro pipeline, it monitors the webhook-service receiving render callbacks, captures Lambda render failures with source-map resolution, and tracks latency from trigger through video delivery.

## Pipeline Role

Wraps the DEPLOY stage webhook-service. When Remotion Lambda finishes, it POSTs a callback to these Next.js routes. Sentry captures errors, performance traces, and session replays — enabling rapid diagnosis of render failures, timeouts, and delivery bottlenecks.

## Integration Pattern

Configure Sentry runtimes for the webhook-service:

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
});

// instrumentation.ts — routes to correct runtime config
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
export const onRequestError = Sentry.captureRequestError;

// app/api/render-callback/route.ts — monitored webhook endpoint
export async function POST(req: Request) {
  const body = await req.json();
  const renderId = body.renderId;
  Sentry.setTag("render.id", renderId);
  Sentry.setTag("render.status", body.status);

  if (body.type === "error") {
    Sentry.captureException(new Error(`Render failed: ${renderId}`), {
      extra: { renderId, output: body.output, errors: body.errors },
    });
  }

  await updateVideoStatus(renderId, body.status, body.outputUrl);
  return Response.json({ ok: true });
}
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `render.id` | `string` | Remotion callback body | Sentry tag |
| `render.status` | `string` | Remotion callback body | Sentry tag |
| `render.errors` | `object[]` | Remotion failure payload | Sentry exception |

## Route Participation

| Route | What Sentry Monitors |
|-------|---------------------|
| product-launch | Batch render callbacks, delivery webhook health |
| personalized-videos | Per-user render status callbacks, Lambda timeout errors |

## Configuration

| Variable | Runtime | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Browser error capture |
| `SENTRY_DSN` | Server/Edge | Webhook error + trace capture |
| `SENTRY_AUTH_TOKEN` | Build | Source map upload |

## Example Pipeline Usage

```typescript
// next.config.ts — wire source maps and tunnel route
import { withSentryConfig } from "@sentry/nextjs";
export default withSentryConfig(nextConfig, {
  org: "remotion-pro",
  project: "webhook-service",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
```
