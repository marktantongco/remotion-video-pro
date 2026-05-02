# Lambda Webhook Render Service

"Render on every data change" — connect your CRM/database to Remotion Lambda.

## Architecture

```
CRM/Webhook → POST /api/render → Prisma DB → BullMQ → Worker → Lambda → S3
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL and Redis, then copy env:
```bash
cp .env.local .env
```

3. Push database schema:
```bash
npx prisma db push
```

4. Deploy Remotion site to S3:
```bash
npx remotion lambda sites create src/index.ts
```

5. Deploy Lambda function:
```bash
npx remotion lambda functions deploy
```

6. Start Next.js dev server:
```bash
npm run dev
```

7. Start render worker (separate terminal):
```bash
npx tsx src/worker.ts
```

## Webhook Format

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: supersecret" \
  -d '{
    "event": "order.completed",
    "data": {
      "customerName": "Alice",
      "productName": "Pro Plan",
      "purchaseDate": "2026-05-03"
    }
  }'
```

## Check Job Status

```bash
curl http://localhost:3000/api/render?jobId=xxx
```

## Production Deployment

- Deploy Next.js to Vercel/Railway/Render
- Run worker as a separate service or ECS task
- Use AWS SQS instead of BullMQ for massive scale
- Set CloudWatch alarms on Lambda duration/memory
