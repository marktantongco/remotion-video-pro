# Rendering & Deployment Pipeline

## Local Render

```bash
npx remotion render MyVideo out/video.mp4 --codec=h264
```

Codecs:
- `h264` (default): Best compatibility
- `h265`: Smaller file, slower encode
- `vp8/vp9`: Web-optimized
- `prores`: Professional editing workflow

## Transparency / Alpha Channel

For transparent backgrounds (logos, overlays):
```bash
npx remotion render MyVideo out/frames --sequence --image-format=png
# Or use ProRes 4444 with alpha
npx remotion render MyVideo out/video.mov --codec=prores --prores-profile=4444
```

## CI/CD with GitHub Actions

```yaml
name: Render Video
on:
  push:
    branches: [main]
jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx remotion render MyVideo out/video.mp4 --codec=h264
      - uses: actions/upload-artifact@v4
        with:
          name: video
          path: out/video.mp4
```

## Lambda Deployment (Production)

Setup:
```bash
npx remotion lambda functions deploy
npx remotion lambda sites create src/index.ts
npx remotion lambda render MyVideo
```

### Security & Cost Guards

```ts
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setCodec('h264');
Config.setOverwriteOutput(true);
// Prevent accidental massive renders
Config.setMaxTimelineTracks(20);
```

Environment variables:
```bash
REMOTION_AWS_ACCESS_KEY_ID=...
REMOTION_AWS_SECRET_ACCESS_KEY=...
REMOTION_AWS_REGION=us-east-1
```

Cost controls:
- Set Lambda memory to 2048MB minimum (CPU scales with memory)
- Use `concurrency: 50` max for cost-controlled tests
- Enable CloudWatch alarms on Lambda duration

## CloudRun (GCP Alternative)

```bash
npx remotion cloudrun render MyVideo
```

## Frame Snapshot Testing

```bash
npx remotion still MyVideo --frame=30 --output=frames/frame-30.png
```

Use in CI to detect visual regressions:
```yaml
- run: npx remotion still MyVideo --frame=30 --output=baseline.png
- run: npx remotion still MyVideo --frame=30 --output=current.png
- run: compare baseline.png current.png
```

## Post-Render Checklist

- [ ] File size under target (8MB for email, 50MB for social upload)
- [ ] No encoding artifacts (check dark gradients for banding)
- [ ] Audio sync verified
- [ ] First frame is not black (common audio preload issue)
- [ ] Last frame holds before cut (don't end abruptly)
- [ ] Transparency preserved if required (check alpha channel)
- [ ] Lambda logs checked for memory/timeout errors
