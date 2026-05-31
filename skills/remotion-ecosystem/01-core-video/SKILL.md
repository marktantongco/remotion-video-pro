# 01 — Core Video

Rendering engine, video strategy, and production approach selection.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **remotion-video-pro** | Central rendering engine — compose React components as frames, batch render via Lambda |
| **marketing-video** | Production approach selection — Remotion vs Hyperframes vs AI generation vs avatars |
| **video-generation** | AI-generated B-roll and hero footage (z-ai-web-dev-sdk) |
| **video-understand** | Analyze reference videos for scene structure and timing |

## Remotion Integration

All skills in this category are primary pipeline components. They operate at
Stage 4 (RENDER) and Stage 5 (TEST).

### Data Flow

```
marketing-video (select approach)
  → remotion-video-pro (compose + render)
  → video-generation (B-roll assets)
  → video-understand (reference analysis)
```

### Integration Hooks

**marketing-video → remotion-video-pro:**
- When marketing-video selects "Programmatic" approach, it routes to remotion-video-pro
- Script output from marketing-video becomes `props.script` for Remotion compositions
- Platform selection (TikTok/YouTube/Web) determines `compositionWidth/Height`

**video-generation → remotion-video-pro:**
- AI-generated video assets become `<OffthreadVideo>` sources in Remotion
- Asset URLs stored in props: `props.brollAssets[]`
- Timing synced via `Sequence` components

**video-understand → remotion-video-pro:**
- Reference video analysis informs scene timing and structure
- Duration estimates feed `Composition.duration` in frames
- Scene breakdown maps to `<Sequence from={frame}>` offsets

## Key Metrics

- Render time per video (target: <30s for 60fps/30s video)
- Lambda cost per render (~$0.003 per 30s video)
- Batch render throughput (target: 1000 videos/hour)
- Variant composition count (A/B testing support)
