# gsap-animations

Comprehensive GSAP animation skill with React integration, ScrollTrigger, timelines, and advanced patterns for cinematic web experiences.

## Description

Expert-level GSAP animation engineering for React applications. Covers ScrollTrigger-driven scroll animations, complex timeline choreography, micro-interaction systems, progressive disclosure, kinetic typography, and cinematic motion design. Optimized for performance with `will-change`, GPU layering, and cleanup best practices.

## Triggers

`gsap`, `animation`, `framer motion`, `scroll animation`, `timeline`, `usegsap`, `scrolltrigger`, `cinematic motion`, `motion design`, `web animation`

## Core Patterns

### 1. GSAP + React Integration

Always use `@gsap/react` `useGSAP` hook for lifecycle management:

```tsx
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-setup';

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // All GSAP animations here are automatically cleaned up on unmount
    gsap.from('.element', { y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
  }, { scope: containerRef });

  return <div ref={containerRef}>...</div>;
}
```

### 2. ScrollTrigger Registration

Register ScrollTrigger once globally in a setup file:

```ts
// src/lib/gsap-setup.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };
```

### 3. Scroll-Driven Animations

```tsx
useGSAP(() => {
  gsap.to('.parallax-element', {
    yPercent: -30,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1, // smooth scroll-linked animation
    },
  });
});
```

### 4. Timeline Choreography

```tsx
useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  
  tl.from('.hero-name', { clipPath: 'inset(0 100% 0 0)', duration: 1.2 })
    .from('.hero-subtitle', { y: 40, opacity: 0 }, '-=0.6')
    .from('.hero-cta', { scale: 0.8, opacity: 0, stagger: 0.15 }, '-=0.4');
});
```

### 5. ScrollTrigger Batch

```tsx
useGSAP(() => {
  const items = gsap.utils.toArray<HTMLElement>('.card');
  
  ScrollTrigger.batch(items, {
    onEnter: (batch) => {
      gsap.fromTo(batch, 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' }
      );
    },
    start: 'top 85%',
    once: true,
  });
});
```

### 6. Micro-Interactions

```tsx
// Card hover with GSAP
const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
  gsap.to(e.currentTarget, { 
    scale: 1.02, y: -6, 
    boxShadow: '10px 10px 0px var(--brutal-yellow)', 
    duration: 0.3, ease: 'power2.out' 
  });
};

// Button press
const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
  gsap.to(e.currentTarget, { scale: 0.97, duration: 0.08, ease: 'power2.out' });
};
```

### 7. Progressive Disclosure

```tsx
// Elements reveal only when user scrolls to them
useGSAP(() => {
  gsap.utils.toArray<HTMLElement>('.reveal-item').forEach((item) => {
    gsap.from(item, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  });
});
```

### 8. Kinetic Typography

```tsx
// Text clip-path reveal
gsap.from('.headline', {
  clipPath: 'inset(0 100% 0 0)',
  duration: 1.2,
  ease: 'expo.inOut',
  scrollTrigger: {
    trigger: '.headline',
    start: 'top 80%',
    once: true,
  },
});

// Counter animation
gsap.to(counterRef.current, {
  innerText: targetValue,
  duration: 2,
  snap: { innerText: 1 },
  ease: 'power2.out',
  scrollTrigger: { trigger: counterRef.current, start: 'top 85%' },
});
```

## Easing Reference

| Easing | Use Case | Character |
|--------|----------|-----------|
| `expo.inOut` | Major entrances/exits | Dramatic acceleration + deceleration |
| `power3.out` | Element reveals | Fast start, gentle landing |
| `power2.out` | Card entrances | Slightly snappier |
| `back.out(1.2)` | Playful pop-ins | Slight overshoot |
| `elastic.out(1, 0.3)` | Bouncy micro-interactions | Oscillating settle |
| `none` | Scroll-scrubbed | Linear (scroll drives timing) |

## Performance Rules

1. **Always use `useGSAP`** — automatic cleanup prevents memory leaks
2. **Scope triggers** — `ScrollTrigger` cleanup via `scope` parameter
3. **Use `will-change`** sparingly — only for elements about to animate
4. **Prefer `from` over `fromTo`** — avoids setting initial state in JS
5. **`once: true`** for one-time reveals — no need to re-animate
6. **Batch DOM reads/writes** — `gsap.utils.toArray` for batch operations
7. **`scrub: 1`** for smooth scroll-linked (not `scrub: true` which is janky)

## Anti-Patterns to Avoid

- Never use `gsap.set` on mount — use `from` instead
- Never create ScrollTriggers without cleanup — use `useGSAP`
- Never animate `width`/`height` — use `scaleX`/`scaleY` for GPU acceleration
- Never use `left`/`top` — use `x`/`y` transforms
- Never nest timelines without `tl.add()` — causes timing confusion

## Compatible Libraries

- `@gsap/react` — Official React hook (`useGSAP`)
- `gsap/ScrollTrigger` — Scroll-driven animations
- `gsap/ScrollToPlugin` — Smooth scroll to elements
- Works alongside Framer Motion — use GSAP for scroll-driven, FM for layout/state
