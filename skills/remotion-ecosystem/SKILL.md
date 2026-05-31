---
name: remotion-ecosystem
description: >
  Unified skill ecosystem for Remotion programmatic video production at scale.
  Orchestrates 91 skills across 10 categories: core video rendering, data ingestion,
  browser automation, AI intelligence, content design, monitoring, marketing strategy,
  devops deployment, document output, and agent systems. Use when building
  end-to-end video pipelines that combine data sourcing, AI generation, rendering,
  A/B testing, deployment, and monitoring into a cohesive production system.
requires: Node.js 18+, React/TypeScript, z-ai-web-dev-sdk
integrates:
  - remotion-video-pro (core rendering engine)
  - firecrawl-scrape (content acquisition)
  - browser-cdp (auth session reuse)
  - marketing-video (video strategy)
  - marketing-ab-testing (video variant testing)
  - amazon-bedrock (AI model orchestration)
  - sentry-ai-monitoring (LLM call tracing)
  - think (structured reasoning)
  - council-of-five (multi-perspective debate)
always_load:
  - _ARCHITECTURE.md
  - _PIPELINE-ROUTES.md
conditional_load:
  data_source_needed:
    - 02-data-ingestion/SKILL.md
  browser_auth_needed:
    - 03-browser-automation/SKILL.md
  ai_generation_needed:
    - 04-ai-intelligence/SKILL.md
  deployment_needed:
    - 08-devops-deploy/SKILL.md
---

# Remotion Ecosystem — Unified Skill Architecture

## Scope

This is the **integration layer** that transforms 91 individual skills into a
cohesive video production pipeline. It does not replace any skill — it provides
the routing, data flow, and orchestration patterns that connect them.

Every skill below can be used independently. This ecosystem document describes
how they compose together when building end-to-end Remotion video systems.

## The Ten Categories

```
remotion-ecosystem/
├── 01-core-video/          ← Rendering engine + video strategy
│   ├── remotion-video-pro      (scaffolding, animation, batch render)
│   ├── marketing-video         (production approach selection)
│   ├── video-generation        (AI video creation)
│   └── video-understand        (video analysis)
│
├── 02-data-ingestion/      ← Content sourcing for video data
│   ├── firecrawl-scrape        (JS-rendered page extraction)
│   ├── firecrawl-crawl         (bulk site crawling)
│   ├── spider                  (site scanning + security audit)
│   ├── web-reader              (page metadata + content)
│   ├── web-search              (real-time search)
│   └── browserbase-fetch       (lightweight URL fetching)
│
├── 03-browser-automation/   ← Auth + interaction for protected content
│   ├── browser-cdp             (Chrome session reuse)
│   ├── agent-browser           (headful browser automation)
│   └── browserbase-autobrowse  (self-improving browse loops)
│
├── 04-ai-intelligence/      ← AI reasoning + model orchestration
│   ├── think                   (multi-framework reasoning via Gemini)
│   ├── council-of-five         (5-persona parallel debate)
│   ├── amazon-bedrock          (Claude/Llama/Nova model invocation)
│   ├── LLM                     (chat completions)
│   └── VLM                     (vision-language understanding)
│
├── 05-content-design/      ← Visual assets + motion design
│   ├── charts                  (data visualization)
│   ├── image-generation         (AI image creation)
│   ├── image-edit              (AI image editing)
│   ├── ui-ux-pro-max           (design system + UI reasoning)
│   ├── anthropic-frontend-design (distinctive interfaces)
│   └── web-shader-extractor     (visual effect extraction)
│
├── 06-monitoring-security/ ← Observability + protection
│   ├── sentry-ai-monitoring     (LLM call tracing + token tracking)
│   ├── sentry-nextjs-sdk        (Next.js error + perf monitoring)
│   ├── audit-analyzer            (system auditing)
│   ├── diagnose                 (debugging + diagnosis)
│   └── mcp-spy                  (MCP traffic debugging)
│
├── 07-marketing-strategy/   ← Growth + experimentation
│   ├── marketing-ab-testing     (hypothesis + chi-square significance)
│   ├── marketing-launch         (5-phase launch framework)
│   ├── marketing-mode           (growth marketing orchestration)
│   └── content-strategy        (content planning)
│
├── 08-devops-deploy/       ← Infrastructure + CI/CD
│   ├── aws-agents-deploy        (Railway/Vercel/Lambda deployment)
│   ├── amazon-bedrock           (AWS AI model deployment)
│   ├── vercel                   (Vercel deployment)
│   ├── deployment-manager       (multi-platform deploy)
│   ├── github                   (CI/CD + repo management)
│   └── fullstack-dev            (Next.js full-stack development)
│
├── 09-document-output/     ← Reports + deliverables from video data
│   ├── docx                     (Word documents)
│   ├── pdf                      (PDF generation)
│   ├── ppt / pptx               (presentations)
│   ├── xlsx                     (spreadsheets)
│   └── infographic-gen          (infographics)
│
└── 10-agent-systems/        ← Agent orchestration + memory
    ├── agent-roles              (specialized agent personas)
    ├── superpowers              (spec-first + sub-agent delegation)
    ├── proactive-agent          (autonomous self-improvement)
    ├── self-improving-agent     (error logging + learning)
    ├── persistent-memory        (cross-session memory)
    └── context-compressor       (context window optimization)
```

