---
name: VLM
description: Implement vision-based AI chat capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to analyze images, describe visual content, or create applications that combine image understanding with conversational AI. Supports image URLs and base64 encoded images for multimodal interactions.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, product-launch, personalized-videos]
---

# VLM — Remotion Integration Guide

## Overview
Analyzes product screenshots and candidate hero frames through vision-based AI to score visual quality, extract layout metadata, and select the best assets for Remotion video compositions.

## Pipeline Role
Operates in the **THINK** stage. Consumes image URLs or base64 screenshots from the ENRICH stage (browser-cdp, agent-browser). Produces scored image assessments that downstream DESIGN and RENDER stages use to select hero frames and configure overlays.

## Integration Pattern
The webhook-service invokes `zai.chat.completions.createVision()` with structured prompts enforcing JSON output. Candidates are ranked and the top scorer is attached to the render job.

```typescript
// webhook-service/src/app/api/vlm-analyze/route.ts
import ZAI from 'z-ai-web-dev-sdk';
import { z } from 'zod';

const ImageScoreSchema = z.object({
  imageUrl: z.string().url(),
  visualQuality: z.number().min(1).max(10),
  suitability: z.enum(['hero', 'background', 'thumbnail', 'reject']),
  dominantColors: z.array(z.string()),
  compositionScore: z.number().min(1).max(10),
});

const HERO_PROMPT = `Score visualQuality and compositionScore 1-10. Classify suitability (hero/background/thumbnail/reject). Extract dominantColors as hex. JSON only.`;

async function scoreImage(url: string) {
  const zai = await ZAI.create();
  const r = await zai.chat.completions.createVision({
    messages: [{ role: 'user', content: [
      { type: 'text', text: HERO_PROMPT },
      { type: 'image_url', image_url: { url } },
    ]}], thinking: { type: 'disabled' },
  });
  return ImageScoreSchema.parse({ ...JSON.parse(r.choices[0]?.message?.content || '{}'), imageUrl: url });
}

async function selectHeroFrame(urls: string[]) {
  const scores = await Promise.all(urls.map(scoreImage));
  const hero = scores.filter(s => s.suitability !== 'reject').sort((a, b) => b.compositionScore - a.compositionScore)[0];
  if (!hero) throw new Error('No suitable hero frame');
  return hero;
}

export async function POST(req: Request) {
  const { imageUrls, jobId } = await req.json();
  const hero = await selectHeroFrame(imageUrls);
  await db.renderJob.update({ where: { id: jobId }, data: { heroFrame: hero } });
  return Response.json({ success: true, hero });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `imageUrls: string[]` | `ImageScore { imageUrl, visualQuality, suitability, dominantColors, compositionScore }` |
| `jobId: string` | Best candidate selected; others classified by suitability |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Analyze competitor screenshots — extract color palettes and layout patterns |
| **product-launch** | Score product demo screenshots for hero frame selection in launch videos |
| **personalized-videos** | Analyze profile images to select personalized video backgrounds |

## Configuration

```bash
export VLM_MIN_QUALITY="5"       # quality threshold
export VLM_CONCURRENCY="5"       # concurrent analyses
```

## Example Pipeline Usage

```typescript
// product-launch: capture → score → inject hero into render props
async function launchHeroFrame(url: string) {
  const caps = await captureScreenshots(url, [{ w: 1920, h: 1080 }, { w: 1080, h: 1920 }]);
  const hero = await selectHeroFrame(caps.map(c => c.imageUrl));
  const props = await generateVideoProps(url);
  props.heroImageUrl = hero.imageUrl;
  props.accentColor = hero.dominantColors[0];
  await renderQueue.add('render', { compositionId: 'ProductLaunch', inputProps: props });
}
```
