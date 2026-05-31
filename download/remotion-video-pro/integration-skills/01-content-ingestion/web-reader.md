---
name: web-reader
description: Implement web page content extraction capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to scrape web pages, extract article content, retrieve page metadata, or build applications that process web content. Supports automatic content extraction with title, HTML, and publication time retrieval.
license: MIT
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, personalized-videos, content-repurpose]
---

# Web Reader — Remotion Integration Guide

## Overview
Extracts article content, titles, and metadata from web pages via the z-ai-web-dev-sdk `page_reader` function, providing clean input for the AI content transformation layer.

## Pipeline Role
Operates in the **ACQUIRE** stage. Produces structured `{ title, text, url, publishedTime }` objects that feed directly into LLM-based script and storyboard generation.

## Integration Pattern

```typescript
// webhook-service/src/lib/web-reader.ts
import ZAI from 'z-ai-web-dev-sdk';

interface PageData {
  title: string;
  text: string;
  url: string;
  publishedTime?: string;
}

async function readPageForPipeline(url: string): Promise<PageData> {
  const zai = await ZAI.create();
  const result = await zai.functions.invoke('page_reader', { url });

  const text = result.data.html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: result.data.title,
    text,
    url: result.data.url,
    publishedTime: result.data.publishedTime,
  };
}

// Content repurpose: article → video script
async function articleToVideoScript(url: string) {
  const page = await readPageForPipeline(url);
  const zai = await ZAI.create();

  const script = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: VIDEO_SCRIPT_PROMPT },
      { role: 'user', content: page.text },
    ],
  });

  return JSON.parse(script.choices[0].message.content);
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `url: string` | `PageData { title, text, url, publishedTime }` |
| Valid HTTP/HTTPS URL | Clean text, title, and metadata |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Read competitor press releases → extract key claims for debunk/response videos |
| **personalized-videos** | Read user's recent content → personalize video messaging |
| **content-repurpose** | Read blog posts → transform into video narration scripts |

## Configuration

```bash
# z-ai-web-dev-sdk is pre-installed in webhook-service
# No additional config needed
```

## Example Pipeline Usage

```typescript
// personalized-videos route: read user's blog → personalized video
const page = await readPageForPipeline('https://user.blog.com/latest-post');
const props = await generatePersonalizedVideoProps(page);
await renderQueue.add('render', { compositionId: 'PersonalizedClip', inputProps: props });
```
