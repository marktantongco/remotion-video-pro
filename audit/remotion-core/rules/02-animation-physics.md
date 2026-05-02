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

Predict how long a spring will take to settle. Critical for timing sequences.

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

## Transitions

Use `@remotion/transitions` for scene changes:

```tsx
import { TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';

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

## Sequence Timing

- `Sequence.from` can be negative (starts immediately, cuts off first N frames)
- `Series.Sequence` has `offset` prop for overlap
- Always think in frames: `seconds * fps`
- Use `measureSpring()` to chain springs without gaps

## Anti-Patterns

- ❌ CSS `transition`, `animation`, `@keyframes`
- ❌ `setTimeout`, `setInterval`, `requestAnimationFrame`
- ❌ Linear interpolation for UI elements (use spring)
- ❌ Animating `box-shadow` or `filter: blur()` (performance killer in Chromium headless)
- ❌ Guessing spring duration — always calculate with `measureSpring()`
