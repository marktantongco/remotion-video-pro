---
name: fetch
description: "Use this skill when the user wants to retrieve a URL without a full browser session: fetch HTML or JSON from static pages, inspect status codes or headers, follow redirects, or get page source for simple scraping. Prefer it over a browser when JavaScript rendering and page interaction are not needed. Supports proxies and redirect control."
license: MIT
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, content-repurpose]
---

# Fetch — Remotion Integration Guide

## Overview
Lightweight HTTP fetch for static pages, status checks, and webhook health monitoring. Use when you need quick content without browser overhead or JavaScript rendering.

## Pipeline Role
Operates in the **ACQUIRE** stage. Provides fast HTML/JSON retrieval for API health checks, static content scraping, and webhook status validation before triggering renders.

## Integration Pattern

```typescript
// webhook-service/src/lib/simple-fetch.ts
import { Browserbase } from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

async function fetchStaticPage(url: string): Promise<string> {
  const response = await bb.fetchAPI.create({
    url,
    allowRedirects: true,
  });
  if (response.statusCode !== 200) {
    throw new Error(`Fetch failed: ${response.statusCode}`);
  }
  return response.content;
}

// Health check before batch render
async function checkRenderServiceHealth(): Promise<boolean> {
  const res = await fetch('http://localhost:3000/api/health');
  return res.ok;
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `url: string` with fetch options | `{ statusCode, headers, content }` |
| URL + options (redirects, proxies) | Raw HTTP response content |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Quick fetch of competitor API endpoints → pricing data extraction |
| **product-launch** | Verify landing page availability before launch video rendering |
| **content-repurpose** | Fetch article HTML for parsing and repurposing |

## Configuration

```bash
export BROWSERBASE_API_KEY="bb-..."
# Or use native fetch for simple cases (no API key needed)
```

## Example Pipeline Usage

```typescript
// product-launch: verify + fetch before video
const html = await fetchStaticPage('https://product.com/pricing');
const pricingData = extractPricingData(html);
await renderQueue.add('render', {
  compositionId: 'PricingVideo',
  inputProps: pricingData,
});
```
