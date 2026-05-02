# Ready-to-Use Prompt Templates

Feed these directly to Claude Code after installing this skill.

## Template A: Social Media Short-Form

> Use the remotion-video-pro skill. Create a 12-second vertical video (1080x1920, 30fps) with 3 scenes:
> 1. Hook (0–2s): Big headline text, subtle background gradient, smooth entrance with spring physics
> 2. Value (2–9s): 3 bullet points that animate in one-by-one (staggered, 10 frames apart)
> 3. CTA (9–12s): Logo placeholder + "Follow for more" style CTA
> Requirements: 
> - Expose headline, bullets, CTA text, and accent color as props with Zod schema
> - Use delayRender for font loading
> - Generous mobile-safe margins (60px edges)
> - No linear animations. Use spring() and measureSpring() for timing
> - Use Oswald or similar bold font. Dark background with single accent color
> - Use React.memo on all scene components
> - Use interpolateColors for background shifts

## Template B: Product Demo

> Use the remotion-video-pro skill. Create a 20-second product demo video (1920x1080, 30fps) for a SaaS dashboard.
> Sequence:
> 1. (0-3s) Logo animates in with scale-up spring
> 2. (3-10s) Mock browser window with dashboard UI. Custom SVG cursor moves to click "Generate Report"
> 3. (10-15s) Loading spinner → bar chart grows 0% to 100% using interpolate
> 4. (15-20s) Fade to product URL and CTA button
> Requirements:
> - Use OffthreadVideo for any screen recordings
> - Use Zod schema for all props
> - Glassmorphism effects via backdrop-filter
> - 60fps feel with spring physics
> - Anti-slop color palette (Acid Minimal or Deep Space)
> - Use Series for scene chaining
> - Add delayRender for async mock data loading

## Template C: Educational Explainer with Captions

> Use the remotion-video-pro skill. Create a 30-second educational video (1080x1920, 30fps) teaching "How AI Agents Work".
> Structure: Split screen. Top: Animated diagram (LLM icon → Tool icon → Action icon) with moving arrows. Bottom: Karaoke-style captions.
> Requirements:
> - Use useAudioData + visualizeAudio if background music present
> - Word-level caption highlighting synced to narration
> - Clean academic palette (navy, white, soft blue)
> - Perfect mobile legibility (font size >= 48px)
> - Use interpolateColors for diagram node highlighting
> - Use spring() for icon movements
> - Include Zod schema with chapter timestamps

## Template D: Personalized Video at Scale (Lambda-Optimized)

> Use the remotion-video-pro skill. Build a ThankYou video template (1920x1080, 30fps, 10s) optimized for Lambda rendering.
> Props via Zod: customerName, productName, purchaseDate, brandColor.
> Scenes:
> 1. "Hello, {customerName}!" with spring entrance
> 2. Product name display with brand-colored underline animation
> 3. "Purchased on {purchaseDate}" + brand logo
> Requirements:
> - Every sub-component wrapped in React.memo()
> - All assets via staticFile()
> - No large JSON in defaultProps
> - Use prefetch() for remote brand assets
> - Use measureSpring() to calculate exact scene durations
> - Include remotion.config.ts with h264 codec
> - Provide GitHub Actions workflow for CI/CD render
