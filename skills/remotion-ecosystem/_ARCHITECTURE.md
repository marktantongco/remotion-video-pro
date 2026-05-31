# Remotion Ecosystem — Architecture Detail

## Data Flow Model

```
                    ┌─────────────────────────┐
                    │    External Data         │
                    │  (Web, CRM, APIs, DB)    │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │ 02-data-ingestion             │
              │ firecrawl-scrape/crawl        │
              │ spider, web-reader/search    │
              │ browserbase-fetch             │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │ 03-browser-automation          │
              │ browser-cdp (auth content)     │
              │ agent-browser (interaction)    │
              │ browserbase-autobrowse         │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Data Store     │
                    │ (PostgreSQL +    │
                    │  Redis Queue)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                                       │
    ┌────▼─────┐                           ┌────▼──────┐
    │ 04-ai-   │                           │ 05-content │
    │ intellig. │                           │ design      │
    │           │                           │             │
    │ think     │                           │ image-gen   │
    │ council-5 │                           │ charts      │
    │ bedrock   │◄──prompt/context────►     │ ui-ux-max   │
    │ LLM/VLM   │                           │ shader-ext  │
    └────┬──────┘                           └──────┬─────┘
         │                                         │
         └─────────────┬───────────────────────────┘
                       │
              ┌────────▼────────┐
              │ 01-core-video   │
              │                  │
              │ remotion-video-  │
              │ pro (compose +   │
              │ batch render)    │
              │ marketing-video  │
              │ video-generation │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │                           │
    ┌────▼──────────┐          ┌────▼──────────┐
    │ 06-monitoring  │          │ 07-marketing    │
    │ security       │          │ strategy        │
    │                │          │                 │
    │ sentry-ai      │          │ ab-testing      │
    │ sentry-nextjs  │          │ marketing-launch│
    │ audit-analyzer │          │ marketing-mode  │
    │ diagnose       │          │ content-strat   │
    │ mcp-spy        │          │                 │
    └────┬──────────┘          └────┬──────────┘
         │                           │
         └─────────────┬─────────────┘
                       │
              ┌────────▼────────┐
              │ 08-devops       │
              │ deploy          │
              │                  │
              │ aws-agents-dep  │
              │ vercel          │
              │ fullstack-dev   │
              │ github          │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │                           │
    ┌────▼──────────┐          ┌────▼──────────┐
    │ 09-document    │          │ 10-agent       │
    │ output         │          │ systems        │
    │                │          │                │
    │ docx/pdf/ppt   │          │ agent-roles    │
    │ xlsx          │          │ superpowers    │
    │ infographic   │          │ persistent-mem │
    │                │          │ proactive-ag   │
    └───────────────┘          └────────────────┘
```

## Integration Patterns

### Pattern 1: Data-to-Video (Most Common)

Skills: 02 → 04 → 05 → 01

Use when: Building personalized or data-driven videos from external sources.

```typescript
// Pseudocode for the integration
async function dataToVideo(sourceUrl: string, recipient: Recipient) {
  // Stage 1: ACQUIRE
  const content = await firecrawlScrape(sourceUrl);
  const data = parseVideoData(content);

  // Stage 2: THINK
  const script = await bedrock.generate(`
    Create a ${recipient.segment} video script using:
    ${JSON.stringify(data)}
  `);

  // Stage 3: DESIGN
  const palette = await uiUxProMax.generatePalette(data.brand);
  const chart = await charts.createVisualization(data.metrics);

  // Stage 4: RENDER
  const composition = remotionVideoPro.compose({
    script,
    palette,
    chart,
    recipient: recipient.name,
  });

  return remotionVideoPro.render(composition);
}
```

### Pattern 2: A/B Video Testing

Skills: 07 → 04 → 05 → 01 → 06

Use when: Testing video variants for marketing optimization.

