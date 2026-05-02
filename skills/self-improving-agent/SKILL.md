---
name: self-improving-agent
version: 1.0.0
description: Structured learning and error logging system for agents that get better over time. Use when implementing continuous improvement loops, error correction, or agent learning systems. Covers LRN/ERR/FEAT entry format, .learnings directory management, priority/status tracking, metadata tagging, and promotion workflow to integrate learnings into CLAUDE.md/AGENTS.md. Enables agents to detect failure patterns and autonomously promote fixes.
source: https://lobehub.com/skills/openclaw-skills-self-improving-agent-1-0-0 (4.86/5 rating)
changelog: Initial release — structured agent learning system
---

# Self-Improving Agent

Structured learning and error logging system that enables agents to continuously improve through experience.

## Learning Entry Format

### LRN (Learnings)
New knowledge gained during operation:
```
LRN [PRIORITY:HIGH|MEDIUM|LOW] [STATUS:ACTIVE|PROMOTED|ARCHIVED]
Context: What situation triggered this learning
Observation: What was discovered
Application: How to apply this going forward
Tags: [category, domain, pattern]
```

### ERR (Errors)
Mistakes and failures with corrective actions:
```
ERR [PRIORITY:HIGH|MEDIUM|LOW] [STATUS:OPEN|FIXED|PROMOTED]
Context: What was being attempted
Root Cause: Why it failed
Fix: What corrects this
Prevention: How to avoid recurrence
Tags: [error-type, domain, severity]
```

### FEAT (Feature Requests)
Improvements identified during operation:
```
FEAT [PRIORITY:HIGH|MEDIUM|LOW] [STATUS:PROPOSED|IMPLEMENTED|PROMOTED]
Motivation: Why this would help
Description: What it should do
Implementation: How to build it
Tags: [feature-type, domain, effort]
```

## Directory Structure

```
.learnings/
  ├── entries/
  │   ├── 2026-05-12-lrn-react-hydration.md
  │   ├── 2026-05-12-err-ssr-random-values.md
  │   └── 2026-05-12-feat-auto-dedup.md
  ├── index.md          # Searchable index of all entries
  └── promoted/         # Learnings promoted to system prompts
```

## Priority Tracking

| Priority | Response Time | Promotion Threshold |
|----------|-------------|-------------------|
| HIGH | Immediate fix needed | After 1 confirmed occurrence |
| MEDIUM | Fix in next session | After 2 confirmed occurrences |
| LOW | Fix when convenient | After 3+ confirmed occurrences |

## Detection Triggers

The agent should create learning entries when:
- A task fails or produces incorrect output
- A user corrects the agent's approach
- A pattern is noticed across multiple interactions
- A workaround is discovered for a recurring issue
- A better approach is found than what was originally used

## Promotion Workflow

1. **Detect** — Error or learning pattern identified
2. **Log** — Create LRN/ERR/FEAT entry in `.learnings/entries/`
3. **Verify** — Confirm the learning is valid (not a one-off)
4. **Promote** — Integrate into AGENTS.md or relevant SKILL.md
5. **Archive** — Move original entry to `.learnings/promoted/`

## Activation Triggers
- Building agent systems that learn from experience
- Implementing error correction loops
- Creating agent memory that improves over time
- Designing continuous improvement workflows for AI agents
