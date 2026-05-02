# Temporal Design Thinking

## The 300ms Rule

Human perception threshold for fluid motion is approximately 300ms. At 30fps that is 9 frames, at 60fps it is 18 frames. Anything shorter than this threshold feels instant or jarring rather than smooth.

Apply these timing minimums:

| Animation Type | Frames at 30fps | Frames at 60fps |
|---------------|-----------------|-----------------|
| Scene transitions | 15-30 | 30-60 |
| Text entrances | 10-20 | 20-40 |
| Micro-interactions (highlights, pulses) | 5-10 | 10-20 |
| Hold time for reading text | 60-90 | 120-180 |
| Fade-in on background elements | 20-30 | 40-60 |

Never rush a transition below 10 frames at 30fps. If the video needs to feel fast, compress the hold time, not the animation time. A snappy spring config (damping 200, stiffness 300) with 15 frames feels energetic. A linear fade over 3 frames feels like a glitch.

## The Hook Window

For short-form content (TikTok, Reels, Shorts), the first 1.5 seconds (45 frames at 30fps) determine whether a viewer stays or scrolls. This is the hook window and it must be treated as the most important real estate in the entire video.

### Hook Structure

| Phase | Frames | Content |
|-------|--------|---------|
| Visual hook | 0-15 | Motion, contrast, surprise — something that stops the scroll |
| Value promise | 15-30 | Text or voice that promises what the viewer will learn/get |
| Transition | 30-45 | Bridge into main content |

### Anti-Patterns That Kill Retention

- Starting with a static title card (no motion, no hook)
- Using a logo animation as the first 3 seconds (nobody cares about your logo)
- Having the first text appear after 60 frames (2 seconds of dead air)
- Using slow fades for the hook (fade takes 30 frames, you only have 45)

## Safe Areas

Critical text and UI elements must stay within platform-specific safe zones. Content outside safe areas gets clipped by platform overlays (profile icons, captions, buttons).

| Platform | Format | Safe Margin |
|----------|--------|-------------|
| TikTok | 9:16 | 60px top/bottom, 40px sides |
| Instagram Reels | 9:16 | 60px top/bottom, 40px sides |
| YouTube Shorts | 9:16 | 60px top/bottom, 40px sides |
| Instagram Feed | 1:1 | 40px all sides |
| YouTube | 16:9 | 40px all sides |
| LinkedIn | 16:9 | 60px bottom (for player controls) |

Never place critical text within 60px of any edge in 9:16 formats. The top area gets covered by the platform UI. The bottom gets covered by caption text and interaction buttons.

### Safe Area Wrapper Component

```tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';

interface SafeAreaProps {
  children: React.ReactNode;
  format?: 'vertical' | 'landscape' | 'square';
  padding?: number;
}

export const SafeArea = React.memo<SafeAreaProps>(({ children, format = 'vertical', padding }) => {
  const defaultPadding = format === 'vertical' ? 60 : 40;
  const p = padding ?? defaultPadding;

  return (
    <AbsoluteFill style={{ padding: p }}>
      {children}
    </AbsoluteFill>
  );
});
```

## Responsive Video with @remotion/layout-utils

Videos must look correct at multiple aspect ratios without rewriting component logic. Use `@remotion/layout-utils` for proportional scaling.

```bash
npm install @remotion/layout-utils
```

```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from '@remotion/layout-utils';

export const ResponsiveScene: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { fontSize, padding } = useLayout({
    width,
    height,
    layout: 'absolute-fill',
  });

  return (
    <div style={{ fontSize, padding }}>
      Content scales proportionally across aspect ratios
    </div>
  );
};
```

## Frame-Based Color Transitions

Animate color over time using `interpolateColors` instead of CSS transitions:

```tsx
const progress = interpolate(frame, [0, 300], [0, 1], { extrapolateRight: 'clamp' });
const bg = interpolateColors(progress, [0, 1], ['#0a0a0a', '#1a1a2e']);
const accent = interpolateColors(progress, [0, 1], ['#ff0055', '#00ff88']);
```

For multi-stop color sequences, chain interpolations:

```tsx
const t = interpolate(frame, [0, 600], [0, 1], { extrapolateRight: 'clamp' });
let bg: string;
if (t < 0.33) {
  bg = interpolateColors(t / 0.33, [0, 1], ['#0a0a0a', '#1a1a2e']);
} else if (t < 0.66) {
  bg = interpolateColors((t - 0.33) / 0.33, [0, 1], ['#1a1a2e', '#2a1a1a']);
} else {
  bg = interpolateColors((t - 0.66) / 0.34, [0, 1], ['#2a1a1a', '#0a0a0a']);
}
```

## Timing Audio to Visuals

Always derive visual timing from audio duration when voiceover is present. Audio is the master clock.

```tsx
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { staticFile } from 'remotion';

// In calculateMetadata:
const duration = await getAudioDurationInSeconds(staticFile('voice.mp3'));
const durationInFrames = Math.ceil(duration * fps);
```

Inside components, use `useVideoConfig().durationInFrames` as the authoritative timeline length:

```tsx
const { durationInFrames } = useVideoConfig();
const totalSeconds = durationInFrames / fps;
```

## Studio Shortcuts

Teach users these Remotion Studio hotkeys for faster iteration:

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `Arrow Left/Right` | Previous/Next frame |
| `Shift + Arrow` | Skip 10 frames |
| `L` | Loop playback |
| `I` | Set in-point |
| `O` | Set out-point |
| `J` | Decrease playback speed |
| `K` | Increase playback speed |
