---
name: marketing-mode
description: |
  Marketing Mode combines 23 comprehensive marketing skills covering strategy, psychology, content, SEO, conversion optimization, and paid growth. Use when users need marketing strategy, copywriting, SEO help, conversion optimization, paid advertising, or any marketing tactic.
remotion_stage: TEST
integration_type: analytics
pipeline_routes: [product-launch, content-repurpose]
---

# Marketing Mode — Remotion Integration Guide

## Overview
Marketing-focused mode providing 23 marketing disciplines (strategy, psychology, SEO, CRO, paid ads) as a knowledge layer for the Remotion video pipeline. Used in the **TEST** stage to evaluate video content against marketing frameworks, score copy effectiveness, and feed optimization signals back into the rendering pipeline.

## Pipeline Role
Operates in the **TEST** stage as an advisory layer. After a video is rendered, marketing-mode evaluates the output against conversion frameworks (AIDA, PAS), psychological principles (loss aversion, anchoring), and CRO best practices. It produces an optimization score and actionable feedback that feeds back into THINK/DESIGN for iterative improvements.

## Integration Pattern
```typescript
// webhook-service/src/lib/marketing-evaluator.ts
import { SkillBridge } from './skill-bridge';

interface MarketingEvalResult {
  score: number;              // 0–100 composite score
  framework: string;          // Best-fit: 'PAS', 'AIDA', 'FAB'
  psychologyTriggers: string[];
  recommendations: string[];
}

async function evaluateVideoProps(
  script: { headline: string; bodyLines: string[]; ctaText: string }
): Promise<MarketingEvalResult> {
  const bridge = new SkillBridge();
  const analysis = await bridge.analyzeContent(JSON.stringify(script));

  const text = `${script.headline} ${script.ctaText}`.toLowerCase();
  const triggers: string[] = [];
  if (/don't miss|limited|last chance/.test(text)) triggers.push('loss-aversion');
  if (/free|no cost|zero/.test(text)) triggers.push('reciprocity');
  if (/\d+/.test(text)) triggers.push('anchoring');
  if (/join|others|already/.test(text)) triggers.push('social-proof');

  const score = calculateConversionScore(script, analysis.topics);
  return {
    score, framework: score > 70 ? 'PAS' : 'AIDA', psychologyTriggers: triggers,
    recommendations: generateOptimizationTips(script, triggers),
  };
}
```

## Data Contract

| Input | Output |
|-------|--------|
| Video script `{ headline, bodyLines, ctaText }` | `MarketingEvalResult { score, framework, psychologyTriggers, recommendations }` |
| Analysis topics from THINK stage | Optimization feedback loop to DESIGN stage |
| Rendered video metadata | CRO audit findings and copy improvement suggestions |

## Route Participation

| Route | Usage |
|-------|-------|
| **product-launch** | Evaluate launch video scripts against PAS/AIDA before rendering; score CTA effectiveness and suggest improvements |
| **content-repurpose** | Audit repurposed clips for platform-specific marketing fit (LinkedIn professional vs. TikTok urgency) and recommend edits |

## Configuration

```bash
export MARKETING_KB_PATH="./integration-skills/05-marketing-analytics/marketing-mode.md"
export MARKETING_SCORE_THRESHOLD=60      # optional: min score to proceed to DEPLOY
export MARKETING_DETECT_TRIGGERS=true     # optional: enable psychology trigger detection
```

## Example Pipeline Usage

```typescript
// content-repurpose route: evaluate before deployment, iterate if needed
async function contentRepurposeWithEval(sourceUrl: string) {
  const scraped = await skillBridge.scrapeUrl(sourceUrl);
  const script = await skillBridge.generateVideoScript(scraped.markdown);

  const eval_ = await evaluateVideoProps(script);
  if (eval_.score < 60) {
    // Feed recommendations back into THINK for rewrite
    const revised = await skillBridge.generateVideoScript(
      `${scraped.markdown}\nOptimize: ${eval_.recommendations.join('. ')}`
    );
    return revised;
  }
  await deployToCdn(eval_.framework, script);
}
```
