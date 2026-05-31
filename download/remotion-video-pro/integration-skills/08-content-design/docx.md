---
name: docx
metadata:
  author: Z.AI
  version: "1.0"
description: "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When GLM needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"
remotion_stage: DEPLOY
integration_type: document_output
pipeline_routes: [competitor-intel, ab-testing]
---

# Docx — Remotion Integration Guide

## Overview
Professional Word document generation as a deploy-stage output for video production pipelines. Produces A/B test reports, competitor analysis documents, and campaign briefs that accompany rendered videos as downloadable deliverables in marketing workflows.

## Pipeline Role
In the competitor-intel route, generates structured competitor analysis reports with embedded charts and screenshots. In ab-testing, produces statistical analysis documents with test results, confidence intervals, and winning variant recommendations. These documents serve as the written companion to video deliverables.

## Integration Pattern
Document generation triggered after video rendering completes:

```typescript
import { SkillBridge } from '../../webhook-service/src/lib/skill-bridge';

async function generatePipelineReport(pipelineResult: {
  route: string;
  stages: Array<{ stage: string; output: Record<string, unknown> }>;
  videoUrl: string;
}) {
  const bridge = new SkillBridge();

  // Extract key data from pipeline stages
  const thinkOutput = pipelineResult.stages
    .find(s => s.stage === 'think')?.output;
  const testOutput = pipelineResult.stages
    .find(s => s.stage === 'test')?.output;

  await bridge.invoke({
    skill: 'docx',
    action: 'create-report',
    params: {
      title: `${pipelineResult.route} Pipeline Report`,
      sections: [
        { heading: 'Executive Summary', content: thinkOutput?.analysis },
        { heading: 'Video Deliverable', link: pipelineResult.videoUrl },
        { heading: 'Test Results', data: testOutput },
      ],
      coverRecipe: 'R3', // Corporate cover from design-system.md
    },
  });
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `title` | string | Document title |
| Input | `sections` | object[] | Structured sections with heading + content |
| Input | `coverRecipe` | string | Cover template ID (R1-R7) |
| Input | `charts` | object[] | Embedded chart image references |
| Output | `filePath` | string | Path to generated .docx file |
| Output | `pageCount` | number | Total document pages |

## Route Participation

| Route | Stage | Role | Document Types |
|-------|-------|------|-----------------|
| competitor-intel | DEPLOY | Analysis report | Competitor analysis with charts |
| ab-testing | DEPLOY | Test report | A/B test results and recommendations |

## Configuration
- **Cover recipes**: R1-R7 validated templates from design-system.md
- **Line spacing**: 1.3x default, scene-specific overrides
- **Charts**: matplotlib PNG embedded via Image() flowable
- **Post-check**: Automated validation via postcheck.py

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"ab-testing","compositionId":"AdVariantVideo","abTestId":"test_abc"}'
```
After rendering video variants and running statistical analysis, a Word document report is generated with full test results.
