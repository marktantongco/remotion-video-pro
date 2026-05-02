---
name: vercel
version: 1.0.0
description: Comprehensive Vercel platform skill covering deployment configuration, Edge Functions, AI SDK integration, Next.js best practices, performance optimization, monorepo support, environment management, analytics, and CDN caching strategies.
---

# Vercel — Deployment and Optimization

## Overview

This skill covers everything needed to deploy, optimize, and manage projects on the Vercel platform. It includes build configuration, Edge Functions, AI SDK integration, performance tuning, environment management, and production monitoring. Designed to work in tandem with the `github` skill for CI/CD integration.

## Deployment

### Project Setup

#### CLI Installation and Login

```bash
npm i -g vercel
vercel login
vercel link        # Link to existing project
vercel             # Deploy to preview
vercel --prod      # Deploy to production
```

#### Build Configuration

Vercel auto-detects the framework from your project. For Next.js, no extra configuration is needed. For custom setups, use `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "framework": "nextjs"
}
```

### Environment Variables

Environment variables are scoped to environments:

| Scope | When Active | Use Case |
|---|---|---|
| Production | Production deployments | API keys, database URLs |
| Preview | Preview deployments | Staging API keys, feature flags |
| Development | Local `vercel dev` | Local database, dev secrets |

```bash
# CLI commands
vercel env add NEXT_PUBLIC_API_URL    # Interactive prompt
vercel env ls                          # List all env vars
vercel env pull .env.local            # Pull to local file
```

**Best Practices:**
- Never commit `.env` files to git
- Prefix client-side variables with `NEXT_PUBLIC_`
- Use Vercel Secrets for sensitive values
- Document required env vars in `.env.example`

### Preview Deployments

Every push to a non-production branch automatically creates a preview deployment:

- Unique URL per deployment (e.g., `feat-login-abc123.vercel.app`)
- Shared with team via PR comment integration
- Can be assigned custom aliases
- Supports draft deployments (not visible to team)

## Edge Functions

### Serverless API Routes

```typescript
// app/api/hello/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return new Response(JSON.stringify({ message: `Hello, ${name}!` }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add custom headers
  response.headers.set('x-request-id', crypto.randomUUID());

  // Redirect logic
  if (request.nextUrl.pathname.startsWith('/old-path')) {
    return NextResponse.redirect(new URL('/new-path', request.url));
  }

  // Geolocation-based routing
  const country = request.geo?.country;
  if (country === 'US') {
    return NextResponse.rewrite(new URL('/en-US' + request.nextUrl.pathname, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Edge Runtime Capabilities

| Feature | Supported | Notes |
|---|---|---|
| Fetch API | Yes | Native support |
| Streaming | Yes | Response streaming |
| Geolocation | Yes | `request.geo` |
| KV Storage | Yes | Vercel KV |
| Blob Storage | Yes | Vercel Blob |
| Postgres | Yes | Vercel Postgres |
| Node.js APIs | Limited | No fs, child_process, etc. |
| Execution Timeout | 30 seconds | Max duration |
| Request Body Size | 4 MB | Max payload |

## Vercel AI SDK

### Streaming Chat Completions

```typescript
import { StreamingTextResponse, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant.',
    messages,
  });

  return new StreamingTextResponse(result.toAIStream());
}
```

### Image Generation Integration

```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const { image } = await generateImage({
    model: openai.image('dall-e-3'),
    prompt,
  });

  return new Response(image.base64, {
    headers: { 'Content-Type': 'image/png' },
  });
}
```

## Vercel + Next.js Best Practices

### App Router Optimizations

| Feature | Implementation | Benefit |
|---|---|---|
| Server Components | Default in App Router | Smaller JS bundle, faster load |
| Streaming SSR | `loading.tsx` + Suspense | Progressive page rendering |
| Image Optimization | `<Image>` from `next/image` | Auto WebP/AVIF, lazy loading |
| Font Optimization | `next/font/google` | Zero layout shift, self-hosted |
| Script Optimization | `next/script` | Strategic loading (afterInteractive, lazyOnload) |
| Metadata API | `generateMetadata()` | Dynamic SEO meta tags |

### Incremental Static Regeneration (ISR)

```typescript
// Revalidate every 60 seconds
export const revalidate = 60;

