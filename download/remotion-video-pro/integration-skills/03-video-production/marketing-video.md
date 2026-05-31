---
name: marketing-video
description: "When the user wants to create, generate, or produce video content using AI tools or programmatic frameworks. Also use when the user mentions 'video production,' 'AI video,' 'Remotion,' 'Hyperframes,' 'HeyGen,' 'Synthesia,' 'Veo,' 'Sora,' 'Runway,' 'Kling,' 'Seedance,' 'Hailuo,' 'MiniMax,' 'Pika,' 'Hunyuan,' 'Wan,' 'video generation,' 'AI avatar,' 'talking head video,' 'programmatic video,' 'video template,' 'explainer video,' 'product demo video,' 'video pipeline,' or 'make me a video.' Use this for video creation, generation, and production workflows."
remotion_stage: RENDER
integration_type: ai_processing
pipeline_routes: [product-launch, content-repurpose, ab-testing]
---

# Marketing Video — Remotion Integration Guide

## Overview
AI video production for marketing campaigns. Integrates with Remotion to render programmatic marketing videos at scale, combining AI-generated B-roll, avatar presenters, and data-driven overlays into composition-based video pipelines.

## Pipeline Role
Acts as the primary RENDER stage executor. Receives structured video scripts from the THINK stage, design assets from DESIGN, and produces final MP4 outputs via Remotion Lambda. Extends Rule 07 (prompt-templates) for production approach selection and AI video model comparison.

## Integration Pattern
Production approach routing with Remotion as the programmatic backbone:

```typescript
import { SkillBridge } from '../webhook-service/src/lib/skill-bridge';

const bridge = new SkillBridge();

async function selectProductionApproach(config: {
  goal: 'explainer' | 'demo' | 'social-clip' | 'ad';
  hasPresenter: boolean;
  budget: 'low' | 'medium' | 'high';
}) {
  // Remotion for templated, data-driven content
  if (config.goal === 'social-clip' || config.goal === 'ad') {
    const script = await bridge.generateVideoScript(content, 'bold');
    return { engine: 'remotion', compositionId: 'SocialAdVideo', script };
  }
  // AI avatars via z-ai-web-dev-sdk for presenter content
  if (config.hasPresenter) {
    const zai = await ZAI.create();
    const task = await zai.video.generations.create({ prompt, quality: 'quality' });
    return { engine: 'ai-avatar', taskId: task.id };
  }
  return { engine: 'remotion', compositionId: 'ProductDemoVideo' };
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `script.headline` | string | Video title/hook text |
| Input | `script.bodyLines` | string[] | Narration lines for scenes |
| Input | `script.ctaText` | string | Call-to-action overlay text |
| Input | `assets.thumbnail` | base64 | AI-generated hero image |
| Input | `variantConfig` | object | Tone, duration, aspect ratio |
| Output | `renderJobId` | string | Remotion Lambda render job ID |
| Output | `videoUrl` | string | CDN URL of rendered MP4 |

## Route Participation

| Route | Stage | Role | Required Inputs |
|-------|-------|------|-----------------|
| product-launch | RENDER | Primary video renderer | Script from THINK, assets from DESIGN |
| content-repurpose | RENDER | Format-specific rendering | Source content analysis, platform specs |
| ab-testing | RENDER | Multi-variant rendering | Variant configs from TEST stage |

## Configuration
- **Default composition**: `ProductLaunchVideo` for launches, `SocialAdVideo` for clips
- **AI model priority**: Veo 3 / Sora 2 for quality; Kling / Seedance for volume
- **Aspect ratios**: 16:9 (YouTube/web), 9:16 (social), 1:1 (feeds)

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"product-launch","compositionId":"ProductLaunchVideo"}'
```
The pipeline THINK stage generates a marketing script, DESIGN creates thumbnails via image-generation, and this skill renders the final video on Remotion Lambda.
