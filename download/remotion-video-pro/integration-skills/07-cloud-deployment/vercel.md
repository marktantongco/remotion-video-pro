---
name: vercel
description: Comprehensive Vercel platform skill covering deployment configuration, Edge Functions, AI SDK integration, Next.js best practices, performance optimization, monorepo support, environment management, analytics, and CDN caching strategies.
remotion_stage: DEPLOY
integration_type: deployment
pipeline_routes: [competitor-intel, product-launch, personalized-videos, ab-testing, content-variation]
---

# Vercel — Remotion Integration Guide

## Overview

Vercel hosts the webhook-service, Edge Functions, and CDN for the Remotion Video Pro pipeline. Rendered videos upload to Vercel Blob and deliver through the global CDN. API routes receive Remotion Lambda render callbacks and trigger downstream delivery.

## Pipeline Role

Anchors DEPLOY by hosting the Next.js webhook-service. When Lambda finishes, it POSTs to a Vercel API route that updates status, uploads to Blob, and returns a CDN URL. Edge Functions handle routing and geolocation-based delivery.

## Integration Pattern

Deploy the webhook-service with Edge Function render callbacks and CDN delivery:

```typescript
// app/api/render-callback/route.ts — receives Remotion Lambda callbacks
export const runtime = "edge";

export async function POST(req: Request) {
  const { renderId, status, outputUrl } = await req.json();

  if (status === "done") {
    // Download render from S3, upload to Vercel Blob for CDN delivery
    const blob = await put(`renders/${renderId}.mp4`, await fetch(outputUrl).then((r) => r.arrayBuffer()), {
      access: "public",
      contentType: "video/mp4",
    });
    await updateVideoRecord(renderId, { status: "ready", cdnUrl: blob.url });
    return Response.json({ cdnUrl: blob.url });
  }

  await updateVideoRecord(renderId, { status: "failed", error: outputUrl });
  return Response.json({ ok: false }, { status: 500 });
}
```

```typescript
// vercel.json — CDN caching for rendered video assets
{
  "headers": [
    {
      "source": "/renders/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `renderId` | `string` | Remotion Lambda callback | Database record key |
| `status` | `string` | Remotion Lambda callback | Blob upload or error handler |
| `outputUrl` | `string` | Remotion Lambda (S3) | Download source for Blob upload |
| `cdnUrl` | `string` | Vercel Blob response | Client video player URL |

## Route Participation

| Route | Vercel Component | Edge Function |
|-------|----------------|---------------|
| competitor-intel | Webhook-service + CDN delivery | Geo-routing for global access |
| product-launch | Batch callback handler + CDN | Rate-limited delivery page |
| personalized-videos | Per-user status callbacks | Auth-gated video access |
| ab-testing | Variant render callbacks | Variant URL routing |
| content-variation | Version status tracking | Cache-invalidation triggers |

## Configuration

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Production | Blob storage for rendered videos |
| `REMOTION_S3_BUCKET` | Production | Source bucket for Lambda renders |
| `WEBHOOK_SECRET` | Production | Authenticate Lambda callbacks |
| `VERCEL_TEAM_ID` | Build | Team-scoped Blob permissions |

## Example Pipeline Usage

A personalized-videos pipeline renders 1,000 clips on Lambda. Each callback uploads to Blob and returns a CDN URL — no S3 signed URLs needed.

```bash
# Deploy webhook-service to Vercel
vercel --prod

# Pull environment variables
vercel env pull .env.local
# Required: VERCEL_BLOB_READ_WRITE_TOKEN, REMOTION_S3_BUCKET, WEBHOOK_SECRET
```
