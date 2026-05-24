<div align="center">

# Remotion Video Pro

### Video Personalization Engine

Programmatic video rendering API with real-time personalization, built-in A/B testing, Stripe integration, batch processing, and enterprise-grade security.

[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/marktantongco/remotion-video-pro/ci.yml?branch=main&style=flat-square)](https://github.com/marktantongco/remotion-video-pro/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Remotion](https://img.shields.io/badge/Remotion-4.0-purple?style=flat-square)](https://www.remotion.dev/)

</div>

---

## Overview

Remotion Video Pro transforms any webhook event into a personalized video in under 60 seconds. It is not just a webhook service — it is a complete **video personalization engine** that renders millions of unique videos, tracks which versions drive higher customer lifetime value (LTV), and routes every render through a secure, audited pipeline.

The system works by receiving events from webhooks or Stripe, resolving the correct video composition (with optional A/B testing), enqueueing the render job via BullMQ, and executing it on AWS Lambda. Output videos are stored on S3 and delivered via public URLs or webhook callbacks.

### Key Capabilities

- **Real-Time Rendering** — AWS Lambda-powered renders with sub-60s delivery for 1080p videos
- **A/B Testing Framework** — Built-in experiment engine with chi-square significance testing, conversion tracking, and LTV correlation analysis
- **Stripe Integration** — Dual-layer security (signature verification + per-checkout HMAC) for automated thank-you and upsell videos
- **Batch Processing** — Up to 10,000 videos per batch with cost guards ($500 limit), priority queues, and webhook callbacks
- **Enterprise Security** — Timing-safe auth, SSRF protection, sliding-window rate limiting, security headers (CSP/HSTS/X-Frame-Options), and PII sanitization
- **Composition Versioning** — Atomic version activation with zero-downtime swaps. Test new compositions before going live
- **Analytics Pipeline** — Track email opens, video plays, and conversions per render. Correlate video variants with LTV

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INCOMING EVENTS                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Webhooks │  │ Stripe       │  │ Batch API        │  │
│  │ (custom) │  │ checkout     │  │ (up to 10K)      │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
└───────┼───────────────┼───────────────────┼─────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Auth     │  │ Rate     │  │ SSRF     │  │ Security │ │
│  │ (timing- │  │ Limiter  │  │ Guard    │  │ Headers  │ │
│  │  safe)   │  │ (sliding)│  │          │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    A/B TEST ENGINE                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Variant      │  │ Analytics    │  │ Chi-Square    │  │
│  │ Assignment   │  │ Tracking     │  │ Significance  │  │
│  │ (50/50)      │  │ (events)     │  │ Test          │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    BULLMQ QUEUE                           │
│         ┌────────────────────────────┐                    │
│         │  Priority Queues          │                    │
│         │  high → normal → low      │                    │
│         └────────────┬──────────────┘                    │
└──────────────────────┼───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    LAMBDA RENDERERS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Remotion     │  │ AWS Lambda   │  │ S3 Output    │  │
│  │ Compositions │  │ (parallel)   │  │ (public URL) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event arrives** — Webhook, Stripe, or batch API call hits the Next.js API layer
2. **Security layer** — Authentication (timing-safe), rate limiting, SSRF guard, security headers
3. **A/B resolution** — If an active test exists, 50/50 variant assignment; version resolved
4. **Job creation** — RenderJob + RenderAnalytics records created in PostgreSQL
5. **Queue** — Job enqueued in BullMQ (Redis) with priority and retry policy
6. **Worker** — BullMQ worker picks up job, renders on AWS Lambda via Remotion
7. **Output** — Video stored on S3, callback fired, analytics updated

---

## Security

This project underwent a comprehensive security audit that identified and fixed **6 critical vulnerabilities**:

| Vulnerability | Risk | Fix |
|---|---|---|
| **Timing attack on webhook secret** | Secret extractable in ~6 hours of sustained traffic | Constant-time comparison using `crypto.timingSafeEqual` |
| **Zero security headers** | Clickjacking, MIME sniffing, no HTTPS enforcement | Full header suite: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Unauthenticated GET endpoints** | Customer PII (names, emails, amounts) exposed without auth | Auth required on all endpoints; `sanitizeJobResponse()` masks PII |
| **No rate limiting** | Render queue flooding with expensive jobs | Sliding-window rate limiter per IP (60/min render, 10/min batch, 100/min Stripe) |
| **SSRF via callbackUrl** | Internal network probing, cloud metadata access | URL validation blocks private IPs, numeric IP bypass, AWS metadata endpoint |
| **Weak RNG in HMAC checkout** | Predictable checkout IDs | `crypto.randomBytes()` replaces `Math.random()` |

### Authentication Model

| Header | Purpose | Endpoints |
|---|---|---|
| `x-webhook-secret` | External webhook systems | `/api/render`, `/api/batch` |
| `x-admin-secret` | Admin operations | `/api/composition/activate`, `/api/ab`, `/api/batch` (GET) |
| `stripe-signature` | Stripe webhook verification | `/api/stripe-webhook` |
| `x-analytics-token` | Lightweight tracking auth | `/api/analytics/track` |

### Security Headers (applied to all responses)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; ...
```

---

## API Reference

### Render

#### `POST /api/render` — Trigger a render job

```bash
curl -X POST https://your-api.com/api/render \
  -H "x-webhook-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.completed",
    "data": {
      "customerName": "Alice",
      "email": "alice@example.com",
      "productName": "Widget Pro",
      "amount": "49.99"
    },
    "version": "v2"
  }'
