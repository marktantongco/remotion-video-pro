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

---
Task ID: 2
Agent: Main Agent
Task: Deploy webhook service to Railway, wire Stripe webhook, implement all 3 suggestions

Work Log:
- Created Railway deployment configs: railway/api/railway.json (Next.js) and railway/worker/railway.json (BullMQ worker)
- Wrote railway/README.md with full deployment guide (setup, env vars, deploy, scaling)
- Built /api/stripe-webhook endpoint with Stripe signature verification (stripe.webhooks.constructEvent)
- Implemented prop extraction from Stripe checkout.session: customerName, email, productName, amount, currency, purchaseDate, brandColor, orderId + custom metadata fields
- Added version routing: VERSION_OVERRIDES map + X-Composition-Version header support in Stripe handler
- Added CompositionVersion model to Prisma schema (composition + version + isActive + description)
- Upgraded /api/render to support version resolution (auto-resolve latest active, explicit pin via "version" field)
- Added stripe dependency to package.json
- Built .github/workflows/ci.yml: 4 gates (typecheck, lint/secrets scan, build, validate-composition) + Railway deploy triggers on main
- Created test harness in starter project: tests/run-all.ts (runner), pattern-compliance.ts (14 checks), project-structure.ts (12 checks), frame-integrity.ts (frame rendering validation)
- Updated rule 11 (validation-pipeline.md) with test harness documentation
- Updated package.json scripts: test, test:patterns, test:structure, test:frames
- Repackaged: 43 files, 67KB

Stage Summary:
- Produced: /home/z/my-project/download/remotion-video-pro.zip (67KB, 43 files)
- New files: railway/api/railway.json, railway/worker/railway.json, railway/README.md, src/app/api/stripe-webhook/route.ts, .github/workflows/ci.yml, tests/run-all.ts, tests/pattern-compliance.ts, tests/project-structure.ts, tests/frame-integrity.ts
- Modified: package.json (+stripe), prisma/schema.prisma (+CompositionVersion model), src/app/api/render/route.ts (+version routing), rules/11-validation-pipeline.md (+test harness docs)
- All 3 suggestions implemented + Railway deployment + Stripe webhook wiring
