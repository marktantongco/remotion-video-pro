---
name: video-generation
description: Implement AI-powered video generation capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to generate videos from text prompts or images, create video content programmatically, or build applications that produce video outputs. Supports asynchronous task management with status polling and result retrieval.
remotion_stage: RENDER
integration_type: ai_processing
pipeline_routes: [product-launch]
---

# Video Generation — Remotion Integration Guide

## Overview
Programmatic video generation using AI models via the z-ai-web-dev-sdk. Generates B-roll, hero footage, and creative visual clips from text prompts or images with asynchronous task management. These AI-generated clips are embedded as assets within Remotion compositions.

## Pipeline Role
Extends Rule 06 (performance) by managing async AI generation tasks efficiently. In the product-launch route, this skill generates supplementary B-roll footage that Remotion compositions layer with programmatic overlays, text animations, and CTA sequences. Generated video URLs become inputProps for Remotion `<Video>` components.

## Integration Pattern
Async video generation with polling, feeding results into Remotion render props:

```typescript
import ZAI from 'z-ai-web-dev-sdk';

async function generateBrollForComposition(scenes: Array<{
  prompt: string; startFrame: number; duration: number;
}>): Promise<Map<string, string>> {
  const zai = await ZAI.create();
  const assets = new Map<string, string>();

  // Fire all generation tasks in parallel
  const tasks = await Promise.all(scenes.map(async (scene) => {
    const task = await zai.video.generations.create({
      prompt: scene.prompt, quality: 'quality', duration: 5, fps: 30,
    });
    return { id: task.id, key: `broll_${scene.startFrame}` };
  }));

  // Poll until all complete (with backoff per Rule 06)
  for (const { id, key } of tasks) {
    let result = await zai.async.result.query(id);
    let interval = 5000;
    while (result.task_status === 'PROCESSING') {
      await new Promise(r => setTimeout(r, interval));
      interval = Math.min(interval * 1.5, 30000);
      result = await zai.async.result.query(id);
    }
    if (result.task_status === 'SUCCESS') {
      assets.set(key, result.video_result?.[0]?.url ?? '');
    }
  }
  return assets;
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `prompt` | string | Scene description for generation |
| Input | `image_url` | string \| string[] | Base64 or URL for img2vid |
| Input | `quality` | 'speed' \| 'quality' | Generation quality mode |
| Input | `size` | string | Resolution (e.g., '1920x1080') |
| Output | `taskId` | string | Async task ID for polling |
| Output | `videoUrl` | string | CDN URL of generated clip |
| Output | `duration` | number | Clip duration in seconds |

## Route Participation

| Route | Stage | Role | Notes |
|-------|-------|------|-------|
| product-launch | RENDER | B-roll generator | Creates hero footage for launch videos |

## Configuration
- **Quality**: `quality` for final production, `speed` for previews
- **Duration**: 5s (default) or 10s per clip
- **Resolutions**: 1920x1080 (landscape), 1080x1920 (vertical), 1024x1024 (square)
- **Polling**: 5s initial interval, 1.5x backoff, 30s cap, 60 max polls

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"product-launch","compositionId":"LaunchVideo","metadata":{
    "brollPrompts":["Product hero shot on white background","Team collaborating"]
  }}'
```
AI-generated clips are layered into the Remotion composition alongside programmatic title cards and CTA overlays.
