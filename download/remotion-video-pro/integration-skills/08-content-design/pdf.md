---
name: pdf
metadata:
  author: Z.AI
  version: "1.0"
description: Professional PDF toolkit with four production lines: (1) Report via ReportLab, (2) Creative via JSON Blueprint and Playwright, (3) Academic via LaTeX/Tectonic, (4) Process for manipulating existing PDFs. Auto-routes based on document type. Includes ATS/creative/academic resume sub-paths.
remotion_stage: DEPLOY
integration_type: document_output
pipeline_routes: [ab-testing]
---

# PDF — Remotion Integration Guide

## Overview
Professional PDF generation as the deploy-stage document output for video pipeline workflows. Produces pipeline performance reports, A/B test analysis documents, and campaign summary PDFs that complement rendered video deliverables with structured, shareable documentation.

## Pipeline Role
In the ab-testing route, generates comprehensive test reports including statistical significance analysis, variant performance data, confidence intervals, and deployment recommendations. Uses the Report production line for structured analytical documents with embedded charts and tables.

## Integration Pattern
PDF report generation from pipeline state after video render:

```typescript
async function generateABTestReport(testData: {
  testId: string;
  variants: Array<{ name: string; impressions: number; conversions: number }>;
  pValue: number;
  winner?: string;
  videoUrls: Record<string, string>;
}) {
  // Route to ReportLab brief for structured PDF
  const reportConfig = {
    brief: 'report',
    title: `A/B Test Report — ${testData.testId}`,
    sections: [
      { heading: 'Test Overview', type: 'text',
        content: `Test ID: ${testData.testId}` },
      { heading: 'Variant Performance', type: 'table',
        columns: ['Variant', 'Impressions', 'Conversions', 'CVR'],
        rows: testData.variants.map(v => [
          v.name, v.impressions, v.conversions,
          (v.conversions / v.impressions * 100).toFixed(2) + '%'
        ]),
      },
      { heading: 'Statistical Analysis', type: 'text',
        content: `p-value: ${testData.pValue}` },
      { heading: 'Video Links', type: 'links',
        items: Object.entries(testData.videoUrls) },
    ],
  };
  return reportConfig;
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `brief` | string | Production line: report, creative, academic, process |
| Input | `title` | string | Document title |
| Input | `sections` | object[] | Document sections with type-specific content |
| Input | `palette` | string | Color palette override |
| Output | `filePath` | string | Path to generated PDF |
| Output | `pageCount` | number | Total pages |
| Output | `fileSize` | number | File size in bytes |

## Route Participation

| Route | Stage | Role | Document Types |
|-------|-------|------|-----------------|
| ab-testing | DEPLOY | Test report | Statistical analysis with charts and tables |

## Configuration
- **Brief routing**: Auto-detects report/creative/academic/process based on content
- **ReportLab**: Structured documents with tables, charts, cover pages
- **Vector output**: `page.pdf()` for selectable text, not screenshot-based
- **Post-check**: poster_validate.py for HTML-based creative pipeline

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"ab-testing","compositionId":"AdVariantVideo","abTestId":"test_abc"}'
```
After video variants render and statistical tests complete, a PDF report is generated with full results for stakeholder distribution.
