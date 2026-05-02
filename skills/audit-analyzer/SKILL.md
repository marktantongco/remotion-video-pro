---
name: audit-analyzer
version: 1.0.0
description: Comprehensive system auditing and analysis for AI agent skill ecosystems, including coverage analysis, performance profiling, dependency mapping, and bottleneck detection.
---

# Audit Analyzer

## Overview

Audit Analyzer provides a systematic framework for auditing AI agent skill systems. It identifies gaps, redundancies, performance bottlenecks, dependency issues, and architectural concerns — delivering actionable reports with prioritized recommendations.

## Skill System Auditing

### Coverage Analysis

Coverage analysis maps the full capability space against installed skills to identify gaps:

```yaml
coverage_audit:
  total_capability_areas: 42
  covered_by_skills: 38
  gap_areas: 4
  coverage_percentage: 90.5%
  gaps:
    - area: "database_migration"
      severity: medium
      workaround: "general-purpose coding skill handles basic cases"
      recommendation: "Create dedicated database migration skill"
    - area: "accessibility_testing"
      severity: high
      workaround: "none"
      recommendation: "Create accessibility testing skill before next release"
```

### Redundancy Detection

Identifies overlapping skills that could be merged or should be differentiated:

```yaml
redundancy_report:
  redundant_pairs:
    - skill_a: "code-formatter"
      skill_b: "style-enforcer"
      overlap_percentage: 78
      recommendation: "merge into single 'code-quality' skill with modes"
    - skill_a: "web-search-basic"
      skill_b: "web-search-advanced"
      overlap_percentage: 95
      recommendation: "deprecate basic version; advanced covers all cases"
```

### Gap Identification Framework

| Gap Category | Detection Method | Severity Criteria |
|--------------|-----------------|-------------------|
| Missing capability | Task request fails with no matching skill | High if requested > 3x/week |
| Partial coverage | Skill handles task but incompletely | Medium if workaround exists |
| Outdated coverage | Skill exists but doesn't handle modern cases | Medium if newer patterns emerged |
| Fragmented coverage | Capability spread across 3+ skills | Low unless causing user confusion |

## Performance Profiling

### EXPLAIN ANALYZE Output Format

Performance profiling produces EXPLAIN ANALYZE-style output for skill execution chains:

```
AUDIT ANALYZE Task: "Generate and deploy a React component with tests"

┌─────────────────────────────────────────────────────────────────────┐
│ Skill Execution Plan                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ → Seq Scan on skill:file-reader (cost: 0.00..1.20 rows: 5)         │
│   Actual: time=12ms, rows=5, cache_hit=true                        │
│                                                                     │
│ → Nested Loop on skill:component-generator                          │
│   ├── Init: skill:template-engine (time=45ms)                      │
│   ├── Init: skill:code-formatter (time=8ms)                        │
│   └── Execute: generate_component() (time=2,340ms)                  │
│       Actual: total=2,393ms, output_tokens=1,247                    │
│       Memory peak: 89MB                                             │
│                                                                     │
│ → Parallel Scan on skill:test-generator                             │
│   ├── Worker 1: unit_tests (time=1,890ms, tests=12)                │
│   ├── Worker 2: integration_tests (time=3,210ms, tests=4)          │
│   └── Gather (time=15ms)                                           │
│       Actual: total=3,225ms, longest_worker=3,210ms                │
│                                                                     │
│ → Index Scan on skill:deploy-manager (time=4,500ms)                 │
│   Actual: time=4,500ms, network_io=3,200ms                          │
│   Bottleneck: network latency (71% of execution time)               │
│                                                                     │
│ Planning time: 23ms                                                 │
│ Execution time: 10,130ms                                            │
│ Total tokens consumed: 8,432                                        │
│ Cache hit rate: 67%                                                 │
│                                                                     │
│ ⚠ Hot path: skill:test-generator Worker 2 (31.7% of total time)    │
│ ⚠ Cold start detected: skill:deploy-manager (first invocation)     │
└─────────────────────────────────────────────────────────────────────┘
```

### Profiling Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| Skill init time | Time to load and initialize a skill | < 100ms | > 500ms |
| Execution time | Time for skill to complete its task | Varies | > 2x median |
| Token consumption | Tokens used per skill invocation | < 2000 | > 5000 |
| Cache hit rate | Percentage of skill loads served from cache | > 80% | < 50% |
| Memory peak | Maximum memory used during skill execution | < 100MB | > 500MB |
| Retry rate | Percentage of skill calls requiring retries | < 5% | > 15% |
| Cold start frequency | Percentage of invocations that are cold starts | < 10% | > 30% |

