# JTBD Research - Jobs to be Done Product Research Methodology

> A structured skill for conducting Jobs to be Done (JTBD) product research, breaking down user needs into functional, emotional, and social components to find high-output solutions.

*Version: 1.0 | Last Updated: April 2026 | Based on: Advanced JTBD (AJTBD) Methodology*

---

## Context

This skill is for conducting rigorous product research using the Jobs to be Done framework. JTBD reveals WHY customers "hire" or "fire" products by understanding the progress they are trying to make in their lives.

Use this skill when:
- Starting product discovery for a new feature or product
- Understanding why users switch between competing products
- Identifying unmet needs and underserved market segments
- Building landing page copy based on real customer language
- Prioritizing features by aligning with core customer jobs
- Conducting B2B or B2C market segmentation research

---

## Instructions

### Step 1: Define the Research Scope

Before starting, clarify these dimensions:

1. **Product/domain**: What product, service, or feature are we researching?
2. **Target market**: B2B or B2C? Specific industry or horizontal?
3. **Research goal**: Discovery, validation, prioritization, or competitive analysis?

### Step 2: Segment the Market (JTBD Segmentation)

Traditional segmentation (demographics, firmographics) is weak. JTBD segments by the **job** people are trying to accomplish.

**For B2B markets, identify 5 segments:**

| Segment | Core Job | Priority | Willingness to Pay |
|---------|----------|----------|-------------------|
| Segment 1 | [Primary functional job] | High/Medium/Low | Premium/Standard/Budget |
| Segment 2 | [Secondary functional job] | ... | ... |
| Segment 3 | [Tertiary job or variant] | ... | ... |
| Segment 4 | [Emerging job] | ... | ... |
| Segment 5 | [Niche/edge-case job] | ... | ... |

**For each segment, calculate:**
- **TAM** (Total Addressable Market): All potential job executors
- **SAM** (Serviceable Addressable Market): Those reachable through your channels
- **SOM** (Serviceable Obtainable Market): Realistic early capture (typically 1-5% of SAM)

### Step 3: Build the Job Map (Work Graph)

Deconstruct the primary job into its full hierarchy:

```
Core Job (what the user wants to accomplish)
  |
  +-- Functional Job
  |     +-- Main functional task
  |     +-- Supporting functional tasks
  |
  +-- Emotional Job
  |     +-- How the user wants to FEEL (positive emotions)
  |     +-- What the user wants to AVOID FEELING (negative emotions)
  |
  +-- Social Job
  |     +-- How the user wants to be PERCEIVED by others
  |     +-- What social identity or status they want to signal
  |
  +-- Related Jobs
  |     +-- Jobs that happen BEFORE the core job
  |     +-- Jobs that happen DURING the core job
  |     +-- Jobs that happen AFTER the core job
  |
  +-- Consumption Chain Jobs
        +-- Determine (discover, define, plan)
        +-- Locate (find, evaluate, select)
        +-- Obtain (buy, install, configure)
        +-- Integrate (connect to existing systems)
        +-- Maintain (update, repair, upgrade)
        +-- Dispose (remove, migrate, archive)
```

**For each job statement, use this format:**
```
"When I [situation], I want to [motivation], so I can [outcome]."
```

### Step 4: Identify Top-5 Risky Assumptions

For every product hypothesis, rank the riskiest assumptions:

| # | Assumption | Type | Evidence | Risk Level | Validation Method |
|---|-----------|------|----------|------------|-------------------|
| 1 | [Assumption text] | Desirability/Viability/Feasibility | [What we know] | Critical/High/Medium/Low | [How to test] |
| 2 | ... | ... | ... | ... | ... |
| 3 | ... | ... | ... | ... | ... |
| 4 | ... | ... | ... | ... | ... |
| 5 | ... | ... | ... | ... | ... |

**Assumption types:**
- **Desirability**: Do people actually want this? (Customer risk)
- **Viability**: Can we build a sustainable business? (Business risk)
- **Feasibility**: Can we actually build this? (Technical risk)

### Step 5: Conduct Customer Interviews

**Interview structure (adapted from The Mom Test):**

1. **Opening** (2 min): Build rapport, explain purpose
2. **Context** (5 min): "Tell me about the last time you [did the job]"
3. **Struggle** (10 min): "Walk me through what you did step by step"
4. **Workarounds** (5 min): "What have you tried to solve this? What worked/didn't?"
5. **Emotions** (5 min): "How did that make you feel? What were you worried about?"
6. **Social** (3 min): "How did others react? Were you trying to impress someone?"

**Critical rules:**
- NEVER ask "Would you use this?" (hypothetical answers are worthless)
- NEVER mention your solution until after they describe their problem
- ALWAYS ask about specific past behavior, not future intentions
- ALWAYS dig for the emotional and social dimensions

