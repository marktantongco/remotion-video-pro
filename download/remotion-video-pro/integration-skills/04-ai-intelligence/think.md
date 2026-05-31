---
name: think
description: Deep multi-framework reasoning using Gemini. Use for complex problem analysis, challenging ideas, and evaluating multiple options with structured thinking.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, product-launch, personalized-videos, content-repurpose, ab-testing]
---

# Think — Remotion Integration Guide

## Overview
Applies structured thinking frameworks (first principles, inversion, second-order effects) to analyze scraped content, plan video strategy, and debug pipeline issues before content enters the Remotion render queue.

## Pipeline Role
Operates in the **THINK** stage. Consumes raw data from upstream ACQUIRE/ENRICH stages. Produces reasoned recommendations and validated decisions that downstream DESIGN and RENDER stages consume as configuration.

## Integration Pattern
The webhook-service invokes Gemini via CLI. Results are stored as structured JSON on the render job.

```typescript
// webhook-service/src/app/api/think/route.ts
interface ThinkResult {
  framework: string;
  analysis: string;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
}

async function runThinkAnalysis(problem: string, frameworks: string[] = ['first-principles', 'inversion']): Promise<ThinkResult> {
  const prompt = `Analyze using frameworks: ${frameworks.join(', ')}.\n\nPROBLEM: ${problem}\n\nRespond in JSON: { framework, analysis, recommendation, confidence }.`;
  const result = execFileSync(`gemini -m pro -o text -e "" "${prompt.replace(/"/g, '\\"')}"`, { timeout: 60000 }).toString();
  return JSON.parse(result);
}

export async function POST(req: Request) {
  const { problem, route, jobId } = await req.json();
  const thinkResult = await runThinkAnalysis(problem);
  await db.renderJob.update({ where: { id: jobId }, data: { thinkAnalysis: thinkResult } });
  return Response.json({ success: true, analysis: thinkResult });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `problem: string` — question or scenario to analyze | `ThinkResult { framework, analysis, recommendation, confidence }` |
| `frameworks?: string[]` — thinking frameworks to apply | Structured JSON with actionable recommendation |
| `route: string` — pipeline route context | Confidence score for downstream gating |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Analyze competitor positioning; apply inversion to find weaknesses |
| **product-launch** | Pre-mortem launch strategy using second-order effects |
| **personalized-videos** | Reason about audience segmentation trade-offs |
| **content-repurpose** | Assess which long-form content maps to short-form video |
| **ab-testing** | Pre-evaluate hypotheses before committing render resources |

## Configuration

```bash
export GEMINI_API_KEY="your-key"        # Required
export GEMINI_MODEL="pro"                # Optional: model override
export THINK_TIMEOUT_MS="60000"         # Optional: analysis timeout
```

## Example Pipeline Usage

```typescript
// ab-testing route: gate hypotheses before rendering
async function abTestThinkGate(hypothesis: string) {
  const analysis = await runThinkAnalysis(
    `A/B test: "${hypothesis}". Apply first-principles and inversion. Will this produce measurable signal?`
  );
  if (analysis.confidence === 'low') return null; // block low-confidence tests
  return generateVariantScripts(analysis);
}
```