## Pipeline Architecture

The Remotion ecosystem follows a 6-stage pipeline:

```
[1. ACQUIRE] → [2. THINK] → [3. DESIGN] → [4. RENDER] → [5. TEST] → [6. DEPLOY]

 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 1: ACQUIRE — Data Ingestion (02-data-ingestion)            │
 │                                                                   │
 │  firecrawl-scrape ──→ scrape competitor pages                     │
 │  browser-cdp ──────→ extract behind-auth content                  │
 │  spider ───────────→ scan product pages for data                  │
 │  web-search ────────→ gather market intelligence                  │
 │  web-reader ────────→ extract article content                     │
 │                                                                   │
 │  Output: { products, competitors, testimonials, pricing }        │
 └────────────────────────────┬─────────────────────────────────────┘
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 2: THINK — AI Intelligence (04-ai-intelligence)            │
 │                                                                   │
 │  think ─────────────→ first-principles analysis of data           │
 │  council-of-five ───→ 5-persona debate on video approach         │
 │  amazon-bedrock ────→ generate script / copy / storyboard         │
 │  LLM ────────────────→ refine messaging and CTAs                  │
 │                                                                   │
 │  Output: { script, storyboard, copy variants, scene plan }       │
 └────────────────────────────┬─────────────────────────────────────┘
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 3: DESIGN — Content + Visual (05-content-design)          │
 │                                                                   │
 │  image-generation ──→ hero images, product shots                  │
 │  charts ─────────────→ data visualizations for video              │
 │  ui-ux-pro-max ─────→ layout + color + typography system         │
 │  web-shader-extractor → visual effects from reference sites       │
 │                                                                   │
 │  Output: { images, charts, color palettes, motion specs }         │
 └────────────────────────────┬─────────────────────────────────────┘
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 4: RENDER — Core Video (01-core-video)                    │
 │                                                                   │
 │  remotion-video-pro → compose React components as frames          │
 │  marketing-video ────→ select production approach                  │
 │  video-generation ──→ AI-generated B-roll footage                 │
 │  video-understand ──→ analyze reference videos                    │
 │                                                                   │
 │  Output: { MP4 renders, variant compositions }                   │
 └────────────────────────────┬─────────────────────────────────────┘
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 5: TEST — Monitoring + A/B (06 + 07)                       │
 │                                                                   │
 │  marketing-ab-testing → chi-square significance on variants       │
 │  sentry-ai-monitoring → trace LLM calls during generation         │
 │  audit-analyzer ─────→ security scan of rendered assets           │
 │  diagnose ────────────→ debug rendering failures                  │
 │                                                                   │
 │  Output: { test results, significance scores, error reports }      │
 └────────────────────────────┬─────────────────────────────────────┘
                              ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │  Stage 6: DEPLOY — DevOps + Marketing (08 + 07)                  │
 │                                                                   │
 │  aws-agents-deploy ─→ deploy to Lambda/Railway                    │
 │  marketing-launch ───→ 5-phase product launch                     │
 │  vercel ──────────────→ webhook service hosting                    │
 │  fullstack-dev ───────→ Next.js dashboard for render management    │
 │                                                                   │
 │  Output: { live renders, webhook endpoints, launch campaign }      │
 └──────────────────────────────────────────────────────────────────┘
```

## Integration Routes

### Route A: Competitor Intelligence Video

```
spider (scan competitor sites)
  → firecrawl-scrape (extract product pages)
  → amazon-bedrock (analyze competitive landscape)
  → council-of-five (debate video angle)
  → charts (create comparison visualizations)
  → remotion-video-pro (render competitor comparison video)
  → marketing-ab-testing (A/B test video variants)
  → aws-agents-deploy (deploy to Lambda)
```

### Route B: Product Launch Video Campaign

