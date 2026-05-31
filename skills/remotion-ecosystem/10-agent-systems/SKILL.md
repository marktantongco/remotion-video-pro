# 10 — Agent Systems

Agent orchestration, memory, and self-improvement systems that
make the video production pipeline autonomous and adaptive.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **agent-roles** | Specialized agent personas (Architect, Developer, Designer, Reviewer) |
| **superpowers** | Spec-first development + sub-agent delegation |
| **proactive-agent** | Autonomous self-improvement with write-ahead logging |
| **self-improving-agent** | Error logging + learning from failures |
| **persistent-memory** | Cross-session structured memory storage |
| **context-compressor** | Context window optimization for long pipelines |

## Remotion Integration

These are meta-skills that enhance the entire pipeline. They operate
across all stages, providing orchestration, memory, and optimization.

### Orchestration Pattern

```
superpowers (define spec)
  → agent-roles (delegate to specialists)
    ├── Architect: design pipeline architecture
    ├── Developer: implement Remotion compositions
    ├── Designer: create visual assets
    └── Reviewer: validate output quality
  → self-improving-agent (learn from results)
  → persistent-memory (store learnings)
```

### Integration Hooks

**agent-roles → remotion-video-pro:**
```typescript
// Agent delegation for video production
const videoSpec = await superpowers.createSpec({
  task: 'Create product demo video for launch',
  subagents: [
    { role: 'Architect', task: 'Design composition structure' },
    { role: 'Developer', task: 'Implement Remotion components' },
    { role: 'Designer', task: 'Create visual assets' },
    { role: 'Reviewer', task: 'Validate frame integrity' },
  ],
});
```

**self-improving-agent → remotion-video-pro:**
- Rendering failures logged with full context
- Pattern detection identifies recurring issues
- Fixes promoted to CLAUDE.md / AGENTS.md
- Performance regressions trigger re-optimization

**persistent-memory → remotion-video-pro:**
- Brand guidelines (colors, fonts, tone) persist across sessions
- Past video campaigns stored as reference
- A/B test results inform future variants
- Render cost data enables budgeting

**context-compressor → full pipeline:**
- Long pipelines (Routes A-E) exceed context windows
- Compression preserves critical data, action items, and decisions
- Enables multi-session pipeline execution

## Learning Loop

```
1. Execute pipeline → 2. Capture results
3. Log failures/errors → 4. Detect patterns
5. Promote fixes → 6. Store in persistent memory
7. Next pipeline run benefits from learnings
```
