---
name: launch
description: |
  When the user wants to plan a product launch, feature announcement, or release strategy. Also use when the user mentions 'launch,' 'Product Hunt,' 'feature release,' 'announcement,' 'go-to-market,' 'beta launch,' 'early access,' 'waitlist,' 'product update,' 'how do I launch this,' 'launch checklist,' 'GTM plan,' or 'we're about to ship.' Use this whenever someone is preparing to release something publicly. For ongoing marketing after launch, see marketing-ideas.
remotion_stage: DEPLOY
integration_type: analytics
pipeline_routes: [product-launch, content-repurpose]
---

# Marketing Launch — Remotion Integration Guide

## Overview
Orchestrates video launch campaigns by coordinating the ORB framework (Owned, Rented, Borrowed channels) with the Remotion rendering pipeline. Used in the **DEPLOY** stage to distribute finished videos to CDN and social channels, with launch-phase metadata driving campaign sequencing and audience targeting.

## Pipeline Role
Operates in the **DEPLOY** stage. After RENDER and TEST produce winning video variants, this skill manages the phased rollout: internal → alpha → beta → early access → full launch. Each phase triggers targeted renders and deployments with channel-specific metadata.

## Integration Pattern
```typescript
// webhook-service/src/app/api/launch/route.ts
import { prisma } from '@/lib/db';
import { renderQueue } from '@/lib/queue';

type LaunchPhase = 'internal' | 'alpha' | 'beta' | 'early-access' | 'full';

interface LaunchCampaign {
  compositionId: string;
  phase: LaunchPhase;
  channels: Array<{ type: 'owned' | 'rented' | 'borrowed'; target: string }>;
  abTestId?: string;
}
export async function POST(req: Request) {
  const campaign = await req.json() as LaunchCampaign;

  // Deploy winning variant if A/B test linked
  let variantProps = {};
  if (campaign.abTestId) {
    const { winner } = await fetch(`${process.env.API_BASE}/api/ab/${campaign.abTestId}`).then(r => r.json());
    if (winner) variantProps = { variant: winner };
  }

  const job = await renderQueue.add('render', {
    compositionId: campaign.compositionId,
    inputProps: { launchPhase: campaign.phase, channels: campaign.channels.map(c => c.target), ...variantProps },
    priority: campaign.phase === 'full' ? 10 : 5,
  });

  await prisma.launchEvent.create({
    data: { phase: campaign.phase, compositionId: campaign.compositionId, jobId: job.id },
  });

  return Response.json({ jobId: job.id, phase: campaign.phase, channels: campaign.channels.length });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `POST /api/launch { compositionId, phase, channels[], abTestId? }` | `{ jobId, phase, channels }` |
| Launch phase + channel targets | CDN deployment URL per channel |
| Optional `abTestId` to deploy winner | Variant override in render props |

## Route Participation

| Route | Usage |
|-------|-------|
| **product-launch** | Full pipeline THINK → DESIGN → RENDER → TEST → DEPLOY. Launch skill drives DEPLOY with phased rollout and ORB channel distribution |
| **content-repurpose** | Repurpose one video into channel-specific formats (LinkedIn clip, TikTok reel, YouTube pre-roll) and deploy each to its target platform |

## Configuration

```bash
export CDN_BASE_URL="https://cdn.example.com/videos"
export STRIPE_SECRET_KEY="sk_live_..."
export LAUNCH_AUTO_ADVANCE_CRON="0 9 * * 1-5"  # optional: phase auto-advance
export LAUNCH_DEFAULT_CHANNELS_FULL="email,social,producthunt"  # optional
```

## Example Pipeline Usage

```typescript
// product-launch route: full campaign from strategy to phased deployment
async function productLaunchPipeline(config: { productName: string }) {
  const script = await skillBridge.generateVideoScript(config.productName, 'bold');
  await renderQueue.add('render', { compositionId: 'ProductLaunchVideo', inputProps: script });
  const phases: LaunchPhase[] = ['internal', 'alpha', 'beta', 'early-access', 'full'];
  for (const phase of phases) {
    await fetch('/api/launch', { method: 'POST', body: JSON.stringify({
      compositionId: 'ProductLaunchVideo', phase, channels: getChannelsForPhase(phase),
    })});
    await delay(phaseDuration(phase));
  }
}
```
