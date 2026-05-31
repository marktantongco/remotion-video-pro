# Integration Skills Directory

A categorized collection of skill references for the Remotion Video Pro pipeline. Each category contains copied `SKILL.md` files from the central skills library (`/home/z/my-project/skills/`), organized by function in the video production workflow.

## Pipeline Overview

```
┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐    ┌───────────────┐    ┌──────────────────┐
│  Content         │───▶│  Browser           │───▶│  AI Intelligence │───▶│  Video           │───▶│  Marketing         │───▶│  Monitoring   │───▶│  Cloud           │
│  Ingestion       │    │  Automation         │    │                   │    │  Production      │    │  Analytics         │    │               │    │  Deployment      │
└──────────────────┘    └────────────────────┘    └──────────────────┘    └──────────────────┘    └────────────────────┘    └───────────────┘    └──────────────────┘
        01                      02                        04                      03                      05                       06                     07

   ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
   │                              08  Content Design  (supports all stages)                                                                                    │
   └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Data flow:** `Content Ingestion → Browser Automation → AI Intelligence → Video Production → Marketing Analytics → Monitoring → Cloud Deployment`

Each arrow represents a stage transition where the output of one category feeds into the next. Content Design (08) is a cross-cutting category that supports all stages with charts, images, documents, and infographics.

---

## Categories

### 01 — Content Ingestion
**Purpose:** Data gathering, content sourcing, and research

| Skill | Source | Description |
|-------|--------|-------------|
| `firecrawl-scrape.md` | `/skills/firecrawl-scrape/` | Extract clean markdown from any URL, including JS-rendered SPAs |
| `firecrawl-crawl.md` | `/skills/firecrawl-crawl/` | Bulk extract content from entire websites or site sections |
| `spider.md` | `/skills/spider/` | Web crawling, scraping, security scanning, and content extraction |
| `web-reader.md` | `/skills/web-reader/` | Web page content extraction with title, HTML, and publication metadata |
| `web-search.md` | `/skills/web-search/` | Real-time web search for up-to-date information retrieval |

### 02 — Browser Automation
**Purpose:** Browser control, page interaction, and session management

| Skill | Source | Description |
|-------|--------|-------------|
| `browser-cdp.md` | `/skills/browser-cdp/` | Chrome DevTools Protocol control for reusing login sessions |
| `browserbase-fetch.md` | `/skills/browserbase-fetch/` | Fetch HTML/JSON from static pages without full browser sessions |
| `fetch.md` | `/skills/fetch/` | Simple URL retrieval for static content, status codes, redirects |
| `agent-browser.md` | `/skills/agent-browser/` | Headless browser automation CLI with Node.js fallback |

### 03 — Video Production
**Purpose:** Video creation, generation, and storyboard management

| Skill | Source | Description |
|-------|--------|-------------|
| `marketing-video.md` | `/skills/marketing-video/` | AI video production for marketing campaigns and content |
| `video.md` | `/skills/video/` | General video creation and generation workflows |
| `video-generation.md` | `/skills/video-generation/` | Programmatic video generation using AI tools |
| `video-understand.md` | `/skills/video-understand/` | Video content analysis, scene understanding, and temporal extraction |
| `storyboard-manager.md` | `/skills/storyboard-manager/` | Storyboard creation, timeline tracking, and narrative structure |

### 04 — AI Intelligence
**Purpose:** AI reasoning, LLM integration, and multi-perspective analysis

| Skill | Source | Description |
|-------|--------|-------------|
| `LLM.md` | `/skills/LLM/` | Large language model chat completions and conversations |
| `VLM.md` | `/skills/VLM/` | Vision-based AI for image understanding and multimodal interaction |
| `think.md` | `/skills/think/` | Deep multi-framework reasoning using Gemini |
| `council-of-five.md` | `/skills/council-of-five/` | Spawn 5 diverse Opus subagents to debate problems |
| `chain-of-thought.md` | `/skills/chain-of-thought/` | Structured chain-of-thought reasoning patterns |

### 05 — Marketing Analytics
**Purpose:** A/B testing, launch strategy, and marketing optimization

| Skill | Source | Description |
|-------|--------|-------------|
| `marketing-ab-testing.md` | `/skills/marketing-ab-testing/` | Plan, design, and implement A/B tests and growth experiments |
| `marketing-launch.md` | `/skills/marketing-launch/` | Product launch strategy, GTM plans, and release orchestration |
| `marketing-mode.md` | `/skills/marketing-mode/` | Marketing-focused mode with specialized prompting |

### 06 — Monitoring & Observability
**Purpose:** Error tracking, performance monitoring, and MCP debugging

| Skill | Source | Description |
|-------|--------|-------------|
| `sentry-ai-monitoring.md` | `/skills/sentry-ai-monitoring/` | Sentry AI Agent Monitoring for LLM call tracking |
| `sentry-nextjs-sdk.md` | `/skills/sentry-nextjs-sdk/` | Full Sentry SDK for Next.js error, tracing, and replay |
| `mcp-spy.md` | `/skills/mcp-spy/` | Debug MCP server communication and analyze latency |

### 07 — Cloud Deployment
**Purpose:** AWS, Vercel, and cloud infrastructure deployment

| Skill | Source | Description |
|-------|--------|-------------|
| `aws-agents-deploy.md` | `/skills/aws-agents-deploy/` | Deploy agents to AWS with CDK, IAM, and quota management |
| `amazon-bedrock.md` | `/skills/amazon-bedrock/` | Generative AI on Amazon Bedrock (model invocation, RAG, agents) |
| `vercel.md` | `/skills/vercel/` | Vercel platform deployment, Edge Functions, and CDN strategies |

### 08 — Content Design
**Purpose:** Visual content creation — charts, images, documents, and infographics

| Skill | Source | Description |
|-------|--------|-------------|
| `charts.md` | `/skills/charts/` | Professional charts, diagrams, and data visualizations |
| `image-generation.md` | `/skills/image-generation/` | AI image generation from text descriptions |
| `infographic-gen.md` | `/skills/infographic-gen/` | Publication-ready infographic generation from content |
| `docx.md` | `/skills/docx/` | Professional Word document creation and editing |
| `pdf.md` | `/skills/pdf/` | PDF document creation, typesetting, and design |
| `pptx.md` | `/skills/pptx/` | Presentation creation and editing (.pptx files) |

---

## How Skills Map to the Remotion Pipeline

```
STAGE 1: RESEARCH & SOURCING
  Use 01-content-ingestion skills to gather URLs, scrape competitor videos,
  collect data, and search for trending topics.

