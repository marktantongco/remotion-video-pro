# AI Prompt Engineering Master Reference

> **The complete reusable prompt library for AI practitioners.**
> Covers prompt architecture, thinking modes, enhancement protocols, structured output, web app generation, brand systems, design vocabulary, typography, and quality scoring.

**Version:** v2026.3  
**Framework:** promptc OS

---

## Quick Start

Add to AI instructions:
```
Before generating code, read MASTER_REFERENCE.md and apply the 8-Layer Architecture.
```

---

## Master System Prompt

**Paste into any AI's User Rules / Custom Instructions / System Prompt field:**

```
You are my expert AI assistant, business partner, and creative strategist.
Your job is to always act in MY best interest — not just answer questions,
but proactively identify what I actually need versus what I literally asked.

Rules you must always follow:
1. Be direct — no filler, no fluff, no unnecessary disclaimers.
2. When I ask for code, give WORKING code. Not pseudocode or examples.
3. When I ask for ideas, give me ranked, actionable options — not just lists.
4. Always tell me if there's a better or faster way to do what I'm asking.
5. Default to expert-level responses unless I say otherwise.
6. If my request is vague, make a smart assumption, state it, then proceed.
7. If something I want is risky or suboptimal, flag it, then do it anyway unless I say stop.
8. Remember context within this conversation — never ask me to repeat myself.
9. Format your replies for scanability: use headers, bullets, and bold for key points.
10. Always end complex answers with a "⚡ Recommended Next Step".
```

---

## Advocate Mode

**Start of any important session:**

```
For this entire conversation, I want you to be my advocate, not just my assistant.
That means:
- If I'm about to make a mistake, warn me.
- If there's a better approach, tell me even if I didn't ask.
- Optimize for MY long-term success, not just completing the immediate task.
- If something I ask for could hurt my project, business, or goals, flag it.
- Prioritize quality over speed unless I say otherwise.
- I give you permission to push back on my ideas if you have a good reason.
```

---

## Secret Sauce Modifiers

Append any of these phrases to boost output quality instantly:

| Modifier | What It Makes AI Do |
|----------|-------------------|
| `act as an expert in [field]` | Forces deep, authoritative responses |
| `give me the version a senior dev would write` | Skips beginner-level output |
| `don't explain, just do it` | Removes verbose preambles |
| `think step by step before answering` | Triggers deeper reasoning chain |
| `what would you do if this was your own business?` | Gets honest, opinionated advice |
| `what am I missing or not asking that I should be?` | Surfaces blind spots |
| `give me the 80/20 version` | Highest impact, minimum complexity |
| `assume I'm an expert, skip the basics` | Removes redundant context |
| `be brutally honest` | Removes diplomatic softening |
| `rank these by impact` | Forces prioritization, not listing |

---

## 8-Layer Prompt Architecture

**The universal structure. Use all 8 layers for production-quality outputs.**

```
ROLE → CONTEXT → OBJECTIVE → CONSTRAINTS → AESTHETIC → PLANNING → OUTPUT → REFINEMENT
```

| Layer | Purpose | Missing It Causes |
|-------|---------|------------------|
| **01 Role** | Who the AI acts as | Generic, shallow responses |
| **02 Context** | Product, audience, platform | Misaligned output |
| **03 Objective** | What success looks like | Aimless generation |
| **04 Constraints** | Quality guardrails | Mediocre, unconstrained output |
| **05 Aesthetic** | Design language / tone | Visually dull or off-brand |
| **06 Planning** | Reason before generating | Structural mistakes |
| **07 Output** | Exact format to deliver | Incomplete or disorganized files |
| **08 Refinement** | Self-critique before final | First-draft quality only |

### Full Template

```
ROLE
You are a [expert role].

CONTEXT
Product: [name or description]
Platform: [mobile / web / hybrid]
Audience: [who uses this]

OBJECTIVE
[One clear sentence of what success looks like]
Success criteria:
- [criterion 1]
- [criterion 2]

CONSTRAINTS
- Mobile-first
- WCAG AA accessibility
- 60fps animation budget
- [other constraints]

AESTHETIC
- [visual style keyword 1]
- [visual style keyword 2]
- [tone descriptor]

PLANNING (complete this before generating)
1. Define information architecture
2. Define navigation model
3. Define layout and grid
4. Define interaction and motion logic
5. Validate accessibility and performance plan

OUTPUT FORMAT
Generate:
1. [file or artifact type]
2. [second deliverable]
3. [instructions or explanation]

REFINEMENT
After generating the first draft:
- Critique for clarity and completeness
- Refine once for structure
- Refine once for polish
- Output final result only
```

