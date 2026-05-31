---
name: Agent Browser
description: A fast Rust-based headless browser automation CLI with Node.js fallback that enables AI agents to navigate, click, type, and snapshot pages via structured commands.
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [competitor-intel, personalized-videos]
---

# Agent Browser — Remotion Integration Guide

## Overview
Full headless browser automation for complex multi-step workflows — multi-page navigation, form submission, screenshot capture, and stateful sessions for interactive content capture.

## Pipeline Role
Operates in the **ACQUIRE** stage. Handles complex browser interactions that simpler tools cannot: multi-page scraping, form submission, authenticated workflows, and sequential content extraction with state persistence.

## Integration Pattern

```typescript
// webhook-service/src/lib/agent-browser.ts
import { execFileSync } from 'child_process';

interface BrowserStep {
  action: string;
  url?: string;
  selector?: string;
  value?: string;
  screenshot?: string;
}

async function executeBrowserWorkflow(
  compositionId: string,
  steps: BrowserStep[]
): Promise<{ frames: string[] }> {
  const frames: string[] = [];

  for (const step of steps) {
    switch (step.action) {
      case 'open':
        execSync(`agent-browser open "${step.url}"`);
        execSync('agent-browser wait 2000');
        break;
      case 'click':
        execSync(`agent-browser click ${step.selector}`);
        execSync('agent-browser wait 1000');
        break;
      case 'fill':
        execSync(`agent-browser fill ${step.selector} "${step.value}"`);
        break;
      case 'screenshot':
        const path = `/tmp/frame-${Date.now()}.png`;
        execSync(`agent-browser screenshot ${path}`);
        frames.push(fs.readFileSync(path).toString('base64'));
        break;
    }
  }

  return { frames };
}

// Multi-step competitor intel: navigate competitor site → capture screenshots
async function competitorWalkthrough(url: string) {
  const frames = await executeBrowserWorkflow('CompetitorTour', [
    { action: 'open', url },
    { action: 'screenshot' }, // Homepage
    { action: 'click', selector: '@e1' }, // Pricing nav
    { action: 'wait', value: '1500' },
    { action: 'screenshot' }, // Pricing page
  ]);
  return frames;
}
```

## Data Contract

| Input | Output |
|-------|--------|
| `BrowserStep[]` — sequential actions | `{ frames: string[] }` — base64 PNG screenshots |
| Structured workflow steps | Array of screenshot frames for video composition |

## Route Participation

| Route | Usage |
|-------|-------|
| **competitor-intel** | Walk through competitor site → capture each page → comparison video montage |
| **personalized-videos** | Capture user's app experience → walkthrough video |

## Configuration

```bash
npm install -g agent-browser
agent-browser install
```

## Example Pipeline Usage

```typescript
// competitor-intel: walkthrough → montage video
const frames = await competitorWalkthrough('https://competitor.com');
await renderQueue.add('render', {
  compositionId: 'CompetitorMontage',
  inputProps: { frames, duration: frames.length * 3 },
});
```
