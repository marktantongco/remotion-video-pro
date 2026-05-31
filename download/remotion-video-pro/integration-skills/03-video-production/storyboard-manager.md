---
name: storyboard-manager
description: Assist writers with story planning, character development, plot structuring, chapter writing, timeline tracking, and consistency checking. Use this skill when working with creative writing projects organized in folders containing characters, chapters, story planning documents, and summaries.
remotion_stage: DESIGN
integration_type: ai_processing
pipeline_routes: [product-launch, content-repurpose]
---

# Storyboard Manager — Remotion Integration Guide

## Overview
Pre-production storyboard creation and narrative planning for video projects. Transforms structured story outlines into scene-by-scene breakdowns with timing, transitions, and visual direction that map directly to Remotion composition `<Sequence>` components.

## Pipeline Role
Extends Rule 03 (temporal-design) by providing the narrative architecture that determines scene ordering, timing, and transitions in the final Remotion composition. In the product-launch route, it creates the story arc that drives the video structure. In content-repurpose, it restructures source content into a compelling video narrative.

## Integration Pattern
Storyboard-to-composition mapping with frame-accurate timing:

```typescript
interface StoryboardScene {
  id: string;
  title: string;
  description: string;
  durationFrames: number;  // 30fps
  transition: 'cut' | 'fade' | 'slide-left' | 'zoom';
  visualType: 'text-overlay' | 'product-shot' | 'chart' | 'cta';
  narrationLine?: string;
}

function storyboardToComposition(scenes: StoryboardScene[]) {
  let currentFrame = 0;
  return scenes.map((scene) => {
    const sequence = {
      id: scene.id,
      from: currentFrame,
      durationInFrames: scene.durationFrames,
      visualType: scene.visualType,
      transitionIn: scene.transition,
      narrationLine: scene.narrationLine ?? null,
    };
    currentFrame += scene.durationFrames;
    return sequence;
  });
}

// Maps directly to Remotion:
// <Sequence from={s.from} durationInFrames={s.durationInFrames}>
//   {renderScene(s)}
// </Sequence>
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `outline` | string | Story outline or source content |
| Input | `targetDuration` | number | Total video duration in seconds |
| Input | `style` | string | Narrative style: dramatic, minimal, energetic |
| Output | `scenes` | StoryboardScene[] | Ordered scene breakdown |
| Output | `totalFrames` | number | Total composition length at 30fps |
| Output | `narrationScript` | string | Full voiceover script |

## Route Participation

| Route | Stage | Role | Notes |
|-------|-------|------|-------|
| product-launch | DESIGN | Narrative architect | Structures launch video story arc |
| content-repurpose | DESIGN | Content restructure | Reorganizes source into video narrative |

## Configuration
- **Frame rate**: 30fps (91 frames per second of video)
- **Default transitions**: `fade` between major sections, `cut` within sections
- **Scene types**: hook, problem, solution, social-proof, demo, CTA
- **Duration targets**: 15s (social), 30s (ad), 60s (explainer), 120s (demo)

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"product-launch","compositionId":"LaunchVideo","metadata":{
    "outline":"Hook → Problem → Product reveal → Testimonial → CTA",
    "targetDuration":60
  }}'
```
The DESIGN stage creates a storyboard with 5 timed scenes, each mapped to a Remotion `<Sequence>` in the RENDER stage.
