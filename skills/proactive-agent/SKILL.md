---
name: proactive-agent
version: 1.0.0
description: Converts passive agents into autonomous, self-improving partners. Use when building long-lived agent systems that need initiative, self-correction, and autonomous operation. Covers write-ahead logging, working buffer management, compaction recovery, reverse prompting, proactive check-ins, autonomous cron scheduling, and ADL/VFM guardrails. Enables agents to anticipate needs rather than waiting for instructions.
source: https://lobehub.com/skills/openclaw-skills-proactive-agent (4.92/5 rating)
changelog: Initial release — autonomous agent architecture patterns
---

# Proactive Agent

Convert passive agents into autonomous, self-improving partners that anticipate needs and take initiative.

## Core Architecture

### Write-Ahead Logging (WAL)
All agent actions are logged before execution to prevent data loss:
- Every decision, action, and outcome recorded in sequence
- Enables crash recovery and state reconstruction
- Provides audit trail for debugging autonomous behavior

### Working Buffer
Short-term memory management for active tasks:
- Current context and goals held in buffer
- Automatic compaction when buffer exceeds threshold
- Priority-based eviction for least-relevant items

### Compaction Recovery
When context is compressed or lost:
- WAL entries reconstruct recent state
- Working buffer repopulated from log
- No task continuity is lost during compaction

## Proactive Behaviors

### Reverse Prompting
Instead of waiting for user input, the agent asks itself:
1. What would the user likely ask next based on current work?
2. What blockers exist that the user hasn't noticed?
3. What can be prepared in advance to save time?

### Proactive Check-Ins
Scheduled self-assessment triggers:
- Review task progress against goals
- Identify stalled or blocked items
- Surface issues before the user asks

### Autonomous Cron Scheduling
Recurring tasks managed without user intervention:
- Health checks, dependency updates, status reports
- Scheduled at appropriate intervals
- Results logged and surfaced on next interaction

## Guardrails

### ADL (Action Definition Language)
Every autonomous action must:
- Have a clear purpose linked to user goals
- Be reversible or low-risk
- Include a rollback plan
- Stay within defined permission boundaries

### VFM (Value Verification Metric)
Before executing autonomously, verify:
- **Necessity**: Does this need to happen now?
- **Value**: Does this create measurable value?
- **Frequency**: Is this the right cadence?
- **Scope**: Is this within the agent's authority?

## Activation Triggers
- Building long-running agent systems
- Implementing autonomous workflows
- Creating self-monitoring agent processes
- Designing agent architectures that anticipate needs
