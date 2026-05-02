# Performance Optimization

## React.memo is Mandatory

Every scene and every reusable component must be wrapped in `React.memo`. Unnecessary re-renders on Lambda cost real money per frame.

```tsx
const HeavyScene = React.memo<{ data: ChapterData[] }>(({ data }) => {
  const processed = useMemo(() => expensiveTransform(data), [data]);
  return <div>{/* ... */}</div>;
});
```

Rules:
- Memo all components in `src/scenes/` and `src/components/`
- Memo all components that receive `props` from a parent
- Do NOT memo leaf components that have no props (they never re-render anyway)
- Use `useMemo` for expensive computations inside memoized components

## OffthreadVideo (Critical)

For any MP4 input, use `OffthreadVideo`. It extracts frames outside the main browser thread, preventing the render process from blocking.

```tsx
import { OffthreadVideo } from 'remotion';

<OffthreadVideo
  src={staticFile('input.mp4')}
  startFrom={0}
  endAt={300}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

Never use `<Video>` for input MP4s in production renders. It decodes on the main thread and causes frame drops, stuttering, and increased render times.

### When OffthreadVideo Matters Most

- Input video longer than 5 seconds
- Rendering on Lambda (memory-constrained)
- Multiple video layers composited together
- 4K resolution output

## Asset Loading Strategy

### Static Files (preferred)
Place assets in `public/` and reference with `staticFile()`:

```tsx
import { staticFile } from 'remotion';

<img src={staticFile('logo.png')} />
<OffthreadVideo src={staticFile('intro.mp4')} />
```

Never `import` images or videos directly into components. This bundles them into the JavaScript payload and explodes bundle size.

### Remote Assets
For assets from external URLs, use `prefetch()` for anything over 1MB:

```tsx
import { prefetch } from 'remotion';

// Before render starts:
const { free, waitUntilDone } = prefetch('https://example.com/asset.mp4');
await waitUntilDone();
// free() when done to release memory
```

## Font Preloading with delayRender

Fonts that fail to load cause fallback rendering (FOUT) which produces frames with wrong typography. Gate renders until fonts are ready:

```tsx
import { preloadFont, delayRender, continueRender } from 'remotion';
import { useEffect, useState } from 'react';

export const usePreloadFont = (fontFamily: string, url: string) => {
  const [handle] = useState(() => delayRender(`font-${fontFamily}`));
  useEffect(() => {
    preloadFont(fontFamily, url).then(() => continueRender(handle));
  }, [fontFamily, url, handle]);
};
```

## Bundle Size Optimization

### Tree-Shake Imports
Named imports only. Never namespace imports:

```tsx
// CORRECT
import { interpolate, spring, useCurrentFrame } from 'remotion';

// WRONG — pulls entire remotion bundle
import * as Remotion from 'remotion';
```

### Avoid Heavy Libraries
Three.js, Lottie, and heavy charting libraries add significant bundle size. Only use them when no lighter alternative exists. For charts, prefer Canvas 2D drawing or SVG. For 3D, consider pre-rendered video instead of runtime Three.js.

### remotion.config.ts Tuning

```ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg'); // jpeg is faster than png
Config.setOverwriteOutput(true);   // skip file existence check
Config.setCodec('h264');           // best compatibility
Config.setChromiumOpenGlRenderer('angle'); // fixes headless GPU issues
```

## Parallel Rendering

### Local Concurrency
Use `--concurrency` to render multiple frames simultaneously:

```bash
npx remotion render MyVideo out/video.mp4 --concurrency=4
```

For machines with 8+ CPU cores, use `--concurrency=8` for near-linear speedup.

### Lambda Horizontal Scaling
Lambda scales automatically. Set concurrency to match your cost budget:

```bash
npx remotion lambda render MyVideo --concurrency=100
```

Cost formula: `render_time_minutes * concurrency * $0.00167/GB-minute * memory_GB`

## The defaultProps Limit

If Remotion throws `defaultProps too big - could not serialize`, your composition props are too large for the props bridge.

Solution: Pass a slim identifier and load data inside the component:

```tsx
// WRONG — heavy data in defaultProps
defaultProps={{
  chapters: [{ text: "...", startFrame: 0, ... }, ...] // 500KB
}}

// CORRECT — pass file path, load inside component
defaultProps={{
  dataUrl: 'data/chapters.json',
}}
// Then inside component:
const data = useAsyncAsset(() => fetch(staticFile(props.dataUrl)).then(r => r.json()));
```

## One-Frame Sanity Check

Before committing to a full render, verify a single frame looks correct:

```bash
npx remotion still MyVideo --scale=0.25 --frame=30 --output=test-frame.png
```

## watchStaticFile (Studio Dev Only)

Auto-reload static assets in Remotion Studio without restarting:

```tsx
import { watchStaticFile, staticFile } from 'remotion';
import { useState, useEffect } from 'react';

export const DynamicAsset = React.memo(() => {
  const [data, setData] = useState('');

  useEffect(() => {
    const { cancel } = watchStaticFile('data.json', (newData) => {
      setData(newData);
    });
    return cancel;
  }, []);

  return <div>{data}</div>;
});
```

Note: `watchStaticFile` only works in Studio. It does nothing during rendering. Never ship code that depends on it for production behavior.
