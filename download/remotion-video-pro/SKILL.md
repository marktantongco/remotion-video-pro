---
name: remotion-video-pro
description: >
  Complete Remotion skill set for programmatic video production. Covers scaffolding,
  animation physics, temporal design, audio sync, anti-slop aesthetics, performance
  optimization, CI/CD rendering pipelines, webhook-driven data video, batch rendering
  at scale, and composition validation. Use when building ANY Remotion video — from
  single social clips to Lambda-rendered personalized video at 10,000+ units.
  No external skill dependencies required.
requires: Node.js 18+, React/TypeScript, basic video concepts.
always_load:
  - rules/01-scaffolding.md
  - rules/02-animation-physics.md
  - rules/06-performance.md
  - rules/11-validation-pipeline.md
conditional_load:
  audio_needed:
    - rules/04-audio-sync.md
  short_form_social:
    - rules/03-temporal-design.md
    - rules/05-anti-slop-aesthetics.md
    - rules/07-prompt-templates.md
  production_deploy:
    - rules/08-rendering-pipeline.md
    - rules/09-webhook-integration.md
    - rules/10-batch-rendering.md
  design_direction:
    - rules/05-anti-slop-aesthetics.md
---

# Remotion Video Pro

## Scope

This skill owns **everything** needed to produce programmatic video with Remotion:

- Project scaffolding and composition architecture
- Frame-based animation mathematics (interpolate, spring, measureSpring)
- Temporal design thinking (safe areas, hook windows, timing)
- Audio synchronization (voiceover, captions, beat detection)
- Visual design system (typography, color, motion principles)
- Performance optimization (memoization, OffthreadVideo, bundle size)
- Rendering pipelines (Lambda, CloudRun, CI/CD)
- Webhook-driven data video (CRM → queue → Lambda → S3)
- Batch rendering at scale (10,000+ personalized videos)
- Composition validation (pre-commit hooks, CI gates)

## Quick Reference

| Problem | Load Rule |
|---------|-----------|
| Project setup, Zod schemas, Composition structure | `01-scaffolding.md` |
| interpolate, spring, transitions, timing | `02-animation-physics.md` |
| Mobile safe areas, frame timing, responsive layout | `03-temporal-design.md` |
| Voiceover sync, captions, beat detection, spectrum | `04-audio-sync.md` |
| Typography, color, banned patterns, motion principles | `05-anti-slop-aesthetics.md` |
| Slow renders, memoization, bundle size, Lambda | `06-performance.md` |
| Ready-made prompts for social, demo, explainer | `07-prompt-templates.md` |
| CI/CD, Lambda, CloudRun, snapshot testing | `08-rendering-pipeline.md` |
| CRM webhook → Lambda → S3 pipeline | `09-webhook-integration.md` |
| Bulk render fan-out, /api/render/batch | `10-batch-rendering.md` |
| Pre-commit hooks, CI gates, composition linting | `11-validation-pipeline.md` |

## Golden Rules

1. **Frame is King.** Every animation derives from `useCurrentFrame()`. No CSS animations, no timers.
2. **Determinism Only.** No `Math.random()`. Use `random(seed)` from Remotion.
3. **Spring > Linear.** Default to `spring()` for motion. Linear feels robotic.
4. **OffthreadVideo for All Input Video.** Never use `<Video>` for MP4 inputs.
5. **Async Data Must Gate Render.** Use `delayRender()` / `continueRender()` for fonts, data, external assets.
6. **Zod Every Composition.** Runtime validation prevents render crashes from bad props.
7. **React.memo Every Scene.** Unnecessary re-renders cost render time and money on Lambda.
8. **Validate Before Commit.** The pre-commit hook catches all 7 deadly sins. Never disable it.
9. **Video is a Database Row.** Personalized video at scale means treating renders as data pipeline output.
10. **Anti-Slop or Nothing.** Default Inter, purple gradients, and emoji icons are forbidden. Period.

## Decision Tree

```
Building a video?
├── Social short-form (TikTok/Reels) → Load 03, 04, 05, 07
├── Product demo / explainer → Load 02, 03, 04, 05
├── Personalized at scale → Load 06, 08, 09, 10
├── CI/CD pipeline → Load 08, 11
└── Just need basics → Load 01, 02, 06, 11
```