```

**Rate limit:** 60 req/min per IP | **Auth:** `x-webhook-secret`

#### `GET /api/render?jobId=xxx` — Poll job status

PII is automatically sanitized in responses (emails masked, amounts redacted).

```bash
curl https://your-api.com/api/render?jobId=clx123... \
  -H "x-webhook-secret: your-secret"
```

**Rate limit:** 120 req/min per IP | **Auth:** `x-webhook-secret`

---

### Batch

#### `POST /api/batch` — Batch render up to 10K videos

Cost guard: estimated cost must not exceed $500 per batch.

```bash
curl -X POST https://your-api.com/api/batch \
  -H "x-webhook-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "composition": "ThankYouVideo",
    "records": [
      { "id": "1", "props": { "customerName": "Alice", "amount": "49.99" } },
      { "id": "2", "props": { "customerName": "Bob", "amount": "29.99" } }
    ],
    "callbackUrl": "https://your-app.com/webhooks/batch-complete",
    "priority": "high"
  }'
```

**Rate limit:** 10 req/min per IP | **Auth:** `x-webhook-secret`

#### `GET /api/batch?composition=ThankYouVideo&limit=50` — List jobs

**Rate limit:** 120 req/min per IP | **Auth:** `x-admin-secret`

---

### Stripe Webhook

#### `POST /api/stripe-webhook` — Stripe event handler

Dual-layer verification: Stripe webhook signature + per-checkout HMAC. Supports automatic A/B test variant assignment with Stripe metadata tagging.

**Rate limit:** 100 req/min per IP | **Auth:** Stripe signature + HMAC

**Supported events:**
| Stripe Event | Composition |
|---|---|
| `checkout.session.completed` | ThankYouVideo |
| `customer.subscription.created` | WelcomeVideo |
| `customer.subscription.renewed` | RenewalVideo |
| `invoice.payment_succeeded` | ReceiptVideo |

---

### Composition Versioning

#### `POST /api/composition/activate` — Activate a version

Atomically deactivates all other versions and activates the target.

```bash
curl -X POST https://your-api.com/api/composition/activate \
  -H "x-admin-secret: your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{ "composition": "ThankYouVideo", "version": "v2" }'
```

#### `PUT /api/composition/activate` — Register a version (inactive)

#### `GET /api/composition/activate?composition=ThankYouVideo` — List versions

#### `DELETE /api/composition/activate?composition=X&version=Y` — Deactivate

**Rate limit:** 30 req/min (write) / 120 req/min (read) per IP | **Auth:** `x-admin-secret`

---

### A/B Testing

#### `POST /api/ab` — Create an A/B test

One active test per composition. Creates experiment with 50/50 split.

```bash
curl -X POST https://your-api.com/api/ab \
  -H "x-admin-secret: your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "thank-you-color-test",
    "composition": "ThankYouVideo",
    "controlVersion": "v1",
    "treatmentVersion": "v2",
    "stripeMetadataKey": "video_variant"
  }'
```

#### `GET /api/ab?composition=ThankYouVideo` — List tests with results

Returns aggregated per-variant stats: render count, completions, conversions, conversion rate, average LTV.

#### `GET /api/ab/[id]` — Detailed test results

Includes daily breakdown, chi-square significance test p-value, and confidence level.

#### `DELETE /api/ab/[id]` — End an A/B test

**Rate limit:** 30 req/min (write) / 120 req/min (read) per IP | **Auth:** `x-admin-secret`

---

### Analytics

#### `POST /api/analytics/track` — Track post-render events

Track email opens, video plays, and conversions for A/B test analysis.

```bash
curl -X POST https://your-api.com/api/analytics/track \
  -H "x-analytics-token: your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "clx123...",
    "event": "converted",
    "ltv": 149.99
  }'
