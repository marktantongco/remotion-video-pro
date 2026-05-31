# Remotion Video Pro — Integration Architecture

## Overview

This document describes how 32 external skills integrate with the `remotion-video-pro` core skill set to create a unified, end-to-end programmatic video production pipeline.

---

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CONTENT INGESTION (01)                           │
│  firecrawl-scrape · firecrawl-crawl · spider · web-reader · web-search  │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Raw content (markdown, HTML, JSON)
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     BROWSER AUTOMATION (02)                              │
│  browser-cdp · browserbase-fetch · fetch · agent-browser                │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Enriched data, screenshots, page captures
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      AI INTELLIGENCE (04)                                │
│  LLM · VLM · think · council-of-five · chain-of-thought               │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Scripts, storyboards, design decisions, asset prompts
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │              REMOTION VIDEO PRO (Core)                              │  │
│  │  rules/01-scaffolding → 02-animation-physics → 03-temporal-design  │  │
│  │  → 04-audio-sync → 05-anti-slop-aesthetics → 06-performance       │  │
│  │  → 07-prompt-templates → 08-rendering-pipeline                     │  │
│  │  → 09-webhook-integration → 10-batch-rendering                     │  │
│  │  → 11-validation-pipeline                                            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                           VIDEO PRODUCTION (03)                          │
│  marketing-video · video · video-generation · video-understand           │
│  storyboard-manager · image-generation · infographic-gen                  │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Rendered MP4s, thumbnails, analytics events
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    MARKETING ANALYTICS (05)                              │
│  marketing-ab-testing · marketing-launch · marketing-mode               │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Test results, launch campaigns, variant data
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   MONITORING (06)                                        │
│  sentry-ai-monitoring · sentry-nextjs-sdk · mcp-spy                    │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ Traces, errors, performance metrics
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLOUD DEPLOYMENT (07)                                 │
│  aws-agents-deploy · amazon-bedrock · vercel                           │
└──────────────────────────────────────────────────────────────────────────┘

   CONTENT DESIGN (08) — cross-cutting: charts · docx · pdf · pptx · image-generation
```

---

## Stage Integration Details

### Stage 1: Content Ingestion → Remotion

**Skill → Remotion Integration Points:**

| Skill | How it feeds Remotion | Example Pipeline |
|-------|-----------------------|------------------|
| `firecrawl-scrape` | Scrape product pages → extract data → inject as Remotion props | CRM webhook triggers scrape of new product → data flows to `ContentScene` props |
| `firecrawl-crawl` | Crawl entire docs section → batch-generate tutorial videos | Docs site crawl → 50 pages → 50 Remotion renders via `/api/render/batch` |
| `spider` | Security scan results → automated compliance video reports | Weekly scan → Spider collects data → Remotion generates compliance report video |
| `web-reader` | Blog posts → repurposed as video summaries | RSS feed → web-reader extracts articles → Remotion generates summary clips |
| `web-search` | Trending topics → automated social video content | Search trending keywords → Remotion generates TikTok clips for each |

**Technical Pattern:**
```typescript
// webhook-service/src/app/api/scrape-and-render/route.ts
import { scrape } from 'firecrawl-sdk';

