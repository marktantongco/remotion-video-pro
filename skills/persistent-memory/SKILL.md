---
name: persistent-memory
version: 1.0.0
description: Cross-session memory persistence for AI agents, providing structured storage, retrieval, consolidation, and privacy controls for long-term agent memory.
---

# Persistent Memory

## Overview

Persistent memory enables AI agents to retain information across sessions, creating continuity in long-running projects and multi-turn workflows. This skill defines the architecture, storage format, retrieval mechanisms, and lifecycle management for agent memory systems.

## Memory Architecture

The memory system operates across three tiers, each serving a distinct purpose in the information hierarchy:

### Tier 1 — Short-Term Memory (Conversation Buffer)

- **Scope**: Current conversation only
- **Capacity**: Limited by context window
- **Persistence**: Ephemeral; cleared on session end
- **Contents**: Recent messages, immediate task context, temporary variables
- **Eviction**: FIFO or relevance-based pruning when approaching limits

### Tier 2 — Working Memory (Current Task Context)

- **Scope**: Active task across potential session boundaries
- **Capacity**: Moderate (hundreds of entries)
- **Persistence**: Cleared when task completes
- **Contents**: Task objectives, intermediate results, open questions, active decisions
- **Eviction**: Task completion triggers archival to long-term or deletion

### Tier 3 — Long-Term Memory (Persistent Files)

- **Scope**: Indefinite; spans all projects and sessions
- **Capacity**: Unlimited (bounded by storage)
- **Persistence**: Permanent until explicitly archived or deleted
- **Contents**: User preferences, project context, learned patterns, decisions log
- **Eviction**: Manual archival or importance-based auto-archival

## Memory Directory Structure

```
.memory/
├── users/
│   ├── {user-id}/
│   │   ├── preferences.md          # User preferences and settings
│   │   ├── communication-style.md   # Tone, format, language preferences
│   │   └── history-summary.md       # Condensed interaction history
├── projects/
│   ├── {project-id}/
│   │   ├── context.md               # Project overview and goals
│   │   ├── architecture.md          # Technical architecture decisions
│   │   ├── conventions.md           # Coding style, naming, patterns
│   │   ├── decisions/
│   │   │   ├── 2024-01-15-auth-choice.md
│   │   │   └── 2024-02-03-db-migration.md
│   │   └── open-questions.md        # Unresolved items
├── patterns/
│   ├── coding-patterns.md           # Reusable code patterns discovered
│   ├── error-resolutions.md         # How past errors were fixed
│   └── workflow-optimizations.md    # Process improvements learned
├── decisions-log.md                 # Global decisions across projects
└── index.md                         # Search index and metadata registry
```

## Memory Types

### User Preferences
```yaml
# Stored in: .memory/users/{user-id}/preferences.md
preferred_language: TypeScript
style_guide: prettier
testing_framework: vitest
communication_preference: concise
avoid_topics: [legacy_systems, proprietary_details]
```

### Project Context
```yaml
# Stored in: .memory/projects/{project-id}/context.md
project_name: My Application
tech_stack: [Next.js, Prisma, PostgreSQL]
primary_goals: [user_auth, dashboard, api_layer]
current_phase: development
known_constraints: [budget, timeline, team_size]
```

### Learned Patterns
- Discovered workarounds for library quirks
- Effective architectural patterns for specific use cases
- Performance optimization techniques validated in practice
- Error resolution procedures that worked

### Decisions Log
- What was decided and when
- Alternatives considered and why they were rejected
- Who approved or influenced the decision
- Outcome and any follow-up actions

## Memory Retrieval

### Semantic Search Pipeline

1. **Query Analysis**: Extract key concepts and intent from the current context
2. **Index Lookup**: Scan the memory index for relevant entries by topic tags
3. **File Scanning**: Read candidate memory files ranked by metadata relevance
4. **Scoring**: Apply relevance scoring to each candidate memory entry

### Relevance Scoring Formula

