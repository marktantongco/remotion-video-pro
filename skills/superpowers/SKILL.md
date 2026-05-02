---
name: superpowers
version: 1.0.0
description: Central orchestration meta-skill that routes user requests to the correct skill(s), manages multi-skill combination pipelines, detects conflicts, and maintains session-aware skill state across the entire skill ecosystem.
---

# Superpowers — Skill Orchestration Layer

## Overview

Superpowers is the meta-skill that acts as the central nervous system for the entire skill ecosystem. It is the first skill consulted on every request and is responsible for routing, combining, and coordinating all other skills. Think of it as the dispatcher that ensures the right agents show up at the right time with the right tools.

## Core Responsibilities

### 1. Skill Activation Routing

When a user request arrives, Superpowers analyzes it and determines which skill(s) should be activated. The routing decision is based on:

- **Keyword detection**: Scanning the request for domain-specific terms
- **Intent classification**: Understanding what the user wants to accomplish
- **Context awareness**: Considering the current session state and conversation history
- **Explicit invocation**: Handling direct skill calls (e.g., `/charts`, `/fullstack-dev`)

### 2. Multi-Skill Combination Choreography

Many real-world requests require multiple skills working in concert. Superpowers manages the execution order and data flow between skills.

**Combo Examples:**

| Request Type | Skills Activated | Execution Order |
|---|---|---|
| "Build a full dashboard" | fullstack-dev → ui-ux-pro-max → charts | Design → Develop → Visualize |
| "Deploy a landing page with animations" | fullstack-dev → gsap-animations → vercel | Build → Animate → Deploy |
| "Create a data report from CSV" | xlsx → charts → pdf | Extract → Visualize → Export |
| "Build a blog with SEO content" | fullstack-dev → web-search → docx | Scaffold → Research → Write |
| "Research and present findings" | aminer-academic-search → pptx → charts | Research → Compose → Visualize |

### 3. Skill Conflict Detection and Resolution

When multiple skills could apply or when skills have overlapping responsibilities, Superpowers resolves conflicts:

- **Priority ordering**: Some skills take precedence over others in ambiguous cases
- **Scope disambiguation**: Narrowing down which skill best fits the full request context
- **Sequential vs. parallel execution**: Determining when skills can run simultaneously
- **Output deduplication**: Preventing multiple skills from producing overlapping deliverables

**Conflict Resolution Rules:**

1. Domain-specific skills always override general-purpose skills
2. When two skills overlap, the more recently activated skill takes priority
3. If a user explicitly names a skill, it wins over keyword-based routing
4. Meta-skills (like this one) never conflict with leaf skills — they coordinate

### 4. Session-Aware Skill State Management

Superpowers tracks skill state across the conversation:

- **Active skills**: Which skills are currently engaged in the session
- **Completed skills**: Which skills have finished their work
- **Pending handoffs**: Data that needs to flow from one skill to another
- **Context windows**: Managing how much context each skill needs
- **State persistence**: Remembering configuration choices across turns

### 5. Decision Tree for Skill Routing

```
USER REQUEST ARRIVES
│
├─ Contains "deploy" / "vercel" / "host"?
│  └─ YES → Activate: vercel
│
├─ Contains "chart" / "graph" / "plot" / "visualize" / "dashboard"?
│  └─ YES → Activate: charts
│
├─ Contains "github" / "PR" / "branch" / "commit" / "CI/CD"?
│  └─ YES → Activate: github
│
├─ Contains "pptx" / "slides" / "presentation" / "deck"?
│  └─ YES → Activate: pptx
│
├─ Contains "pdf" / "document" / "report"?
│  └─ YES → Activate: pdf
│
├─ Contains "excel" / "spreadsheet" / "csv" / "xlsx" / "data"?
│  └─ YES → Activate: xlsx
│
├─ Contains "animate" / "motion" / "gsap" / "transition"?
│  └─ YES → Activate: gsap-animations
│
├─ Contains "UI" / "UX" / "design" / "layout" / "wireframe"?
│  └─ YES → Activate: ui-ux-pro-max
│
├─ Contains "build" / "app" / "API" / "component" / "next.js" / "fullstack"?
│  └─ YES → Activate: fullstack-dev
│
├─ Contains "research" / "paper" / "academic" / "citation"?
│  └─ YES → Activate: aminer-academic-search
│
├─ Contains "image" / "generate" / "AI art" / "picture"?
│  └─ YES → Activate: image-generation
│
├─ Contains "search" / "find" / "web" / "lookup"?
│  └─ YES → Activate: web-search
│
├─ Multiple keywords detected?
│  └─ YES → Activate combo pipeline (see combo table above)
│
└─ NO MATCH → Route to general-purpose LLM response
```

### 6. The 8-Layer Pipeline

Superpowers orchestrates all work through an 8-layer pipeline:

| Layer | Name | Purpose |
|---|---|---|
| 1 | Meta | Orchestration, routing, planning (this skill) |
| 2 | Input | Request parsing, clarification, requirement gathering |
| 3 | Strategy | Approach selection, architecture decisions, tech stack |
| 4 | Design | UI/UX, visual design, information architecture |
| 5 | Development | Code implementation, feature building, integration |
| 6 | Animation | Motion design, transitions, interactive feedback |
| 7 | Content | Copywriting, documentation, accessibility content |
| 8 | Quality | Testing, review, performance optimization, security |
| 9 | Ship | Deployment, monitoring, handoff documentation |

Each layer may activate one or more skills. Not every layer is required for every request — Superpowers determines which layers are relevant and skips the rest.

### 7. Routing Table — Request Patterns to Skill Activations

| Request Pattern | Primary Skill | Supporting Skills | Pipeline Layers |
|---|---|---|---|
| "Create a web app" | fullstack-dev | ui-ux-pro-max, vercel | Meta → Strategy → Design → Development → Ship |
| "Make a chart from this data" | charts | xlsx | Meta → Input → Development |
| "Deploy to Vercel" | vercel | github | Meta → Ship |
| "Build a presentation" | pptx | charts, image-generation | Meta → Input → Design → Content |
| "Analyze this spreadsheet" | xlsx | charts | Meta → Input → Development → Quality |
| "Design a landing page" | ui-ux-pro-max | fullstack-dev | Meta → Strategy → Design → Development |
| "Set up CI/CD" | github | vercel | Meta → Strategy → Ship |
| "Generate a PDF report" | pdf | xlsx, charts | Meta → Input → Content → Quality |
| "Search for papers on X" | aminer-academic-search | docx | Meta → Input → Content |
| "Add animations to my site" | gsap-animations | fullstack-dev | Meta → Design → Development → Animation |
| "Clone this website" | web-reader | fullstack-dev, ui-ux-pro-max | Meta → Input → Design → Development |

## Activation Protocol

1. Superpowers is **always active** — it runs on every request as the first evaluation layer
2. It should not produce visible output unless explaining the routing decision
3. When multiple skills activate, Superpowers prints a brief combo header: `"Activating: [skill1] + [skill2] → [goal]"`
4. If no skill matches, Superpowers silently delegates to the base LLM

## Anti-Patterns to Avoid

- **Over-activation**: Do not activate every skill that loosely matches. Pick the 1-2 most relevant.
- **Circular routing**: A skill must never route back to Superpowers for re-routing.
- **State leakage**: Each skill invocation should be independent unless explicitly chained.
- **Priority inversion**: Never let a lower-priority skill override an explicit user request.
