---
name: council-of-five
description: Spawn 5 Opus subagents with randomly-generated distinct personas to debate a problem from multiple angles. Use when exploring UX decisions, architecture choices, or any decision that benefits from diverse perspectives arguing creatively.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, ab-testing]
---

# Council of Five — Remotion Integration Guide

## Overview
Spawns 5 parallel Opus subagents with unique personas to debate creative direction decisions. Synthesizes divergent viewpoints into a ranked recommendation that the pipeline uses to configure Remotion visual style parameters.

## Pipeline Role
Operates in the **THINK** stage. Consumes a design question from upstream stages. Produces a synthesized recommendation with persona scores that downstream DESIGN and RENDER stages use to set color palette, animation style, text density, and pacing.

## Integration Pattern
The webhook-service fans out 5 parallel LLM calls via `z-ai-web-dev-sdk`, each seeded with a distinct persona.

```typescript
// webhook-service/src/app/api/council-of-five/route.ts
import ZAI from 'z-ai-web-dev-sdk';

interface CouncilResult {
  personas: string[];
  comparison: Array<{ persona: string; argument: string }>;
  winningApproach: string;
}

const PERSONAS = [
  { name: 'Haiku Master', p: 'Every pixel must earn its place.' },
  { name: 'Color Theorist', p: 'Meaning lives in hue and contrast.' },
  { name: 'Lazy User', p: 'I scroll past anything not grabbing me in 0.5s.' },
  { name: 'Chaos Monkey', p: 'What happens on a broken phone at 2am?' },
  { name: 'Storyteller', p: 'Every frame must advance the plot.' },
];

async function runCouncil(question: string): Promise<CouncilResult> {
  const zai = await ZAI.create();
  const debates = await Promise.all(PERSONAS.map(async (p) => {
    const c = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: `You are ${p.name}. ${p.p}` },
        { role: 'user', content: `Debate this video design decision: ${question}` },
      ], thinking: { type: 'disabled' },
    });
    return { persona: p.name, argument: c.choices[0]?.message?.content || '' };
  }));
  const synthesis = await synthesizeResults(zai, question, debates);
  return { personas: PERSONAS.map(p => p.name), comparison: debates, winningApproach: synthesis };
}

export async function POST(req: Request) {
  const { question, jobId } = await req.json();
  const result = await runCouncil(question);
  await db.renderJob.update({ where: { id: jobId }, data: { councilDecision: result } });
  return Response.json({ success: true, result });
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `question: string` — creative decision to debate | `CouncilResult { personas, comparison, winningApproach }` |
| `jobId: string` — render job for metadata | Ranked recommendation with persona comparison |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Debate visual approach — minimalist vs maximalist motion graphics |
| **ab-testing** | Each persona becomes a variant hypothesis for A/B testing |

## Configuration

```bash
export ANTHROPIC_API_KEY="your-key"   # Required
export COUNCIL_TIMEOUT_MS="120000"     # full round timeout
```

## Example Pipeline Usage

```typescript
// ab-testing route: each persona becomes a variant
async function councilDrivenABTest(brief: string) {
  const council = await runCouncil(`What visual style for: ${brief}?`);
  const variants = council.comparison.map((d, i) => ({
    name: `variant-${i}-${council.personas[i]}`,
  }));
  return createABTest({ name: 'council-style', variants }); }
```
