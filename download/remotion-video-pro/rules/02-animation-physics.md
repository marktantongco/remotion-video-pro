# Animation Physics & Timing

## interpolate() — The Workhorse

Map frame ranges to values. Always clamp by default.

```tsx
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

const translateY = interpolate(frame, [0, 60], [100, 0], {
  extrapolateRight: 'clamp',
  easing: Easing.out(Easing.cubic),
});
```

### Easing Cheat Sheet

| Easing | Use Case |
|--------|----------|
| `Easing.linear` | Never use for entrances |
| `Easing.in(Easing.quad)` | Exits, things leaving screen |
| `Easing.out(Easing.quad)` | Entrances, things appearing |
| `Easing.inOut(Easing.cubic)` | Symmetric transitions |
| `Easing.bezier(0.16, 1, 0.3, 1)` | Custom snappy feel |

## interpolateColors()

Animate between colors smoothly.

```tsx
import { interpolateColors } from 'remotion';

const progress = interpolate(frame, [0, 300], [0, 1], { extrapolateRight: 'clamp' });
const bg = interpolateColors(progress, [0, 1], ['#0a0a0a', '#1a1a2e']);
const text = interpolateColors(progress, [0, 1], ['#ffffff', '#00ff88']);
```

## spring() — Organic Motion

Spring physics create natural, organic-feeling motion that linear interpolation can never match. Every UI element entering the frame should use spring unless there is a specific reason not to.

```tsx
const scale = spring({
  fps,
  frame,
  config: {
    damping: 200,
    stiffness: 100,
    mass: 1,
  },
});
```

### measureSpring()

Predict how long a spring will take to settle. Critical for timing sequences and preventing premature scene cuts.

```tsx
import { measureSpring } from 'remotion';

const durationInFrames = measureSpring({
  fps,
  config: { damping: 200, stiffness: 100 },
});

// Use this to set Sequence duration dynamically
<Sequence durationInFrames={durationInFrames}>
  <AnimatedElement />
</Sequence>
```

### Spring Presets

| Feel | Damping | Stiffness | Mass |
|------|---------|-----------|------|
| Snappy UI | 200 | 300 | 1 |
| Gentle float | 50 | 50 | 1.5 |
| Heavy bounce | 10 | 100 | 2 |
| Apple-style | 200 | 100 | 1 |

### Combining Springs with Interpolate

For multi-axis motion, layer springs and interpolations:

```tsx
const { fps, durationInFrames } = useVideoConfig();
const frame = useCurrentFrame();

// Entrance: scale + opacity + Y translate
const entrance = spring({ fps, frame, config: { damping: 200, stiffness: 100 } });
const opacity = interpolate(entrance, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
const translateY = interpolate(entrance, [0, 1], [40, 0], { extrapolateRight: 'clamp' });

// Exit: starts at 80% of timeline
const exitStart = Math.floor(durationInFrames * 0.8);
const exitProgress = interpolate(
  frame,
  [exitStart, durationInFrames],
  [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);
const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0], { extrapolateRight: 'clamp' });
const exitTranslateX = interpolate(exitProgress, [0, 1], [0, -80], { extrapolateRight: 'clamp' });

const finalOpacity = Math.min(opacity, exitOpacity);
const finalTranslateY = translateY;
const finalTranslateX = exitTranslateX;
```

## Transitions

Use `@remotion/transitions` for scene changes. Install it first:

```bash
npm install @remotion/transitions
```

```tsx
import { TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';
import { springTiming, linearTiming } from '@remotion/transitions/spring-timing';
import { flip } from '@remotion/transitions/flip';

// Spring-timed fade
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={springTiming({ config: { damping: 200 } })}
    presentation={fade()}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 30 })}
    presentation={slide()}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneC />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### Transition Types

| Presentation | Best For |
|-------------|----------|
| `fade()` | General purpose, smooth |
| `slide()` | Directional storytelling |
| `wipe()` | High energy, sports, gaming |
| `flip()` | Card-like reveals, comparisons |

## Sequence Timing

- `Sequence.from` can be negative (starts immediately, cuts off first N frames)
- `Series.Sequence` has `offset` prop for overlap
- Always think in frames: `seconds * fps`
- Use `measureSpring()` to chain springs without gaps
- For parallel animations, use multiple `Sequence` components at the same time offset

## Staggered Animations

Animate list items one by one:

```tsx
const items = ['Feature 1', 'Feature 2', 'Feature 3'];
const staggerDelay = 10; // frames between each item

return items.map((item, i) => {
  const itemFrame = frame - (i * staggerDelay);
  if (itemFrame < 0) return null;

  const opacity = interpolate(itemFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(itemFrame, [0, 15], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div key={i} style={{ opacity, transform: `translateY(${translateY}px)` }}>
      {item}
    </div>
  );
});
```

## Anti-Patterns

- Never use CSS `transition`, `animation`, `@keyframes` — Chromium headless ignores them
- Never use `setTimeout`, `setInterval`, `requestAnimationFrame` — use `useCurrentFrame()`
- Never use linear interpolation for UI elements — spring always looks better
- Never animate `box-shadow` or `filter: blur()` — performance killer in headless Chromium
- Never guess spring duration — always calculate with `measureSpring()`
