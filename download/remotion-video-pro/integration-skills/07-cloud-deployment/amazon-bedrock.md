---
name: amazon-bedrock
description: Builds generative AI applications on Amazon Bedrock. Covers model invocation (Converse API, InvokeModel), RAG with Knowledge Bases, Bedrock Agents, Guardrails, and AgentCore. Use when invoking models, setting up Knowledge Bases, creating agents, applying guardrails, deploying to AgentCore, troubleshooting Bedrock errors (ThrottlingException, AccessDeniedException), or choosing models (Claude, Llama, Nova, Titan). NOT for custom model training, Rekognition, or Comprehend.
remotion_stage: THINK
integration_type: ai_processing
pipeline_routes: [competitor-intel, product-launch, personalized-videos, ab-testing]
---

# Amazon Bedrock — Remotion Integration Guide

## Overview

Amazon Bedrock provides managed access to foundation models (Claude, Llama, Nova, Titan) via the Converse API. In the Remotion Video Pro pipeline, Bedrock replaces the z-ai-web-dev-sdk for users who prefer AWS-native AI — generating video scripts, scene breakdowns, and composition props that feed directly into Remotion rendering.

## Pipeline Role

Drives the THINK stage across all four routes. Each route invokes Bedrock's Converse API to generate structured output — scene timelines, copy variants, personalized messages — that maps 1:1 to Remotion composition `inputProps`. Bedrock's prompt caching reduces cost for repeated template structures across batch renders.

## Integration Pattern

Use the Converse API to generate Remotion composition props with explicit token limits:

```typescript
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION! });

interface VideoProps {
  scenes: { text: string; duration: number; color: string }[];
  title: string;
  cta: string;
}

export async function generateVideoProps(prompt: string): Promise<VideoProps> {
  const response = await client.send(
    new ConverseCommand({
      modelId: "us.anthropic.claude-sonnet-4-20250514",
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2048, temperature: 0.7 },
      system: [
        {
          text: `You generate JSON for Remotion compositions. Return only a JSON object
with: { scenes: Array<{text:string, duration:number, color:string}>, title: string, cta: string }`,
        },
      ],
    })
  );

  const text = response.output?.message?.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as VideoProps;
}
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `modelId` | `string` | Bedrock config | Remotion props generator |
| `maxTokens` | `number` | Inference config | Quota reservation |
| `system` | `string[]` | Route-specific template | Converse API |
| `scenes` | `object[]` | LLM JSON output | Remotion composition props |
| `title` / `cta` | `string` | LLM JSON output | Remotion composition props |

## Route Participation

| Route | Bedrock Use Case | Model Suggestion |
|-------|-----------------|-----------------|
| competitor-intel | Analyze competitor content → script | Claude Sonnet |
| product-launch | Product copy + scene breakdown | Claude Sonnet |
| personalized-videos | Per-user personalized messages | Claude Haiku |
| ab-testing | Generate N copy variants | Claude Sonnet |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | Bedrock region (use `us-east-1` for best model access) |
| `BEDROCK_MODEL_ID` | Yes | Cross-region inference profile ID |
| `MAX_TOKENS` | No | Must be set explicitly to avoid quota waste |

## Example Pipeline Usage

Bedrock generates 50 unique scripts from a product spec. Each becomes Remotion props rendered by Lambda. Prompt caching keeps the system prompt warm across all 50 calls, cutting per-call cost ~60%.

```typescript
// Batch generate props for product-launch route
const systemPrompt = buildSystemPrompt("product-launch");
const props = await Promise.all(
  products.map((p) => generateVideoProps(`Product: ${p.name}\n${systemPrompt}`))
);
// Feed to Remotion Lambda render queue
await renderQueue.enqueue(props.map((p) => ({ compositionId: "ProductVideo", inputProps: p })));
```
