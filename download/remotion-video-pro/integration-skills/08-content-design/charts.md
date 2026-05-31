---
name: charts
metadata:
  author: Z.AI
  version: "1.0"
description: >
  Professional chart and diagram creation skill. Covers all types of visual data
  representation and structural diagrams: data charts (bar, line, pie, scatter, heatmap, radar, candlestick, boxplot, histogram, area, waterfall, regression, distribution), structural diagrams (flowcharts, mind maps, tree diagrams, org charts, architecture diagrams, network graphs, ER diagrams, class diagrams, Gantt charts, swimlane diagrams, sequence diagrams), dashboards, KPI panels, and interactive visualizations. Applies when the user wants to create, generate, draw, plot, visualize, or improve any chart, graph, diagram, or dashboard.
remotion_stage: DESIGN
integration_type: visual_asset
pipeline_routes: [competitor-intel, ab-testing]
---

# Charts — Remotion Integration Guide

## Overview
Publication-ready data visualization for embedding as video frames within Remotion compositions. Generates charts that animate into view during video playback, visualize A/B test results, and illustrate competitor comparison data in dashboard-style video segments.

## Pipeline Role
Produces visual chart assets for the DESIGN stage. In competitor-intel, generates comparison charts showing market positioning, pricing, and feature differences. In ab-testing, creates statistical visualization frames showing variant performance, confidence intervals, and significance levels.

## Integration Pattern
Chart generation with frame-accurate animation data for Remotion:

```typescript
import { SkillBridge } from '../../webhook-service/src/lib/skill-bridge';

async function generateChartFrame(config: {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'radar';
  data: Record<string, unknown>;
  width: number;
  height: number;
  animateIn: boolean;
}) {
  const bridge = new SkillBridge();
  const chartImage = await bridge.generateChart(config.data, config.type);
  // chartImage.base64 is embedded as <Img> in Remotion scene
  return {
    assetId: `chart_${Date.now()}`,
    base64: chartImage.base64,
    width: config.width,
    height: config.height,
    // Animation config for Remotion spring transitions
    animation: config.animateIn
      ? { type: 'spring', from: { scale: 0.8, opacity: 0 }, to: { scale: 1, opacity: 1 } }
      : null,
  };
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `type` | string | Chart type: bar, line, pie, scatter, radar, etc. |
| Input | `data` | object | Structured chart data (labels, values, series) |
| Input | `palette` | string | Color scheme: business-cool, tech-cyan, morandi |
| Input | `size` | string | Dimensions: '1920x1080', '1080x1920' |
| Output | `base64` | string | PNG chart image encoded as base64 |
| Output | `assetId` | string | Unique identifier for Remotion composition reference |

## Route Participation

| Route | Stage | Role | Chart Types Used |
|-------|-------|------|-----------------|
| competitor-intel | DESIGN | Comparison visuals | Bar, radar, comparison tables |
| ab-testing | DESIGN | Statistical viz | Bar, line with CI bands, pie for conversion |

## Configuration
- **Palette**: Low-saturation professional palettes (never pure blue/green/red fills)
- **Anti-overlap**: Mandatory legend outside plot area, `constrained_layout=True`
- **Animation**: Spring-based scale-in for Remotion frame transitions
- **DPI**: 2x device scale for 300dpi print-equivalent quality in video

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"ab-testing","compositionId":"ABTestDashboard","metadata":{
    "charts":[{"type":"bar","data":{"variants":["A","B"],"conversions":[142,189]}}]
  }}'
```
Charts are rendered as PNG frames and embedded in the Remotion AB-test dashboard composition with spring-animated entrances.
