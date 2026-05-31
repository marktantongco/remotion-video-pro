---
name: firecrawl-crawl
description: |
  Bulk extract content from an entire website or site section. Use this skill when the user wants to crawl a site, extract all pages from a docs section, bulk-scrape multiple pages following links, or says "crawl", "get all the pages", "extract everything under /docs", "bulk extract", or needs content from many pages on the same site. Handles depth limits, path filtering, and concurrent extraction.
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, content-repurpose]
---

# Firecrawl Crawl — Remotion Integration Guide

## Overview
Bulk-extracts content from entire websites or site sections, enabling batch video generation from documentation sites, knowledge bases, or product catalogs.

## Pipeline Role
Operates in the **ACQUIRE** stage. Produces an array of `{ url, title, markdown }` objects that feed into batch rendering pipelines (Core Rule 10).

## Integration Pattern

```typescript
// webhook-service/src/lib/content-ingestion.ts
import { execFileSync } from 'child_process';

interface CrawlResult {
  url: string;
  title: string;
  markdown: string;
}

async function crawlSiteForBatch(
  baseUrl: string,
  includePaths: string,
  limit: number = 50
): Promise<CrawlResult[]> {
  const outputPath = `/tmp/crawl-${Date.now()}.json`;
  execFileSync(
    `firecrawl crawl "${baseUrl}" --include-paths ${includePaths} --limit ${limit} --wait --progress -o ${outputPath}`,
    { timeout: 120000 }
  );

  const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  return data.map((page: any) => ({
    url: page.url,
    title: page.title || extractTitle(page.markdown),
    markdown: page.markdown,
  }));
}

// Batch render each page as a video (Core Rule 10)
async function crawlAndBatchRender(
  baseUrl: string,
  compositionId: string
) {
  const pages = await crawlSiteForBatch(baseUrl, '/docs', 50);

  for (const page of pages) {
    const props = await transformToVideoProps(page);
    await renderQueue.add('render', {
      compositionId,
      inputProps: props,
      metadata: { sourceUrl: page.url },
    });
  }
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `baseUrl`, `includePaths`, `limit` | `CrawlResult[]` — array of `{ url, title, markdown }` |
| Site section URL + crawl config | Up to N pages of structured content |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Crawl competitor entire docs → generate tutorial comparison videos |
| **product-launch** | Crawl changelog directory → auto-generate release videos for each entry |
| **content-repurpose** | Crawl blog section → batch-repurpose articles as short-form videos |

## Configuration

```bash
export FIRECRAWL_API_KEY="fc-..."
npm install -g firecrawl-scraper
# Monitor credit usage before large crawls
firecrawl credit-usage
```

## Example Pipeline Usage

```typescript
// product-launch route: crawl docs → batch render tutorial videos
const docs = await crawlSiteForBatch('https://docs.example.com', '/api', 30);
await batchRender('ApiTutorial', docs.map(d => transformToVideoProps(d)));
```
