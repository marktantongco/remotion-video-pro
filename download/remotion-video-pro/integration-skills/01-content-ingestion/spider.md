---
name: spider
description: Web crawling and scraping with analysis. Use for crawling websites, security scanning, and extracting information from web pages.
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, content-repurpose]
---

# Spider — Remotion Integration Guide

## Overview
Crawls and analyzes websites using curl + Gemini AI analysis, providing raw content extraction and structured data for the video pipeline.

## Pipeline Role
Operates in the **ACQUIRE** stage. Combines HTTP fetching with AI-powered content extraction to produce structured data from competitor sites, product pages, or any web source.

## Integration Pattern

```typescript
// webhook-service/src/lib/spider-ingestion.ts
import { execFileSync } from 'child_process';

async function spiderAnalyze(url: string): Promise<SpiderResult> {
  // 1. Fetch raw content
  const content = execFileSync(
    `curl -s -H "User-Agent: Mozilla/5.0" "${url}"`,
    { encoding: 'utf-8', timeout: 15000 }
  ).toString();

  // 2. Extract links for deeper crawling
  const links = [...content.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]);

  // 3. AI extraction for structured data
  const zai = await ZAI.create();
  const analysis = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SPIDER_EXTRACTION_PROMPT },
      { role: 'user', content },
    ],
  });

  return { url, content, links, analysis: JSON.parse(analysis) };
}
```

## Data Contract

| Input | Output |
|-------|--------|
| Target URL, optional extraction prompt | `{ url, content, links, analysis }` |
| URL string | Raw HTML + structured analysis + discovered links |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Crawl competitor sites → extract pricing, features, positioning data |
| **product-launch** | Scrape product pages → extract specs for feature announcement videos |
| **content-repurpose** | Crawl article sites → extract and repurpose for video scripts |

## Configuration

```bash
export GEMINI_API_KEY="your_key"
pip install google-generativeai
```

## Example Pipeline Usage

```typescript
// competitor-intel route: spider competitor → structured analysis → video
const analysis = await spiderAnalyze('https://competitor.com/pricing');
await renderQueue.add('render', {
  compositionId: 'CompetitorAnalysis',
  inputProps: { data: analysis },
});
```