## Dependency Analysis

### Skill Interdependency Mapping

```yaml
dependency_graph:
  skill:web-app-generator:
    depends_on:
      - skill:component-generator (required)
      - skill:code-formatter (required)
      - skill:test-generator (optional)
      - skill:deploy-manager (optional)
    depended_on_by:
      - skill:fullstack-scaffold (required)
    depth: 2
    fan_out: 4
    fan_in: 1
```

### Coexistence Mapping

| Skill Pair | Conflict Type | Impact | Resolution |
|------------|---------------|--------|------------|
| formatter-a + formatter-b | Output conflict | High — conflicting formatting | Mark as mutually exclusive |
| search-basic + search-advanced | Redundancy | Low — wasted tokens | Deprecate basic |
| auth-jwt + auth-session | Overlap | Medium — unclear routing | Add routing priority |
| test-unit + test-e2e | Complementary | None — synergistic | No action needed |

### Dependency Health Checks

- **Orphan skills**: No other skill depends on them and they depend on nothing (evaluate for removal)
- **Hub skills**: Depended on by 5+ skills (critical — changes have wide impact)
- **Circular dependencies**: Skill A depends on B which depends on A (must be broken)
- **Deep chains**: Dependency chains longer than 4 levels (flatten or consolidate)

## Version Drift Detection

### Drift Analysis

```yaml
drift_report:
  generated_at: 2024-03-15T10:00:00Z
  skills_analyzed: 24
  drift_detected: 3
  details:
    - skill: "api-client"
      installed_version: "1.2.0"
      latest_version: "2.1.0"
      drift_severity: high
      breaking_changes: true
      incompatible_with: ["api-v2-wrapper", "oauth-handler"]
      recommendation: "Upgrade after updating dependent skills"
    - skill: "data-parser"
      installed_version: "3.0.0"
      latest_version: "3.0.2"
      drift_severity: low
      breaking_changes: false
      patches: ["fix: handle null values in CSV parsing"]
      recommendation: "Safe to upgrade immediately"
```

### Version Compatibility Matrix

| Drift Level | Installed | Latest | Action | Urgency |
|-------------|-----------|--------|--------|---------|
| Patch drift | X.Y.Z | X.Y.Z+n | Upgrade (safe) | Low |
| Minor drift | X.Y.Z | X.(Y+n).Z | Review changelog, upgrade | Medium |
| Major drift | X.Y.Z | (X+n).Y.Z | Full compatibility audit required | High |
| EOL | X.Y.Z | N/A (unmaintained) | Find replacement or fork | Critical |

## Architecture Analysis

### Layer Inspection

```
┌──────────────────────────────────────────┐
│            Presentation Layer             │
│  Skills: ui-generator, chart-builder      │
│  Health: ✅ Coverage complete             │
│  Complexity: Low                          │
├──────────────────────────────────────────┤
│             Logic Layer                   │
│  Skills: code-gen, data-transform, search │
│  Health: ⚠ Missing error-recovery skill  │
│  Complexity: Medium                       │
├──────────────────────────────────────────┤
│            Data Layer                     │
│  Skills: db-query, cache-manager, storage │
│  Health: ✅ Coverage complete             │
│  Complexity: Medium                       │
├──────────────────────────────────────────┤
│          Infrastructure Layer             │
│  Skills: deploy, monitor, config-manager  │
│  Health: ❌ Missing logging skill         │
│  Complexity: High (3 cross-cutting deps)  │
└──────────────────────────────────────────┘
```

### Complexity Metrics

| Metric | Formula | Target | Current |
|--------|---------|--------|---------|
| Skill Count | Total installed skills | - | 24 |
| Dependency Depth | Max depth in dependency graph | ≤ 3 | 4 ⚠ |
| Fan-Out | Max skills depended on by one skill | ≤ 5 | 7 ⚠ |
| Coupling Score | Avg dependencies per skill | ≤ 2 | 1.8 ✅ |
| Cohesion Score | Skills with single clear purpose / total | ≥ 0.8 | 0.75 ⚠ |
| Routing Efficiency | Direct skill matches / total skill invocations | ≥ 0.9 | 0.85 ⚠ |

## Hidden Factor Identification

### Implicit Dependencies

Hidden dependencies that are not declared but affect behavior:

| Hidden Factor | Detection Method | Risk | Mitigation |
|---------------|-----------------|------|------------|
| Shared file system state | Skills write to same paths | Medium | Enforce namespace isolation |
| Token budget competition | Multiple skills reduce per-skill budget | High | Implement token reservation |
| Global configuration | Skills read shared config that changes | Medium | Snapshot config per invocation |
| Execution order sensitivity | Skills assume specific call order | High | Declare order dependencies explicitly |
| Side effects between skills | One skill's output affects another's input | Medium | Document all side effects |

