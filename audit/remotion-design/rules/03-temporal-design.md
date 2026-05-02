# Temporal Design Thinking

## The 300ms Rule

Human perception threshold for fluid motion is ~300ms (9 frames at 30fps, 18 frames at 60fps).

- Scene transitions: 15–30 frames
- Text entrances: 10–20 frames
- Micro-interactions: 5–10 frames
- Hold time for reading: 2–3 seconds minimum per text block

## The Hook Window

For short-form (TikTok/Reels), the first 1.5 seconds (45 frames) determine retention.

Structure:
1. **Frames 0–45:** Visual hook — motion, contrast, surprise
2. **Frames 45–600:** Value delivery — information, story, demo
3. **Frames 600–900:** CTA — clear next action

## Safe Areas

| Platform | Safe Margin |
|----------|-------------|
| Mobile vertical | 60px top/bottom, 40px sides |
| Desktop landscape | 40px all sides |

Never place critical text within 60px of any edge in 9:16 formats.

## Responsive Video with @remotion/layout-utils

Video must look correct at multiple aspect ratios without rewriting logic.

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
      Content scales proportionally
    </div>
  );
};
```

## Frame-Based Color Transitions

Animate color over time:

```tsx
const progress = interpolate(frame, [0, 300], [0, 1], { extrapolateRight: 'clamp' });
const bg = interpolateColors(progress, [0, 1], ['#0a0a0a', '#1a1a2e']);
```

## Timing Audio to Visuals

Always derive visual timing from audio duration when voiceover is present:

```tsx
const { durationInFrames } = useVideoConfig(); // Use this as master clock
```

If using external audio, get duration first:
```tsx
import { getAudioDurationInSeconds } from '@remotion/media-utils';

const duration = await getAudioDurationInSeconds(staticFile('voice.mp3'));
const durationInFrames = Math.ceil(duration * fps);
```

## Studio Shortcuts

Teach users these Remotion Studio hotkeys:
- `Space` — Play/Pause
- `Arrow Left/Right` — Previous/Next frame
- `Shift + Arrow` — Skip 10 frames
- `L` — Loop playback
- `I/O` — Set in/out points for preview range
