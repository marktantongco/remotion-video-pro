# Remotion Webhook Service

Programmatic video rendering service built with **Next.js 14**, **Remotion**, **BullMQ**, and **AWS Lambda**.

## Architecture

```
Stripe/Generic Webhook
         │
         ▼
   ┌─────────────┐     ┌──────────┐     ┌──────────┐
   │  API Service  │────▶│  Redis   │────▶│  Worker  │
   │  (Next.js)   │     │ (BullMQ) │     │  (Bull)  │
   └─────────────┘     └──────────┘     └────┬─────┘
         │                                      │
         ▼                                      ▼
   ┌─────────────┐                       ┌──────────┐
   │  PostgreSQL  │                       │  Lambda  │
   │  (Prisma)    │                       │ (Render) │
   └─────────────┘                       └────┬─────┘
                                               │
                                               ▼
                                         ┌──────────┐
                                         │    S3     │
                                         │  (Output) │
                                         └──────────┘
```

## Deployment

### Railway (API + Worker)

Two separate Railway services sharing one codebase:

1. **API Service** — Next.js webhook endpoints
2. **Worker Service** — BullMQ job processor

See `webhook-service/railway/README.md` for full deployment guide.

### Required Environment Variables

See `.env.example` for all required variables.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/render` | POST | Trigger a render job |
| `/api/render?jobId=xxx` | GET | Poll job status |
| `/api/stripe-webhook` | POST | Stripe webhook handler |
| `/api/batch` | POST | Batch render (up to 10K) |
| `/api/batch` | GET | List batch jobs |
| `/api/composition/activate` | POST | Activate a composition version |
| `/api/composition/activate` | PUT | Register a new version |
| `/api/composition/activate` | GET | List all versions |
| `/api/composition/activate` | DELETE | Deactivate a version |

## Key Features

- **Versioned compositions** — deploy multiple versions, activate without downtime
- **Stripe webhook integration** — auto-render thank-you videos on purchase
- **HMAC verification** — per-checkout integrity check prevents replay attacks
- **Batch rendering** — up to 10K videos with cost guard ($500 limit)
- **Test harness** — 26 automated checks catch the 7 deadly sins of Remotion
- **CI pipeline** — 4-gate GitHub Actions pipeline (typecheck, lint, build, validate)

## Project Structure

```
remotion-video-pro/
├── webhook-service/          # Next.js API + BullMQ worker
│   ├── src/
│   │   ├── app/api/          # Route handlers
│   │   ├── lib/              # Queue, DB, Render, HMAC helpers
│   │   └── worker.ts         # BullMQ worker process
│   ├── prisma/               # Database schema
│   ├── railway/              # Railway deploy configs
│   └── scripts/              # Lambda deployment scripts
├── templates/starter-project/ # Remotion video project template
│   ├── src/                  # Composition + scenes
│   ├── tests/                # Test harness (26 checks)
│   └── scripts/              # Composition validator
├── rules/                    # 11 skill rules (scaffolding, animation, etc.)
└── SKILL.md                  # Master skill definition
```