```

**Events:** `email_opened`, `video_played`, `converted`
**Rate limit:** 100 req/min per IP | **Auth:** `x-analytics-token`

---

## Project Structure

```
remotion-video-pro/
├── webhook-service/                    # Next.js API + BullMQ worker
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── render/            # Single render + job status
│   │   │   │   ├── batch/             # Batch render + job listing
│   │   │   │   ├── stripe-webhook/    # Stripe event handler + A/B integration
│   │   │   │   ├── composition/
│   │   │   │   │   └── activate/      # Version management (CRUD)
│   │   │   │   ├── ab/                # A/B test management
│   │   │   │   │   └── [id]/          # A/B test results + significance
│   │   │   │   └── analytics/
│   │   │   │       └── track/         # Post-render event tracking
│   │   │   ├── layout.tsx             # Root layout
│   │   │   └── page.tsx               # Landing page
│   │   ├── lib/
│   │   │   ├── security.ts            # Auth, timing-safe compare, PII sanitization
│   │   │   ├── rate-limit.ts          # Sliding-window rate limiter
│   │   │   ├── url-validator.ts       # SSRF protection
│   │   │   ├── hmac.ts                # Per-checkout HMAC verification
│   │   │   ├── stripe-checkout.ts     # Secure checkout session creation
│   │   │   ├── queue.ts               # BullMQ queue
│   │   │   ├── render.ts              # AWS Lambda rendering
│   │   │   └── db.ts                  # Prisma client
│   │   ├── middleware.ts              # Security headers + CORS
│   │   └── worker.ts                 # BullMQ worker process
│   ├── prisma/
│   │   └── schema.prisma              # RenderJob, CompositionVersion, ABTest, RenderAnalytics
│   ├── railway/                       # Railway deploy configs (api + worker)
│   ├── scripts/deploy-lambda.sh       # Lambda deployment script
│   └── Dockerfile.worker              # Worker container
├── templates/starter-project/         # Remotion video project template
│   ├── src/
│   │   ├── MainVideo.tsx              # Main composition
│   │   ├── Root.tsx                   # Root component
│   │   └── scenes/                    # Hook, Content, CTA scenes
│   ├── tests/                         # Test harness (26 checks)
│   └── scripts/validate-composition.ts
├── rules/                             # 11 skill rules
│   ├── 01-scaffolding.md
│   ├── 02-animation-physics.md
│   ├── 03-temporal-design.md
│   ├── 04-audio-sync.md
│   ├── 05-anti-slop-aesthetics.md
│   ├── 06-performance.md
│   ├── 07-prompt-templates.md
│   ├── 08-rendering-pipeline.md
│   ├── 09-webhook-integration.md
│   ├── 10-batch-rendering.md
│   └── 11-validation-pipeline.md
├── .github/workflows/ci.yml           # 4-gate CI pipeline
└── SKILL.md                           # Master skill definition
```

---

## Database Schema

### RenderJob

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `composition` | String | Target composition (e.g., "ThankYouVideo") |
| `version` | String? | Version tag (e.g., "v2") |
| `props` | Json | Render input props (customer data) |
| `status` | String | `pending` → `rendering` → `done` / `failed` |
| `progress` | Float | Render progress (0-1) |
| `outputUrl` | String? | S3 public URL of rendered video |
| `abTestId` | String? | A/B test cohort ID |
| `abVariant` | String? | `control` or `treatment` |
| `stripeMetadata` | Json? | Raw Stripe metadata for analytics |
| `ltvTracked` | Boolean | Has LTV data been captured? |

### CompositionVersion

| Field | Type | Description |
|---|---|---|
| `composition` | String | Composition name |
| `version` | String | Version tag |
| `isActive` | Boolean | Currently active version? |
| `deployedAt` | DateTime | When this version was registered |

### ABTest

| Field | Type | Description |
|---|---|---|
| `name` | String | Test name |
| `composition` | String | Target composition |
| `controlVersion` | String | Control group version |
| `treatmentVersion` | String | Treatment group version |
| `stripeMetadataKey` | String | Key stored in Stripe metadata |
| `isActive` | Boolean | Currently running? |

### RenderAnalytics

| Field | Type | Description |
|---|---|---|
| `jobId` | String | Related render job |
| `abTestId` | String? | Related A/B test |
| `deliveryOpen` | Boolean? | Recipient opened the email? |
| `videoPlayed` | Boolean? | Recipient watched the video? |
| `conversion` | Boolean? | Recipient converted? |
| `ltv` | Float? | Customer lifetime value |

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/remotion"

# Redis (BullMQ queue)
REDIS_URL="redis://host:6379"

# Remotion Lambda
REMOTION_AWS_ACCESS_KEY_ID=your_key
REMOTION_AWS_SECRET_ACCESS_KEY=your_secret
REMOTION_AWS_REGION=us-east-1
REMOTION_SERVE_URL=https://your-site.s3.amazonaws.com/index.html
REMOTION_FUNCTION_NAME=remotion-render-fn

# Authentication
WEBHOOK_SECRET=generate-a-long-random-string
ADMIN_SECRET=generate-a-different-long-random-string
CHECKOUT_HMAC_SECRET=64-char-hex-from-crypto.randomBytes(32)

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Analytics (lightweight auth for tracking)
ANALYTICS_TOKEN=generate-a-tracking-token

# Callback URL security (optional)
ALLOWED_CALLBACK_DOMAINS=your-app.com,api.your-app.com

# Worker config
WORKER_CONCURRENCY=5
```

