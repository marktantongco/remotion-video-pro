# 04 — AI Intelligence

Structured reasoning, multi-perspective debate, and AI model orchestration
for generating video scripts, copy variants, and creative decisions.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **think** | Multi-framework reasoning via Gemini (first principles, pre-mortem, second-order) |
| **council-of-five** | 5-persona parallel debate for creative decisions |
| **amazon-bedrock** | Claude/Llama/Nova model invocation (Converse API, RAG, Agents) |
| **LLM** | Chat completions (z-ai-web-dev-sdk) |
| **VLM** | Vision-language understanding for scene analysis |

## Remotion Integration

These skills operate at Stage 2 (THINK). They transform raw data into
creative decisions, scripts, and storyboard plans that feed Stage 4 rendering.

### Data Flow

```
raw data (from 02-data-ingestion)
  → think (first-principles analysis)
  → council-of-five (multi-angle debate)
  → amazon-bedrock / LLM (script generation)
  → structured output → remotion-video-pro props
```

### Integration Hooks

**think → council-of-five → remotion-video-pro:**
```typescript
// Reasoning pipeline for video strategy
const analysis = await think.deepAnalysis(`
  Given this product data: ${JSON.stringify(productData)}
  What video approach maximizes conversion for ${audienceSegment}?
`);

const perspectives = await councilOfFive(`
  Debate this video approach: ${analysis.recommendation}
  Context: ${JSON.stringify(analysis.context)}
`);

// Synthesize into Remotion composition plan
const compositionPlan = {
  duration: perspectives.consensus.duration,
  scenes: perspectives.synthesized.scenes,
  hook: perspectives.bestHook.text,
  cta: perspectives.bestCTA.text,
  colorScheme: perspectives.visualRecommendation.palette,
};

await remotionVideoPro.render(compositionPlan);
```

**amazon-bedrock → remotion-video-pro:**
- Bedrock Converse API generates video scripts with structured output
- Claude models provide high-quality copy for video overlays
- Llama models can generate multiple variant scripts in parallel
- RAG with Knowledge Bases ensures brand consistency in generated content

**VLM → remotion-video-pro:**
- Analyze reference images to extract color palettes and typography
- Understand existing videos to replicate scene structure
- Validate rendered video frames against design intent

## Cost Tracking

All AI calls should be monitored via sentry-ai-monitoring:
- Track `gen_ai.usage.input_tokens` + `gen_ai.usage.output_tokens`
- Use `gen_ai.request.model` to attribute costs per model
- Set budget alerts via Bedrock cost tracking
