---
name: diagnose
version: 1.0.0
description: >
  Provides systematic debugging and problem diagnosis including error
  classification, root cause analysis, log interpretation, performance
  profiling, and structured diagnostic workflows.
---

# Diagnose Skill

## Overview

This skill provides a systematic approach to identifying, analyzing, and
resolving software problems. It combines structured diagnostic workflows
with domain-specific knowledge to move from symptoms to root causes
efficiently.

## Activation Triggers

- "Why is X failing?"
- "Debug this error: [error message]"
- "This is slow — help me find the bottleneck"
- "My app crashes when X happens"
- "Interpret this stack trace"
- "Help me diagnose this flaky test"
- "Something is wrong but I can't tell what"

## Diagnostic Workflow

Follow this 6-step process for every diagnosis:

```
Observe ──▶ Hypothesize ──▶ Test ──▶ Confirm ──▶ Fix ──▶ Verify
   │              │            │          │         │        │
   ▼              ▼            ▼          ▼         ▼        ▼
 Gather       Generate     Run test   Does test  Apply    Does
 symptoms     candidates   or check   confirm?   fix      problem
 & context    from below              hypothesis         resolve?
```

**Rules:**
- Never skip the Observe step. Premature hypothesis leads to wild goose
  chases.
- Generate at least 2-3 hypotheses before testing. Avoid confirmation
  bias by considering contradictory evidence.
- If a test disproves a hypothesis, record the negative result — it
  narrows the search space.
- After fixing, verify with the original reproduction case AND at least
  one related scenario.

## Error Classification Taxonomy

| Category | Description | Common Causes | Quick Checks |
|----------|-------------|---------------|-------------|
| **Syntax** | Code cannot be parsed | Typos, missing brackets, wrong separators | Linter output, IDE highlights |
| **Runtime** | Code crashes during execution | Null/undefined access, type errors, missing files | Stack trace line numbers, try-catch |
| **Logic** | Code runs but produces wrong results | Off-by-one, wrong condition, incorrect algorithm | Unit tests, manual trace with sample input |
| **Integration** | Components fail to communicate | API contract mismatch, version incompatibility, CORS | Network tab, API logs, version check |
| **Performance** | Code is correct but too slow | N+1 queries, unbounded loops, missing index | Profiler, query plan, Big-O analysis |
| **Security** | Code has vulnerability | Injection, auth bypass, data exposure | Security scanner, OWASP checklist |
| **Configuration** | Environment is misconfigured | Wrong env vars, missing secrets, port conflicts | Env dump, config validation, port check |
| **Concurrency** | Race conditions or deadlocks | Shared mutable state, missing locks, callback ordering | Stress test, thread dump, race detector |
| **Resource** | Out of memory, disk, handles | Memory leaks, unclosed connections, large payloads | Resource monitor, heap dump, lsof |

## Root Cause Analysis Techniques

### The 5 Whys

Ask "why" recursively until you reach a systemic cause:

```
Problem: API returns 500 error
→ Why? Database connection timed out
→ Why? Connection pool exhausted
→ Why? Queries taking too long
→ Why? Missing index on frequently queried column
→ Why? Index was removed during a migration refactor
→ ROOT CAUSE: Migration process lacks performance regression checks
```

### Fishbone (Ishikawa) Diagram

Categorize potential causes into:

- **People**: Knowledge gaps, miscommunication, insufficient training
- **Process**: Missing steps, unclear procedures, no code review
- **Tools**: Wrong version, misconfigured, insufficient capacity
- **Environment**: OS differences, network issues, resource limits
- **Data**: Corrupt input, schema mismatch, missing records
- **Code**: Bugs, missing validation, poor error handling

### Fault Tree Analysis

Start from the failure event and decompose into sub-events using AND/OR
logic gates. Useful for complex failures with multiple contributing
factors.

## Diagnostic Verbosity Levels

