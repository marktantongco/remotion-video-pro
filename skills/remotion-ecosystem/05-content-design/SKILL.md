# 05 — Content Design

Visual asset creation, data visualization, and motion design systems
that provide the visual layer for Remotion video compositions.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **charts** | Data visualizations (matplotlib, ECharts, D3.js, Playwright+CSS) |
| **image-generation** | AI image creation (z-ai-web-dev-sdk) |
| **image-edit** | AI image editing and manipulation |
| **ui-ux-pro-max** | Design system, UI reasoning, layout, typography, color |
| **anthropic-frontend-design** | Distinctive, non-generic interface design |
| **web-shader-extractor** | WebGL/Canvas shader extraction from reference sites |

## Remotion Integration

These skills operate at Stage 3 (DESIGN). They create visual assets
and design systems that become `<Img>`, `<OffthreadVideo>`, and styled
components in Remotion compositions.

### Data Flow

```
design brief (from 04-ai-intelligence)
  → ui-ux-pro-max (design system: colors, type, spacing)
  → image-generation (hero images, product shots)
  → charts (data visualizations as static/SVG assets)
  → web-shader-extractor (motion effects from references)
  → assets ready for remotion-video-pro composition
```

### Integration Hooks

**ui-ux-pro-max → remotion-video-pro:**
```typescript
// Design system feeds Remotion theme
const designSystem = await uiUxProMax.generateSystem({
  brand: productData.brand,
  audience: audienceSegment,
  platform: 'tiktok', // 9:16 vertical
});

// Maps directly to Remotion composition constants
const composition = {
  colors: designSystem.palette,
  fonts: designSystem.typography,
  spacing: designSystem.spacing,
  borderRadius: designSystem.borderRadius,
  // Used in <AbsoluteFill style={{ background: colors.primary }}>
};
```

**charts → remotion-video-pro:**
- Chart output (PNG/SVG) becomes `<Img src={chartUrl}>` in Remotion
- Animated charts use ECharts → `<Series>` with frame-based data reveal
- Data visualization timing synced to narration via `useCurrentFrame()`

**image-generation → remotion-video-pro:**
- `z-ai-generate` CLI produces hero images for video backgrounds
- Generated assets stored in S3, referenced as `<Img src={assetUrl}>`
- Multiple variants for A/B testing video thumbnails

**web-shader-extractor → remotion-video-pro:**
- Extracted WebGL effects ported as Remotion `<Canvas>` overlays
- Shader uniforms driven by `useCurrentFrame()` for frame-accurate animation
- Background effects from reference sites become video ambient layers

## Asset Pipeline

```
1. Generate assets (image-generation, charts)
2. Upload to S3 (aws-agents-deploy)
3. Reference URLs in Remotion inputProps
4. Lazy-load via delayRender/continueRender
5. Cache for batch renders
```
