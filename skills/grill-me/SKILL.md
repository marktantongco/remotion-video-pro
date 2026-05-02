---
name: grill-me
version: 1.0.0
description: >
  Provides adversarial review and stress-testing of ideas, code, and
  decisions. Includes devil's advocate analysis, edge case probing,
  architecture critique, and pre-mortem analysis frameworks.
---

# Grill-Me Skill

## Overview

This skill subjects ideas, code, architectures, and decisions to rigorous
adversarial scrutiny. It deliberately searches for weaknesses, unstated
assumptions, and failure modes. The goal is not to tear down work but to
strengthen it by finding and addressing vulnerabilities before they
become real problems.

## Activation Triggers

- "Stress-test this idea"
- "What's wrong with this approach?"
- "Grill my architecture"
- "Play devil's advocate on this decision"
- "Find the weaknesses in this code"
- "What could go wrong with this plan?"
- "Pre-mortem my feature"

## Critique Severity Levels

Every critique is tagged with a severity to help the recipient prioritize
responses:

| Level | Label | Meaning | Action Required |
|-------|-------|---------|-----------------|
| **1** | Observation | Interesting note, no action needed | Acknowledge |
| **2** | Concern | Potential weakness worth considering | Discuss, decide |
| **3** | Warning | Likely problem if not addressed | Plan mitigation |
| **4** | Blocker | Critical flaw that could cause failure | Must resolve before proceeding |

**Rules:**
- Every critique must include the severity level in bold, e.g.,
  `[WARNING]`
- Blockers are rare and reserved for genuine show-stopping issues.
- Never use severity to bully — use it to prioritize.
- If everything looks solid, say so. Don't manufacture problems.

## Core Capabilities

### 1. Devil's Advocate Analysis

Challenge every significant claim and assumption:

**Assumption hunting:**
- What is this design assuming about users, data, traffic, and
  infrastructure?
- What happens if those assumptions are wrong?
- Which assumptions are documented vs. implicit?

**Weak point probing:**
- Where is the design most fragile? (single point of failure,
  tightest coupling, least tested path)
- What is the most controversial design decision? Why was it made?
  What was the next-best alternative?
- If you had to make this fail, how would you do it?

**Perspective shifting:**
- How would a security researcher attack this?
- How would a competitor exploit this weakness?
- How would an inexperienced developer break this?
- How would this behave at 10x current scale?

### 2. Code Stress-Testing

Probe code for robustness against adversarial inputs and conditions:

**Edge case categories to test:**
- Empty inputs, null values, undefined, NaN
- Very large inputs (1MB string, 10,000-item array)
- Very small inputs (single character, empty array, zero)
- Boundary values (INT_MAX, negative numbers, floating point edge cases)
- Unicode and encoding issues (emoji, RTL text, zero-width characters,
  surrogate pairs)
- Concurrent access (race conditions, deadlock potential)
- Malformed data (truncated, corrupted, wrong types)
- Time-related edge cases (leap seconds, timezone transitions, DST,
  year 2038)

**Failure injection scenarios:**
- What if the database is unavailable for 30 seconds?
- What if the third-party API returns 500 on every 5th request?
- What if the message queue delivers messages out of order?
- What if the user clicks submit 50 times rapidly?
- What if the filesystem is read-only?
- What if the system clock jumps backward?

### 3. Decision Interrogation

Every significant technical decision must answer these questions:

1. **Why this approach over alternatives?** What was the next-best option
   and why was it rejected?
2. **What evidence supports this decision?** Is it based on benchmarks,
   experience, documentation, or assumption?
3. **What would make you change your mind?** What future evidence would
   invalidate this decision?
4. **What is the cost of being wrong?** If this turns out to be a bad
   choice, how expensive is it to reverse?
5. **Who is affected if this fails?** What is the blast radius on users,
   systems, and team velocity?
6. **How long until we know if it works?** What is the feedback loop?
   Can we shorten it?
7. **What are the hidden dependencies?** What else must be true for this
   to succeed?
8. **What happens at scale?** Does the approach hold at 10x, 100x, 1000x?
9. **What is the maintenance burden?** Who will maintain this in 1 year?
   3 years? Is the team equipped?
10. **Is this the simplest solution that could work?** Have we considered
    doing nothing?

### 4. Architecture Critique

Evaluate architectural decisions for resilience and sustainability:

**Single Points of Failure (SPOF):**
- Identify every component that, if it fails, brings down the system.
- For each SPOF, assess: likelihood of failure, impact of failure,
  existence of fallback.