// On-demand revalidation
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST() {
  revalidatePath('/blog');          // Revalidate by path
  revalidateTag('blog-posts');      // Revalidate by tag
  return Response.json({ revalidated: true });
}
```

### Caching Strategies

| Strategy | Header | Use Case |
|---|---|---|
| Static | `s-maxage=31536000, immutable` | Assets that never change |
| ISR | `s-maxage=60, stale-while-revalidate=300` | Dynamic pages with tolerance |
| SWR | `stale-while-revalidate=86400` | Content that can be stale briefly |
| No Cache | `Cache-Control: no-store` | Real-time or user-specific data |

## Web Performance

### Performance Budgets

| Metric | Target | Budget |
|---|---|---|
| First Contentful Paint (FCP) | < 1.8s | Strict |
| Largest Contentful Paint (LCP) | < 2.5s | Critical |
| First Input Delay (FID) | < 100ms | Critical |
| Cumulative Layout Shift (CLS) | < 0.1 | Critical |
| Time to Interactive (TTI) | < 3.8s | Moderate |
| Total Blocking Time (TBT) | < 200ms | Moderate |
| JS Bundle Size (initial) | < 100 KB | Strict |
| Total Page Weight | < 500 KB | Moderate |

### Core Web Vitals Optimization Checklist

- [ ] Optimize LCP: Preload hero image, use `<Image>` component, server-render critical content
- [ ] Optimize CLS: Set explicit dimensions on images/videos, avoid dynamic content injection above the fold
- [ ] Optimize FID/TBT: Code split heavy components, defer non-critical JS, use web workers
- [ ] Enable compression: Brotli preferred, gzip fallback (Vercel does this automatically)
- [ ] Minimize third-party scripts: Load async, use `next/script` strategy
- [ ] Use resource hints: `preconnect`, `dns-prefetch`, `preload`, `prefetch`
- [ ] Audit with Lighthouse: Target 90+ performance score

## Project Composition

### Monorepo Support

Vercel natively supports monorepos with automatic framework detection per directory:

```json
// vercel.json (root)
{
  "git": {
    "deploymentEnabled": false
  }
}
```

```json
// apps/web/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Turborepo Integration

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Vercel automatically detects Turborepo and uses remote caching for faster builds.

## vercel.json Configuration Reference

| Field | Type | Description | Default |
|---|---|---|---|
| `buildCommand` | `string` | Custom build command | Auto-detected |
| `outputDirectory` | `string` | Build output directory | Auto-detected |
| `installCommand` | `string` | Custom install command | `npm install` |
| `framework` | `string` | Framework preset | Auto-detected |
| `functions` | `object` | Function-level config | `{}` |
| `routes` | `array` | Custom routing rules | `[]` |
| `rewrites` | `array` | URL rewrite rules | `[]` |
| `redirects` | `array` | URL redirect rules | `[]` |
| `headers` | `array` | Custom response headers | `[]` |
| `crons` | `array` | Scheduled cron jobs | `[]` |
| `regions` | `array` | Function deployment regions | `["iad1"]` |
| `env` | `object` | Environment variables | `{}` |

### Common Configuration Examples

**Custom Headers:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Redirects:**
```json
{
  "redirects": [
    { "source": "/old-page", "destination": "/new-page", "permanent": true },
    { "source": "/blog/:slug", "destination": "/articles/:slug", "permanent": false }
  ]
}
```

## Analytics and Monitoring

### Vercel Web Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Speed Insights

```typescript
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Monitoring Dashboard

- **Web Analytics**: Page views, visitors, bounce rate, demographics
- **Speed Insights**: Real User Monitoring (RUM) for Core Web Vitals
- **Build Logs**: Build duration, errors, warnings per deployment
- **Function Logs**: Serverless function invocations, errors, cold starts
- **Deployment Status**: Uptime monitoring, deployment health

## CDN and Caching

### Cache Rules

Vercel provides a global edge network with intelligent caching:

```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, must-revalidate" }
      ]
    }
  ]
}
```

### Stale-While-Revalidate

The SWR pattern serves cached content immediately while fetching fresh content in the background:

```
User Request → Serve Cached (fast) → Fetch Fresh (background) → Update Cache
```

Configured via `s-maxage` (cache age) + `stale-while-revalidate` (grace period):

```
Cache-Control: s-maxage=60, stale-while-revalidate=300
```

This means: serve from cache for 60 seconds, then serve stale for up to 300 seconds while refreshing.

## Deployment Checklist

Use this checklist before every production deployment:

### Pre-Deployment

- [ ] All tests pass (unit, integration, E2E)
- [ ] Linting and type checking pass with zero errors
- [ ] Environment variables are configured in Vercel dashboard
- [ ] Database migrations are prepared and tested
- [ ] API routes are tested against staging/preview environment
- [ ] No hardcoded localhost or debug URLs remain
- [ ] `.env.example` is updated with any new required variables

### Build Verification

- [ ] Build completes without warnings or errors
- [ ] Bundle size is within budget
- [ ] Static assets are generated correctly
- [ ] Image optimization is working (no unoptimized images)
- [ ] Metadata and OG tags are set correctly
- [ ] 404 and error pages are configured

### Performance

- [ ] Lighthouse score is 90+ for all categories
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- [ ] Largest contentful paint element is optimized
- [ ] Third-party scripts are lazy-loaded
- [ ] Fonts use `next/font` for zero layout shift

### Security

- [ ] No secrets or API keys in code or committed files
- [ ] Security headers are configured (CSP, X-Frame-Options, etc.)
- [ ] Rate limiting is configured for API routes
- [ ] Authentication flows are tested
- [ ] CORS policy is correctly configured

### Post-Deployment

- [ ] Smoke test all critical user flows on production URL
- [ ] Verify analytics are tracking correctly
- [ ] Check Speed Insights for initial performance data
- [ ] Monitor function logs for errors in the first hour
- [ ] Notify stakeholders of successful deployment
- [ ] Tag the release in git with semantic version
