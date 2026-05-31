---
name: infographic-gen
version: 1.0.0
description: Generate publication-ready infographics from content. Use when transforming data, articles, reports, or concepts into visual infographic format. Covers 21 layout patterns across 20 visual styles, automated layout and style recommendations, multilingual support, and multiple aspect ratios. Suitable for marketing materials, data reports, social media, educational content, and business presentations.
remotion_stage: DESIGN
integration_type: visual_asset
pipeline_routes: [competitor-intel]
---

# Infographic Gen — Remotion Integration Guide

## Overview
Infographic generation that produces frame-ready visual summaries for embedding within Remotion video compositions. Transforms competitor data, market research, and analytical content into visually rich infographic frames that animate as standalone segments in comparison and analysis videos.

## Pipeline Role
In the competitor-intel route, generates infographic-style frames that visualize competitor positioning, market share data, feature comparisons, and strategic insights. These infographic segments appear as dedicated scenes within the Remotion competitor comparison video, providing data-rich visual content between narrative segments.

## Integration Pattern
Infographic generation with scene-level timing for Remotion:

```typescript
async function generateInfographicScene(data: {
  content: string;
  layout: 'comparison' | 'timeline' | 'ranking' | 'process-map';
  style: 'corporate' | 'minimalist' | 'neon';
  durationSeconds: number;
}) {
  // Generate infographic as high-res PNG
  const infographicImage = await generateInfographic({
    content: data.content,
    layoutPattern: data.layout,
    visualStyle: data.style,
    aspectRatio: '16:9',
  });
  return {
    type: 'infographic-frame',
    base64: infographicImage.base64,
    durationInFrames: data.durationSeconds * 30,
    // Parallax animation config for Remotion
    animation: {
      type: 'parallax-scroll',
      scrollSpeed: infographicImage.height / (data.durationSeconds * 30),
    },
  };
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `content` | string | Source data/article for visualization |
| Input | `layoutPattern` | string | 1 of 21 layouts (bar, timeline, process-map, etc.) |
| Input | `visualStyle` | string | 1 of 20 styles (corporate, neon, minimalist, etc.) |
| Input | `aspectRatio` | string | '16:9' (video), '1:1' (social), '9:16' (stories) |
| Output | `base64` | string | Rendered infographic PNG, base64-encoded |
| Output | `height` | number | Pixel height for parallax scroll calculation |

## Route Participation

| Route | Stage | Role | Infographic Types |
|-------|-------|------|-------------------|
| competitor-intel | DESIGN | Data visualization frames | Feature comparison, market share, SWOT analysis |

## Configuration
- **Layouts**: 21 patterns (data-driven, list-based, narrative, spatial, specialized)
- **Styles**: 20 visual styles auto-selected based on content analysis
- **Animation**: Parallax-scroll for tall infographics, scale-in for compact ones
- **Languages**: Auto-adapts typography for English, Chinese, Japanese, Korean, and more

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"competitor-intel","compositionId":"CompetitorComparisonVideo",
    "sourceUrls":["https://competitor.com"],"metadata":{
    "infographic":{"layout":"comparison","style":"corporate","durationSeconds":8}
  }}'
```
An infographic comparison frame is generated and embedded as a Remotion scene with parallax scroll animation over 8 seconds (240 frames).