**Scalability Limits:**
- Where are the hard scaling ceilings? (database connections, memory
  limits, API rate limits, team coordination overhead)
- What is the scaling strategy? (vertical, horizontal, sharding,
  caching, async processing)

**Coupling Analysis:**
- Which modules cannot be deployed independently?
- Which services share a database or have synchronous dependencies?
- How painful is it to change the public API of module X?

**Evolution Assessment:**
- How easy is it to add a new feature to this architecture?
- How easy is it to replace component X with component Y?
- Does the architecture favor fast iteration or rigid stability?

### 5. Risk Identification

For each identified risk, document:

| Risk | Likelihood (L/M/H) | Impact (L/M/H) | Blast Radius | Mitigation |
|------|--------------------|-----------------|---------------|-----------|
| Example: DB migration fails on prod | M | H | All users | Rollback plan, dry-run on staging |
| Example: Third-party API deprecates endpoint | L | H | Feature X | Abstraction layer, monitoring |

**Risk categories:**
- Technical (bugs, performance, security)
- Operational (deployment failures, monitoring gaps, on-call fatigue)
- Organizational (bus factor, knowledge concentration, team changes)
- External (dependency deprecation, API changes, regulation)

## Pre-Mortem Analysis Framework

**Premise:** Imagine it is 6 months from now. The project failed. Ask:
*Why did it fail?*

### Pre-Mortem Process

1. **Set the scene**: "It's [date]. We launched [feature/project]. It
   failed spectacularly. What happened?"
2. **Generate failure scenarios**: Each participant independently writes
   3-5 reasons for failure.
3. **Cluster and rank**: Group similar failures and rank by likelihood
   and impact.
4. **Convert to mitigations**: For each top failure, define a concrete
   action that would prevent or detect it early.
5. **Integrate into plan**: Add mitigations to the project plan with
   owners and deadlines.

### Common Pre-Mortem Failure Modes

| Failure Mode | Leading Indicator | Early Mitigation |
|-------------|-------------------|-----------------|
| Over-engineering | Velocity declining, complexity increasing | Set scope boundaries, MVP definition |
| Under-engineering | Frequent hotfixes, mounting tech debt | Architecture review, non-functional requirements |
| Scope creep | Feature list growing, deadlines slipping | Strict change control, impact assessment |
| Integration hell | Components work in isolation, fail together | Continuous integration, contract testing |
| Adoption failure | Low usage after launch | User research, beta testing, feedback loops |
| Burnout | Team velocity dropping, increased errors | Sustainable pace, proper estimation, buffer time |

## Stress-Test Scenario Generator Template

```markdown
# Stress Test: [Component/Feature Name]

## Environment
- Input: [expected input types and ranges]
- Load: [expected concurrent users / requests per second]
- Dependencies: [downstream services, databases, external APIs]

## Scenarios

### Scenario 1: Peak Load
- Condition: [e.g., 10x normal traffic for 30 minutes]
- Expected behavior: [e.g., graceful degradation, queue and process]
- Actual behavior: [test result]

### Scenario 2: Dependency Failure
- Condition: [e.g., database unavailable for 60 seconds]
- Expected behavior: [e.g., cached responses, clear error message]
- Actual behavior: [test result]

### Scenario 3: Malicious Input
- Condition: [e.g., SQL injection, XSS payloads, oversized uploads]
- Expected behavior: [e.g., input validation, rate limiting]
- Actual behavior: [test result]

### Scenario 4: Data Edge Case
- Condition: [e.g., empty database, corrupt records, duplicate keys]
- Expected behavior: [e.g., graceful handling, data integrity preserved]
- Actual behavior: [test result]

### Scenario 5: Resource Exhaustion
- Condition: [e.g., memory limit reached, disk full, connection pool empty]
- Expected behavior: [e.g., circuit breaker, alert triggered]
- Actual behavior: [test result]

## Summary
| Scenario | Pass/Fail | Severity | Action Items |
|----------|-----------|----------|-------------|
```

## Output Quality Standards

- Be direct and specific. Vague criticisms waste time.
- Every criticism must include a suggested improvement or alternative.
- Acknowledge strengths as well as weaknesses — this builds trust and
  provides balanced feedback.
- Prioritize findings by severity so the recipient knows where to focus.
- Never critique without understanding the constraints that led to the
  current design. Ask "what constraints shaped this decision?" before
  judging it.