```
marketing-launch (plan 5-phase launch)
  → web-search (gather market data)
  → think (first-principles messaging strategy)
  → amazon-bedrock (generate video script)
  → image-generation (create hero images)
  → ui-ux-pro-max (design visual system)
  → remotion-video-pro (render launch video)
  → video-generation (AI B-roll footage)
  → sentry-ai-monitoring (trace all AI calls)
  → aws-agents-deploy (deploy pipeline)
  → marketing-ab-testing (test hook variations)
```

### Route C: Data-Driven Personalized Videos

```
firecrawl-crawl (bulk extract customer data sources)
  → browser-cdp (extract behind-auth CRM data)
  → amazon-bedrock (personalize video copy per recipient)
  → charts (generate personalized data visualizations)
  → remotion-video-pro (batch render with personalization props)
  → sentry-ai-monitoring (monitor batch LLM token usage)
  → aws-agents-deploy (Lambda batch rendering)
  → docx/xlsx (generate ROI report from campaign)
```

### Route D: Content Repurposing Pipeline

```
video-understand (analyze source video)
  → browserbase-autobrowse (gather reference content)
  → think (plan repurposing strategy)
  → firecrawl-scrape (extract blog content for reference)
  → marketing-video (select short-form vs long-form approach)
  → image-generation (create thumbnail variants)
  → remotion-video-pro (render platform-specific versions)
  → marketing-launch (coordinate multi-platform distribution)
```

### Route E: A/B Test Video Variants at Scale

```
marketing-ab-testing (design hypothesis + variants)
  → council-of-five (debate which variants to test)
  → amazon-bedrock (generate variant copy/scripts)
  → ui-ux-pro-max (design variant visual systems)
  → remotion-video-pro (render A/B compositions)
  → sentry-ai-monitoring (trace generation costs)
  → marketing-launch (deploy test to audience)
  → charts (visualize test results)
  → pdf (generate test report)
```

## Cross-Cutting Concerns

### Security (06-monitoring-security)

Every pipeline stage should be wrapped with:
- **sentry-ai-monitoring**: Trace all LLM calls (token count, latency, cost)
- **sentry-nextjs-sdk**: Monitor webhook service health
- **audit-analyzer**: Periodic security scan of deployed infrastructure
- **mcp-spy**: Debug MCP tool integrations in development

### Memory (10-agent-systems)

Cross-session continuity for recurring video production:
- **persistent-memory**: Store brand guidelines, color palettes, past campaigns
- **context-compressor**: Optimize context window when running complex pipelines
- **self-improving-agent**: Learn from rendering failures and A/B test results

### Quality (01-core-video)

Enforce remotion-video-pro golden rules at every render:
- Frame-based determinism (no Math.random)
- Spring animations over linear
- React.memo on every scene component
- Zod schema validation on all props
- Pre-commit validation hooks

## Quick Reference — Skill to Pipeline Stage

| Skill | Primary Stage | Secondary Use |
|-------|--------------|----------------|
| remotion-video-pro | 4. RENDER | 5. TEST (validation) |
| firecrawl-scrape | 1. ACQUIRE | 6. DEPLOY (verify pages) |
| firecrawl-crawl | 1. ACQUIRE | 3. DESIGN (reference content) |
| spider | 1. ACQUIRE | 6. DEPLOY (security scan) |
| browser-cdp | 1. ACQUIRE | 3. DESIGN (auth content) |
| browserbase-fetch | 1. ACQUIRE | — |
| browserbase-autobrowse | 1. ACQUIRE | 2. THINK (research) |
| think | 2. THINK | 5. TEST (debug analysis) |
| council-of-five | 2. THINK | 7. MARKETING (strategy) |
| amazon-bedrock | 2. THINK | 4. RENDER (AI generation) |
| LLM | 2. THINK | — |
| VLM | 2. THINK | 4. RENDER (scene analysis) |
| charts | 3. DESIGN | 9. OUTPUT (reports) |
| image-generation | 3. DESIGN | 4. RENDER (assets) |
| ui-ux-pro-max | 3. DESIGN | 2. THINK (layout reasoning) |
| marketing-ab-testing | 5. TEST | 7. MARKETING (growth) |
| marketing-launch | 6. DEPLOY | 7. MARKETING (campaign) |
| sentry-ai-monitoring | 5. TEST | 6. DEPLOY (production monitor) |
| aws-agents-deploy | 6. DEPLOY | — |
| fullstack-dev | 6. DEPLOY | 3. DESIGN (dashboards) |
| docx/pdf/xlsx | 9. OUTPUT | 7. MARKETING (reports) |
| agent-roles | 10. SYSTEMS | 2. THINK (delegation) |
| superpowers | 10. SYSTEMS | — |
