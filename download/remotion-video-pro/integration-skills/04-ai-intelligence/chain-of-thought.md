---
name: chain-of-thought
description: Activate for complex problems that benefit from explicit, step-by-step reasoning before arriving at a conclusion. Covers multi-step analysis, architecture decisions, debugging with causal reasoning, and tasks where showing the reasoning process is as valuable as the answer.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, product-launch, personalized-videos, content-repurpose, ab-testing]
---

# Chain of Thought — Remotion Integration Guide

## Overview
Applies explicit step-by-step reasoning to decompose complex video pipeline problems into verifiable sub-steps. Used for debugging blank frames, planning multi-sequence scripts, and validating render logic before committing Lambda resources.

## Pipeline Role
Operates in the **THINK** stage. Consumes a problem statement or script brief. Produces a numbered reasoning chain with cross-checks and confidence ratings that downstream stages use to validate logic before rendering.

## Integration Pattern
The webhook-service constructs a structured prompt enforcing the 6-step protocol. Results are parsed into a `ReasoningChain` object for auditability.

```typescript
// webhook-service/src/app/api/chain-of-thought/route.ts
import ZAI from 'z-ai-web-dev-sdk';

interface ReasoningChain {
  problem: string;
  steps: Array<{ stepNumber: number; label: string; content: string }>;
  conclusion: string;
  confidence: 'high' | 'medium' | 'low';
}

const COT_PROMPT = `Solve using 6 steps: 1) Restate problem. 2) List assumptions (flag unverifiable).
3) Decompose. 4) Solve with intermediate results. 5) Cross-check. 6) Flag uncertainties.
JSON: { steps: [{stepNumber, label, content}], conclusion, confidence }.`;

async function runChainOfThought(problem: string): Promise<ReasoningChain> {
  const zai = await ZAI.create();
  const c = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: COT_PROMPT },
      { role: 'user', content: problem },
    ], thinking: { type: 'enabled' as const },
  });
  return { problem, ...JSON.parse(c.choices[0]?.message?.content || '{}') };
}

export async function POST(req: Request) {
  const { problem, jobId } = await req.json();
  const chain = await runChainOfThought(problem);
  await db.renderJob.update({ where: { id: jobId }, data: { reasoningChain: chain } });
  return Response.json({ success: true, chain });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `problem: string` — issue or script brief to reason through | `ReasoningChain { problem, steps[], conclusion, confidence }` |
| `jobId: string` — render job for audit trail attachment | Confidence score for downstream gating |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Step-by-step competitor video strategy decomposition |
| **product-launch** | Plan multi-sequence launch scripts; validate narrative arc |
| **personalized-videos** | Verify dynamic props map correctly per segment |
| **content-repurpose** | Decompose articles into clip boundaries with timing |
| **ab-testing** | Debug blank-frame variants; trace prop flow through composition |

## Configuration

```bash
export COT_THINKING_ENABLED="true"     # Optional: extended thinking
export COT_MIN_CONFIDENCE="medium"     # Optional: gate threshold
```

## Example Pipeline Usage

```typescript
// ab-testing route: debug blank-frame variant before re-render
async function debugVariantCoT(jobId: string, symptom: string) {
  const chain = await runChainOfThought(
    `Blank frames at frame 45-60. Symptom: ${symptom}. Props: ${JSON.stringify(await getJobProps(jobId))}`
  );
  if (chain.confidence === 'high') await reEnqueueWithFix(jobId, chain.conclusion);
  return chain;
}
```
