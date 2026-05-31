# 09 — Document Output

Report generation and document creation from video pipeline data
and A/B test results.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **docx** | Word documents (reports, proposals, contracts) |
| **pdf** | PDF generation (reports, posters, academic papers) |
| **ppt** / **pptx** | Presentations (pitch decks, campaign reviews) |
| **xlsx** | Spreadsheets (data analysis, financial reports) |
| **infographic-gen** | Infographics from data content |

## Remotion Integration

These skills are post-pipeline outputs. They generate human-readable reports
and deliverables from video production data and A/B test results.

### Data Flow

```
pipeline data (render metrics, A/B results, costs)
  → xlsx (spreadsheet: render costs, token usage)
  → pdf (report: campaign performance)
  → pptx (presentation: launch review)
  → docx (proposal: next campaign plan)
  → infographic-gen (visual: results summary)
```

### Integration Hooks

**xlsx → marketing-ab-testing:**
- Export A/B test results with chi-square calculations
- Monthly experiment velocity dashboard
- Cumulative lift tracking over time

**pdf → marketing-launch:**
- Campaign performance reports
- Video production cost analysis
- ROI calculations per video variant

**pptx → marketing-launch:**
- Launch review presentations
- Video variant comparison slides
- Quarterly pipeline retrospective

**infographic-gen → charts:**
- Visual summaries of test results for social sharing
- Pipeline throughput infographics for stakeholders
