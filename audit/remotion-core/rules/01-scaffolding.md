# Scaffolding & Composition Architecture

## Project Setup

Always scaffold with:
```bash
npx create-video@latest --yes --blank --tailwind my-video
cd my-video
```

If the user already has a project, verify these files exist:
- `src/index.ts` (calls `registerRoot`)
- `src/Root.tsx` (exports compositions with `calculateMetadata`)
- `remotion.config.ts`
- `public/` directory
- `tsconfig.json` with `"strict": true`

## Composition Rules with Zod

A `<Composition>` is the renderable unit. Always pair with Zod for runtime validation.

```tsx
import { Composition, calculateMetadata } from 'remotion';
import { z } from 'zod';
import { MainVideo } from './MainVideo';

export const videoSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ff0055'),
  showLogo: z.boolean().default(true),
  chapters: z.array(z.object({
    text: z.string(),
    startFrame: z.number().int().min(0),
    endFrame: z.number().int().min(0),
  })).default([]),
});

export type VideoProps = z.infer<typeof videoSchema>;

export const calculateMainMetadata = calculateMetadata(async ({ props }) => {
  const parsed = videoSchema.parse(props);
  const durationInFrames = parsed.chapters.length > 0
    ? Math.max(...parsed.chapters.map(c => c.endFrame))
    : 300;

  return {
    durationInFrames,
    width: 1920,
    height: 1080,
    fps: 30,
    props: parsed,
  };
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="MainVideo"
      component={MainVideo}
      calculateMetadata={calculateMainMetadata}
      schema={videoSchema}
      defaultProps={{
        title: 'Default Title',
        accentColor: '#ff0055',
        showLogo: true,
        chapters: [],
      }}
    />
  </>
);
```

### Aspect Ratio Presets

| Platform | Width | Height | FPS | Duration (typical) |
|----------|-------|--------|-----|-------------------|
| YouTube Landscape | 1920 | 1080 | 30 | 30–120s |
| TikTok/Reels/Shorts | 1080 | 1920 | 30 | 7–30s |
| Twitter/X | 1280 | 720 | 30 | 15–60s |
| LinkedIn | 1920 | 1080 | 30 | 15–90s |
| Instagram Square | 1080 | 1080 | 30 | 15–60s |

## Async Asset Loading Pattern

Never let fonts or data cause blank frames. Gate render with `delayRender`.

```tsx
import { delayRender, continueRender, staticFile } from 'remotion';
import { useEffect, useState } from 'react';

export const useAsyncAsset = <T,>(fetcher: () => Promise<T>, deps: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [handle] = useState(() => delayRender('Loading async asset'));

  useEffect(() => {
    let cancelled = false;
    fetcher().then((result) => {
      if (!cancelled) {
        setData(result);
        continueRender(handle);
      }
    });
    return () => { cancelled = true; };
  }, deps);

  return data;
};
```

## Scene Architecture

Break every video into isolated `Scene` components. Each scene receives `frame` relative to its start.

```tsx
// src/scenes/HookScene.tsx
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface HookSceneProps {
  headline: string;
  accentColor: string;
}

export const HookScene: React.FC<HookSceneProps> = React.memo(({ headline, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, config: { damping: 200, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: '#0a0a0a',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 80,
    }}>
      <h1 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: 140,
        color: accentColor,
        opacity,
        transform: `scale(${scale})`,
        textAlign: 'center',
        lineHeight: 1.1,
      }}>
        {headline}
      </h1>
    </AbsoluteFill>
  );
});
```

Compose in Root:
```tsx
<Series>
  <Series.Sequence durationInFrames={90}>
    <HookScene headline="THE FUTURE" accentColor="#00ff88" />
  </Series.Sequence>
  <Series.Sequence durationInFrames={300}>
    <ValueScene />
  </Series.Sequence>
  <Series.Sequence durationInFrames={90}>
    <CTAScene />
  </Series.Sequence>
</Series>
```

## Environment Guards

Use `getRemotionEnvironment()` to prevent studio-only code from breaking renders.

```tsx
import { getRemotionEnvironment } from 'remotion';

const { isStudio } = getRemotionEnvironment();

// Safe to use only in studio
if (isStudio) {
  console.log('Studio-only debug');
}
```

## Entry File Pattern

```tsx
// src/index.ts
import { registerRoot } from 'remotion';
import { Root } from './Root';

registerRoot(Root);
```

## Root File Pattern

```tsx
// src/Root.tsx
import { Composition } from 'remotion';
import { MainVideo, videoSchema, calculateMainMetadata } from './MainVideo';

export const Root: React.FC = () => (
  <>
    <Composition
      id="MainVideo"
      component={MainVideo}
      calculateMetadata={calculateMainMetadata}
      schema={videoSchema}
      defaultProps={{ title: 'Hello World' }}
    />
  </>
);
```
