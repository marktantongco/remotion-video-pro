# 03 — Browser Automation

Authentication session reuse and browser interaction for accessing
protected content that feeds video production pipelines.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **browser-cdp** | Chrome DevTools Protocol — reuse existing login sessions (2.6K installs) |
| **agent-browser** | Headful browser automation with visual snapshot |
| **browserbase-autobrowse** | Self-improving browse loops with learning |

## Remotion Integration

These skills operate at Stage 1 (ACQUIRE) as an escalation path when
content is behind authentication or requires interaction.

### Escalation Pattern

```
browserbase-fetch (try simple fetch first)
  → if auth required: browser-cdp (reuse session)
  → if interaction needed: agent-browser (click/type)
  → if complex multi-step: browserbase-autobrowse (automated loop)
```

### Integration Hooks

**browser-cdp → firecrawl-scrape → remotion-video-pro:**
```typescript
// When content is behind auth
const token = await browserCDP.eval(
  'localStorage.getItem("auth_token")'
);
const content = await firecrawlScrape({
  url: protectedPageUrl,
  headers: { Authorization: `Bearer ${token}` },
});
const video = await remotionVideoPro.render({
  compositionId: 'DashboardDemo',
  inputProps: parseDashboardData(content),
});
```

**agent-browser → remotion-video-pro:**
- Browser snapshots become reference frames for video compositions
- Page interaction sequences can be recorded as video walkthrough scripts

**browserbase-autobrowse → remotion-video-pro:**
- Browsing patterns inform video narrative structure
- Discovered content auto-feeds into video production queue

## Security Notes

- Always use `--detect-only` before launching Chrome via CDP
- Never kill user's Chrome without explicit consent
- Auth tokens extracted via CDP are scoped to video production only
- Log all CDP operations for audit trail