### Silent Failure Detection

```yaml
silent_failure_scan:
  patterns_detected:
    - pattern: "skill returns success but produces no output"
      affected_skills: ["data-validator", "sanity-checker"]
      risk: medium
      recommendation: "Add output validation to detect empty results"
    - pattern: "skill catches all exceptions without logging"
      affected_skills: ["error-handler", "retry-manager"]
      risk: high
      recommendation: "Add structured logging for all caught exceptions"
    - pattern: "skill uses default values when input is invalid"
      affected_skills: ["config-loader", "parameter-parser"]
      risk: medium
      recommendation: "Fail explicitly on invalid input instead of defaulting"
```

### Edge Case Identification

- **Empty input**: What does each skill do when given empty or null input?
- **Oversized input**: Does the skill degrade gracefully with very large inputs?
- **Concurrent access**: Are skills safe when invoked simultaneously on shared state?
- **Partial failure**: If a multi-step skill fails mid-execution, is state left consistent?
- **Timeout handling**: Do skills have and respect timeout constraints?

## Audit Report Template

```markdown
# System Audit Report

**Date**: YYYY-MM-DD
**Auditor**: audit-analyzer v1.0.0
**Scope**: Full system audit

## Executive Summary
[2-3 sentence overview of system health]

## Coverage Analysis
- Total capability areas: N
- Coverage: X% (N covered / N total)
- Critical gaps: [list]

## Performance Profile
- Average skill execution time: Nms
- Slowest skill: skill-name (Nms)
- Total token consumption per task: N
- Cache hit rate: N%

## Dependency Health
- Circular dependencies: N (list if any)
- Max dependency depth: N
- Hub skills (high impact): [list]
- Orphan skills (candidates for removal): [list]

## Version Drift
- Skills behind latest: N
- Skills with breaking changes available: N
- End-of-life skills: N

## Architecture Assessment
- Layer health: [per-layer status]
- Complexity score: N/10
- Coupling score: N/10

## Hidden Factors
- Implicit dependencies found: N
- Silent failure patterns: N
- Edge cases unhandled: N

## Recommendations (Prioritized)
1. [P0] Critical: Action item
2. [P1] High: Action item
3. [P2] Medium: Action item
4. [P3] Low: Action item
```

## Audit Severity Levels

| Severity | Label | Description | Recommended Action | Timeline |
|----------|-------|-------------|-------------------|----------|
| 0 | Info | Observation, no action needed | Document and monitor | N/A |
| 1 | Low | Minor improvement opportunity | Schedule for next maintenance | 30 days |
| 2 | Medium | Potential issue with workaround | Plan fix, implement workaround | 14 days |
| 3 | High | Active issue affecting performance | Investigate and fix | 7 days |
| 4 | Critical | System failure or data risk | Immediate remediation required | 24 hours |
| 5 | Emergency | Security vulnerability or data loss | Drop everything, fix now | Immediate |

## Bottleneck Classification Taxonomy

### Category 1: Execution Bottlenecks
- **Slow skill initialization**: Excessive loading time on first invocation
- **Synchronous blocking**: Skills waiting on external resources without async
- **Repeated computation**: Same expensive calculation performed multiple times

### Category 2: Resource Bottlenecks
- **Token exhaustion**: Context window filled before task completion
- **Memory pressure**: Skills consuming excessive RAM during execution
- **I/O saturation**: Too many concurrent file or network operations

### Category 3: Dependency Bottlenecks
- **Serial dependency chains**: Tasks that could be parallel but run sequentially
- **Version incompatibility**: Skills failing due to mismatched dependency versions
- **Missing dependency**: Skills failing or degrading without required peer

### Category 4: Routing Bottlenecks
- **Ambiguous routing**: Multiple skills matching the same intent
- **Failed routing**: Intent not matching any skill, triggering fallback
- **Misrouting**: Task routed to wrong skill, requiring re-routing

### Category 5: Output Bottlenecks
- **Format conversion**: Excessive time spent converting between output formats
- **Validation overhead: Output validation taking longer than generation
- **Compression needed**: Output exceeding size limits requiring re-processing

## Integration Points

- **Skill Registry**: Source of truth for installed skills and versions
- **Execution Engine**: Provides performance telemetry for profiling
- **Dependency Resolver**: Supplies dependency graph data
- **Task Router**: Provides routing logs for bottleneck analysis
