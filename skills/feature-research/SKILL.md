---
name: feature-research
version: 1.0.0
description: >
  Conducts deep research on features, technologies, and implementation
  approaches. Provides feasibility analysis, technology landscape mapping,
  competitive analysis, and build-vs-buy decision frameworks.
---

# Feature Research Skill

## Overview

This skill systematically investigates features, technologies, and
implementation approaches to produce actionable research reports. It
combines web research, documentation analysis, and structured evaluation
frameworks to help teams make informed technical decisions.

## Activation Triggers

- "Research how to implement X"
- "Is feature X feasible for our stack?"
- "Compare technology options for X"
- "What are competitors doing with X?"
- "Should we build, buy, or integrate X?"
- "What APIs are available for X?"

## Research Depth Levels

| Level | Scope | Time Budget | Output |
|-------|-------|-------------|--------|
| **Quick Scan** | High-level feasibility | 5-10 min | Go/No-Go summary |
| **Standard** | Full landscape review | 15-30 min | Detailed comparison report |
| **Deep Dive** | Exhaustive analysis with prototypes | 45-90 min | Production-ready recommendation |

Use the Quick Scan level when the question is a simple feasibility check
(e.g., "Can we do real-time collaboration with WebSockets?"). Escalate to
Standard or Deep Dive when the decision has significant architectural or
business impact.

## Core Capabilities

### 1. Feature Feasibility Analysis

Evaluate whether a feature is technically viable within the current
constraints. Consider:

- **Technical Viability**: Does the technology stack support it? Are there
  known limitations or browser/API constraints?
- **Effort Estimation**: Rough sizing using T-shirt sizes (S/M/L/XL) or
  story-point ranges. Break down into sub-tasks when possible.
- **Risk Assessment**: Identify technical risks (dependency stability,
  performance implications, security surface area) and rate them
  Low/Medium/High/Critical.
- **Prerequisite Detection**: What must exist before this feature can be
  built? (e.g., auth system, database migration, third-party account).

### 2. Technology Landscape Mapping

Survey and compare the available tools, frameworks, and services for a
given capability. Produce a structured comparison covering:

- Maturity and community adoption (GitHub stars, npm/pip downloads,
  Stack Overflow tags)
- Maintenance status (last release, open issues, commit frequency)
- License compatibility
- Integration effort with the current stack
- Performance characteristics (benchmarks where available)
- Security audit history

### 3. Competitive Analysis

Research how competitors and similar products implement comparable
features. Sources include public changelogs, teardown blog posts, demo
videos, App Store/Play Store descriptions, and open-source codebases.

Output a feature-parity matrix:

| Feature | Our Product | Competitor A | Competitor B | Competitor C |
|---------|-------------|--------------|--------------|--------------|
| Real-time sync | Planned | Yes | Partial | No |
| Offline mode | No | Yes | No | Yes |
| Export to PDF | Yes | Yes | Yes | Partial |

### 4. Implementation Strategy Research

Identify best practices, design patterns, and known pitfalls for the
feature in question. Cover:

- Recommended design patterns (e.g., CQRS for event-driven features,
  Strategy pattern for pluggable algorithms)
- Common anti-patterns to avoid
- Performance considerations (caching strategies, lazy loading,
  pagination)
- Accessibility requirements (WCAG guidelines)
- Internationalization needs

### 5. API and Integration Research

When a feature depends on external services, research:

- Available APIs and their documentation quality
- Authentication models (API keys, OAuth, JWT)
- Rate limits and pricing tiers (free, pro, enterprise)
- Data formats and webhook support
- SDK availability and language coverage
- SLAs and uptime guarantees
- Alternative providers if the primary choice becomes unavailable

## Decision Framework: Build vs. Buy vs. Integrate

Score each option across these dimensions (1-5 scale):

| Dimension | Build | Buy | Integrate |
|-----------|-------|-----|-----------|
| Time to value | | | |
| Customization | | | |
| Maintenance burden | | | |
| Vendor lock-in risk | | | |
| Total cost (1yr) | | | |
| Security control | | | |
| Team capability fit | | | |
| Scalability ceiling | | | |

**Decision rules:**
- If "Time to value" is critical and "Customization" is low: **Buy**
- If "Customization" is critical and team has bandwidth: **Build**
- If the capability is commodity and well-served by APIs: **Integrate**
- If total cost of ownership favors one path by >30%: favor that path

## Feature Research Report Template

```markdown
# Feature Research: [Feature Name]
**Date:** YYYY-MM-DD
**Researcher:** [Agent / Human]
**Depth Level:** Quick Scan | Standard | Deep Dive

## Executive Summary
[2-3 sentence recommendation with confidence level]

## Problem Statement
[What problem does this feature solve? For whom?]

## Feasibility Assessment
- Technical Viability: [Yes / Partial / No] — [rationale]
- Effort Estimate: [S/M/L/XL] — [key sub-tasks]
- Risk Level: [Low/Medium/High/Critical] — [top risks]

## Technology Landscape
[Comparison table or ranked list]

## Competitive Landscape
[Feature-parity matrix]

## Recommended Approach
[Build / Buy / Integrate — with justification]

## Open Questions
[Unresolved items requiring further investigation]

## Next Steps
[Action items with owners and deadlines]
```

## Output Quality Standards

- Every claim must be backed by at least one source (documentation URL,
  benchmark reference, or authoritative article).
- Clearly distinguish between facts (proven capabilities) and opinions
  (architectural preferences).
- When uncertain, state the uncertainty explicitly and suggest how to
  resolve it.
- Provide actionable next steps at the end of every report.
