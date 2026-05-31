<p align="center">
  <strong>Remotion Video Pro</strong>
</p>

<p align="center">
  <em>Video Personalization Engine &mdash; Pipeline-Driven Video Production at Scale</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.0-blue" alt="Version 3.0.0" />
  <img src="https://img.shields.io/badge/skills-34-green" alt="34 Integration Skills" />
  <img src="https://img.shields.io/badge/pipeline-6_stages-orange" alt="6-Stage Pipeline" />
  <img src="https://img.shields.io/badge/security-6_fixes-green" alt="6-Point Security Framework" />
  <img src="https://img.shields.io/badge/endpoints-15-purple" alt="15 API Endpoints" />
</p>

---

Remotion Video Pro is a full **Video Personalization Engine** built on **Next.js 14**, **Remotion 4.x**, **BullMQ**, and **AWS Lambda**. In v3.0, it has evolved from a simple webhook-triggered render service into a pipeline orchestration platform with a 34-skill integration ecosystem, pluggable stage handlers, and 5 predefined production routes for common video workflows.

---

## Table of Contents

- [What's New in v3.0](#whats-new-in-v30)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Pipeline Routes](#pipeline-routes)
- [Skill Ecosystem](#skill-ecosystem)
  - [Integration Skills (34 skills, 8 categories)](#integration-skills-34-skills-8-categories)
  - [SkillBridge API](#skillbridge-api)
  - [Skill Manifest](#skill-manifest)
- [API Reference (v3.0 — 15 Endpoints)](#api-reference-v30--15-endpoints)
- [Security Framework (6-Point Defense)](#security-framework-6-point-defense)
- [Database Schema](#database-schema)
- [Pipeline Internals](#pipeline-internals)
  - [Stage Handlers](#stage-handlers)
  - [Error Handling](#error-handling)
  - [SkillBridge Integration Pattern](#skillbridge-integration-pattern)
- [Project Structure (v3.0)](#project-structure-v30)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## What's New in v3.0

v3.0 is the most significant upgrade in the project's history. Here's what changed:

| Category | Change |
|----------|--------|
| **Pipeline Engine** | Full 6-stage orchestration engine (`ACQUIRE → THINK → DESIGN → RENDER → TEST → DEPLOY`) with sequential execution, per-stage error handling, and in-memory state storage |
| **Pipeline Routes** | 5 predefined production routes: `competitor-intel`, `product-launch`, `personalized-videos`, `content-repurpose`, `ab-testing` |
| **Skill Ecosystem** | 34 skill integration guides across 8 categories with Remotion-specific patterns |
| **SkillBridge** | Abstraction layer with Zod-validated inputs, 13 typed methods across 5 categories (Content Ingestion, Browser Automation, AI Intelligence, Content Design, Marketing) |
| **Pipeline API** | 3 new endpoints: `POST /api/pipeline`, `GET /api/pipeline`, `GET /api/pipeline/list` with pagination, filtering, and admin access |
| **Security** | 6-point defense framework: timing-safe comparison, security headers, PII sanitization, sliding window rate limiting, SSRF protection, crypto-secure random |
| **Skill Tooling** | `skill-manifest.json` tracking, `sync-skills.sh` sync script, `skill-health-check.sh` health checker |

### Changelog Summary

```
v3.0.0 — Video Personalization Engine
  + 6-stage pipeline engine (pipeline.ts)
  + 5 predefined pipeline routes (pipeline-routes.ts)
  + SkillBridge abstraction layer (skill-bridge.ts)
  + 3 new API endpoints (/api/pipeline, /api/pipeline/list)
  + SSRF protection (url-validator.ts)
  + Sliding window rate limiter (rate-limit.ts)
  + Timing-safe auth (security.ts)
  + PII sanitization (sanitizeJobResponse)
  + 34 skill integration guides
  + Skill manifest and sync tooling
  + Pipeline callback support
  ~ Upgraded all auth to timingSafeEqual
  ~ Middleware security headers
```

---

## Architecture Overview

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                   6-STAGE PIPELINE ENGINE                  │
                         │                                                          │
                         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
                         │  │ ACQUIRE  │→│  THINK   │→│  DESIGN  │→│  RENDER  │   │
                         │  │(5 skills)│ │(5 skills)│ │(6 skills)│ │  (Core)  │   │
                         │  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘   │
                         │                                                │          │
                         │  ┌──────────┐ ┌──────────┐                    │          │
                         │  │  DEPLOY  │←│   TEST   │←───────────────────┘          │
                         │  │(3 skills)│ │(6 skills)│                               │
                         │  └──────────┘ └──────────┘                               │
                         └─────────────────────────┬───────────────────────────────┘
                                                   │
                    ┌──────────────────────────────┼───────────────────────────────┐
                    │                              │                               │
              ┌─────▼─────┐                ┌──────▼──────┐                ┌────────▼────────┐
              │  SkillBridge│                │   Webhook   │                │   BullMQ Queue   │
              │  (13 methods│                │   Service   │                │   (Redis)        │
              │   Zod-validated)             │  (Next.js)  │                │                  │
              └─────┬─────┘                └──────┬──────┘                └────────┬────────┘
                    │                              │                               │
         ┌──────────┼──────────┐                  │                        ┌──────▼──────┐
         │  34 Skill │  8       │                  │                        │   Worker    │
         │  Guides   │ Categories│                  │                        │  (BullMQ)   │
         └──────────┴──────────┘                  │                        └──────┬──────┘
                                                   │                               │
                                          ┌────────▼────────┐              ┌────────▼────────┐
                                          │  PostgreSQL     │              │  AWS Lambda      │
                                          │  (Prisma ORM)   │              │  (Remotion 4.x)  │
                                          │                 │              │                  │
                                          │  - RenderJob    │              │  renderMedia     │
                                          │  - ABTest       │              │  OnLambda()      │
                                          │  - Composition  │              └────────┬────────┘
                                          │    Version      │                       │
                                          │  - Analytics    │              ┌────────▼────────┐
                                          └─────────────────┘              │  Amazon S3       │
                                                                           │  (Video Output)  │
                                                                           └─────────────────┘
```

### Data Flow

1. **Webhook / API** receives a request (Stripe, generic webhook, or pipeline trigger)
2. **Auth + Rate Limit** validates the request using timing-safe comparison
3. **Pipeline Engine** (or direct render) processes through stages sequentially
4. **SkillBridge** invokes external skills at each stage with Zod-validated inputs
5. **BullMQ** queues render jobs to Redis
6. **Worker** picks up jobs and invokes **AWS Lambda** for Remotion rendering
7. **Lambda** renders the video and stores output in **S3**
8. **Callback** notifies the caller with the render result

---

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repo-url> remotion-video-pro
cd remotion-video-pro

# Install dependencies
cd webhook-service
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Deployment section)

# Push database schema
npx prisma db push
```

### 2. Run the Development Server

```bash
# Start the API service
npm run dev

# In a separate terminal, start the BullMQ worker
npm run worker
```

### 3. Trigger Your First Pipeline

```bash
# Competitor Intelligence — scrape a competitor and generate a comparison video
curl -X POST https://your-domain.com/api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "competitor-intel",
    "compositionId": "CompetitorComparisonVideo",
    "sourceUrls": ["https://competitor.com/product", "https://competitor.com/pricing"]
  }'
```

### 4. Check Pipeline Status

```bash
curl -X GET "https://your-domain.com/api/pipeline?id=pipe_abc123" \
  -H "x-webhook-secret: $WEBHOOK_SECRET"
```

### 5. Trigger a Render Directly

```bash
curl -X POST https://your-domain.com/api/render \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.completed",
    "data": {
      "customerName": "Alice",
      "productName": "Pro Plan",
      "amount": "99.00",
      "currency": "USD"
    }
  }'
```

### 6. List Pipelines (Admin)

```bash
curl -X GET "https://your-domain.com/api/pipeline/list?status=completed&limit=10" \
  -H "x-admin-secret: $ADMIN_SECRET"
```

---

## Pipeline Routes

Pipeline routes are predefined workflows that chain pipeline stages together for common video production use cases. Each route specifies the stage sequence, required inputs, and output types.

| Route | Stages | Source URLs Required? | Description | Example Output |
|-------|--------|:---------------------:|-------------|----------------|
| `competitor-intel` | ACQUIRE → THINK → DESIGN → RENDER → TEST | Yes | Monitor competitor websites, analyze positioning, and generate comparison videos using web scraping and AI analysis | comparison-video, analysis-report, screenshot-diff |
| `product-launch` | THINK → DESIGN → RENDER → TEST → DEPLOY | No | End-to-end product launch campaign: AI generates marketing strategy, designs visuals, renders video variants, runs A/B tests, and deploys winners | marketing-video, ab-test-report, cdn-url |
| `personalized-videos` | ACQUIRE → THINK → DESIGN → RENDER → DEPLOY | Optional | Batch-render personalized videos from user data. Ingests user profiles, generates tailored scripts, and delivers custom videos | personalized-video, user-data-report |
| `content-repurpose` | ACQUIRE → THINK → DESIGN → RENDER → TEST → DEPLOY | Yes | Transform existing web content (articles, blog posts) into optimized video formats for social media and omnichannel distribution | repurposed-video, social-clip, thumbnail, cdn-url |
| `ab-testing` | THINK → DESIGN → RENDER → TEST → DEPLOY | No | Generate multiple video variants and run statistical A/B tests with chi-square significance analysis | variant-videos, ab-test-report, chi-square-analysis, winner-deployment |

### Route Examples

#### Competitor Intelligence

```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "competitor-intel",
    "compositionId": "CompetitorComparisonVideo",
    "sourceUrls": [
      "https://competitor.com/product",
      "https://competitor.com/pricing"
    ]
  }'
```

#### Product Launch

```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "product-launch",
    "compositionId": "ProductLaunchVideo",
    "callbackUrl": "https://myapp.com/webhook/launch-complete",
    "priority": 8
  }'
```

#### Personalized Videos

```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "personalized-videos",
    "compositionId": "PersonalizedWelcomeVideo",
    "sourceUrls": ["https://api.myapp.com/users/123"],
    "metadata": { "userId": "123", "eventType": "signup" }
  }'
```

#### Content Repurpose

```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "content-repurpose",
    "compositionId": "BlogToVideo",
    "sourceUrls": ["https://blog.example.com/my-article"],
    "callbackUrl": "https://myapp.com/webhook/repurpose-done"
  }'
```

#### A/B Testing

```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "ab-testing",
    "compositionId": "AdVariantVideo",
    "metadata": { "variants": 3, "sampleSize": 1000 }
  }'
```

---

## Skill Ecosystem

The skill ecosystem provides 34 integration guides that wire external AI/content skills into the pipeline engine. Each guide documents Remotion-specific patterns, data contracts, and usage examples.

### Integration Skills (34 skills, 8 categories)

#### 01 — Content Ingestion (5 skills)

Primary stage: **ACQUIRE**

| Skill | File | Description |
|-------|------|-------------|
| firecrawl-scrape | `01-content-ingestion/firecrawl-scrape.md` | Scrape individual URLs and extract LLM-optimized markdown content from JavaScript-heavy pages |
| firecrawl-crawl | `01-content-ingestion/firecrawl-crawl.md` | Bulk-extract content from entire websites or site sections with depth-limited crawling |
| spider | `01-content-ingestion/spider.md` | Full web crawling and scraping with security scanning and content analysis |
| web-reader | `01-content-ingestion/web-reader.md` | Extract article content, titles, and metadata from web pages |
| web-search | `01-content-ingestion/web-search.md` | Real-time web search returning structured results with URLs, titles, and snippets |

#### 02 — Browser Automation (4 skills)

Primary stage: **ACQUIRE**

| Skill | File | Description |
|-------|------|-------------|
| browser-cdp | `02-browser-automation/browser-cdp.md` | Control Chrome via CDP (DevTools Protocol) to reuse login sessions and extract authenticated content |
| browserbase-fetch | `02-browser-automation/browserbase-fetch.md` | Lightweight URL fetching without a full browser session for static pages and APIs |
| fetch | `02-browser-automation/fetch.md` | Static page content retrieval with redirect control and proxy support |
| agent-browser | `02-browser-automation/agent-browser.md` | Rust-based headless browser automation CLI for navigation, clicking, typing, and screenshots |

#### 03 — Video Production (5 skills)

Primary stage: **RENDER**

| Skill | File | Description |
|-------|------|-------------|
| marketing-video | `03-video-production/marketing-video.md` | End-to-end marketing video production with AI-generated scripts and Remotion rendering |
| video | `03-video-production/video.md` | Programmatic video creation using Remotion with multiple AI generation backends |
| video-generation | `03-video-production/video-generation.md` | AI video generation with support for Remotion, Runway, Kling, Pika, and other backends |
| video-understand | `03-video-production/video-understand.md` | Video content analysis — extract scenes, motion patterns, and temporal sequences |
| storyboard-manager | `03-video-production/storyboard-manager.md` | Storyboard planning and scene management for complex video compositions |

#### 04 — AI Intelligence (5 skills)

Primary stage: **THINK**

| Skill | File | Description |
|-------|------|-------------|
| LLM | `04-ai-intelligence/LLM.md` | Large language model integration for chat completions, script generation, and content analysis |
| VLM | `04-ai-intelligence/VLM.md` | Vision-language model integration for image understanding and visual content analysis |
| think | `04-ai-intelligence/think.md` | Deep multi-framework reasoning using Gemini for complex problem analysis |
| council-of-five | `04-ai-intelligence/council-of-five.md` | Spawn 5 AI personas that debate creative approaches from different angles |
| chain-of-thought | `04-ai-intelligence/chain-of-thought.md` | Structured reasoning chains for step-by-step problem solving and analysis |

#### 05 — Marketing Analytics (3 skills)

Primary stage: **TEST**

| Skill | File | Description |
|-------|------|-------------|
| marketing-ab-testing | `05-marketing-analytics/marketing-ab-testing.md` | Plan, design, and implement A/B tests for video creatives with statistical analysis |
| marketing-launch | `05-marketing-analytics/marketing-launch.md` | Product launch planning, feature announcement, and go-to-market strategy |
| marketing-mode | `05-marketing-analytics/marketing-mode.md` | Marketing channel strategy and content distribution optimization |

#### 06 — Monitoring & Observability (3 skills)

Primary stage: **TEST**

| Skill | File | Description |
|-------|------|-------------|
| sentry-ai-monitoring | `06-monitoring-observability/sentry-ai-monitoring.md` | Sentry integration for tracking LLM calls, AI agent conversations, and pipeline performance |
| sentry-nextjs-sdk | `06-monitoring-observability/sentry-nextjs-sdk.md` | Full Sentry SDK for Next.js — error tracking, tracing, session replay, and profiling |
| mcp-spy | `06-monitoring-observability/mcp-spy.md` | Debug MCP server communication for troubleshooting integrations and latency |

#### 07 — Cloud Deployment (3 skills)

Primary stage: **DEPLOY**

| Skill | File | Description |
|-------|------|-------------|
| aws-agents-deploy | `07-cloud-deployment/aws-agents-deploy.md` | Deploy agents to AWS with CDL/IAM validation, version management, and canary deployments |
| amazon-bedrock | `07-cloud-deployment/amazon-bedrock.md` | Generative AI on Amazon Bedrock — model invocation, RAG, agents, and guardrails |
| vercel | `07-cloud-deployment/vercel.md` | Vercel deployment, Edge Functions, Next.js optimization, and CDN caching |

#### 08 — Content Design (6 skills)

Primary stage: **DESIGN** (cross-cutting)

| Skill | File | Description |
|-------|------|-------------|
| charts | `08-content-design/charts.md` | Professional chart and diagram creation — bar, line, pie, scatter, heatmaps, and more |
| image-generation | `08-content-design/image-generation.md` | AI image generation for thumbnails, backgrounds, and video overlays |
| infographic-gen | `08-content-design/infographic-gen.md` | Publication-ready infographics from data in 21 layout patterns and 20 visual styles |
| docx | `08-content-design/docx.md` | Word document creation and editing with tracked changes and formatting |
| pdf | `08-content-design/pdf.md` | PDF generation and manipulation for reports and documentation |
| pptx | `08-content-design/pptx.md` | Presentation creation and editing with layouts, comments, and speaker notes |

---

### SkillBridge API

The SkillBridge is the abstraction layer between the pipeline engine and external skill integrations. It provides **13 typed methods** across 5 categories with Zod-validated inputs, structured error handling, and a generic `invoke()` fallback for untyped skill calls.

```
SkillBridge
├── Content Ingestion
│   ├── scrapeUrl(url)                    → { markdown, title, metadata }
│   ├── crawlSite(url, depth?)            → { pages[] }
│   └── searchWeb(query, num?)            → { results[] }
├── Browser Automation
│   ├── captureScreenshot(url)            → { base64, width, height }
│   └── extractAuthContent(url, session)   → string
├── AI Intelligence
│   ├── generateVideoScript(content, style?) → { headline, bodyLines, ctaText, variantConfig }
│   ├── analyzeContent(content)           → { topics, sentiment, keyPoints }
│   └── debateVideoApproach(context, options[]) → { winner, reasoning }
├── Content Design
│   ├── generateImage(prompt, size?)       → { base64, url? }
│   └── generateChart(data, type)          → { base64 }
├── Marketing
│   ├── createABTest(config)               → { testId }
│   └── getABTestResults(testId)          → { significant, pValue, winner? }
└── Monitoring
    ├── trackEvent(event, data)            → void
    ├── checkSystemHealth()                → { status, checks }
    └── invoke(invocation)                 → SkillResponse<T>
```

| # | Method | Category | Signature | Returns | Description |
|---|--------|----------|-----------|---------|-------------|
| 1 | `scrapeUrl` | Content Ingestion | `scrapeUrl(url: string)` | `{ markdown, title, metadata }` | Scrape a single URL via firecrawl-scrape; returns LLM-optimized markdown |
| 2 | `crawlSite` | Content Ingestion | `crawlSite(url: string, depth?: number)` | `{ pages[] }` | Bulk-crawl a website up to a given depth (max 10) |
| 3 | `searchWeb` | Content Ingestion | `searchWeb(query: string, num?: number)` | `{ results[] }` | Real-time web search returning structured results (max 50) |
| 4 | `captureScreenshot` | Browser Automation | `captureScreenshot(url: string)` | `{ base64, width, height }` | Full-page screenshot via agent-browser |
| 5 | `extractAuthContent` | Browser Automation | `extractAuthContent(url: string, session: Record<string, string>)` | `string` | Extract content from authenticated sessions via browser-cdp |
| 6 | `generateVideoScript` | AI Intelligence | `generateVideoScript(content: string, style?: string)` | `{ headline, bodyLines, ctaText, variantConfig }` | Generate structured video scripts via LLM skill |
| 7 | `analyzeContent` | AI Intelligence | `analyzeContent(content: string)` | `{ topics, sentiment, keyPoints }` | Analyze content with AI — extract topics, sentiment, and key points via think skill |
| 8 | `debateVideoApproach` | AI Intelligence | `debateVideoApproach(context: string, options: string[])` | `{ winner, reasoning }` | Multi-perspective debate via council-of-five; requires 2-10 options |
| 9 | `generateImage` | Content Design | `generateImage(prompt: string, size?: string)` | `{ base64, url? }` | AI image generation for thumbnails/overlays; sizes: 512x512 to 1920x1080 |
| 10 | `generateChart` | Content Design | `generateChart(data: Record, type: string)` | `{ base64 }` | Publication-ready charts; types: bar, line, pie, scatter, heatmap, radar, candlestick, boxplot, histogram, area, waterfall, regression |
| 11 | `createABTest` | Marketing | `createABTest(config: { name, variants })` | `{ testId }` | Create A/B test with at least 2 variants |
| 12 | `getABTestResults` | Marketing | `getABTestResults(testId: string)` | `{ significant, pValue, winner? }` | Retrieve A/B test results with chi-square significance |
| 13 | `invoke` | Utility | `invoke(invocation: SkillInvocation)` | `SkillResponse<T>` | Generic skill invocation for extensibility |

#### Usage Example

```typescript
import { SkillBridge } from '@/lib/skill-bridge';

const bridge = new SkillBridge();

// Scrape a competitor page
const page = await bridge.scrapeUrl('https://competitor.com/pricing');

// Generate a video script from the scraped content
const script = await bridge.generateVideoScript(page.markdown, 'bold');

// Analyze content sentiment
const analysis = await bridge.analyzeContent(page.markdown);

// Generate a thumbnail image
const thumbnail = await bridge.generateImage(script.headline, '1920x1080');

// Create an A/B test
const test = await bridge.createABTest({
  name: 'Hero Video Test Q1 2024',
  variants: { control: { videoId: 'v1' }, treatment: { videoId: 'v2' } },
});
```

---

### Skill Manifest

The skill manifest (`integration-skills/skill-manifest.json`) is the single source of truth for the skill ecosystem. It tracks:

- **34 skills** across **8 categories**
- Which pipeline stage each category maps to
- Whether each skill has Remotion-specific integration guides
- The source-to-target file mapping for sync operations
- Required skills per pipeline route

#### Manifest Structure

```json
{
  "version": "2.0.0",
  "lastSync": "2026-05-31T00:00:00.000Z",
  "categories": {
    "01-content-ingestion": { "stage": "ACQUIRE", "skills": [...] },
    "02-browser-automation": { "stage": "ACQUIRE", "skills": [...] },
    "03-video-production":   { "stage": "RENDER",  "skills": [...] },
    "04-ai-intelligence":     { "stage": "THINK",   "skills": [...] },
    "05-marketing-analytics":{ "stage": "TEST",    "skills": [...] },
    "06-monitoring-observability": { "stage": "TEST",    "skills": [...] },
    "07-cloud-deployment":   { "stage": "DEPLOY",  "skills": [...] },
    "08-content-design":     { "stage": "DESIGN",  "skills": [...] }
  },
  "stats": {
    "totalCategories": 8,
    "totalSkills": 34,
    "remotionIntegrated": 34,
    "pendingIntegration": 0
  }
}
```

#### Sync and Health Check Scripts

```bash
# Sync skill guides from the source skills directory
./scripts/sync-skills.sh

# Run health check on all skill integrations
./scripts/skill-health-check.sh
```

---

## API Reference (v3.0 — 15 Endpoints)

### Authentication

| Header | Used For | Comparison |
|--------|----------|------------|
| `x-webhook-secret` | Render, batch, pipeline, A/B, analytics, stripe-webhook | `timingSafeEqual` |
| `x-admin-secret` | Composition management, pipeline list | `timingSafeEqual` |
| `stripe-signature` | Stripe webhook verification | Stripe SDK `constructEvent()` |

### Endpoints

| # | Endpoint | Method | Auth | Rate Limit | Description |
|---|----------|--------|------|------------|-------------|
| 1 | `/api/render` | POST | `x-webhook-secret` | 60/min | Trigger a single render job (event-based) |
| 2 | `/api/render` | GET | `x-webhook-secret` | 60/min | Poll render job status by `jobId` query param |
| 3 | `/api/batch` | POST | `x-webhook-secret` | 20/min | Batch render up to 10,000 videos ($500 cost guard) |
| 4 | `/api/batch` | GET | `x-admin-secret` | 60/min | List batch jobs with status summary |
| 5 | `/api/stripe-webhook` | POST | Stripe sig + HMAC | N/A | Stripe checkout handler with dual-layer verification |
| 6 | `/api/composition/activate` | POST | `x-admin-secret` | 20/min | Activate a composition version (atomically deactivates others) |
| 7 | `/api/composition/activate` | PUT | `x-admin-secret` | 20/min | Register a new version (inactive — test before activating) |
| 8 | `/api/composition/activate` | GET | `x-admin-secret` | 60/min | List all composition versions (grouped by composition) |
| 9 | `/api/composition/activate` | DELETE | `x-admin-secret` | 20/min | Deactivate a specific version |
| 10 | `/api/ab` | POST | `x-webhook-secret` | 30/min | Create a new A/B test |
| 11 | `/api/ab` | GET | `x-webhook-secret` | 30/min | List all A/B tests |
| 12 | `/api/ab/[id]` | GET | `x-webhook-secret` | 60/min | Get A/B test details with chi-square analysis |
| 13 | `/api/ab/[id]` | DELETE | `x-webhook-secret` | 20/min | Delete an A/B test |
| 14 | `/api/analytics/track` | POST | `x-webhook-secret` | 120/min | Track analytics events |
| 15 | `/api/pipeline` | POST | `x-webhook-secret` | 10/min | **NEW v3.0** — Trigger a pipeline execution |
| 16 | `/api/pipeline` | GET | `x-webhook-secret` | 60/min | **NEW v3.0** — Get pipeline status by `id` query param |
| 17 | `/api/pipeline/list` | GET | `x-admin-secret` | 30/min | **NEW v3.0** — List all pipelines (paginated, filterable) |

### Render Endpoints

#### POST /api/render — Trigger a Render Job

```bash
curl -X POST https://your-domain.com/api/render \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.completed",
    "data": {
      "customerName": "Alice Johnson",
      "productName": "Pro Plan",
      "amount": "99.00",
      "currency": "USD",
      "purchaseDate": "2024-01-15"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "jobId": "clx1abc2def",
  "composition": "ThankYouVideo",
  "version": "v2",
  "status": "queued"
}
```

**Supported events:** `user.created`, `order.completed`, `lead.qualified`, `milestone.reached`, `subscription.renewed`

#### GET /api/render — Poll Job Status

```bash
curl -X GET "https://your-domain.com/api/render?jobId=clx1abc2def" \
  -H "x-webhook-secret: $WEBHOOK_SECRET"
```

#### POST /api/batch — Batch Render

```bash
curl -X POST https://your-domain.com/api/batch \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "composition": "ThankYouVideo",
    "records": [
      { "id": "1", "props": { "customerName": "Alice" } },
      { "id": "2", "props": { "customerName": "Bob" } },
      { "id": "3", "props": { "customerName": "Carol" } }
    ],
    "callbackUrl": "https://myapp.com/webhook/batch-done",
    "priority": "normal"
  }'
```

**Cost guard:** Estimated cost is calculated at $0.08/video. Batches exceeding $500 are rejected with HTTP 402.

### Stripe Webhook Endpoint

#### POST /api/stripe-webhook — Stripe Checkout Handler

Dual-layer verification:
1. **Stripe signature** — confirms the payload came from Stripe
2. **Per-checkout HMAC** — confirms the checkout was initiated by our server (prevents replay attacks)

```bash
# Handled by Stripe's webhook infrastructure automatically
# Configure in Stripe Dashboard → Webhooks
# Endpoint: https://your-domain.com/api/stripe-webhook
# Events: checkout.session.completed, customer.subscription.created, etc.
```

### Composition Version Management

#### POST /api/composition/activate — Activate a Version

```bash
curl -X POST https://your-domain.com/api/composition/activate \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "composition": "ThankYouVideo",
    "version": "v3"
  }'
```

#### PUT /api/composition/activate — Register a New Version

```bash
curl -X PUT https://your-domain.com/api/composition/activate \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "composition": "ThankYouVideo",
    "version": "v3",
    "description": "Updated brand colors and CTA animation"
  }'
```

#### GET /api/composition/activate — List All Versions

```bash
curl -X GET "https://your-domain.com/api/composition/activate?composition=ThankYouVideo" \
  -H "x-admin-secret: $ADMIN_SECRET"
```

#### DELETE /api/composition/activate — Deactivate a Version

```bash
curl -X DELETE "https://your-domain.com/api/composition/activate?composition=ThankYouVideo&version=v2" \
  -H "x-admin-secret: $ADMIN_SECRET"
```

### Pipeline Endpoints (NEW v3.0)

#### POST /api/pipeline — Trigger a Pipeline

Creates and executes a multi-stage pipeline. Validates the route, SSRF-checks all source URLs, and runs stages sequentially.

```bash
curl -X POST https://your-domain.com/api/pipeline \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "route": "content-repurpose",
    "compositionId": "BlogToVideo",
    "sourceUrls": ["https://blog.example.com/my-post"],
    "callbackUrl": "https://myapp.com/webhook/pipeline-done",
    "priority": 8
  }'
```

**Request body (Zod-validated):**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `route` | enum | Yes | `competitor-intel`, `product-launch`, `personalized-videos`, `content-repurpose`, `ab-testing` |
| `compositionId` | string (1-200) | Yes | Remotion composition ID for the RENDER stage |
| `sourceUrls` | string[] (max 50) | Conditional | URLs for data acquisition (required by `competitor-intel` and `content-repurpose`) |
| `callbackUrl` | string | No | Completion callback URL (SSRF-validated) |
| `abTestId` | string | No | Link an A/B test to the TEST stage |
| `priority` | number (1-10) | No | Render queue priority (default varies by route) |
| `metadata` | Record<string, unknown> | No | Arbitrary metadata passed to stages |

**Response:**

```json
{
  "pipelineId": "pipe_1705312800_a3f2b1",
  "status": "completed",
  "stages": [
    { "stage": "acquire", "status": "completed", "durationMs": 3200 },
    { "stage": "think", "status": "completed", "durationMs": 5100 },
    { "stage": "design", "status": "completed", "durationMs": 4200 },
    { "stage": "render", "status": "completed", "durationMs": 45000 },
    { "stage": "test", "status": "completed", "durationMs": 1800 }
  ],
  "totalDurationMs": 59300,
  "renderJobId": "render_pipe_1705312800_a3f2b1_1705312859"
}
```

**Rate limit:** 10 requests per minute per IP.

#### GET /api/pipeline — Pipeline Status

```bash
curl -X GET "https://your-domain.com/api/pipeline?id=pipe_abc123" \
  -H "x-webhook-secret: $WEBHOOK_SECRET"
```

**Response (404 if not found):**

```json
{
  "id": "pipe_abc123",
  "config": {
    "name": "competitor-intel pipeline — CompetitorComparisonVideo",
    "route": "competitor-intel",
    "compositionId": "CompetitorComparisonVideo",
    "stages": ["acquire", "think", "design", "render", "test"]
  },
  "status": "completed",
  "stages": [
    { "stage": "acquire", "status": "completed", "durationMs": 2100 },
    { "stage": "think", "status": "completed", "durationMs": 4800 },
    { "stage": "design", "status": "completed", "durationMs": 3900 },
    { "stage": "render", "status": "completed", "durationMs": 52000 },
    { "stage": "test", "status": "completed", "durationMs": 1200 }
  ],
  "totalDurationMs": 64000,
  "renderJobId": "render_pipe_abc123_1705312800",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:01:04.000Z"
}
```

#### GET /api/pipeline/list — List Pipelines (Admin)

```bash
# List completed pipelines
curl -X GET "https://your-domain.com/api/pipeline/list?status=completed&limit=10" \
  -H "x-admin-secret: $ADMIN_SECRET"

# Filter by route
curl -X GET "https://your-domain.com/api/pipeline/list?route=product-launch&limit=20" \
  -H "x-admin-secret: $ADMIN_SECRET"

# Paginate
curl -X GET "https://your-domain.com/api/pipeline/list?offset=20&limit=20" \
  -H "x-admin-secret: $ADMIN_SECRET"
```

**Query parameters:**

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `status` | enum | — | — | `running`, `completed`, `failed`, `partial` |
| `route` | string | — | — | Filter by route name |
| `limit` | number | 20 | 100 | Results per page |
| `offset` | number | 0 | — | Number of results to skip |

**Response:**

```json
{
  "pipelines": [
    {
      "id": "pipe_abc123",
      "name": "content-repurpose pipeline — BlogToVideo",
      "route": "content-repurpose",
      "status": "completed",
      "compositionId": "BlogToVideo",
      "stageCount": 6,
      "completedStages": 6,
      "failedStages": 0,
      "totalDurationMs": 72000,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "status": "completed",
    "route": null
  }
}
```

---

## Security Framework (6-Point Defense)

The v3.0 security framework addresses 6 distinct attack vectors with defense-in-depth:

| # | Measure | Implementation | File | Threat Mitigated |
|---|---------|---------------|------|------------------|
| 1 | **Timing-Safe Comparison** | `timingSafeEqual` (Node.js `crypto`) for all secret comparisons — webhook secret, admin secret, HMAC verification | `security.ts` | Timing attacks on authentication secrets |
| 2 | **Security Headers** | CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy, X-Content-Type-Options via Next.js middleware | `middleware.ts` | XSS, clickjacking, content injection |
| 3 | **Auth + PII Sanitization** | `verifyWebhookSecret()`, `verifyAdminSecret()` for GET auth; `sanitizeJobResponse()` recursively redacts PII fields from API responses | `security.ts` | Unauthorized access, PII leakage |
| 4 | **Sliding Window Rate Limiting** | Per-endpoint in-memory rate limiter with configurable thresholds, `Retry-After` headers, and automatic cleanup | `rate-limit.ts` | Brute force, API abuse, DoS |
| 5 | **SSRF Protection** | Private IP blocking (10.x, 172.16.x, 192.168.x, 169.254.x, 127.x), cloud metadata endpoint filtering, protocol restriction (HTTP/HTTPS only), hostname allowlisting | `url-validator.ts` | Server-Side Request Forgery |
| 6 | **Crypto-Secure Random** | `crypto.randomBytes` for A/B test variant assignment to prevent predictable assignment | A/B test module | Prediction of test assignment |

### 1. Timing-Safe Comparison

All secret comparisons use Node.js `crypto.timingSafeEqual` to prevent timing attacks:

```typescript
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
```

### 2. Security Headers

Applied via Next.js middleware to all responses:

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
```

### 3. PII Sanitization

The `sanitizeJobResponse()` function recursively traverses response objects and redacts known PII fields:

```typescript
const PII_FIELDS = new Set([
  'email', 'password', 'token', 'secret', 'apikey',
  'api_key', 'authorization', 'credit_card', 'creditCard',
  'ssn', 'phone',
]);

// { email: 'user@example.com', name: 'Alice' }
// → { email: '[REDACTED]', name: 'Alice' }
```

### 4. Sliding Window Rate Limiting

Per-endpoint configuration:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/pipeline` (POST) | 10 req/min | 60s |
| `/api/batch` (POST) | 20 req/min | 60s |
| `/api/render` | 60 req/min | 60s |
| `/api/analytics/track` | 120 req/min | 60s |

Rate-limited responses include `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.

### 5. SSRF Protection

Blocked destinations:
- **Private IPs:** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`
- **Loopback:** `127.0.0.0/8`, `::1`, `localhost`
- **Link-local:** `169.254.0.0/16` (including `169.254.169.254` — AWS/GCP metadata)
- **Cloud metadata:** `metadata.google.internal`, `metadata.aws.internal`
- **Protocols:** Only `http:` and `https:` allowed

### 6. Crypto-Secure Random

A/B test variant assignment uses `crypto.randomBytes` to ensure unpredictable, unbiased assignment.

---

## Database Schema

The project uses **PostgreSQL** with **Prisma ORM**. The schema defines models for render jobs, composition versioning, A/B testing, and analytics.

### RenderJob

Tracks individual video render jobs through the BullMQ → Lambda → S3 pipeline.

```prisma
model RenderJob {
  id          String   @id @default(cuid())
  composition String                    // e.g., "ThankYouVideo"
  version     String?                    // e.g., "v2"
  props       Json                       // Render input props
  status      String   @default("pending")  // pending | rendering | done | failed
  progress    Float    @default(0)       // 0.0 → 1.0
  outputUrl   String?                    // S3 URL of rendered video
  error       String?                    // Error message if failed
  webhookUrl  String?                    // Callback URL on completion
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([composition, version])
}
```

### CompositionVersion

Tracks which version of each Remotion composition is "active". Supports zero-downtime version switching.

```prisma
model CompositionVersion {
  id          String   @id @default(cuid())
  composition String                    // e.g., "ThankYouVideo"
  version     String                    // e.g., "v1", "v2"
  isActive    Boolean  @default(true)   // Only one version active per composition
  deployedAt  DateTime @default(now())
  description String?                   // Human-readable changelog

  @@unique([composition, version])
  @@index([composition, isActive])
}
```

### Key Relationships

```
CompositionVersion (1──N) RenderJob
  "ThankYouVideo:v2"  ──────→  jobs using this composition+version

Pipeline (in-memory) ──→ RenderJob
  pipeline.renderJobId  ──────→  RenderJob.id
```

---

## Pipeline Internals

### Stage Handlers

Each pipeline stage is handled by a dedicated function that uses the SkillBridge to perform work:

| Stage | Handler | What It Does |
|-------|---------|-------------|
| **ACQUIRE** | `handleAcquireStage()` | Scrapes `sourceUrls` via `skillBridge.scrapeUrl()`. Collects titles, content lengths, and page metadata. If no URLs configured, falls back to pipeline metadata. |
| **THINK** | `handleThinkStage()` | Collects output from the ACQUIRE stage (or metadata), calls `skillBridge.generateVideoScript()` and `skillBridge.analyzeContent()` to produce a structured video script and content analysis. |
| **DESIGN** | `handleDesignStage()` | Reads the script headline from the THINK stage output, calls `skillBridge.generateImage()` to create a 1920x1080 thumbnail or visual asset. |
| **RENDER** | `handleRenderStage()` | Collects all upstream stage outputs as `renderProps`, creates a render job ID, and queues the job for BullMQ → Lambda processing. |
| **TEST** | `handleTestStage()` | Runs `skillBridge.checkSystemHealth()` to verify Lambda, S3, Redis, and database connectivity. Optionally fetches A/B test results if `abTestId` is configured. |
| **DEPLOY** | `handleDeployStage()` | Tracks deployment events via `skillBridge.trackEvent()`, generates a CDN deploy URL, and fires a completion callback to the configured `callbackUrl`. |

### Error Handling

The pipeline engine implements a **fail-forward** model that preserves completed work:

```
Stage 1: COMPLETED ✓
Stage 2: COMPLETED ✓
Stage 3: FAILED    ✗ ← Error occurs here
Stage 4: SKIPPED   - ← Automatically skipped
Stage 5: SKIPPED   - ← Automatically skipped
```

**Pipeline status values:**

| Status | Meaning |
|--------|---------|
| `running` | Pipeline is currently executing stages |
| `completed` | All stages completed successfully |
| `failed` | The first stage failed — no stages completed |
| `partial` | Some stages completed before a failure — completed results are preserved |

**Callback behavior:**
- The completion callback fires regardless of final status (`completed`, `failed`, or `partial`)
- Callback URLs are validated against SSRF protection rules before being called
- Callback failures are logged but do not affect the pipeline status

### SkillBridge Integration Pattern

External skills wire into the pipeline through the SkillBridge abstraction layer:

```
Pipeline Stage Handler
  │
  ├── Calls SkillBridge.scrapeUrl(url)     ← firecrawl-scrape integration
  ├── Calls SkillBridge.generateScript()  ← LLM integration
  ├── Calls SkillBridge.generateImage()   ← image-generation integration
  ├── Calls SkillBridge.generateChart()   ← charts integration
  ├── Calls SkillBridge.createABTest()     ← marketing-ab-testing integration
  └── Calls SkillBridge.trackEvent()       ← analytics integration
        │
        ├── Zod input validation
        ├── TODO: Actual SDK call
        └── Typed response return
```

Each SkillBridge method includes:
1. **Zod validation** — Input parameters are validated against strict schemas
2. **Structured logging** — `[SkillBridge] methodName: params` for observability
3. **Typed returns** — Each method returns a strongly-typed interface
4. **Error handling** — Descriptive errors on validation failure

**To wire a real skill:**

```typescript
// In skill-bridge.ts, replace the TODO placeholder:
async scrapeUrl(url: string) {
  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) throw new Error(...);

  // Replace this placeholder with the actual SDK call:
  const result = await firecrawlScrape(parsed.data);
  return { markdown: result.content, title: result.title, metadata: result.meta };
}
```

---

## Project Structure (v3.0)

```
remotion-video-pro/
├── SKILL.md                              # Master skill definition
├── README.md                             # This file
├── rules/                                # 11 rendering rules
│   ├── 01-scaffolding.md                 # Project scaffolding patterns
│   ├── 02-animation-physics.md           # Animation physics principles
│   ├── 03-temporal-design.md             # Temporal design patterns
│   ├── 04-audio-sync.md                  # Audio synchronization
│   ├── 05-anti-slop-aesthetics.md        # Anti-slop visual quality
│   ├── 06-performance.md                 # Performance optimization
│   ├── 07-prompt-templates.md            # Prompt engineering templates
│   ├── 08-rendering-pipeline.md          # Rendering pipeline config
│   ├── 09-webhook-integration.md         # Webhook integration patterns
│   ├── 10-batch-rendering.md             # Batch rendering guidelines
│   └── 11-validation-pipeline.md         # Validation pipeline rules
├── templates/starter-project/            # Remotion project template
│   ├── src/
│   │   ├── Root.tsx                      # Remotion root composition
│   │   ├── MainVideo.tsx                 # Main video component
│   │   ├── index.ts                      # Entry point
│   │   └── scenes/
│   │       ├── HookScene.tsx              # Hook/attention scene
│   │       ├── ContentScene.tsx          # Content/body scene
│   │       └── CTAScene.tsx              # Call-to-action scene
│   ├── tests/
│   │   ├── run-all.ts                    # Test runner (26 checks)
│   │   ├── project-structure.ts          # Project structure validation
│   │   ├── frame-integrity.ts            # Frame integrity checks
│   │   └── pattern-compliance.ts         # Pattern compliance validation
│   ├── scripts/
│   │   └── validate-composition.ts       # Composition validator
│   ├── remotion.config.ts                # Remotion configuration
│   ├── tsconfig.json                     # TypeScript configuration
│   └── package.json                       # Dependencies
├── integration-skills/                    # 34 skill integration guides
│   ├── skill-manifest.json               # Skill tracking manifest
│   ├── README.md                         # Integration overview
│   ├── ARCHITECTURE.md                   # Pipeline architecture docs
│   ├── pipeline-diagram.png              # Visual pipeline diagram
│   ├── 01-content-ingestion/             # 5 skills
│   │   ├── firecrawl-scrape.md
│   │   ├── firecrawl-crawl.md
│   │   ├── spider.md
│   │   ├── web-reader.md
│   │   └── web-search.md
│   ├── 02-browser-automation/             # 4 skills
│   │   ├── browser-cdp.md
│   │   ├── browserbase-fetch.md
│   │   ├── fetch.md
│   │   └── agent-browser.md
│   ├── 03-video-production/               # 5 skills
│   │   ├── marketing-video.md
│   │   ├── video.md
│   │   ├── video-generation.md
│   │   ├── video-understand.md
│   │   └── storyboard-manager.md
│   ├── 04-ai-intelligence/                # 5 skills
│   │   ├── LLM.md
│   │   ├── VLM.md
│   │   ├── think.md
│   │   ├── council-of-five.md
│   │   └── chain-of-thought.md
│   ├── 05-marketing-analytics/            # 3 skills
│   │   ├── marketing-ab-testing.md
│   │   ├── marketing-launch.md
│   │   └── marketing-mode.md
│   ├── 06-monitoring-observability/       # 3 skills
│   │   ├── sentry-ai-monitoring.md
│   │   ├── sentry-nextjs-sdk.md
│   │   └── mcp-spy.md
│   ├── 07-cloud-deployment/              # 3 skills
│   │   ├── aws-agents-deploy.md
│   │   ├── amazon-bedrock.md
│   │   └── vercel.md
│   └── 08-content-design/                # 6 skills
│       ├── charts.md
│       ├── image-generation.md
│       ├── infographic-gen.md
│       ├── docx.md
│       ├── pdf.md
│       └── pptx.md
├── scripts/                               # Root-level scripts
│   ├── sync-skills.sh                    # Skill sync tool
│   └── skill-health-check.sh             # Health checker
├── webhook-service/                       # Next.js API + BullMQ worker
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                # Root layout
│   │   │   ├── page.tsx                  # Landing page
│   │   │   └── api/                      # 8 route handler directories
│   │   │       ├── pipeline/             # NEW: Pipeline endpoints
│   │   │       │   ├── route.ts          # POST/GET /api/pipeline
│   │   │       │   └── list/route.ts     # GET /api/pipeline/list
│   │   │       ├── render/route.ts       # POST/GET /api/render
│   │   │       ├── batch/route.ts        # POST/GET /api/batch
│   │   │       ├── stripe-webhook/route.ts  # POST /api/stripe-webhook
│   │   │       ├── composition/activate/route.ts  # POST/PUT/GET/DELETE
│   │   │       ├── ab/route.ts           # POST/GET /api/ab
│   │   │       ├── ab/[id]/route.ts     # GET/DELETE /api/ab/[id]
│   │   │       └── analytics/track/route.ts  # POST /api/analytics/track
│   │   ├── lib/                          # 11 library modules
│   │   │   ├── pipeline.ts               # NEW: Pipeline engine core
│   │   │   ├── pipeline-routes.ts        # NEW: 5 predefined routes
│   │   │   ├── skill-bridge.ts           # NEW: Skill integration bridge (13 methods)
│   │   │   ├── security.ts               # Auth + timingSafeEqual + PII sanitization
│   │   │   ├── rate-limit.ts             # Sliding window rate limiter
│   │   │   ├── url-validator.ts          # SSRF protection
│   │   │   ├── render.ts                 # Lambda render orchestration
│   │   │   ├── queue.ts                  # BullMQ queue setup
│   │   │   ├── hmac.ts                   # Checkout HMAC generation/verification
│   │   │   ├── stripe-checkout.ts        # Secure Stripe checkout session creation
│   │   │   └── db.ts                     # Prisma client singleton
│   │   └── worker.ts                     # BullMQ worker process
│   ├── prisma/
│   │   └── schema.prisma                 # Database models (RenderJob, CompositionVersion)
│   ├── scripts/
│   │   └── deploy-lambda.sh              # Lambda deployment script
│   ├── railway/
│   │   ├── README.md                     # Railway deployment guide
│   │   ├── api/railway.json              # API service config
│   │   └── worker/railway.json           # Worker service config
│   ├── Dockerfile.worker                 # Worker Dockerfile
│   ├── next.config.js                     # Next.js configuration
│   ├── tsconfig.json                      # TypeScript configuration
│   ├── package.json                      # Dependencies
│   └── package-lock.json
└── .github/workflows/ci.yml              # 4-gate CI pipeline
```

---

## Deployment

### Vercel (API Service — Production)

The webhook service API is deployed on Vercel for edge performance and automatic HTTPS.

```
URL: https://webhook-service-ten.vercel.app
```

### Railway (API + Worker)

Two separate Railway services sharing one codebase:

| Service | URL | Purpose |
|---------|-----|---------|
| API Service | `https://remotion-api-production-1362.up.railway.app` | Next.js webhook endpoints |
| Worker Service | (internal) | BullMQ job processor |

See `webhook-service/railway/README.md` for the full deployment guide.

### AWS Lambda (Rendering)

- Lambda workers execute Remotion compositions via `@remotion/lambda`
- Rendered videos are stored in S3 with public-read ACL
- Progress is polled every 2 seconds with a 10-minute timeout
- Failed renders are retried 3 times with exponential backoff

```bash
# Deploy Lambda rendering function
cd webhook-service
npm run deploy:lambda

# Skip tests (for emergency deploys)
npm run deploy:lambda:unsafe
```

### Required Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `WEBHOOK_SECRET` | Auth | Secret for `x-webhook-secret` header |
| `ADMIN_SECRET` | Auth | Secret for `x-admin-secret` header |
| `STRIPE_SECRET_KEY` | Stripe | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Stripe webhook signing secret |
| `CHECKOUT_HMAC_SECRET` | HMAC | Per-checkout HMAC secret for replay protection |
| `DATABASE_URL` | Prisma | PostgreSQL connection string |
| `REDIS_URL` | BullMQ | Redis connection for job queue |
| `REMOTION_AWS_REGION` | Lambda | AWS region for Lambda rendering |
| `REMOTION_FUNCTION_NAME` | Lambda | Lambda function name for rendering |
| `REMOTION_SERVE_URL` | Lambda | Remotion serve URL for compositions |

### CI/CD Pipeline

The GitHub Actions CI pipeline runs 4 gates:

1. **Typecheck** — `tsc --noEmit`
2. **Lint** — ESLint
3. **Build** — `next build`
4. **Validate** — Composition validator + test harness (26 checks)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|---------|
| API Framework | Next.js 14 | Webhook endpoints, API routes, middleware |
| Rendering | Remotion 4.x | Programmatic video composition and rendering |
| Job Queue | BullMQ + Redis | Async job processing with priority and retry |
| Serverless | AWS Lambda | On-demand video rendering at scale |
| Storage | Amazon S3 | Rendered video output storage |
| Database | PostgreSQL (Prisma ORM) | Job tracking, versioning, analytics |
| Validation | Zod | Input validation across all endpoints |
| Auth | HMAC-SHA256 + `timingSafeEqual` | Secure authentication and integrity verification |
| Rate Limiting | Sliding Window (in-memory) | Per-endpoint request throttling |
| Security | CSP / HSTS / X-Frame-Options / SSRF | Defense-in-depth web security |
| Testing | Chi-Square (Yates Correction) | Statistical A/B test significance |
| Payments | Stripe | Checkout sessions, subscription management |
| CI/CD | GitHub Actions | 4-gate automated pipeline |
| Monitoring | Sentry | Error tracking and AI agent monitoring |

---

## License

MIT
