# 08 — DevOps & Deploy

Infrastructure, CI/CD, and deployment for the video rendering pipeline.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **aws-agents-deploy** | Railway/Vercel/Lambda deployment (173 installs) |
| **amazon-bedrock** | AWS AI model deployment and AgentCore |
| **vercel** | Vercel deployment and edge functions |
| **deployment-manager** | Multi-platform deployment orchestration |
| **github** | CI/CD, repo management, release workflow |
| **fullstack-dev** | Next.js dashboard for render management |

## Remotion Integration

These skills operate at Stage 6 (DEPLOY). They make video rendering
accessible via webhooks, dashboards, and serverless infrastructure.

### Deployment Topology

```
[GitHub] → [CI/CD] → [Railway API Service]
                          │
                          ├── webhook-service (Next.js)
                          │   ├── /api/render (single render)
                          │   ├── /api/batch (batch render)
                          │   ├── /api/stripe-webhook (payment trigger)
                          │   └── /api/ab/* (A/B testing)
                          │
                          └── [Railway Worker] (blocked — free plan limit)
                              └── BullMQ worker → Lambda → S3

[Vercel] → webhook-service frontend
            └── Landing page + API

[AWS Lambda] → Remotion rendering
[S3] → Rendered video output
```

### Integration Hooks

**aws-agents-deploy → remotion-video-pro:**
- Deploy webhook service to Railway/Vercel
- Configure Lambda for Remotion rendering
- Set up S3 for video output storage
- Environment variable management

**fullstack-dev → remotion-video-pro:**
- Build Next.js dashboard for:
  - Render job management (create, monitor, retry)
  - A/B test management (create, track, promote)
  - Video preview and download
  - Cost and usage analytics

**github → remotion-video-pro:**
- Pre-commit hooks run composition validation
- CI pipeline runs test harness before merge
- Release tags trigger version activation

## Pending Infrastructure

| Component | Status | Blocker |
|-----------|--------|---------|
| Railway API | Deployed | Environment variables need real values |
| Vercel Frontend | Deployed | prisma generate in postinstall |
| Railway Worker | Blocked | Free plan 3-service limit |
| Render Worker | Blocked | Payment method required |
| AWS Lambda | Ready | Needs REMOTION_AWS_* credentials |
| Stripe Webhook | Configured | Needs endpoint URL + signing secret |
| PostgreSQL | Schema ready | Needs connection + prisma db push |
