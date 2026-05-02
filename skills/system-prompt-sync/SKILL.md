---
name: system-prompt-sync
version: 1.0.0
description: System prompt versioning, synchronization, testing, and optimization for AI agents, ensuring consistent behavior and continuous prompt improvement.
---

# System Prompt Sync

## Overview

System Prompt Sync provides a complete workflow for managing the lifecycle of system prompts across AI agents. It ensures prompts are versioned, synchronized, tested, and optimized — preventing drift and inconsistencies that lead to unpredictable agent behavior.

## System Prompt Versioning

All system prompts follow semantic versioning adapted for prompt content:

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE]

MAJOR    — Breaking behavioral changes (new core instructions, removed capabilities)
MINOR    — Non-breaking additions (new guidelines, expanded sections, new modes)
PATCH    — Bug fixes and clarifications (typos, ambiguous wording, edge cases)
PRERELEASE —rc.1, -beta.2, -alpha.3 (pre-release versions for testing)
```

### Version Rules

1. **MAJOR** bump when removing or fundamentally altering core directives
2. **MINOR** bump when adding new sections, modes, or conditional logic
3. **PATCH** bump when fixing unclear instructions without changing behavior
4. Pre-release versions must not be used in production environments
5. All versions must include a corresponding changelog entry

## Prompt Diff and Changelog Generation

### Diff Format

Each version change produces a structured diff showing exactly what changed:

```markdown
## [2.1.0] - 2024-03-15

### Added
- New "error handling" directive under Task Execution section
- Conditional mode switching for code review vs. code generation

### Changed
- Revised output format specification from JSON to Markdown tables
- Updated token budget allocation (thinking: 2000 → 3000 tokens)

### Removed
- Deprecated "always ask for clarification" directive (replaced by confidence scoring)

### Behavior Impact
- Agents will now produce Markdown tables instead of JSON for structured output
- Code review mode is now available via mode-switching directive
- Error handling is more explicit, reducing retry loops
```

### Changelog Template

```markdown
# System Prompt Changelog

All notable changes to the system prompt are documented here.

## [Unreleased]

## [2.1.0] - 2024-03-15
### Changed
- ...

## [2.0.1] - 2024-03-01
### Fixed
- ...
```

## Cross-Agent Prompt Synchronization

### Synchronization Model

When multiple agents share a base prompt or related prompts, synchronization ensures behavioral consistency:

| Sync Level | Description | Mechanism |
|------------|-------------|-----------|
| Full Sync | Identical prompts across all agents | Shared prompt file, symlinked |
| Base + Override | Shared core with agent-specific extensions | Template inheritance |
| Contract Sync | Different prompts but guaranteed interface compatibility | Interface contract validation |
| Independent | No synchronization needed | No action required |

### Synchronization Checklist

- [ ] Identify all agents using the prompt or its derivatives
- [ ] Determine appropriate sync level for each agent
- [ ] Apply changes to the base prompt template
- [ ] Propagate changes to all synced agents
- [ ] Run regression tests on all affected agents
- [ ] Verify no behavioral regressions in edge cases
- [ ] Update version numbers and changelogs consistently
- [ ] Notify all downstream consumers of the change

### Conflict Resolution Strategies

When two prompt modifications conflict:

1. **Last Write Wins**: Most recent change takes precedence (use for minor patches)
2. **Merge with Annotations**: Both changes included with conditional logic and comments
3. **Explicit Override File**: Conflicting section extracted to an override file per agent
4. **Escalation to Owner**: Flag conflict for human review and manual resolution
5. **Feature Branch**: Create parallel prompt versions and A/B test to decide

## Prompt Template Management

### Template Variables

```markdown
# Variable Syntax: {{variable_name}}
# Conditional: {{#if condition}} ... {{/if}}
# Mode Switch: {{mode:review}} ... {{/mode:review}}