---

## Animal Thinking Modes

| Animal | Mode | Purpose |
|--------|------|---------|
| 🐇 | Rabbit | Multiply Ideas |
| 🦉 | Owl | Deep Analysis |
| 🐜 | Ant | Break Into Steps |
| 🦅 | Eagle | Big Picture Strategy |
| 🐬 | Dolphin | Creative Solutions |
| 🦫 | Beaver | Build Systems |
| 🐘 | Elephant | Cross-Field Connections |

### Mode Chains

| Goal | Mode Chain | Best For |
|------|------------|----------|
| Build AI Content System | 🦅 Eagle → 🦫 Beaver → 🐜 Ant | Automated content pipelines |
| Solve Complex Problem | 🦉 Owl → 🐬 Dolphin → 🐘 Elephant | Product design, breakthroughs |
| Brainstorm Product | 🐇 Rabbit → 🦅 Eagle → 🐜 Ant | Product ideation |
| Design Workflow | 🦫 Beaver → 🐜 Ant → 🦉 Owl | Automation scripts, SOPs |
| Validate Business | 🦉 Owl → 🐘 Elephant → 🦅 Eagle | Startup validation |

### Individual Mode Prompts

**🐇 Rabbit — Multiply Ideas**
```
Take this idea and multiply it into 10 different variations.
For each variation: change the angle, change the audience, change the format.
Present the results as a list of distinct ideas.
```

**🦉 Owl — Deep Analysis**
```
Think like an owl — slow, observant and analytical.
Examine this problem from multiple perspectives and identify
the hidden factors most people overlook.
```

**🐜 Ant — Break Into Steps**
```
Think like an ant.
Break this goal into the smallest possible steps someone could realistically complete.
```

**🦅 Eagle — Big Picture Strategy**
```
Think like an eagle flying high above the landscape.
Explain the long-term strategy behind this idea and how the pieces connect.
```

**🐬 Dolphin — Creative Solutions**
```
Think like a dolphin — curious, playful and inventive.
Generate creative solutions to this problem that most people wouldn't normally consider.
```

**🦫 Beaver — Build Systems**
```
Think like a beaver building a dam.
Design a practical system that solves this problem step by step.
```

**🐘 Elephant — Cross-Field Connections**
```
Think like an elephant with a powerful memory.
Connect this idea to insights from other fields such as
psychology, economics, science or history.
```

---

## Enhancement Protocols

### Self-Refinement Loop

```
Generate draft →
Critique on: sophistication, uniqueness, performance, platform alignment →
Refine once for structure →
Refine once for polish and consistency →
Output final result only.
```

> Two refinement iterations max. Three absolute maximum. Never re-generate from scratch.

### Chain-of-Thought (CoT)

Append to any complex prompt:
```
Let's think step by step.
```

### Self-Consistency (Creativity Validation)

```
Generate [6-12] layout/approach variants.
Identify the strongest structural patterns across all variants.
Merge the best attributes into one final output.
```

### Tweak Protocol (Systematic Iteration)

```
Refine [specific element] with [specific change].
Lock aesthetic. Preserve hierarchy. Maintain code quality.
Do not change anything else.
```

---

## Structured Output / JSON Techniques

### Global JSON Rule

> Always append when requesting JSON:

```
Respond EXCLUSIVELY with valid JSON — no explanations, no markdown fences, no extra text.
Use double quotes only. No trailing commas. No comments inside JSON.
Unknown values use "TBD". Output must pass JSON.parse() without errors.
```

### Technique 1 — Role + Strict Schema

```
You are an expert [role].
Analyze the [input] and respond EXCLUSIVELY with valid JSON.
Use this exact schema:
{
  "key": "value",
  "nested": { "subkey": "subvalue" },
  "array": [ { "item": "value" } ]
}
Input: [your input]
```

### Technique 2 — Few-Shot Examples (Best for Local Models)

```
Example 1:
Input: "A freelance photographer portfolio site"
Output: { ...valid JSON... }

Example 2:
Input: "Local gym with classes and membership info"
Output: { ...valid JSON... }

Now process:
Input: "[real input]"
Output:
```

### Technique 3 — Chain-of-Thought + Structured Output

```
First, think step by step internally:
1. Identify core business type and goals.
2. List essential pages.
3. For each page, identify 3-5 sections.
Then output ONLY the JSON. Do not include your reasoning in the output.
```

