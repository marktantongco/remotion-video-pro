---
name: image-generation
description: Implement AI image generation capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to create images from text descriptions, generate visual content, create artwork, design assets, or build applications with AI-powered image creation. Supports multiple image sizes and returns base64 encoded images. Also includes CLI tool for quick image generation.
remotion_stage: DESIGN
integration_type: visual_asset
pipeline_routes: [product-launch, personalized-videos, content-repurpose, ab-testing]
---

# Image Generation — Remotion Integration Guide

## Overview
AI-powered image creation via the z-ai-web-dev-sdk for generating video thumbnails, hero images, background assets, and custom visual elements. Generated images become static or animated assets within Remotion compositions, providing the visual foundation for marketing videos at scale.

## Pipeline Role
Primary visual asset generator across four routes. In product-launch, creates hero images and thumbnails. In personalized-videos, generates customized visuals per user segment. In content-repurpose, produces video thumbnails from source content. In ab-testing, generates variant thumbnails and creative assets for A/B comparison.

## Integration Pattern
Batch image generation feeding Remotion composition inputProps:

```typescript
import ZAI from 'z-ai-web-dev-sdk';

async function generateCompositionAssets(assets: Array<{
  prompt: string; size: string; purpose: 'hero' | 'thumbnail' | 'background';
}>) {
  const zai = await ZAI.create();
  const results = await Promise.all(assets.map(async (a) => {
    const response = await zai.images.generations.create({
      prompt: a.prompt, size: a.size,
    });
    return {
      purpose: a.purpose,
      base64: response.data[0].base64,
      size: a.size,
    };
  }));
  // Results map directly to Remotion <Img> src props
  return Object.fromEntries(results.map((r) => [r.purpose, `data:image/png;base64,${r.base64}`]));
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `prompt` | string | Image description (subject + style + details) |
| Input | `size` | string | '1024x1024', '1344x768', '768x1344', '1440x720' |
| Input | `purpose` | string | Asset role: hero, thumbnail, background, overlay |
| Output | `base64` | string | PNG image data, base64-encoded |
| Output | `assetUrl` | string | Data URI for direct Remotion `<Img>` embedding |

## Route Participation

| Route | Stage | Role | Typical Assets |
|-------|-------|------|-----------------|
| product-launch | DESIGN | Hero + thumbnail | Product hero shot, social thumbnails |
| personalized-videos | DESIGN | Per-user visuals | Custom backgrounds, name overlays |
| content-repurpose | DESIGN | Video thumbnails | Platform-specific thumbnail crops |
| ab-testing | DESIGN | Variant creatives | A/B thumbnail variants, split-test assets |

## Configuration
- **Sizes**: 1920x1080 (hero), 1024x1024 (thumbnail), 1440x720 (banner)
- **Prompt engineering**: Subject + style + details + quality terms
- **Caching**: MD5-based cache key from prompt+size to avoid regeneration
- **Retries**: 3 attempts with exponential backoff on failure

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"product-launch","compositionId":"LaunchVideo","metadata":{
    "imageAssets":[
      {"prompt":"Modern SaaS product hero, dark background","size":"1920x1080","purpose":"hero"},
      {"prompt":"Social media thumbnail, vibrant","size":"1024x1024","purpose":"thumbnail"}
    ]
  }}'
```
Generated images are embedded as data URIs in the Remotion composition's inputProps for rendering.
