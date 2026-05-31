---
name: fetch
description: "Use this skill when the user wants to retrieve a URL without a full browser session: fetch HTML or JSON from static pages, inspect status codes or headers, follow redirects, or get page source for simple scraping. Prefer it over a browser when JavaScript rendering and page interaction are not needed. Supports proxies and redirect control."
license: MIT
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, content-repurpose]
---

# Browserbase Fetch — Remotion Integration Guide

## Overview
Fetches HTML or JSON from static pages via the Browserbase API without a full browser session. Faster than browser automation, ideal for simple content retrieval and API endpoint checks.

## Pipeline Role
Operates in the **ACQUIRE** stage. Provides fast HTTP content retrieval for static pages, API health checks, and webhook monitoring before batch render jobs.

## Integration Pattern

```typescript
// webhook-service/src/lib/browserbase-fetch.ts
import { Browserbase } from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

async function fetchPage(url: string): Promise<string> {
  const response = await bb.fetchAPI.create({
    url,
    allowRedirects: true,
  });
  return response.content;
}

// Quick API health check before batch rendering
async function preflightCheck(urls: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  for (const url of urls) {
    try {
      const res = await bb.fetchAPI.create({ url, allowRedirects: false });
      results.set(url, res.statusCode === 200);
    } catch { results.set(url, false); }
  }
  return results;
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `url: string` + options | `{ id, statusCode, headers, content, contentType }` |
| URL with fetch options | Full HTTP response including headers |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Fetch competitor public pages for content extraction |
| **product-launch** | Preflight-check all landing pages before launch video campaign |
| **content-repurpose** | Fetch article HTML for content repurposing pipeline |

## Configuration

```bash
export BROWSERBASE_API_KEY="bb-..."
npm install @browserbasehq/sdk
```

## Example Pipeline Usage

```typescript
// product-launch: preflight check before rendering launch videos
const health = await preflightCheck(launchUrls);
const healthy = health.filter((_, v) => v);
await batchRender('LaunchVideo', healthy.map(u => fetchPage(u)));
```
