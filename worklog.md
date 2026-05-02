---
Task ID: 1
Agent: Main Agent
Task: Audit all 4 uploaded ZIPs, identify gaps, build unified remotion-video-pro skill

Work Log:
- Extracted and read all 28 files across 4 ZIP archives (remotion-project-fixed, remotion-core, remotion-design, lambda-webhook-service)
- Identified 7 critical gaps: split skills referencing non-existent unified name, .ts/.js validator mismatch in lint-staged, no batch endpoint, no data-driven-video rule, no CI validation rule, missing TransitionSeries in project, undocumented setTimeout polling
- Designed unified skill architecture with 11 rules, conditional loading, and decision tree
- Built SKILL.md with frontmatter, conditional_load rules, quick reference table, and golden rules
- Wrote 11 rule files covering full Remotion lifecycle
- Created starter project template with 3 scenes (Hook, Content, CTA) using TransitionSeries
- Fixed validator script (proper .ts extension, added delayRender/continueRender check, namespace import check)
- Built enhanced webhook service with /api/batch endpoint (cost guards, priority queues, dedup, callbacks, 10k record limit)
- Packaged 34-file artifact as 52KB ZIP

Stage Summary:
- Produced: /home/z/my-project/download/remotion-video-pro.zip
- 11 rules, 1 starter project, 1 webhook service, 1 validation script
- All 3 original suggestions implemented: CI validation, merge recommendation, batch endpoint
