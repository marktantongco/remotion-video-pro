# Performance Optimization

## Memoization is Mandatory

```tsx
const HeavyScene = React.memo(({ data }) => {
  const processed = useMemo(() => expensiveTransform(data), [data]);
  return <div>...</div>;
});
```

## OffthreadVideo (Critical)

For any MP4 input, use `OffthreadVideo`. It extracts frames outside the main thread.

```tsx
import { OffthreadVideo } from 'remotion';

<OffthreadVideo 
  src={staticFile('input.mp4')} 
  startFrom={0}
  endAt={300}
/>
```

Never use `<Video>` for input MP4s in production renders. It causes frame drops.

## Asset Loading

- ❌ `import img from './image.png'` (bloated bundle)
- ✅ `staticFile('image.png')` (streams from disk)
- ✅ `prefetch()` for remote assets > 1MB

```tsx
import { prefetch } from 'remotion';

const { free, waitUntilDone } = prefetch('https://example.com/asset.mp4');
await waitUntilDone(); // Use before render starts
```

## Font Preloading with delayRender

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

## Bundle Size

- Tree-shake imports: `import { interpolate } from 'remotion'` not `import * as Remotion from 'remotion'`
- Avoid heavy libs (Three.js, Lottie) unless necessary
- Use `remotion.config.ts` to optimize:

```ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setChromiumOpenGlRenderer('angle'); // Fixes some headless GPU issues
```

## Parallel Rendering

Local concurrency:
```bash
npx remotion render MyVideo --concurrency=4
```

Lambda (horizontal scaling):
```bash
npx remotion lambda render MyVideo --concurrency=100
```

## The `defaultProps` Limit

If you hit `defaultProps too big - could not serialize`:
- Pass a slim ID as prop
- Load heavy data inside component via `fetch()` or `staticFile()`

## One-Frame Sanity Check

```bash
npx remotion still MyVideo --scale=0.25 --frame=30
```

## watchStaticFile (Studio Dev)

Auto-reload assets in studio without restart:

```tsx
import { watchStaticFile, staticFile } from 'remotion';
import { useState, useEffect } from 'react';

export const DynamicAsset: React.FC = () => {
  const [data, setData] = useState('');

  useEffect(() => {
    const { cancel } = watchStaticFile('data.json', (newData) => {
      setData(newData);
    });
    return cancel;
  }, []);

  return <div>{data}</div>;
};
```