async function scrapeAndRender(url: string, compositionId: string) {
  // 1. Ingest content
  const content = await scrape(url);
  
  // 2. Transform to Remotion props via AI (Stage 4)
  const props = await transformToVideoProps(content);
  
  // 3. Enqueue render job (Core Rule 10)
  await renderQueue.add('render', {
    compositionId,
    inputProps: props,
    // A/B test variant assignment (Stage 5)
    abTestId: abTest.id,
    variant: abTest.variant,
  });
}
```

---

### Stage 2: Browser Automation → Remotion

| Skill | Integration | Example |
|-------|-------------|---------|
| `browser-cdp` | Capture authenticated page screenshots → use as video backgrounds | CDP captures user dashboard → Remotion overlays personalized data |
| `browserbase-fetch` | Fetch JS-rendered pages for data extraction | Browserbase fetches SPA product page → data → video |
| `fetch` | Quick HTTP checks for webhook health monitoring | Fetch webhook endpoint → validate → render status video |
| `agent-browser` | Full browser automation for complex multi-step workflows | Agent browses competitor sites → captures screenshots → comparison video |

---

### Stage 3: Video Production (Core + Skills)

**The core `remotion-video-pro` skill provides 11 rules that govern all video creation. External skills extend it:**

| External Skill | Remotion Rule Integration | What it adds |
|----------------|--------------------------|--------------|
| `marketing-video` | Extends Rule 07 (prompt-templates) | Production workflows, AI video model comparison, agent-native pipeline |
| `video` | Extends Rules 01-03 | Tool selection matrix (Remotion vs Hyperframes vs AI avatars), editing tools |
| `video-generation` | Extends Rule 06 (performance) | AI-generated B-roll via z-ai-web-dev-sdk, base64 image assets |
| `video-understand` | Extends Rule 04 (audio-sync) | Video analysis for repurposing existing content |
| `storyboard-manager` | Extends Rule 03 (temporal-design) | Pre-production planning, character consistency, timeline tracking |
| `image-generation` | Extends Rule 05 (anti-slop-aesthetics) | AI-generated thumbnails, hero images, custom assets |
| `infographic-gen` | Extends Rule 05 (anti-slop-aesthetics) | Data visualization frames within video sequences |

**Pattern: Marketing Video → Remotion Composition**
```typescript
// marketing-video skill generates the script
// remotion-video-pro rule 07 provides the template
// The bridge is the webhook-service API