### Technique 4 — Validation Guardrails

```
After generating the JSON:
- Verify all keys match the schema exactly
- Check for trailing commas and fix them
- Confirm all strings use double quotes
- Replace any undefined values with "TBD"
- Ensure the result passes JSON.parse() without errors
```

---

## Web App Prompt Framework

### Master Template

```
You are a senior full-stack developer and product designer.

ROLE: Senior full-stack developer + product designer

GOAL: [Describe your app in one sentence]

FUNCTIONAL REQUIREMENTS
- Dynamic UI components
- Mobile-first responsive layout
- Interactive sections with user feedback
- Modular, reusable component architecture

UI/UX DESIGN LANGUAGE
- Ultra-modern Gen-Z aesthetic
- High-contrast typography
- Bold color gradients
- Glassmorphism panels
- Smooth micro-interactions

TECHNICAL STACK
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- Animation: Framer Motion or GSAP
- Components: shadcn/ui

OUTPUT FORMAT
Generate:
1. Project folder structure
2. Full source code (all files)
3. Instructions to run locally

CONSTRAINTS
- Mobile-first always
- WCAG AA accessibility minimum
- 60fps animation budget
- No placeholder lorem ipsum content

AESTHETIC LOCK
dark-mode native | neon-accent sparse | typography-first | hierarchy clear
```

### Three Layers Rule

```
FUNCTION   →  What does the app DO?
DESIGN     →  What does it LOOK and FEEL like?
TECHNOLOGY →  What STACK runs it?
```

---

## Design Vocabulary

### Core Visual Effects

| Term | Effect |
|------|--------|
| **glassmorphism** | Frosted glass panels, translucent backdrop |
| **brutalist ui** | Raw, oversized, high-contrast |
| **kinetic typography** | Text that animates, morphs, reacts to scroll |
| **bento grid** | Mosaic card layout, Apple-style asymmetric grid |
| **micro-interactions** | Tiny animations on hover, click, scroll |
| **neon accent** | Single bright color pop against dark |
| **liquid gradient** | Smooth, animated, shifting color blends |
| **dark-mode native** | Designed for dark backgrounds first |

### Advanced Effects

| Term | Effect |
|------|--------|
| **neo-brutalism** | Bold shadows, flat colors, thick borders |
| **aurora gradients** | Soft flowing northern lights effect |
| **noise grain** | Textured overlay adding depth |
| **blur overlay** | Background blur for focus |
| **morph shapes** | Organic transforming shapes |
| **tilt 3d** | Parallax depth on cards |
| **particle systems** | Interactive floating elements |
| **scanline effect** | Retro CRT horizontal lines |
| **chromatic aberration** | RGB split glitch effect |
| **mesh gradient** | Multi-color organic blending |
| **claymorphism** | 3D soft plastic appearance |

### Design Combos

| Combo | Elements | Best For |
|-------|----------|----------|
| **🫧 Glass + Bento** | glassmorphism, bento grid, dark-mode | Dashboards, data viz |
| **💥 Brutal + Neon** | brutalist, neon accent, kinetic | Landing pages, bold brands |
| **🌊 Liquid + Ambient** | liquid gradient, ambient motion | Hero sections, immersive |
| **📰 Editorial + Bento** | editorial, bento grid, progressive | Content platforms, blogs |
| **✨ Micro + Skeleton** | micro-interactions, skeleton loading | Apps, data-heavy interfaces |
| **🚀 Full Immersive** | kinetic, liquid, micro, ambient | Marketing sites, launches |
| **🎮 Cyberpunk Glow** | neon, chromatic, scanline, dark | Gaming, crypto, tech |
| **💎 Premium Minimal** | glass, noise grain, duotone | Luxury brands |

---

## Typography

### Gen-Z Typography Combos

| Display Font | Mono Pairing | Best For |
|--------------|--------------|----------|
| **Space Grotesk** | JetBrains Mono | Tech startups, SaaS |
| **Syne Bold** | JetBrains Mono | Creative agencies, portfolios |
| **Clash Display** | Space Mono | Fashion, luxury, premium |
| **Inter Tight** | JetBrains Mono | Dashboards, enterprise apps |

### Infographic Typography

| Use Case | Font Combination |
|----------|------------------|
| **Data Viz** | Space Grotesk (headers) + Inter (body) + JetBrains Mono (numbers) |
| **Creative** | Syne (display) + Space Grotesk (body) + Clash Display (accent) |
| **Mobile** | Inter Tight (headlines) + Inter (body) + SF Pro (UI) |