## Available Variables
{{agent_role}}              — The agent's designated role
{{context_window}}          — Available context size in tokens
{{supported_tools}}         — List of tools available to the agent
{{output_format}}           — Expected output format
{{language}}                — Primary language for responses
{{verbosity_level}}         — Amount of detail in responses (minimal/normal/detailed)
```

### Conditional Sections

```markdown
{{#if mode == "code_review"}}
- Focus on correctness, performance, and security
- Provide line-by-line annotations
- Rate severity of issues (critical/warning/info)
{{/if}}

{{#if mode == "code_generation"}}
- Prioritize working, tested code
- Include error handling and edge cases
- Follow project conventions from memory
{{/if}}
```

### Mode Switching

Modes allow a single prompt to adapt its behavior based on context:

| Mode | Trigger | Behavior Adjustments |
|------|---------|---------------------|
| default | No mode specified | Balanced general-purpose behavior |
| expert | Complex technical task | Increased depth, more citations, stricter reasoning |
| fast | Simple or urgent task | Concise responses, skip explanations |
| careful | High-stakes decision | Explicit reasoning chains, uncertainty quantification |
| creative | Content generation task | More varied output, less formulaic structure |

## Prompt Testing Framework

### A/B Testing Prompts

```yaml
test_suite:
  name: "output_format_experiment"
  prompt_a: "v2.0.0-markdown-tables"
  prompt_b: "v2.0.0-json-output"
  evaluation_criteria:
    - correctness: "Does the output contain the right data?"
    - parseability: "Can the output be reliably parsed?"
    - user_preference: "Which format do users prefer?"
  sample_size: 100
  statistical_threshold: 0.05
```

### Regression Detection

Regression tests ensure prompt changes do not degrade performance on known-good scenarios:

```markdown
## Regression Test Suite

### Test Case: basic_arithmetic
- Input: "What is 15% of 240?"
- Expected behavior: Correct answer (36) with brief explanation
- Min acceptable accuracy: 100% across 20 runs
- Tested versions: 1.0.0, 1.1.0, 1.2.0, 2.0.0

### Test Case: code_explanation
- Input: "Explain this function: [provided code]"
- Expected behavior: Accurate explanation with complexity analysis
- Min acceptable accuracy: 95% across 20 runs
- Tested versions: 1.0.0, 1.2.0, 2.0.0
```

### Prompt Testing Checklist

- [ ] Unit tests: Does each directive produce the expected behavior?
- [ ] Integration tests: Do multiple directives interact correctly?
- [ ] Edge case tests: How does the prompt handle ambiguous or adversarial inputs?
- [ ] Regression tests: Does the new version match or exceed baseline performance?
- [ ] Token efficiency: Is the prompt using tokens effectively without waste?
- [ ] Instruction following: Does the agent follow all instructions in priority order?
- [ ] Format compliance: Does the output match the specified format?
- [ ] Safety boundary: Does the agent refuse inappropriate requests appropriately?
- [ ] Latency impact: Does the prompt change affect response time significantly?

## Prompt Optimization Based on Outcomes

### Success/Failure Tracking

Every task outcome is logged against the prompt version that produced it:

```yaml
outcome_log:
  timestamp: 2024-03-15T14:30:00Z
  prompt_version: "2.0.0"
  task_type: code_generation
  success: true
  quality_score: 8.5
  iterations_required: 1
  user_satisfaction: positive
  failure_modes: []  # if success: false, list failure categories
```

### Optimization Cycle

1. **Collect**: Gather outcome data over a sufficient sample period (≥ 50 tasks)
2. **Analyze**: Identify patterns in failures and successes per prompt section
3. **Hypothesize**: Form hypotheses about which prompt changes would improve outcomes
4. **Implement**: Create prompt variant with targeted changes
5. **Test**: A/B test against current production prompt
6. **Evaluate**: Compare metrics using statistical significance tests
7. **Ship**: Promote winning variant to production with version bump
8. **Monitor**: Continue tracking outcomes to catch regressions early

### Common Optimization Targets

| Problem | Symptom | Prompt Fix |
|---------|---------|------------|
| Over-verbosity | Responses too long, buried key info | Add explicit length constraints, "TL;DR first" directive |
| Under-specification | Ambiguous or incomplete outputs | Add format templates and output examples |
| Hallucination | Fabricated facts or references | Add "only use provided context" constraint |
| Inconsistent formatting | Different structures across responses | Provide explicit format specification with examples |
| Ignored instructions | Agent skips specific directives | Reorder instructions by priority, add emphasis markers |
| Excessive caution | Unnecessary disclaimers and hedging | Tune confidence thresholds, reduce safety overreach |

## Prompt Conflict Resolution

When multiple prompt changes are proposed simultaneously:

### Priority Matrix

| Change Type | Priority | Rationale |
|-------------|----------|-----------|
| Safety fix | P0 — Critical | Ships immediately, all other changes deferred |
| Correctness fix | P1 — High | Ships in next release, minimal review needed |
| Behavioral improvement | P2 — Medium | Ships in next release with full review |
| Experimental feature | P3 — Low | Ships as pre-release, extensive testing required |
| Cosmetic / formatting | P4 — Low | Batched into periodic maintenance releases |

### Resolution Flow

1. All proposed changes are logged with metadata (author, rationale, priority)
2. Changes are grouped by compatibility (can they coexist?)
3. Conflicting changes are identified and flagged
4. Conflict resolution strategy is applied (see strategies above)
5. Resolved prompt undergoes full testing before promotion
6. Final prompt is versioned, documented, and deployed

## Integration Points

- **Skill Loader**: Reads prompt version and applies correct template on agent init
- **Task Router**: Selects appropriate mode based on task classification
- **Outcome Tracker**: Logs results against prompt version for optimization
- **Sync Daemon**: Periodically checks for prompt updates across agents