export const MarketingVideo: React.FC<MarketingVideoProps> = ({
  headline,
  bodyLines,
  ctaText,
  variant, // A/B test variant
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Rule 02: spring-based animation
  const titleY = spring({ frame, from: -50, to: 0, fps });
  
  // Rule 03: temporal design — hook in first 1.5 seconds
  const hookComplete = frame > Math.round(fps * 1.5);
  
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={Math.round(fps * 1.5)}>
        <AnimatedTitle text={headline} y={titleY} />
      </Sequence>
      {hookComplete && bodyLines.map((line, i) => (
        <Sequence key={i} from={Math.round(fps * (1.5 + i * 0.8))}>
          <BodyText text={line} />
        </Sequence>
      ))}
      <Sequence from={Math.round(fps * (1.5 + bodyLines.length * 0.8))}>
        <CTAButton text={ctaText} variant={variant} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

### Stage 4: AI Intelligence → Video Pipeline

| Skill | Integration Point | Example |
|-------|-------------------|---------|
| `LLM` | Script generation, content transformation | Raw scraped data → LLM → structured video props |
| `VLM` | Image analysis for video asset selection | Product screenshots → VLM scores visual quality → best used as hero frame |
| `think` | Architecture decisions for video pipeline design | "Should we use Lambda or CloudRun for rendering?" |
| `council-of-five` | Creative direction decisions for video style | 5 personas debate: minimalist vs maximalist video design |
| `chain-of-thought` | Complex video logic debugging | "Why is this composition rendering blank frames?" |

**Pattern: LLM as Content Transformer**
```typescript
// In webhook-service, LLM transforms raw content → Remotion props
import ZAI from 'z-ai-web-dev-sdk';

async function generateVideoProps(scrapedContent: string): Promise<VideoProps> {
  const zai = await ZAI.create();
  const result = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: VIDEO_PROPS_GENERATION_PROMPT },
      { role: 'user', content: scrapedContent }
    ],
  });
  return JSON.parse(result.choices[0].message.content);
}
```

---

### Stage 5: Marketing Analytics → Video Optimization

**This is where the A/B testing framework (built in previous session) connects:**

| Skill | Integration Point | Example |
|-------|-------------------|---------|
| `marketing-ab-testing` | Extends Prisma ABTest model | Video variant A vs B → chi-square significance test |
| `marketing-launch` | Video launch campaigns | Product Hunt launch video → marketing-launch manages the ORB framework |
| `marketing-mode` | Ongoing video content strategy | Weekly video calendar, content pillars |

**Pattern: A/B Test → Batch Render**
```typescript
// Create A/B test for video variants
POST /api/ab
{
  "name": "hero-video-cta-color",
  "variants": {
    "control": { ctaColor: "#FF6B35" },
    "treatment": { ctaColor: "#00D4AA" }
  }
}

// Each webhook render job carries the variant assignment
// RenderAnalytics tracks: views, click-through, completion rate
// GET /api/ab/[id] → chi-square test → statistical significance
```

---

### Stage 6: Monitoring → Production Reliability

| Skill | Integration Point | Example |
|-------|-------------------|---------|
| `sentry-ai-monitoring` | Monitor LLM calls in webhook-service | Track token usage, latency for content generation |
| `sentry-nextjs-sdk` | Full-stack error monitoring for webhook-service | Capture render failures, Lambda timeouts |
| `mcp-spy` | Debug MCP communication issues | Debug skill orchestration latency |

**Integration with webhook-service:**
```typescript
// src/instrumentation-client.ts (sentry-nextjs-sdk pattern)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  streamGenAiSpans: true,
  integrations: [
    Sentry.vercelAIIntegration(), // monitor z-ai-web-dev-sdk calls
  ],
});
```

---

### Stage 7: Cloud Deployment → Scale

| Skill | Integration Point | Example |
|-------|-------------------|---------|
| `aws-agents-deploy` | Deploy Remotion Lambda workers to AWS | `agentcore deploy --target production` |
| `amazon-bedrock` | Use Bedrock models for content generation | Claude via Bedrock for video script writing |
| `vercel` | Deploy webhook-service frontend | Vercel deployment for API + landing page |

---

## Cross-Cutting: Content Design (08)

These skills support every stage:

| Skill | Used At | Purpose |
|-------|---------|---------|
| `charts` | Stage 1 (data viz in ingestion) | Generate charts that become video frames |
| `image-generation` | Stage 3 (assets) | AI-generated thumbnails, hero images |
| `infographic-gen` | Stage 3 (assets) | Infographic frames within video |
| `docx` | Stage 5 (reports) | Generate A/B test reports |
| `pdf` | Stage 5 (reports) | Generate pipeline performance reports |
| `pptx` | Stage 5 (presentations) | Video strategy presentations |

---

## Data Flow Summary

```
1. TRIGGER: Webhook / API / Schedule
   ↓
2. INGEST: firecrawl-scrape/crawl → raw content
   ↓
3. ENRICH: browser-cdp/browserbase-fetch → screenshots, interactive data
   ↓
4. TRANSFORM: LLM + think → structured video props (JSON)
   ↓
5. DESIGN: council-of-five → creative direction; image-generation → assets
   ↓
6. RENDER: remotion-video-pro core → MP4 output
   ↓
7. ANALYZE: marketing-ab-testing → variant performance
   ↓
8. MONITOR: sentry → errors, traces, AI calls
   ↓
9. DEPLOY: aws-agents-deploy / vercel → production
   ↓
10. REPORT: docx/pdf/charts → performance dashboards
```

---

## Security Considerations (Cross-Stage)

All stages must adhere to the 6-point security framework from `remotion-video-pro`:

1. **timingSafeEqual** — Webhook signature verification (Stage 1 trigger)
2. **Security Headers** — CSP/HSTS/X-Frame-Options (Stage 9 deploy)
3. **Auth + PII Sanitization** — GET request auth, `sanitizeJobResponse()` (Stage 2-3)
4. **Sliding Window Rate Limiting** — Per-endpoint thresholds (Stage 1 API)
5. **SSRF Protection** — URL validation for scrape targets (Stage 1-2)
6. **crypto.randomBytes** — Secure random for A/B assignment (Stage 5)
