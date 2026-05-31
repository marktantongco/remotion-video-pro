---
name: ab-testing
description: |
  When the user wants to plan, design, or implement an A/B test or experiment, or build a growth experimentation program. Also use when the user mentions "A/B test," "split test," "experiment," "test this change," "variant copy," "multivariate test," "hypothesis," "should I test this," "which version is better," "test two versions," "statistical significance," "how long should I run this test," "growth experiments," "experiment velocity," "experiment backlog," "ICE score," "experimentation program," or "experiment playbook." Use this whenever someone is comparing two approaches and wants to measure which performs better, or when they want to build a systematic experimentation practice. For tracking implementation, see analytics. For page-level conversion optimization, see cro.
remotion_stage: TEST
integration_type: analytics
pipeline_routes: [competitor-intel, product-launch, ab-testing]
---

# A/B Testing — Remotion Integration Guide

## Overview
The deepest marketing analytics integration point. Extends the Prisma `ABTest` model to run statistically rigorous A/B tests on video variants, using chi-square significance testing with Yates correction. The webhook-service exposes `POST /api/ab` for test creation and `GET /api/ab/[id]` for results, while the stripe-webhook assigns variants during render.

## Pipeline Role
Operates in the **TEST** stage. After the RENDER stage produces video variants, this skill evaluates performance metrics (views, click-through, completion rate) and determines statistical significance. Also triggered standalone via the `ab-testing` route for full THINK → DESIGN → RENDER → TEST → DEPLOY flows.

## Integration Pattern
```typescript
// webhook-service/src/app/api/ab/route.ts
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  const { name, variants, primaryMetric, sampleSize } = await req.json();
  if (Object.keys(variants).length < 2) throw new Error('At least 2 variants required');

  const test = await prisma.aBTest.create({
    data: { name, variantKeys: Object.keys(variants), primaryMetric, sampleSize, status: 'running' },
  });
  return Response.json({ testId: test.id, variantKeys: Object.keys(variants) });
}

// webhook-service/src/app/api/ab/[id]/route.ts — Yates-corrected chi-square
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const test = await prisma.aBTest.findUniqueOrThrow({ where: { id: params.id } });
  const metrics = await prisma.aBTestEvent.groupBy({
    by: ['variant'], where: { testId: test.id },
    _sum: { conversions: true, impressions: true },
  });
  const { pValue, significant, winner } = chiSquareYates(metrics, test.primaryMetric);
  return Response.json({ testId: test.id, pValue, significant, winner });
}

// stripe-webhook assigns variant via crypto.randomBytes (Security Rule 6)
const variant = randomBytes(1).readUInt8(0) < 128 ? 'control' : 'treatment';
await renderQueue.add('render', { composition, props, abTestId: test.id, variant });
```

## Data Contract

| Input | Output |
|-------|--------|
| `POST /api/ab { name, variants, primaryMetric, sampleSize }` | `{ testId, variantKeys }` |
| `GET /api/ab/[id]` | `{ testId, pValue, significant, winner }` |
| Render job with `abTestId` + `variant` props | ABTestEvent rows per impression/conversion |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Test two competitor comparison video styles against each other |
| **product-launch** | Compare launch video CTA colors, headlines, or visual styles |
| **ab-testing** | Dedicated route: THINK generates variants, TEST evaluates, DEPLOY ships winner |

## Configuration

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/remotion"
export AB_TEST_DEFAULT_SAMPLE_SIZE=1000   # optional
export AB_TEST_ALPHA_THRESHOLD=0.05       # optional, default significance threshold
```

## Example Pipeline Usage

```typescript
// ab-testing route: create test → render variants → auto-select winner
async function abTestPipeline(config: { compositionId: string; variants: Record<string, unknown> }) {
  const { testId } = await fetch('/api/ab', { method: 'POST', body: JSON.stringify({
    name: `video-ab-${Date.now()}`, variants: config.variants,
    primaryMetric: 'clickThrough', sampleSize: 2000,
  })}).then(r => r.json());

  for (const variant of Object.keys(config.variants)) {
    await renderQueue.add('render', {
      compositionId: config.compositionId,
      inputProps: { ...config.variants[variant], abTestId: testId, variant },
    });
  }

  const results = await fetch(`/api/ab/${testId}`).then(r => r.json());
  if (results.significant) await deployWinner(results.winner, config.compositionId);
}
```
