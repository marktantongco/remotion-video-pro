---
name: browser-cdp
description: "Use this skill when you need to control a Chrome browser via CDP (Chrome DevTools Protocol) to reuse existing login sessions. Covers: launching Chrome in debug mode, opening URLs, waiting for page load, evaluating JavaScript, taking snapshots, and extracting auth tokens. Trigger phrases: browser automation, CDP, agent-browser, 浏览器操作, 操作浏览器, Chrome CDP, 复用登录态, extract token from browser."
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, personalized-videos]
---

# Browser CDP — Remotion Integration Guide

## Overview
Controls Chrome via the Chrome DevTools Protocol to capture authenticated page content, screenshots, and dynamic data that firecrawl/scrape cannot access (dashboards, SaaS tools, authenticated pages).

## Pipeline Role
Operates in the **ACQUIRE** stage. Captures screenshots as PNG base64 and extracts structured data from authenticated web pages, feeding into VLM analysis or direct video backgrounds.

## Integration Pattern

```typescript
// webhook-service/src/lib/cdp-capture.ts

async function captureAuthenticatedPage(
  url: string,
  evalScript: string
): Promise<{ screenshot: string; data: any }> {
  // Check if CDP is ready (non-destructive)
  const status = execFileSync(
    'node scripts/setup-cdp-chrome.js 9222 --detect-only',
    { encoding: 'utf-8', timeout: 5000 }
  ).toString();

  if (!status.includes('CDP_STATUS=ready')) {
    throw new Error('CDP not ready — run setup first');
  }

  // Navigate and wait
  execFileSync(`agent-browser --cdp 9222 open "${url}"`, { timeout: 15000 });
  execSync('agent-browser --cdp 9222 wait 3000', { timeout: 5000 });

  // Screenshot for video background
  execFileSync('agent-browser --cdp 9222 screenshot /tmp/capture.png', { timeout: 10000 });
  const screenshot = fs.readFileSync('/tmp/capture.png').toString('base64');

  // Extract data
  const dataResult = execFileSync(
    `agent-browser --cdp 9222 eval '${evalScript}' --json`,
    { encoding: 'utf-8', timeout: 5000 }
  );

  return { screenshot, data: JSON.parse(dataResult) };
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `url`, optional `evalScript` | `{ screenshot: base64, data: JSON }` |
| Target URL + JS extraction script | PNG screenshot + structured page data |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Capture competitor dashboard screenshots for comparison video backgrounds |
| **personalized-videos** | Capture user's authenticated profile → personalized video with real data overlay |

## Configuration

```bash
npm install -g agent-browser
# Chrome must be running in debug mode on port 9222
```

## Example Pipeline Usage

```typescript
// competitor-intel: capture dashboard → comparison video
const { screenshot, data } = await captureAuthenticatedPage(
  'https://app.competitor.com/dashboard',
  'JSON.stringify({ metrics: document.querySelectorAll(".metric-card").length })'
);
await renderQueue.add('render', {
  compositionId: 'CompetitorComparison',
  inputProps: { background: screenshot, metrics: data },
});
```
