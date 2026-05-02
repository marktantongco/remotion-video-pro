# Anti-Slop Aesthetics for Video

## Banned Elements

These elements are forbidden in any Remotion project produced with this skill. They signal amateur work and generic AI output.

### Fonts
- Inter, Roboto, Arial, system-ui, Helvetica, Times New Roman (for headings)
- Any font loaded without `delayRender` (causes FOUT — Flash of Unstyled Text)

### Colors
- Generic purple/blue gradients on white backgrounds (`linear-gradient(135deg, #667eea, #764ba2)`)
- Default Tailwind blue (`#3B82F6`) as primary accent
- Pure black `#000000` without intentional design rationale
- Neon glow effects on text (unless specifically going for cyberpunk aesthetic)

### Layout
- Cookie-cutter SaaS card layouts with rounded corners and subtle shadows
- Centered text with no visual hierarchy
- Wall of text — more than 15 words on screen at once in short-form
- Emojis used as icons (use inline SVG instead)

### Animation
- Default `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on anything
- Pure linear animations for entrances and exits
- Bounce effects on everything (overused)
- Rotating/spinning logos (dated)

## Typography for Motion

Choose typography based on the video's tone. Every font pairing below has been tested for readability at 30fps on 1080p and higher.

| Tone | Heading Font | Body Font | Use Case |
|------|-------------|-----------|----------|
| Brutal/Impact | Oswald | Space Mono | Tech, sports, gaming |
| Editorial | Playfair Display | Source Sans Pro | Luxury, fashion, culture |
| Retro-Futuristic | Orbitron | Rajdhani | Sci-fi, crypto, AI |
| Organic/Playful | Nunito | Merriweather | Education, lifestyle |
| Luxury | Cormorant Garamond | Montserrat | Real estate, finance |
| Minimal | DM Sans | DM Sans | SaaS, product demos |
| Bold Statement | Bebas Neue | Inter (body only) | Social media, ads |

### Font Loading with delayRender

Never let fonts render as fallback. Gate the frame until the font is loaded:

```tsx
import { preloadFont, delayRender, continueRender } from 'remotion';
import { useEffect, useState } from 'react';

export const useFont = (fontFamily: string, url: string) => {
  const [handle] = useState(() => delayRender(`Loading font: ${fontFamily}`));

  useEffect(() => {
    preloadFont(fontFamily, url).then(() => continueRender(handle));
  }, [fontFamily, url, handle]);
};

// Usage in component:
useFont('Oswald', 'https://fonts.gstatic.com/s/oswald/v53/TK3iWkUHHAIjg752FD8Ghe4.woff2');
```

### Font Size by Platform

| Format | Min Heading | Min Body | Max Heading |
|--------|------------|----------|-------------|
| 1920x1080 (landscape) | 72px | 32px | 200px |
| 1080x1920 (vertical) | 48px | 28px | 140px |
| 1080x1080 (square) | 60px | 30px | 160px |

## Color Direction

Commit to ONE palette and execute it fully across every frame. Inconsistent color is the fastest way to make a video look unpolished.

### Palette 1: Monochrome Noir
```
Background:  #0a0a0a
Surface:     #111111
Text:        #ffffff
Accent:      #ff0055 (red) or #00ff88 (green) — pick ONE
```

Best for: Tech demos, product launches, dramatic content.

### Palette 2: Acid Minimal
```
Background:  #f5f5f0
Surface:     #ffffff
Text:        #1a1a1a
Accent:      #00ff88
```

Best for: SaaS product demos, educational content, clean brands.

### Palette 3: Deep Space
```
Background:  #0a0a1a
Surface:     #1e1e2e
Text:        #e0e0ff
Accent:      #00d4ff
```

Best for: AI/ML content, developer tools, sci-fi themes.

### Palette 4: Warm Editorial
```
Background:  #f5f0e8
Surface:     #fffdf8
Text:        #2a2a2a
Accent:      #c65d3b
```

Best for: Finance, real estate, lifestyle, documentary.

## Motion Principles

### Entrances (things appearing)
Scale from 0.8 to 1.0, opacity from 0 to 1, slight translateY from 20px to 0. Use spring config `{ damping: 200, stiffness: 100 }`.

```tsx
const entrance = spring({ fps, frame, config: { damping: 200, stiffness: 100 } });
const opacity = interpolate(entrance, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
const scale = interpolate(entrance, [0, 1], [0.8, 1], { extrapolateRight: 'clamp' });
const translateY = interpolate(entrance, [0, 1], [20, 0], { extrapolateRight: 'clamp' });
```

### Exits (things leaving)
Opacity from 1 to 0, translateX from 0 to -50px. Never scale down on exit — it looks like a bug, not an animation.

```tsx
const exitProgress = interpolate(frame, [exitStart, exitStart + 15], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
const exitTranslateX = interpolate(exitProgress, [0, 1], [0, -50]);
```

### Emphasis (drawing attention)
Brief scale from 1 to 1.05 and back to 1, lasting 5-10 frames. Use on key beats or data highlights.

```tsx
const emphasisFrame = 120; // Frame where emphasis triggers
const emphasisProgress = interpolate(frame, [emphasisFrame, emphasisFrame + 8], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
const emphasisScale = interpolate(emphasisProgress, [0, 0.5, 1], [1, 1.05, 1]);
```

### Backgrounds
Subtle gradient shifts or animated noise textures. Never static white. Never pure black without a subtle gradient.

```tsx
const bgProgress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
const bg = interpolateColors(bgProgress, [0, 1], ['#0a0a0a', '#0f0f1a']);
```

## Composition Rules

- Use asymmetry. Centered text is for amateurs. Offset text left or right and balance with visual weight on the opposite side.
- Negative space is power. Crowded frames induce cognitive anxiety. When in doubt, remove elements.
- Layer depth: Background (static or very slow movement) to Midground (main content with spring animations) to Foreground (accent elements like particles or overlays).
- Design for the worst frame. Pause at any point in the timeline. The still frame should look intentional and composed, like a photograph.
- Text density: Maximum 8-10 words per line. Maximum 3 lines on screen at once in short-form. Maximum 6-8 words per line in landscape format.
