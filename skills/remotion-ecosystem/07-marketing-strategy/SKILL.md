# 07 — Marketing Strategy

Growth experimentation, launch campaigns, and content strategy that
drive the business decisions behind video production.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **marketing-ab-testing** | Hypothesis design, chi-square significance, ICE scoring, experiment programs |
| **marketing-launch** | 5-phase launch framework (ORB channels: Owned/Rented/Borrowed) |
| **marketing-mode** | Growth marketing orchestration |
| **content-strategy** | Content planning and pillar strategy |

## Remotion Integration

These skills operate at Stage 5 (TEST) and Stage 6 (DEPLOY). They determine
what videos to produce, how to test them, and how to distribute them.

### Data Flow

```
marketing-launch (plan campaign)
  → marketing-ab-testing (design video experiments)
  → remotion-video-pro (render variants)
  → marketing-launch (distribute winning variant)
  → charts (visualize results)
  → pdf (generate campaign report)
```

### Integration Hooks

**marketing-ab-testing ↔ remotion-video-pro (Bi-directional):**

This is the deepest integration point. The remotion-video-pro webhook service
already has Prisma ABTest, RenderAnalytics, and extended RenderJob models.

```typescript
// In webhook-service/src/app/api/ab/route.ts
// marketing-ab-testing provides the methodology
// remotion-video-pro provides the rendering

// 1. Create A/B test with video variants
const test = await prisma.aBTest.create({
  data: {
    name: 'Hook Variation Test',
    hypothesis: 'Emotional hook increases email_opened by 20%',
    variants: {
      create: [
        { name: 'Control', script: controlScript },
        { name: 'Emotional Hook', script: emotionalScript },
      ]
    }
  }
});

// 2. Render variants
for (const variant of test.variants) {
  await renderVideo({
    compositionId: variant.compositionVersionId,
    props: { script: variant.script },
    metadata: { abTestId: test.id, variantId: variant.id },
  });
}

// 3. Track events (email_opened, video_played, converted)
// 4. Calculate chi-square significance
const result = chiSquareYates(test.events);
// 5. Promote winner to active composition
```

**marketing-launch → remotion-video-pro:**
- Phase 3 (Beta): Teaser videos rendered via Remotion
- Phase 5 (Full Launch): Product demo videos, social clips
- Post-launch: Update videos based on feedback

**content-strategy → remotion-video-pro:**
- Content calendar drives video production schedule
- Pillar content mapped to video series
- Repurposing strategy: long-form → short-form video clips

## Experiment Velocity

Target: 4-8 video experiments per month
- Week 1: Design hypothesis + render variants
- Week 2-3: Run test (collect events)
- Week 4: Analyze + promote winner + design next test