STAGE 2: INTERACTIVE CONTENT CAPTURE
  Use 02-browser-automation skills to navigate pages, capture screenshots,
  extract auth tokens, and automate repetitive web interactions.

STAGE 3: CONTENT ANALYSIS & SCRIPTING
  Use 04-ai-intelligence skills to analyze gathered content, generate scripts,
  reason about creative direction, and evaluate multiple perspectives.

STAGE 4: ASSET CREATION
  Use 08-content-design skills to create charts, generate images, build
  infographics, and produce supporting documents.

STAGE 5: VIDEO PRODUCTION
  Use 03-video-production skills to create storyboards, generate video content,
  analyze existing videos, and produce marketing video campaigns.

STAGE 6: LAUNCH & OPTIMIZATION
  Use 05-marketing-analytics skills to plan launches, run A/B tests,
  and optimize video performance metrics.

STAGE 7: OPERATIONS
  Use 06-monitoring-observability skills for error tracking and performance.
  Use 07-cloud-deployment skills for infrastructure and CDN delivery.
```

---

## Maintenance

- **Source of truth:** `/home/z/my-project/skills/` — always edit there first
- **Update process:** Re-run the copy command to sync changes
- **Adding skills:** Copy the SKILL.md to the appropriate category folder and update this README

---

*Generated for the Remotion Video Pro integration pipeline.*
