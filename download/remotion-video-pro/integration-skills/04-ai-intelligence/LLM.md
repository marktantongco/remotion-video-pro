---
name: LLM
description: Implement large language model (LLM) chat completions using the z-ai-web-dev-sdk. Use this skill when the user needs to build conversational AI applications, chatbots, AI assistants, or any text generation features. Supports multi-turn conversations, system prompts, and context management.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, product-launch, personalized-videos, content-repurpose, ab-testing]
---

# LLM — Remotion Integration Guide

## Overview
The primary content transformer in the pipeline. Converts raw scraped data and analyzed content into typed, validated JSON props that Remotion compositions consume directly, using the `z-ai-web-dev-sdk`.

## Pipeline Role
Operates in the **THINK** stage. Consumes raw markdown from ACQUIRE/ENRICH stages plus reasoning output from THINK-stage peers. Produces `VideoProps` objects — Zod-validated JSON that the RENDER stage injects into Remotion compositions.

## Integration Pattern
The webhook-service invokes `zai.chat.completions.create()` with a system prompt enforcing JSON schema output. Results are validated with Zod before render enqueue.

```typescript
// webhook-service/src/app/api/llm-to-props/route.ts
import ZAI from 'z-ai-web-dev-sdk';
import { z } from 'zod';

const VideoPropsSchema = z.object({
  headline: z.string().max(80),
  bodyLines: z.array(z.string().max(120)).max(6),
  ctaText: z.string().max(40),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  variant: z.enum(['control', 'treatment']),
  pacing: z.enum(['fast', 'medium', 'slow']),
});
type VideoProps = z.infer<typeof VideoPropsSchema>;

const SYSTEM_PROMPT = `You are a video strategist. Transform raw content into Remotion props.
Rules: headline ≤80 chars, bodyLines ≤6 at ≤120 chars each, ctaText ≤40 chars.
Pick accentColor by mood. Set pacing: fast=urgency, slow=explanation.
Respond ONLY with valid JSON.`;

async function generateVideoProps(raw: string, variant: 'control' | 'treatment' = 'control'): Promise<VideoProps> {
  const zai = await ZAI.create();
  const c = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      { role: 'user', content: raw },
    ], thinking: { type: 'disabled' },
  });
  return VideoPropsSchema.parse({ ...JSON.parse(c.choices[0]?.message?.content || '{}'), variant });
}

export async function POST(req: Request) {
  const { content, compositionId, variant, route } = await req.json();
  const props = await generateVideoProps(content, variant);
  await renderQueue.add('render', { compositionId, inputProps: props, route });
  return Response.json({ success: true, props });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `rawContent: string` — scraped markdown | `VideoProps { headline, bodyLines, ctaText, accentColor, variant, pacing }` |
| `variant: 'control' \| 'treatment'` | Zod-validated JSON for Remotion composition |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Transform competitor analysis into comparison video props |
| **product-launch** | Convert changelogs into launch video script props with pacing |
| **personalized-videos** | Generate per-user personalized video props from profile data |
| **content-repurpose** | Repurpose articles into short-form clip props with segment boundaries |
| **ab-testing** | Generate variant-specific props where variant controls composition branching |

## Configuration

```bash
export LLM_MODEL="claude-sonnet-4-20250514"  # model selection
export LLM_RETRIES="3"                       # validation retries
```

## Example Pipeline Usage

```typescript
// content-repurpose: batch transform blog posts into clip props
async function repurposeBatch(posts: Array<{ url: string }>) {
  const results = await Promise.allSettled(posts.map(async (p) => ({
    source: p.url, props: await generateVideoProps((await scrapeForPipeline(p.url)).markdown),
  })));
  await batchRender('ShortFormClip', results.filter(r => r.status === 'fulfilled').map(r => r.value.props));
}
```