### Step 6: Synthesize into JTBD Statements

From interview data, extract job statements in this format:

```
Main Job: "When I [specific situation/context], I want to [action/motivation],
so I can [measurable desired outcome]."

Functional: [What they need to accomplish]
Emotional (positive): [How they want to feel]
Emotional (negative): [What anxiety/frustration they want to avoid]
Social: [How they want to be perceived by others]

Push Forces (motivate adoption):
  - [Current pain point 1]
  - [Current pain point 2]
  - [Aspiration or opportunity 1]

Pull Forces (attract to new solution):
  - [Benefit 1 of new approach]
  - [Benefit 2 of new approach]
  - [Social proof or status gain]

Anxiety Forces (resist adoption):
  - [Concern 1 about switching]
  - [Concern 2 about new solution]

Habit Forces (resist change):
  - [Current workaround 1 that's "good enough"]
  - [Existing investment 1 that's hard to leave]
```

### Step 7: Generate Landing Page Copy

Transform JTBD insights into customer-language copy:

**Headline formula:**
```
[Outcome they want] without [Pain they want to avoid]
```

**Subheadline:**
```
[For target segment], [main job] is [current struggle].
[Product name] helps you [primary benefit] so you can [emotional outcome].
```

**Social proof:**
```
[Specific result] + [Customer in same segment] + [Emotional payoff]
```

### Step 8: Plan Respondent Recruitment

For ongoing research, establish recruitment channels:

| Channel | B2B | B2C | Cost | Quality |
|---------|-----|-----|------|---------|
| Existing customers | Email outreach | In-app survey | Low | High |
| LinkedIn | InMail + Groups | N/A | Medium | High |
| Communities | Slack/Discord | Reddit/Facebook | Low | Medium |
| Panels | UserTesting, Respondent.io | Prolific, MTurk | Medium-High | Medium |
| Referrals | Customer referrals | Social sharing | Low | High |

---

## Constraints

- NEVER assume you know what customers want -- validate with real behavior, not opinions
- NEVER segment by demographics alone -- always segment by job
- NEVER skip the emotional and social dimensions -- functional alone is incomplete
- NEVER ask leading questions in interviews -- "Wouldn't you agree that..." is forbidden
- NEVER build without testing at least the top-3 risky assumptions
- NEVER write marketing copy before doing JTBD research -- you will use your language, not theirs
- NEVER treat one interview as data -- minimum 5-8 interviews per segment for patterns

---

## Examples

### Example 1: B2B SaaS Product Research

**Product:** Project management tool for remote design teams

**Segment 1 (Primary):**
- Core Job: "When I manage a distributed design team, I want to see real-time design progress across all projects, so I can catch blockers before they delay delivery."
- Emotional (+): Feel in control, look competent to stakeholders
- Emotional (-): Avoid feeling blindsided by missed deadlines
- Social: Be seen as an organized leader who runs tight ships
- TAM: 2.4M remote design managers globally
- SAM: 180K reachable via design communities and LinkedIn
- SOM: 2,700 (1.5% of SAM, year 1 target)

**Top Assumption:**
| # | Assumption | Type | Risk | Validation |
|---|-----------|------|------|------------|
| 1 | Design managers will pay $49/mo for real-time visibility | Viability | Critical | Survey 50 design managers with pricing page test |

### Example 2: B2C Mobile App

**Product:** Meal planning app for busy parents

**Core Job Statement:**
"When I come home exhausted at 6pm with hungry kids, I want to know exactly what to cook with what I already have in my fridge, so I can feed my family a healthy meal in under 30 minutes without another trip to the grocery store."

**Push Forces:** Standing in front of open fridge with no plan; kids asking "what's for dinner?"; ordering takeout again and feeling guilty
**Pull Forces:** Quick recipes matched to ingredients; feeling like a good parent; saving money on groceries
**Anxiety Forces:** App suggests recipes with ingredients I don't know; takes longer than just ordering pizza
**Habit Forces:** Defaulting to the same 5 recipes I know by heart; partner usually handles dinner

---

## Output Artifacts

After completing research, these artifacts should be stored:

1. `segments.md` -- Market segmentation with TAM/SAM/SOM
2. `job-map.md` -- Full job hierarchy with functional/emotional/social dimensions
3. `assumptions.md` -- Top-5 risky assumptions with validation plans
4. `interview-notes.md` -- Raw interview summaries (de-identified)
5. `jtbd-statements.md` -- Synthesized job statements per segment
6. `landing-copy.md` -- Customer-language marketing copy
7. `recruitment-plan.md` -- Ongoing respondent recruitment strategy

---

*Based on: Advanced JTBD methodology by Ivan Zamesin & Anna Shundeeva (snowtema/ajtbd-skills). Adapted and extended for universal agent use.*