| Level | When to Use | What to Include |
|-------|-------------|-----------------|
| **Silent** | Known issues, routine fixes | Only the fix and verification |
| **Normal** | Standard debugging | Symptoms, hypothesis, fix, verification |
| **Verbose** | Complex or unfamiliar issues | Full reasoning chain, alternatives considered, evidence |
| **Trace** | Production incidents, learning | Every thought, dead-end explored, tool outputs, timeline |

## Log Analysis and Interpretation

### Reading Stack Traces

1. **Start at the bottom** — The deepest frame is where the exception
   originated.
2. **Read upward** — Follow the call chain to understand how execution
   reached the failure point.
3. **Filter noise** — Ignore framework internals (node_modules, lib/,
   vendor/) unless the bug is in the framework itself.
4. **Extract key info**: File name, line number, function name, error
   message, error type.

### Identifying Patterns

- **Recurring errors**: Same error across multiple requests — likely a
  systematic issue, not a one-off.
- **Temporal clustering**: Errors spike at specific times — correlate with
  deployments, traffic patterns, batch jobs.
- **Cascade failures**: One service failing causes downstream errors —
  find the origin, don't fix symptoms.
- **Slow degradation**: Response times increasing over time — memory leak,
  connection leak, or resource exhaustion.

## Performance Diagnosis

### Profiling Strategy

1. **Measure first** — Use profiling tools (Chrome DevTools, py-spy,
  go tool pprof, async-profiler) before guessing.
2. **Identify the hotspot** — What function/line consumes the most time?
3. **Classify the bottleneck** — CPU-bound, I/O-bound, memory-bound,
  or lock contention.
4. **Check the algorithm** — Is the right algorithm being used? What is
  the Big-O complexity for actual input sizes?
5. **Check the data** — Is the query hitting an index? Is caching
  configured? Is pagination in place?

### Common Performance Pitfalls

| Pattern | Symptom | Fix |
|---------|---------|-----|
| N+1 queries | O(n) DB round trips | Batch query, eager loading, DataLoader |
| Unbounded rendering | UI freezes on large lists | Virtualization, pagination |
| Synchronous I/O | Event loop blocked | Async/await, worker threads |
| Missing debounce | Excessive API calls on keystroke | Debounce or throttle input handlers |
| Full table scan | Slow query on large table | Add composite index, use WHERE clause |
| Memory leak | Growing heap over time | Clean up event listeners, release references |

## Diagnostic Decision Tree

```
Is there an error message?
├── YES → Is it a stack trace?
│   ├── YES → Parse trace → Identify origin → Classify error type
│   └── NO → Search for message online → Check docs/changelog
└── NO → What is the symptom?
    ├── Crashes → Check resource limits → Check core dump / heap dump
    ├── Wrong output → Add logging → Trace data flow → Compare expected vs actual
    ├── Slow → Profile → Identify hotspot → Classify bottleneck
    ├── Flaky / Intermittent → Add retry logging → Race condition check → Isolate environment
    └── Silent failure → Check return values → Add error handling → Verify monitoring
```

## Known Pitfalls Reference

### React
- Stale closures in useEffect with missing dependency
- Infinite re-render from setState inside render
- Key prop mismatch causing unmounted component updates

### Node.js
- Unhandled promise rejection crashing the process
- Event emitter memory leak (max listeners exceeded)
- Blocking the event loop with synchronous operations

### Python
- Mutable default arguments (`def f(x=[])`)
- Integer caching surprise (`a = 256; b = 256; a is b`)
- GIL contention in CPU-bound threads

### PostgreSQL
- Transaction ID wraparound (autovacuum not running)
- Lock contention from long-running transactions
- Query planner choosing seq scan over index scan (statistics stale)

## Output Quality Standards

- Always state the most likely root cause explicitly, even if uncertain.
- Present hypotheses in order of likelihood.
- Include reproduction steps when possible.
- After every fix, specify the verification steps needed.
- For production incidents, include a timeline and blast radius estimate.
