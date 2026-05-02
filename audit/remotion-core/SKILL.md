---
name: remotion-core
description: >
  Technical foundation for Remotion programmatic video. Covers scaffolding,
  animation physics (interpolate, spring, measureSpring), performance optimization,
  async asset loading, and rendering pipelines. Use when building or debugging
  Remotion compositions, optimizing render speed, or setting up CI/CD/Lambda.
  Does NOT cover visual design or aesthetics — load remotion-design for that.
requires: Node.js 18+, React/TypeScript knowledge.
always_load:
  - rules/01-scaffolding.md
  - rules/02-animation-physics.md
  - rules/06-performance.md
  - rules/08-rendering-pipeline.md
---

# Remotion Core

## Scope

This skill owns the **temporal engine** of Remotion:
- Frame-based state machines
- Animation mathematics
- Asset loading patterns
- Render optimization
- Cloud deployment

It does NOT own color, typography, or layout aesthetics. Load `remotion-design` alongside this skill for visual direction.

## Quick Reference

| Problem | Load Rule |
|---------|-----------|
| Project setup, Zod schemas, Composition structure | `01-scaffolding.md` |
| interpolate, spring, transitions, timing | `02-animation-physics.md` |
| Slow renders, memoization, bundle size, Lambda | `06-performance.md` |
| CI/CD, Lambda, CloudRun, snapshot testing | `08-rendering-pipeline.md` |

## Golden Rules

1. **Frame is King.** Every animation derives from `useCurrentFrame()`. No CSS animations, no timers.
2. **Determinism Only.** No `Math.random()`. Use `random(seed)` from Remotion.
3. **Spring > Linear.** Default to `spring()` for motion. Linear feels robotic.
4. **OffthreadVideo for All Input Video.** Never use `<Video>` for MP4 inputs.
5. **Async Data Must Gate Render.** Use `delayRender()` / `continueRender()` for fonts, data, external assets.
6. **Zod Every Composition.** Runtime validation prevents render crashes from bad props.
