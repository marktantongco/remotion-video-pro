# Deployment Manager

## Context

Use this skill when the user needs to deploy a project to a hosting platform, configure CI/CD pipelines, manage environment variables, monitor deployment health, or execute a rollback. This skill covers GitHub Pages, Vercel, and Netlify as primary platforms.

**Trigger phrases:** "deploy to Vercel," "set up GitHub Pages," "deploy on Netlify," "configure CI/CD," "rollback deployment," "monitor uptime."

---

## Instructions

### Step 1: Pre-Deployment Checklist

1. **Verify the project builds locally:**
   ```bash
   npm run build   # or: yarn build / pnpm build
   ```
   - No build errors or warnings
   - Output size is reasonable (check bundle analyzer if > 500KB)
   - Preview the build locally: `npx serve dist` or `npm run preview`

2. **Run the full test suite:**
   ```bash
   npm run test -- --coverage
   ```
   - All tests pass
   - Coverage meets the project threshold (or note gaps)
   - Lint passes: `npm run lint`

3. **Prepare environment variables:**
   - Create a `.env.example` file documenting all required variables (no secrets)
   - Audit `.gitignore` includes `.env`, `.env.local`, `.env.production`
   - Document each variable: name, purpose, required/optional, example value
   - Never commit secrets to version control

4. **Confirm the Git state is clean:**
   - All changes committed
   - On the correct branch (`main` or configured deploy branch)
   - No untracked files that should be committed

### Step 2: Platform-Specific Deployment

#### GitHub Pages
5. **Static sites only** (HTML, CSS, JS, or pre-built SPAs):
   - Add `.github/workflows/deploy.yml` using `actions/deploy-pages`
   - Set build output directory in action (usually `dist` or `build`)
   - Configure repository: Settings → Pages → Source: GitHub Actions
   - For SPAs, add a `404.html` that redirects to `index.html` for client-side routing
   - Base URL: set `base` in Vite config or `publicPath` in Webpack

#### Vercel
6. **Connect repository** or use CLI:
   ```bash
   npm i -g vercel && vercel
   ```
   - Framework detection should auto-configure build settings
   - Override if needed: Build Command, Output Directory, Install Command
   - Set environment variables in Project Settings → Environment Variables
   - Configure per-environment: Production, Preview, Development

7. **Configure domains:**
   - Add custom domain in Project Settings → Domains
   - Vercel auto-provisions SSL via Let's Encrypt
   - DNS: point A record to `76.76.21.21` or CNAME to `cname.vercel-dns.com`

#### Netlify
8. **Connect repository** or use CLI:
   ```bash
   npm i -g netlify-cli && netlify init
   ```
   - Build command: `npm run build`
   - Publish directory: `dist` (Vite) or `build` (CRA/Next.js)
   - Set environment variables in Site Settings → Environment

9. **Configure redirects** in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
     conditions = {Language = ["en"]}
   ```

10. **Set up continuous deployment:**
    - Push to `main` → auto-deploys to production
    - Pull requests → auto-deploys to deploy preview URLs
    - Configure branch rules: only `main` triggers production deploys

### Step 3: SSL & CDN Configuration

11. **Verify SSL** is active and auto-renewing (all three platforms handle this automatically for custom domains).

12. **Configure caching headers** for static assets:
    - Vercel: `vercel.json` → headers config
    - Netlify: `netlify.toml` → headers config
    - Set `Cache-Control: public, max-age=31536000, immutable` for hashed assets

13. **Test performance:**
    - Run Lighthouse audit on the deployed URL
    - Target: Performance > 90, Accessibility > 90, Best Practices > 90
    - Check Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Step 4: Monitoring & Alerting

14. **Set up uptime monitoring:**
    - Use the platform's built-in monitoring (Vercel Speed Insights, Netlify Analytics)
    - Or external: UptimeRobot (free), BetterUptime, or Pingdom
    - Monitor every 1-5 minutes for production sites

15. **Configure error tracking:**
    - Add Sentry (free tier available) for runtime error capture
    - Integrate in app entry point: `Sentry.init({ dsn: "YOUR_DSN" })`
    - Set up alert rules: email on > 5 errors/hour, Slack on > 10 errors/hour

16. **Performance monitoring:**
    - Vercel: enable Speed Insights and Web Vitals
    - Netlify: enable Analytics
    - Track: page load time, API response times, bundle sizes over time

### Step 5: Update & Rollback Workflow

17. **Standard update procedure:**
    ```
    Pull latest code → Install dependencies → Run tests → Build locally →
    Push to main → Wait for CI → Verify deployment → Smoke test live site →
    Monitor for 15 minutes
    ```

18. **Rollback procedures by platform:**
    - **Vercel:** Dashboard → Deployments → Click "..." on previous deployment → Promote to Production
    - **Netlify:** Dashboard → Deploys → Click "Rollback" on previous successful deploy
    - **GitHub Pages:** Revert the commit that triggered the failed deploy, or checkout previous commit on deploy branch

19. **Post-deployment smoke test checklist:**
    - [ ] Homepage loads without errors
    - [ ] Navigation links work
    - [ ] Key user flows function (login, form submit, etc.)
    - [ ] Console has no JS errors
    - [ ] API endpoints return expected responses
    - [ ] Images and assets load correctly

---

## Constraints

- NEVER deploy directly from a local machine to production for team projects. Always use CI/CD.
- NEVER store secrets in environment variable files committed to Git. Use platform UI or encrypted secrets.
- ALWAYS test on a preview deployment before promoting to production.
- ALWAYS have a rollback plan before deploying. Know which previous deployment to restore.
- NEVER skip the smoke test after deployment. Even "small changes" can break production.
- Environment variables MUST be documented in `.env.example` before deployment.
- SSL MUST be active on production. Never serve over plain HTTP.
- Deploy logs MUST be checked for warnings, even if the build succeeds.

---

## Examples

### Example 1: React SPA Deployment to Vercel

```
Project: React + TypeScript + Vite portfolio site
Steps:
  1. Build locally: npm run build (output: dist/)
  2. Push to GitHub main branch
  3. Vercel auto-detects Vite, configures build command
  4. Set env vars: VITE_API_URL (production), VITE_CONTACT_EMAIL
  5. Deploy succeeds, preview URL generated
  6. Custom domain: portfolio.janedoe.com → CNAME to cname.vercel-dns.com
  7. SSL auto-provisioned, Lighthouse score: 96/98/100
  8. Sentry added for error tracking, UptimeRobot pinging every 5 minutes

Rollback: Vercel dashboard → Promote previous deployment (30 seconds)
```

### Example 2: Static Site to GitHub Pages with Monitoring

```
Project: Documentation site (Astro + Tailwind)
Steps:
  1. Create .github/workflows/deploy.yml with actions/deploy-pages
  2. Build command: npm run build, output: dist/
  3. Push to main → GitHub Actions runs build and deploys
  4. Configure custom domain: docs.myproject.com
  5. DNS: CNAME to [username].github.io
  6. Enable GitHub Pages HTTPS (Enforce HTTPS toggle)
  7. Add 404.html for client-side routing fallback
  8. UptimeRobot monitoring: pings every 1 minute, alerts to Slack
  9. Weekly Lighthouse audits via GitHub Action (scheduled cron)

Rollback: git revert [commit-hash] → push → Actions redeploys previous version
```
