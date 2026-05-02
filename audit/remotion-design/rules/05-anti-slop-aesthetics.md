# Anti-Slop Aesthetics for Video

## Banned Elements

- Inter, Roboto, Arial, system-ui fonts
- Generic purple/blue gradients on white
- Cookie-cutter SaaS card layouts
- Emojis as icons (use SVG)
- Default `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- Pure linear animations
- Unprefixed font loading (causes FOUT in rendered frames)

## Typography for Motion

| Tone | Font Pairing | Use Case |
|------|-------------|----------|
| Brutal/Impact | Oswald + Space Mono | Tech, sports, gaming |
| Editorial | Playfair Display + Source Sans Pro | Luxury, fashion, culture |
| Retro-Futuristic | Orbitron + Rajdhani | Sci-fi, crypto, AI |
| Organic/Playful | Nunito + Merriweather | Education, lifestyle |
| Luxury | Cormorant Garamond + Montserrat | Real estate, finance |

## Font Loading with delayRender

Never let fonts render as fallback. Gate the frame until loaded.

```tsx
import { preloadFont, delayRender, continueRender } from 'remotion';
import { useEffect, useState } from 'react';

export const useFont = (fontFamily: string, url: string) => {
  const [handle] = useState(() => delayRender(`Loading font: ${fontFamily}`));

  useEffect(() => {
    preloadFont(fontFamily, url).then(() => continueRender(handle));
  }, [fontFamily, url, handle]);
};

// Usage
useFont('Oswald', 'https://fonts.gstatic.com/s/oswald/v53/...woff2');
```

## Color Direction

Commit to ONE palette and execute fully:

1. **Monochrome Noir**: `#000`, `#111`, `#fff`, one accent (red or neon)
2. **Acid Minimal**: White bg, black text, single acid green highlight
3. **Deep Space**: Navy `#0a0a1a`, slate `#1e1e2e`, cyan `#00d4ff`
4. **Warm Editorial**: Cream `#f5f0e8`, charcoal `#2a2a2a`, terracotta `#c65d3b`

## Motion Principles

- **Entrances**: Scale from 0.8→1 + opacity 0→1 + slight translateY (20px→0)
- **Exits**: Opacity 1→0 + translateX 0→-50px (never scale down, it looks like a bug)
- **Emphasis**: Brief scale 1→1.05→1 on key beats (5-10 frames)
- **Backgrounds**: Subtle gradient shifts or animated noise textures, never static white

## Composition Rules

- Use asymmetry. Centered text is for amateurs.
- Negative space is power. Crowded frames induce anxiety.
- Layer depth: Background (static/very slow) → Midground (main content) → Foreground (accent elements)
- Always design for the worst frame: pause at any point and the still should look intentional
