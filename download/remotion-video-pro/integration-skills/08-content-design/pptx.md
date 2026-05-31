---
name: pptx
description: "Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (3) Working with layouts, (4) Adding comments or speaker notes, or any other presentation tasks"
remotion_stage: DEPLOY
integration_type: document_output
pipeline_routes: [product-launch]
---

# PPTX — Remotion Integration Guide

## Overview
Professional PowerPoint presentation generation as a deploy-stage deliverable for video production campaigns. Produces video strategy presentations, campaign pitch decks, and stakeholder briefs that accompany rendered video content in product launch workflows.

## Pipeline Role
In the product-launch route, generates a campaign pitch presentation that mirrors the video narrative structure. Each slide corresponds to a key scene from the storyboard, allowing stakeholders to review the creative direction before or alongside the final rendered video. The presentation serves as the written companion to the video deliverable.

## Integration Pattern
Presentation generation mapping storyboard scenes to slides:

```typescript
import { SkillBridge } from '../../webhook-service/src/lib/skill-bridge';

async function generateCampaignDeck(storyboard: {
  headline: string;
  scenes: Array<{ title: string; narrationLine: string; visualType: string }>;
  videoUrl: string;
  brandColors: { background: string; primary: string; accent: string };
}) {
  const bridge = new SkillBridge();

  // Build slide inventory matching storyboard structure
  const slides = [
    { layout: 'cover', title: storyboard.headline,
      subtitle: 'Product Launch Campaign' },
    ...storyboard.scenes.map((scene, i) => ({
      layout: 'two-column',
      title: `Scene ${i + 1}: ${scene.title}`,
      content: scene.narrationLine,
      visualType: scene.visualType,
    })),
    { layout: 'cta', title: 'Video Deliverable',
      link: storyboard.videoUrl },
  ];

  await bridge.invoke({
    skill: 'pptx',
    action: 'create',
    params: {
      slides,
      colorGroup: storyboard.brandColors,
      aspectRatio: '16:9',
    },
  });
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `slides` | object[] | Slide definitions with layout and content |
| Input | `colorGroup` | object | Background, primary, and accent colors |
| Input | `aspectRatio` | string | '16:9' (widescreen) or '4:3' (standard) |
| Input | `brandAssets` | object[] | Logo and brand image references |
| Output | `filePath` | string | Path to generated .pptx file |
| Output | `slideCount` | number | Total slides generated |

## Route Participation

| Route | Stage | Role | Presentation Types |
|-------|-------|------|-------------------|
| product-launch | DEPLOY | Campaign pitch deck | Strategy presentation matching video narrative |

## Configuration
- **Design philosophy**: Swiss style — whitespace, asymmetry, typographic hierarchy
- **Color system**: One color group per deck (Background/Primary/Accent at 15/80/5%)
- **Workflow**: HTML slides → html2pptx.js → PptxGenJS → visual validation via thumbnails
- **Visual validation**: Thumbnail grid inspection before delivery

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"product-launch","compositionId":"LaunchVideo","metadata":{
    "generateDeck":true,"brandColors":{
      "background":"#F4F1E9","primary":"#15857A","accent":"#FF6A3B"
    }
  }}'
```
A pitch deck is generated alongside the video, with slides mirroring each storyboard scene plus a final CTA slide linking to the rendered video.
