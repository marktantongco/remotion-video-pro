---
name: code-research
version: 1.0.0
description: >
  Searches for, analyzes, and references code patterns and solutions.
  Covers library evaluation, code archaeology, solution validation, and
  structured code search strategies.
---

# Code Research Skill

## Overview

This skill helps developers find, evaluate, and validate code solutions
for specific problems. It combines web search, documentation lookup,
and structured analysis to produce trustworthy, well-referenced results
that go beyond copy-paste answers.

## Activation Triggers

- "How do I implement X in [language/framework]?"
- "Find the best library for X"
- "What's the current best practice for X?"
- "Help me understand this legacy code"
- "Validate this solution against edge cases"
- "Compare these npm/pip packages for X"

## Code Source Credibility Tiers

Always prefer higher-tier sources. When lower-tier sources are used,
cross-reference with a higher tier before recommending.

| Tier | Source | Trust Level | Notes |
|------|--------|-------------|-------|
| **1** | Official documentation | Highest | Canonical source of truth |
| **2** | Official GitHub repo (tests, examples) | Very High | Shows intended usage patterns |
| **3** | Stack Overflow (high-vote answers) | High | Peer-reviewed community knowledge |
| **4** | Authoritative blogs (framework core team) | High | Often includes rationale and context |
| **5** | General blog posts / Medium articles | Medium | May be outdated or contain errors |
| **6** | AI-generated content / forums | Low | Must be validated against Tier 1-3 |

**Rule**: Never recommend a solution based solely on a Tier 5 or 6 source
without confirming it against documentation or official examples.

## Core Capabilities

### 1. Code Pattern Discovery

Find established implementation patterns for specific problems. The
research process:

1. **Identify the problem domain** — What category does this fall into?
   (state management, data transformation, auth, etc.)
2. **Search for canonical patterns** — Check official docs and
   well-maintained examples first.
3. **Cross-reference multiple sources** — Do at least 2 independent
   sources agree on the approach?
4. **Check for framework-specific idioms** — The "right" way in React
   may differ from Vue or Svelte.
5. **Verify recency** — Patterns can become outdated (e.g., class
   components in React).

**Output format:** Provide the pattern name, a concise code example,
a brief explanation of why it works, and links to sources.

### 2. Library and Package Research

When evaluating libraries or packages, use the checklist below:

#### Package Evaluation Checklist

- [ ] **Active maintenance**: Last release within 6 months
- [ ] **Community size**: Reasonable download count and GitHub stars
- [ ] **Open issues**: Not accumulating critical unresolved bugs
- [ ] **Test coverage**: Tests exist and pass (check CI badge)
- [ ] **TypeScript support**: If applicable, types are maintained
- [ ] **Bundle size**: Checked via bundlephobia.com or pkg-size.dev
- [ ] **License**: Compatible with project license
- [ ] **Security**: No known critical vulnerabilities (check Snyk/Dependabot)
- [ ] **Dependencies**: Minimal, well-maintained transitive deps
- [ ] **API stability**: No frequent breaking changes in changelog
- [ ] **Documentation quality**: Clear README, API docs, examples
- [ ] **Fork vs. original**: If a fork, why was it forked? Is it merged back?

**Comparison output:** A ranked table with scores for each criterion and
a final recommendation with justification.

### 3. Code Archaeology

When analyzing existing codebases (especially legacy ones), follow this
structured approach:

1. **Entry point mapping** — Trace from the application entry point
   (main, index, app) to understand initialization flow.
2. **Dependency graph** — Identify all internal and external dependencies.
   Use tools like `madge`, `depcruise`, or `pydeps` when available.
3. **Data flow tracing** — Follow a representative request from input
   to output, documenting each transformation step.
4. **Pattern cataloging** — Identify the architectural patterns in use
   (MVC, event-driven, microservices, monolith, etc.).
5. **Dead code detection** — Flag unused exports, unreachable code paths,
   and deprecated API calls.
6. **Coupling analysis** — Identify tight coupling between modules and
   suggest decoupling strategies.

**Output:** An annotated codebase map with module responsibilities,
data flow diagrams (text-based), and a risk assessment for modifications.

### 4. Solution Validation

Before recommending any code solution, validate it against:

- **Happy path**: Does the solution work for the primary use case?
- **Edge cases**: Empty inputs, null values, very large inputs, Unicode
  characters, concurrent access.
- **Error handling**: What happens when dependencies fail? Network errors?
  Timeout scenarios?
- **Security**: SQL injection, XSS, CSRF, path traversal, SSRF — does the
  solution introduce any of these?
- **Performance**: What is the time and space complexity? Does it degrade
  gracefully under load?
- **Compatibility**: Which browser versions / Node versions / Python
  versions does it support?

### 5. Code Review Research

Find best practices for specific review scenarios:

- Pull request review checklists for specific change types (DB migrations,
  API changes, auth modifications)
- Static analysis tools appropriate for the language/framework
- Testing strategies (unit, integration, e2e) for the code in question
- Refactoring patterns (extract method, introduce parameter object, etc.)

## Code Research Workflow Diagram

```
┌─────────────┐
│  Problem    │
│  Statement  │
└──────┬──────┘
       ▼
┌─────────────┐     ┌──────────────────┐
│  Classify   │────▶│  Domain: Auth    │
│  Domain     │     │  DB  | API | UI  │
└──────┬──────┘     └──────────────────┘
       ▼
┌─────────────┐
│  Search     │
│  Sources    │◀──── Tier 1-3 priority
└──────┬──────┘
       ▼
┌─────────────┐     ┌──────────────────┐
│  Evaluate   │────▶│  Cross-reference  │
│  Solutions  │     │  Validate        │
└──────┬──────┘     └──────────────────┘
       ▼
┌─────────────┐
│  Validate   │
│  Edge Cases │
└──────┬──────┘
       ▼
┌─────────────┐
│  Produce    │
│  Report     │
└─────────────┘
```

## Code Search Strategy Table

| Scenario | Primary Search Target | Secondary | Tools |
|----------|----------------------|-----------|-------|
| Official API usage | Docs site (readthedocs, devdocs) | GitHub examples | `ripgrep`, web search |
| Bug / error message | GitHub Issues, SO | Docs changelog | Error text as query |
| Package comparison | npmjs / PyPI / crates.io | Bundlephobia, Snyk | Registry metadata |
| Design pattern | Refactoring.Guru, docs | SO high-vote | Pattern name + language |
| Performance optimization | Benchmark blogs, docs | GitHub perf tests | `perf`, flamegraphs |
| Security best practice | OWASP, CVE database | Framework security guide | Security advisories |
| Migration / upgrade | Migration guides, changelogs | GitHub PRs, SO | Version diff tools |

## Output Quality Standards

- Always include source links for every recommendation.
- Clearly mark code examples with their language and minimum version
  requirements.
- When multiple solutions exist, present at least 2 options with trade-off
  analysis.
- Flag any solution that has known limitations or deprecation risks.
- State the confidence level: **High** (well-tested, widely used),
  **Medium** (works but limited validation), **Low** (theoretical or
  untested).