```typescript
async function abTestVideo(hypothesis: ABHypothesis) {
  // THINK: Council of Five debates approach
  const perspectives = await councilOfFive(
    `Debate this video A/B test: ${hypothesis.description}`
  );

  // THINK: Generate variant scripts
  const variants = await Promise.all(
    hypothesis.variants.map(v =>
      bedrock.generate(`Script for variant: ${v.description}`)
    )
  );

  // DESIGN: Generate visual systems per variant
  const designs = await Promise.all(
    variants.map(v => uiUxProMax.designSystem(v))
  );

  // RENDER: Compose and render all variants
  const compositions = variants.map((v, i) =>
    remotionVideoPro.compose({ ...v, design: designs[i] })
  );

  const renders = await Promise.all(
    compositions.map(c => remotionVideoPro.render(c))
  );

  // TEST: Set up A/B test with chi-square significance
  await marketingABTesting.createTest({
    hypothesis,
    variants: renders.map((r, i) => ({
      variantId: i,
      videoUrl: r.url,
    })),
    testMethod: 'chi-square',
  });
}
```

### Pattern 3: Monitor-Driven Optimization

Skills: 06 → 10 → 02 → 04 → 01

Use when: Using production monitoring to improve video quality.

```typescript
async function monitorOptimize() {
  // MONITOR: Get AI call metrics
  const metrics = await sentryAIMonitoring.getMetrics({
    operation: 'gen_ai.chat',
    timeRange: '7d',
  });

  // AGENT: Self-improving agent learns from failures
  const learnings = await selfImprovingAgent.analyze({
    errors: metrics.errors,
    latencies: metrics.p95,
  });

  // ACQUIRE: Refresh data sources based on learnings
  const freshData = await firecrawlScrape(learnings.dataRefreshUrls);

  // THINK: Apply learnings to generation
  const improvedScript = await bedrock.generate(`
    Previous issues: ${JSON.stringify(learnings.issues)}
    Generate improved video script using: ${freshData}
  `);

  // RENDER: Produce improved video
  return remotionVideoPro.composeAndRender(improvedScript);
}
```

## Key Integration Points

### 1. remotion-video-pro ↔ marketing-ab-testing

The remotion-video-pro webhook service already has ABTest models in Prisma.
The marketing-ab-testing skill provides the statistical methodology (chi-square,
ICE scoring, sample size calculation). Together they form a complete video
experimentation engine.

**Connection**: ABTest.variantScript maps to Remotion Composition props.
Chi-square significance from marketing-ab-testing determines when to promote
a winning variant.

### 2. firecrawl-scrape ↔ remotion-video-pro

Data scraped from external sources becomes video props. The firecrawl-scrape
output (clean markdown) is parsed into structured data that feeds Remotion
compositions.

**Connection**: `firecrawlScrape(url) → parseToVideoProps(markdown) →
remotionVideoPro.render(props)`

### 3. browser-cdp ↔ firecrawl-scrape

When content is behind authentication (competitor dashboards, private docs),
browser-cdp reuses existing login sessions to access content that firecrawl-scrape
cannot reach directly.

**Connection**: `browserCDP.extract(url) → firecrawlScrape(extractedHTML) →
structuredData`

### 4. amazon-bedrock ↔ sentry-ai-monitoring

Every Bedrock model invocation is automatically traced by Sentry AI monitoring.
Token counts, latency, and costs are captured for optimization decisions.

**Connection**: `bedrock.converse()` wrapped in Sentry span with gen_ai.*
attributes. Cost tracking uses token usage data.

### 5. council-of-five ↔ think

Council-of-five uses think's multi-framework reasoning for each persona.
Think provides the analytical depth; council-of-five provides the creative
diversity.

**Connection**: Each council persona runs a `think()` deep analysis from their
unique perspective, then results are synthesized.

### 6. marketing-launch ↔ remotion-video-pro

Launch videos are a primary deliverable of the marketing-launch 5-phase framework.
Videos produced by remotion-video-pro are deployed as launch assets.

**Connection**: Phase 3 (Beta) and Phase 5 (Full Launch) include video
production milestones that trigger remotion-video-pro rendering pipelines.

## File Structure Conventions

All Remotion-integrated skills follow this convention for their integration
hooks:

```yaml
# In each skill's SKILL.md, add:
remotion_integration:
  stage: [1-6]
  input_type: [markdown|json|image|video]
  output_type: [props|composition|render]
  pipeline_route: [A|B|C|D|E]
  data_mapping:
    - from: "skill_output_field"
      to: "remotion_prop_name"
```

This metadata enables automatic pipeline routing when skills are composed.
