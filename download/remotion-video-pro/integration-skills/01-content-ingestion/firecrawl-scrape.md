---
name: firecrawl-scrape
description: |
  Extract clean markdown from any URL, including JavaScript-rendered SPAs. Use this skill whenever the user provides a URL and wants its content, says "scrape", "grab", "fetch", "pull", "get the page", "extract from this URL", or "read this webpage". Handles JS-rendered pages, multiple concurrent URLs, and returns LLM-optimized markdown. Use this instead of WebFetch for any webpage content extraction.
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, personalized-videos, content-repurpose]
---

# Firecrawl Scrape — Remotion Integration Guide

## Overview
Extracts clean markdown from any URL (including JS-rendered SPAs) and feeds it into the Remotion video pipeline as raw content for AI transformation or direct prop injection.

## Pipeline Role
Operates in the **ACQUIRE** stage. Takes a target URL, scrapes its content, and produces structured markdown/JSON that downstream skills (LLM, THINK, DESIGN) transform into Remotion composition props.

## Integration Pattern
The webhook-service invokes firecrawl-scrape via the Firecrawl CLI or SDK, then passes results to the AI transformation layer.

```typescript
// webhook-service/src/app/api/scrape-and-render/route.ts
import { execFileSync } from 'child_process';

interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  scrapedAt: string;
}

async function scrapeForPipeline(url: string): Promise<ScrapeResult> {
  // Validate URL against SSRF protection (Security Rule 5)
  if (!isValidUrl(url)) {
    throw new Error('Invalid or unsafe URL');
  }

  const outputPath = `/tmp/scrape-${Date.now()}.md`;
  execFileSync(
    `firecrawl scrape "${url}" --only-main-content -o ${outputPath}`,
    { timeout: 30000 }
  );

  const markdown = fs.readFileSync(outputPath, 'utf-8');
  return { url, title: extractTitle(markdown), markdown, scrapedAt: new Date().toISOString() };
}

// Wire into render pipeline
export async function POST(req: Request) {
  const { url, compositionId } = await req.json();
  const content = await scrapeForPipeline(url);
  const props = await transformToVideoProps(content);

  await renderQueue.add('render', { compositionId, inputProps: props });
  return Response.json({ success: true, jobId: renderQueue.id });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `url: string` (validated) | `ScrapeResult { url, title, markdown, scrapedAt }` |
| Target URL, optional `--only-main-content` flag | Clean markdown suitable for LLM processing |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Scrape competitor product pages → extract features, pricing, positioning for comparison video |
| **product-launch** | Scrape changelog/release notes → auto-generate launch video scripts |
| **personalized-videos** | Scrape user profile pages → generate personalized content video |
| **content-repurpose** | Scrape blog posts → repurpose as TikTok/YouTube Shorts scripts |

## Configuration

```bash
# Required
export FIRECRAWL_API_KEY="fc-..."
# Optional: concurrency limit (default from account)
# CLI install
npm install -g firecrawl-scraper
```

## Example Pipeline Usage

```typescript
// competitor-intel route: scrape competitor → generate comparison video
async function competitorIntelPipeline(competitorUrls: string[]) {
  const results = competitorUrls.map(url => scrapeForPipeline(url));

  // Transform all at once for batch rendering
  const props = await Promise.all(
    results.map(r => transformToVideoProps(r))
  );

  await batchRender('CompetitorComparison', props);
}
```
