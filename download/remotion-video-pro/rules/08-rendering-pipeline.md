# Rendering & Deployment Pipeline

## Local Render

```bash
npx remotion render MyVideo out/video.mp4 --codec=h264
```

Common options:
```bash
# Specify quality and speed
npx remotion render MyVideo out/video.mp4 --codec=h264 --crf=18

# Render specific frame range
npx remotion render MyVideo out/video.mp4 --frames=0-300

# Render at half resolution for fast preview
npx remotion render MyVideo out/video.mp4 --scale=0.5

# Render with parallel frame processing
npx remotion render MyVideo out/video.mp4 --concurrency=4
```

## Codec Selection

| Codec | File Size | Speed | Compatibility | Use Case |
|-------|-----------|-------|---------------|----------|
| `h264` | Medium | Fast | Universal | Default choice, web upload |
| `h265` | Small | Slow | Modern browsers, iOS | Mobile-optimized |
| `vp8` | Medium | Fast | Web | Web-only delivery |
| `vp9` | Small | Medium | Modern browsers | YouTube preferred |
| `prores` | Large | Fast | Editing software | Professional editing workflow |

## Transparency / Alpha Channel

For overlays, logos, or compositing on other video:

```bash
# PNG sequence with transparency
npx remotion render MyVideo out/frames --sequence --image-format=png

# ProRes 4444 with alpha channel
npx remotion render MyVideo out/video.mov --codec=prores --prores-profile=4444

# WebM with alpha (VP8)
npx remotion render MyVideo out/video.webm --codec=vp8
```

## CI/CD with GitHub Actions

Complete workflow with validation gate:

```yaml
name: Render Video
on:
  push:
    branches: [main]
    paths: ['src/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/validate-composition.ts

  render:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx remotion render MyVideo out/video.mp4 --codec=h264 --crf=18
      - uses: actions/upload-artifact@v4
        with:
          name: video
          path: out/video.mp4

  snapshot-test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx remotion still MyVideo --frame=30 --output=current.png
      - name: Compare with baseline
        run: |
          if [ -f baseline/frame-30.png ]; then
            diff <(identify -verbose current.png) <(identify -verbose baseline/frame-30.png) && echo "Match" || echo "Visual regression detected"
          fi
```

## Lambda Deployment (Production Scale)

### Setup

```bash
# Deploy Lambda functions
npx remotion lambda functions deploy

# Create serve site (bundles your project to S3)
npx remotion lambda sites create src/index.ts

# Render on Lambda
npx remotion lambda render MyVideo --concurrency=100
```

### Security & Cost Guards

```ts
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setCodec('h264');
Config.setOverwriteOutput(true);
Config.setMaxTimelineTracks(20); // Prevent accidental massive compositions
```

Environment variables required:
```bash
REMOTION_AWS_ACCESS_KEY_ID=...
REMOTION_AWS_SECRET_ACCESS_KEY=...
REMOTION_AWS_REGION=us-east-1
```

### Cost Optimization

- Set Lambda memory to 2048MB minimum (CPU scales linearly with memory in Lambda)
- Start with `concurrency: 50` for testing, scale to 100-200 for production
- Enable CloudWatch alarms on Lambda duration and error rate
- Use `--privacy=public` to get a direct S3 URL after render
- Delete old renders from S3 after delivery to control storage costs

Cost estimate per video at 1080p/30fps/30s with 2048MB:
- Approximately $0.05-0.10 per 30-second video
- At 10,000 videos: $500-1000 total

## CloudRun (GCP Alternative)

```bash
npx remotion cloudrun render MyVideo
```

CloudRun is simpler to set up than Lambda but has less granular concurrency control. Use it if you are already in the GCP ecosystem.

## Frame Snapshot Testing

Generate still frames at specific timestamps for visual regression testing:

```bash
# Single frame
npx remotion still MyVideo --frame=30 --output=frames/frame-30.png

# Multiple frames
npx remotion still MyVideo --frame=0 --output=frames/frame-0.png
npx remotion still MyVideo --frame=150 --output=frames/frame-150.png
npx remotion still MyVideo --frame=300 --output=frames/frame-300.png
```

Use `--scale=0.25` for fast low-res snapshots during development.

## Post-Render Checklist

Before delivering any video, verify:

- [ ] File size under target (8MB for email, 50MB for social upload)
- [ ] No encoding artifacts (check dark gradients for banding)
- [ ] Audio sync verified (voiceover matches on-screen text)
- [ ] First frame is not black (common audio preload issue)
- [ ] Last frame holds for at least 10 frames before cut (no abrupt endings)
- [ ] Transparency preserved if required (check alpha channel in output)
- [ ] Lambda logs checked for memory/timeout errors (if applicable)
- [ ] Font rendering correct on all frames (no FOUT mid-video)
