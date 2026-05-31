---
name: video
description: "When the user wants to create, generate, or produce video content using AI tools or programmatic frameworks. Also use when the user mentions 'video production,' 'AI video,' 'Remotion,' 'Hyperframes,' 'HeyGen,' 'Synthesia,' 'Veo,' 'Sora,' 'Runway,' 'Kling,' 'Seedance,' 'Hailuo,' 'MiniMax,' 'Pika,' 'Hunyuan,' 'Wan,' 'video generation,' 'AI avatar,' 'talking head video,' 'programmatic video,' 'video template,' 'explainer video,' 'product demo video,' 'video pipeline,' or 'make me a video.'"
remotion_stage: RENDER
integration_type: ai_processing
pipeline_routes: [content-repurpose]
---

# Video — Remotion Integration Guide

## Overview
General-purpose video creation spanning programmatic, AI-generated, and avatar-based approaches. Routes to the optimal engine (Remotion, Hyperframes, AI generation) based on content requirements, then integrates with the pipeline for end-to-end rendering.

## Pipeline Role
Extends Rules 01-03 of remotion-video-pro (scaffolding, animation physics, temporal design). Provides the tool selection matrix that determines whether a video is best served by Remotion's React framework, Hyperframes' HTML model, or external AI video APIs. In the content-repurpose route, it transforms existing content into platform-optimized video formats.

## Integration Pattern
Tool selection routing with Remotion as the default programmatic engine:

```typescript
interface VideoToolSelection {
  engine: 'remotion' | 'hyperframes' | 'ai-generation' | 'ai-avatar';
  reason: string;
  compositionId?: string;
}

function selectVideoEngine(request: {
  isTemplated: boolean;
  needsComplexAnimation: boolean;
  batchCount: number;
  hasPresenter: boolean;
}): VideoToolSelection {
  if (request.batchCount > 10 || request.isTemplated) {
    return { engine: 'remotion', reason: 'Batch/templated — Remotion Lambda scale',
             compositionId: 'BatchSocialClip' };
  }
  if (request.hasPresenter) {
    return { engine: 'ai-avatar', reason: 'Presenter required — HeyGen/Synthesia' };
  }
  if (request.needsComplexAnimation && !request.isTemplated) {
    return { engine: 'remotion', reason: 'Complex animation — React + Spring',
             compositionId: 'AnimatedExplainer' };
  }
  return { engine: 'hyperframes', reason: 'Simple HTML frames — agent-friendly' };
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `sourceUrls` | string[] | Content URLs for repurposing |
| Input | `platform` | string | Target: youtube, tiktok, reels, website |
| Input | `engine` | string | Selected rendering engine |
| Output | `renderJobId` | string | Remotion or external render ID |
| Output | `videoUrl` | string | Final rendered video URL |

## Route Participation

| Route | Stage | Role | Notes |
|-------|-------|------|-------|
| content-repurpose | RENDER | Multi-format renderer | Generates platform-specific variants from source content |

## Configuration
- Remotion for: complex animation, batch rendering, Lambda-scale production
- Hyperframes for: agent-generated HTML frames, quick turnaround
- AI generation for: original B-roll, hero footage, creative visuals
- AI avatars for: talking-head explainers, multilingual content

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{
    "route":"content-repurpose",
    "compositionId":"BlogToVideo",
    "sourceUrls":["https://blog.example.com/article"]
  }'
```
The pipeline scrapes content, extracts key points, and this skill renders a video optimized for the target platform using the best-fit engine.
