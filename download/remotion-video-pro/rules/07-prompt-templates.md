# Ready-to-Use Prompt Templates

Feed these directly to the AI after loading this skill. Each template produces a working Remotion project with proper Zod schemas, React.memo, spring physics, and validation compliance.

## Template A: Social Media Short-Form

> Use the remotion-video-pro skill. Create a 12-second vertical video (1080x1920, 30fps) with 3 scenes:
> 1. Hook (0-2s): Big headline text with spring entrance, subtle animated background gradient
> 2. Value (2-9s): 3 bullet points that animate in one-by-one (staggered 10 frames apart)
> 3. CTA (9-12s): Logo placeholder with "Follow for more" text
>
> Requirements:
> - Expose `headline`, `bullets` (string array), `ctaText`, and `accentColor` as props with Zod schema
> - Use `delayRender` for font loading (Oswold font)
> - 60px safe margins on all sides (mobile vertical)
> - Spring physics for all entrances, no linear animations
> - Dark background with single accent color palette
> - `React.memo` on all scene components
> - `interpolateColors` for background shifts between scenes
> - Use `TransitionSeries` with `fade()` between scenes
> - Include `remotion.config.ts` with h264 codec and JPEG image format
> - Include `scripts/validate-composition.ts` pre-commit hook

## Template B: Product Demo

> Use the remotion-video-pro skill. Create a 20-second product demo video (1920x1080, 30fps) for a SaaS dashboard.
>
> Sequence:
> 1. (0-3s) Company logo animates in with scale-up spring
> 2. (3-10s) Mock browser window with dashboard UI. Custom SVG cursor moves to click "Generate Report"
> 3. (10-15s) Loading indicator, then bar chart grows from 0% to 100% using interpolate
> 4. (15-20s) Fade to product URL and CTA button with hover-like spring effect
>
> Requirements:
> - Use `OffthreadVideo` for any screen recording background
> - Zod schema with all props typed
> - Glassmorphism card effects via `backdrop-filter: blur()`
> - Spring physics with `measureSpring()` for scene duration
> - Acid Minimal or Deep Space color palette
> - Use `Series` for scene chaining
> - `delayRender` for async mock data loading
> - All scene components wrapped in `React.memo`
> - SVG cursor animation driven by `interpolate` keyframes

## Template C: Educational Explainer with Captions

> Use the remotion-video-pro skill. Create a 30-second educational video (1080x1920, 30fps) teaching "How AI Agents Work".
>
> Structure: Split screen layout.
> - Top half: Animated diagram — LLM icon to Tool icon to Action icon, connected by animated arrows that pulse with spring physics
> - Bottom half: Karaoke-style word-level caption highlighting synced to narration
>
> Requirements:
> - Use `useAudioData` + `visualizeAudio` for audio spectrum background if music present
> - Word-level caption highlighting with current/past/upcoming color states
> - Clean academic palette (navy `#0a0a1a`, white `#ffffff`, soft blue `#4488ff`)
> - Mobile legibility: minimum 48px font size for all text
> - `interpolateColors` for diagram node highlighting as explanation progresses
> - `spring()` for icon entrance movements with stagger
> - Zod schema with `chapter` timestamps and caption data
> - 60px safe margins (vertical format)
> - Audio duration drives total video length via `calculateMetadata`

## Template D: Personalized Video at Scale (Lambda-Optimized)

> Use the remotion-video-pro skill. Build a ThankYou video template (1920x1080, 30fps, 10s = 300 frames) optimized for Lambda batch rendering.
>
> Props via Zod: `customerName` (string), `productName` (string), `purchaseDate` (string), `brandColor` (hex string).
>
> Scenes:
> 1. (0-3s) "Hello, {customerName}!" with spring entrance scale animation
> 2. (3-7s) Product name display with brand-colored underline that grows via interpolate
> 3. (7-10s) "Purchased on {purchaseDate}" with brand logo placeholder fade-in
>
> Requirements:
> - Every sub-component wrapped in `React.memo()`
> - All assets via `staticFile()`, zero runtime fetches
> - Slim `defaultProps` — no large objects
> - Use `prefetch()` for remote brand assets (logo URL as optional prop)
> - `measureSpring()` to calculate exact scene durations from spring configs
> - `remotion.config.ts` with h264 codec, JPEG image format, ANGLE renderer
> - GitHub Actions workflow file for CI/CD render on push
> - Include the composition validation script
> - Design for `--concurrency=100` Lambda rendering (no shared state, no side effects)

## Template E: Data-Driven Report Video

> Use the remotion-video-pro skill. Create a 15-second data report video (1920x1080, 30fps) that visualizes JSON data.
>
> Props via Zod: `title` (string), `metrics` (array of `{ label: string, value: number, change: number }`), `accentColor` (hex).
>
> Sequence:
> 1. (0-2s) Title card with spring entrance
> 2. (2-10s) 4 metric cards animate in staggered (5 frames apart). Each card shows label, value (counting up via interpolate), and change percentage (green if positive, red if negative)
> 3. (10-13s) All metrics visible, accent-colored bar grows to show relative comparison
> 4. (13-15s) Fade to summary text
>
> Requirements:
> - Load metrics data inside component via `staticFile()` + `fetch()`
> - Count-up animation for numbers using `interpolate` over 60 frames
> - Color-code positive/negative changes
> - `React.memo` on metric card component (reused 4 times)
> - `delayRender` for data loading
> - Acid Minimal palette
> - Include validation script