---

## Deployment

### Railway (API + Worker)

Two Railway services share one codebase:

1. **API Service** — Next.js webhook endpoints (`npm run build && npm start`)
2. **Worker Service** — BullMQ job processor (`npx tsx src/worker.ts`)

The free plan supports 3 services (API + PostgreSQL + Redis). The Worker requires a 4th service (upgrade plan or deploy to Render).

### Vercel

The Next.js API service deploys directly to Vercel:

```bash
npx vercel --prod
```

Set environment variables in the Vercel dashboard. Note: The BullMQ Worker is not compatible with Vercel serverless — deploy the worker separately to Railway or Render.

### Render (Worker Fallback)

The worker container is configured via `Dockerfile.worker`:

```bash
docker build -f Dockerfile.worker -t remotion-worker .
```

---

## CI/CD

The 4-gate GitHub Actions pipeline runs on every push and PR:

| Gate | Purpose | Command |
|---|---|---|
| 1. Type Check | TypeScript compilation | `npx tsc --noEmit` |
| 2. Lint & Secrets | Detect committed secrets | `git diff` + `.env` scan |
| 3. Build | Next.js production build | `npm run build` |
| 4. Validate | Composition compliance | `validate-composition.ts` + `run-all.ts` (26 checks) |

---

## A/B Testing Guide

### How It Works

1. **Create a test** — POST `/api/ab` with control and treatment versions
2. **Incoming renders are auto-assigned** — 50/50 split when an active test exists for the composition
3. **Variant stored in Stripe** — The assignment is written to the Stripe checkout session metadata
4. **Track events** — POST `/api/analytics/track` when emails are opened, videos played, or conversions happen
5. **View results** — GET `/api/ab/[id]` shows per-variant stats + chi-square significance test

### Example Workflow

```bash
# 1. Create A/B test
curl -X POST /api/ab -H "x-admin-secret: $ADMIN" -d '{
  "name": "hero-color-test",
  "composition": "ThankYouVideo",
  "controlVersion": "v1",
  "treatmentVersion": "v2",
  "stripeMetadataKey": "video_variant"
}'

# 2. Purchases flow through Stripe → webhook auto-assigns variant
# Variant is stored on both RenderJob and Stripe session metadata

# 3. Track conversions (called from your app after user takes action)
curl -X POST /api/analytics/track -H "x-analytics-token: $TOKEN" -d '{
  "jobId": "clx...",
  "event": "converted",
  "ltv": 149.99
}'

# 4. Check results with statistical significance
curl /api/ab/[test-id] -H "x-admin-secret: $ADMIN"
# Returns: control vs treatment stats, p-value, confidence level
```

---

## Starter Project

The `templates/starter-project/` directory contains a production-ready Remotion project with:

- **3 scenes**: Hook, Content, CTA (with `TransitionSeries`)
- **Test harness**: 26 automated checks for the 7 deadly sins of Remotion
- **Composition validator**: Frame integrity, pattern compliance, project structure

---

## Tech Stack

| Component | Technology |
|---|---|
| API Framework | Next.js 14 (App Router) |
| Video Rendering | Remotion 4.0 + AWS Lambda |
| Queue | BullMQ 5.0 + Redis |
| Database | PostgreSQL + Prisma ORM |
| Payments | Stripe (checkout sessions + webhooks) |
| Security | crypto.timingSafeEqual, CSP, HSTS, SSRF guard |
| CI/CD | GitHub Actions (4-gate pipeline) |
| Deployment | Railway, Vercel, Render |

---

## License

MIT

---

<div align="center">

Built by [marktantongco](https://github.com/marktantongco)

</div>
