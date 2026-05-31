---
name: web-search
description: Implement web search capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to search for real-time information from the web, retrieve up-to-date content beyond the knowledge cutoff, or find the latest news and data. Returns structured search results with URLs, snippets, and metadata.
license: MIT
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, product-launch, content-repurpose]
---

# Web Search — Remotion Integration Guide

## Overview
Performs real-time web searches via the z-ai-web-dev-sdk `web_search` function, discovering trending topics, competitor mentions, or timely content for video creation.

## Pipeline Role
Operates in the **ACQUIRE** stage. Returns `{ url, name, snippet }` results that are either scraped for content or used directly as video topic seeds.

## Integration Pattern

```typescript
// webhook-service/src/lib/trending-discovery.ts
import ZAI from 'z-ai-web-dev-sdk';

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  date?: string;
}

async function discoverTrendingTopics(
  query: string,
  recencyDays: number = 7
): Promise<SearchResult[]> {
  const zai = await ZAI.create();
  const results = await zai.functions.invoke('web_search', {
    query,
    num: 10,
    recency_days: recencyDays,
  });

  return results.map((r: any) => ({
    url: r.url,
    name: r.name,
    snippet: r.snippet,
    date: r.date,
  }));
}

// Trending content → auto-generate social video
async function trendingToVideoPipeline() {
  const topics = await discoverTrendingTopics('video marketing trends');
  for (const topic of topics.slice(0, 5)) {
    const props = await generateTrendingVideoProps(topic);
    await renderQueue.add('render', { compositionId: 'TrendingClip', inputProps: props });
  }
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `query: string`, `num?: number`, `recency_days?: number` | `SearchResult[]` — `{ url, name, snippet, date }` |
| Search query + filters | Ranked search results with metadata |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Search competitor name → find latest news mentions for response videos |
| **product-launch** | Search industry keywords → identify trending angles for launch video |
| **content-repurpose** | Search trending topics → auto-generate topical video content |

## Configuration

```bash
# z-ai-web-dev-sdk is pre-installed
# No additional config needed
```

## Example Pipeline Usage

```typescript
// content-repurpose route: search trends → daily video clips
const results = await discoverTrendingTopics('React best practices 2025');
const articles = await Promise.all(
  results.slice(0, 3).map(r => readPageForPipeline(r.url))
);
await batchRender('DailyClip', articles.map(a => transformToVideoProps(a)));
```
