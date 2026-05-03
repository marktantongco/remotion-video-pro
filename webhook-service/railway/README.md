# Remotion Webhook Service — Railway Deployment
# Two separate Railway services sharing one codebase

## Setup (one-time)

1. Create a new Railway project:
   ```bash
   railway init remotion-webhook
   ```

2. Add PostgreSQL plugin:
   ```bash
   railway add postgresql
   ```

3. Add Redis plugin:
   ```bash
   railway add redis
   ```

4. Set environment variables:
   ```bash
   railway variables set WEBHOOK_SECRET=your-production-secret
   railway variables set REMOTION_AWS_ACCESS_KEY_ID=your_key
   railway variables set REMOTION_AWS_SECRET_ACCESS_KEY=your_secret
   railway variables set REMOTION_AWS_REGION=us-east-1
   railway variables set REMOTION_SERVE_URL=https://your-site.s3.amazonaws.com/index.html
   railway variables set REMOTION_FUNCTION_NAME=remotion-render-fn
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   railway variables set WORKER_CONCURRENCY=5
   ```

5. Connect DATABASE_URL and REDIS_URL automatically:
   Railway auto-injects `DATABASE_URL` from the PostgreSQL plugin
   and `REDIS_URL` from the Redis plugin.

## Deploy API Service

The API service runs Next.js and handles webhook endpoints.

```bash
# Deploy the API (run from project root)
cd railway/api
railway up
```

Or via Railway dashboard:
1. Create service "remotion-api"
2. Connect GitHub repo
3. Set root directory to `railway/api` (or `.` if monorepo)
4. Build command: `npm install && npx prisma generate && npm run build`
5. Start command: `npm run start`
6. Port: 3000

## Deploy Worker Service

The worker processes render jobs from BullMQ. This is a long-running process, not a web server.

```bash
# Deploy the worker (run from project root)
cd railway/worker
railway up
```

Or via Railway dashboard:
1. Create service "remotion-worker"
2. Same GitHub repo
3. Build command: `npm install && npx prisma generate`
4. Start command: `npx tsx src/worker.ts`
5. No port needed (background worker)

## Verify Both Services

```bash
# Check API is running
curl https://your-railway-app.up.railway.app/api/render?jobId=test

# Check worker logs in Railway dashboard
# You should see: "Render worker started (concurrency: 5)"
```

## Wire Stripe Webhook

In Stripe Dashboard > Developers > Webhooks:
1. Click "Add endpoint"
2. URL: `https://your-railway-app.up.railway.app/api/stripe-webhook`
3. Events to listen: `checkout.session.completed`
4. Copy the signing secret > set as `STRIPE_WEBHOOK_SECRET`

Every purchase now auto-generates a personalized thank-you video.

## Scaling

- **API**: Railway auto-scales based on HTTP traffic. Default is fine for webhook volume.
- **Worker**: Increase `WORKER_CONCURRENCY` (env var) for more parallel renders.
  - Start at 3 (conservative)
  - Increase to 5-10 for steady production load
  - Max 20 if Lambda concurrency allows
- **Redis**: Railway Redis handles the queue. No changes needed.
- **PostgreSQL**: Railway PostgreSQL auto-scales. Monitor query count in dashboard.
