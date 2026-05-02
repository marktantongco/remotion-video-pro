---
name: remotion-design
description: >
  Visual design system for Remotion video. Covers anti-slop aesthetics,
  typography for motion, color palettes, safe areas, temporal design thinking,
  and audio-sync visual pacing. Use when deciding how a video should LOOK
  and FEEL. Does NOT cover React component structure or animation math —
  load remotion-core for that.
requires: Eye for contrast and spacing.
always_load:
  - rules/03-temporal-design.md
  - rules/04-audio-sync.md
  - rules/05-anti-slop-aesthetics.md
  - rules/07-prompt-templates.md
---

# Remotion Design

## Scope

This skill owns the **visual language** of Remotion video:
- Typography choices for readability at 30fps
- Color direction and palette constraints
- Safe areas and responsive composition
- Audio-driven visual pacing
- Prompt templates for common video types

It does NOT own React patterns, animation APIs, or render infrastructure. Load `remotion-core` alongside this skill for technical implementation.

## Quick Reference

| Problem | Load Rule |
|---------|-----------|
| Mobile safe areas, frame timing, responsive layout | `03-temporal-design.md` |
| Voiceover sync, captions, beat detection, spectrum | `04-audio-sync.md` |
| Typography, color, banned patterns, motion principles | `05-anti-slop-aesthetics.md` |
| Ready-made prompts for social, demo, explainer | `07-prompt-templates.md` |

## Core Philosophy: Anti-Slop

- **BANNED**: Inter, Roboto, system fonts, purple gradients, emojis as icons, linear animations
- **MANDATED**: Unique typography, context-specific palettes, spring physics, intentional asymmetry

## Temporal Design Principles

1. **Audio-First Pacing.** Lock audio duration before animating. Visuals follow sound.
2. **The 300ms Rule.** Transitions need ~9 frames at 30fps to feel fluid.
3. **The Hook Window.** First 45 frames (1.5s) determine short-form retention.
4. **Design for the Pause.** Any single frame should look intentional when paused.