---

## Prompt Lint Rules

| Rule ID | Check | Autofix? |
|---------|-------|----------|
| `missing-role` | Does the prompt define who the AI should act as? | ✅ Add default role |
| `missing-constraints` | Does the prompt define explicit limits? | ✅ Add mobile-first, WCAG, 60fps |
| `missing-objective` | Does the prompt state a clear success condition? | ❌ Must be user-defined |
| `vague-language` | Does it use: nice, cool, awesome? | ✅ Replace with specific terms |
| `missing-output-format` | Does it specify what files/format to generate? | ❌ Must be user-defined |
| `missing-planning` | For UI prompts, is there a planning phase? | ❌ Must be user-defined |

### Vague Words to Replace

| Avoid | Replace With |
|-------|--------------|
| `nice` | `clear and intentional` |
| `cool` | `high-contrast and dynamic` |
| `modern` | `[specific aesthetic keyword]` |
| `awesome` | `visually striking and purposeful` |
| `good design` | `typographically strong with clear hierarchy` |

---

## Quality Checklist

```
STRUCTURE
  [ ] Role defined — who is the AI acting as?
  [ ] Goal clear — one sentence maximum
  [ ] Objective and success criteria stated
  [ ] Constraints listed explicitly

DESIGN (for UI/UX prompts)
  [ ] Platform specified — mobile or web or hybrid
  [ ] 3+ aesthetic keywords included
  [ ] Animation library named
  [ ] Mobile-first stated explicitly

TECHNICAL
  [ ] Stack specified — framework + styling + animation
  [ ] Output format requested
  [ ] Accessibility: WCAG AA minimum stated
  [ ] Performance: 60fps animation budget stated

QUALITY
  [ ] No vague words
  [ ] Refinement instruction included
  [ ] At least one interaction metaphor defined

ANIMAL MODE (optional power-up)
  [ ] Mode selected or chained appropriately
```

---

## Prompt Scoring Dimensions

| Dimension | What It Measures | Max Score |
|-----------|-----------------|----------|
| **Clarity** | Is the goal unambiguous? | 10 |
| **Structure** | Does it follow the 8-layer architecture? | 10 |
| **Constraints** | Mobile-first? Accessibility? Performance? | 10 |
| **Predictability** | Does it specify output format and refinement? | 10 |
| **Overall** | Average of all four dimensions | 10 |

### Score Interpretation

| Score | Quality Level | Action |
|-------|---------------|--------|
| 9–10 | Production ready | Ship it |
| 7–8 | Good, minor gaps | Add missing constraints |
| 5–6 | Partial structure | Add role + output format |
| 3–4 | Weak, vague | Rebuild using 8-layer template |
| 1–2 | Single vague sentence | Start over with master template |

---

## Task-Specific Prompts

### YouTube Content Creation

```
Act as a YouTube growth strategist with 10 years of experience.
When I give you a topic, automatically:
1. Identify the 3 best angles for that niche
2. Generate a scroll-stopping title using proven CTR patterns
3. Write a structured script with hook, body, and CTA
4. Suggest 5 SEO-optimized tags

Topic: [your topic here]
```

### Coding / Engineering

```
You are a senior software engineer and architect.
When I describe a feature, always:
- Ask clarifying questions ONLY if something is truly ambiguous
- Write production-ready code, not demo code
- Add error handling automatically
- Explain the "why" behind any non-obvious decision in a single comment
- Flag performance or security concerns before I ask
```

### Business / Strategy

```
Act as my COO and strategist. When I describe a problem or goal:
- Identify the fastest path to results (the 80/20 solution)
- Separate what I MUST do from what is optional
- Give me a prioritized action plan, not just advice
- Tell me what successful people in this space actually do, not just theory
```

### Research / Summarizing

```
You are a research assistant. When I give you content to analyze:
- Extract the 3-5 most actionable insights
- Identify what is missing or what I should also know
- Format as: Key Insight → Why It Matters → Action I Can Take
```

---

## Resources

| Resource | Link |
|----------|------|
| GitHub Repository | https://github.com/marktantongco/promptc |
| AI Visual Synthesis | https://github.com/marktantongco/ai-visual-synthesis |
| Master Reference Raw | https://raw.githubusercontent.com/marktantongco/promptc/master/MASTER_REFERENCE.md |

---

_promptc OS · v2026.3 · github.com/marktantongco/promptc_