```
score = (recency_weight * recency_score)
      + (frequency_weight * access_frequency)
      + (importance_weight * importance_rating)
      + (context_match_weight * semantic_similarity)
```

| Factor | Weight | Description |
|--------|--------|-------------|
| Recency | 0.25 | How recently the memory was last accessed |
| Frequency | 0.20 | How often the memory has been retrieved |
| Importance | 0.30 | Explicit importance rating (1-10) |
| Context Match | 0.25 | Semantic similarity to current query |

### Retrieval Commands

- `memory.search(query)` — Search all memory files for relevant entries
- `memory.get(category, key)` — Retrieve a specific memory entry
- `memory.recent(n, category?)` — Get the N most recent memories, optionally filtered
- `memory.related(entry_id)` — Find memories related to a given entry

## Memory Consolidation

Consolidation runs periodically or when triggered by memory size thresholds:

### Summarization Rules
- Condense verbose entries into key facts (≤ 3 bullet points)
- Preserve decision rationale even if details are trimmed
- Maintain chronological ordering within summaries
- Tag consolidated entries with `consolidated: true`

### Deduplication
- Detect semantically identical entries across memory files
- Merge duplicates into a single canonical entry
- Preserve the most detailed version as the canonical source
- Add cross-references from merged entries to the canonical

### Importance Scoring

| Level | Score | Action |
|-------|-------|--------|
| Critical | 9-10 | Never auto-archive; pin to index |
| High | 7-8 | Auto-archive after 90 days of no access |
| Medium | 4-6 | Auto-archive after 30 days of no access |
| Low | 1-3 | Auto-archive after 14 days of no access |

## Memory Lifecycle

| Phase | Trigger | Action | Output |
|-------|---------|--------|--------|
| Create | New information learned | Write structured entry to appropriate file | Memory file updated |
| Retrieve | Task requires context | Search and score relevant memories | Ranked memory results |
| Update | Information changes or corrections | Update existing entry with timestamp | Entry version incremented |
| Consolidate | Threshold reached or scheduled | Summarize, deduplicate, rescore | Cleaner memory set |
| Archive | Inactivity or project completion | Move to `.memory/archive/` | Archived but retrievable |
| Delete | Explicit user request or privacy policy | Permanently remove entry | Entry removed |

## Privacy Controls

### What Gets Stored (Persistent)
- User-stated preferences and settings
- Technical decisions and their rationale
- Project architecture and conventions
- Learned patterns and successful solutions
- Error resolutions and workarounds

### What Stays Ephemeral (Never Stored)
- Authentication credentials and API keys
- Personal identifiable information (PII)
- Transient debugging output
- Temporary file paths and environment details
- Content that the user explicitly marks as private

### Privacy Enforcement
- All memory writes pass through a privacy filter before storage
- Users can mark any conversation segment as `do-not-remember`
- A `memory.forget(query)` command removes matching entries
- Export and deletion requests are honored within one session

## File Naming Conventions

- **Pattern**: `{date}-{slug}.md` for decision entries (e.g., `2024-03-15-auth-refactor.md`)
- **Pattern**: `{category}.md` for category files (e.g., `preferences.md`, `patterns.md`)
- **Dates**: ISO 8601 format (`YYYY-MM-DD`)
- **Slugs**: lowercase, hyphen-separated, max 50 characters
- **Encoding**: UTF-8, LF line endings

## Format Standards

Every memory file follows this structure:

```markdown
---
id: mem-{uuid}
created: 2024-03-15T10:30:00Z
updated: 2024-03-15T10:30:00Z
category: decision
importance: 8
tags: [authentication, security, jwt]
project: my-project
---

# Title

## Context
Why this memory exists.

## Content
The actual information to remember.

## Metadata
- Source: conversation / observation / deduction
- Confidence: high / medium / low
```

## Integration Points

- **Agent Init**: Load user preferences and project context into working memory
- **Task Start**: Retrieve relevant memories for the task category
- **Task End**: Store any new learnings or decisions from the task
- **Session End**: Consolidate short-term memories and flush working memory
