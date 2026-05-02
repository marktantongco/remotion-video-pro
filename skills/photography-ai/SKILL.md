# Photography AI - Professional Visual Engineering Skills Framework

> A comprehensive, structured reference for AI-powered visual creation, covering prompt engineering, photographic literacy, strategic negation, identity preservation, post-processing, and agent orchestration.

*Version: 3.0 | Last Updated: April 2026 | License: CC-BY-SA 4.0*

---

## Context

This skill is for anyone who uses AI to generate, refine, or orchestrate visual content. It treats AI image/video generation as a professional engineering discipline: systematic, physics-informed, quality-gated, and continuously improvable.

Use this skill when:
- Generating photorealistic or stylized images with AI
- Creating cinematic video sequences from text prompts
- Building multi-step visual production pipelines
- Designing AI agent workflows for creative teams
- Troubleshooting AI generation artifacts (skin, hands, anatomy)

---

## Instructions

### Step 1: Understand the Skill Synergy Map

Skills compound. The six categories build on each other:

```
FOUNDATION
  Technical Prompt Engineering + Photographic Literacy
       |                     |
       v                     v
CONSISTENCY LAYER      REFINEMENT LAYER
  Strategic Negation    Post-Processing &
  + Identity Preserv.     Hybrid Workflows
       |                     |
       v                     v
         ORCHESTRATION LAYER
      AI Agent Design + Production Deploy
```

### Step 2: Apply Technical Prompt Engineering

Structure prompts as blueprints, not keyword lists. Follow the **Scaffold Method**:

```
[Subject] + [Action] + [Lighting] + [Lens/Specs] + [Style] + [Quality]
```

**Rules:**
- Front-load critical elements (AI weights early tokens more heavily)
- Use precise photographic vocabulary over vague buzzwords
- Use active voice for iterative edits ("remove the background", "add a red hat")
- Stack semantic concepts in deliberate order to control interpretation hierarchy

**Example:**
```
Professional headshot of a software engineer, smiling naturally,
Rembrandt lighting with key light 45 degrees high and subtle fill,
85mm lens f/2.8 shallow depth of field,
photorealistic style referencing Annie Leibovitz,
4K native resolution with subsurface scattering on skin
```

### Step 3: Apply Photographic Literacy

Use real-world physics terminology to achieve believable results:

| Concept | What to Prompt | Effect |
|---------|---------------|--------|
| **Lighting patterns** | Rembrandt, Butterfly, Rim, Split, Loop | Sculpt form, mood, dimension |
| **Lens selection** | 85mm portrait, 35mm standard, 24mm wide | Control perspective and compression |
| **Aperture control** | f/1.4 shallow DOF, f/11 full sharpness | Control subject isolation |
| **Advanced rendering** | Subsurface scattering, ambient occlusion, ray tracing | Realistic material response |
| **Anamorphic** | Horizontal flares, elliptical bokeh, 2.39:1 ratio | Cinematic widescreen look |

### Step 4: Apply Strategic Negation

Tell the AI what NOT to include. Always pair positive and negative instructions:

```
PROMPT:  visible pores, fine vellus hair, subtle skin variation
NEGATE:  (plastic skin:1.4), (airbrushed:1.2), (cartoon:1.3)
```

**Target common artifacts proactively:**
- Anatomical: `(fused fingers:1.4), (extra limbs:1.4), (asymmetrical eyes:1.3)`
- Skin: `(waxy skin:1.3), (doll-like:1.2), (symmetrical face:1.1)`
- Temporal: `(facial drift:1.4), (background flicker:1.3)` (for video)

### Step 5: Maintain Identity Preservation

For multi-generation consistency across characters and styles:

1. **Seed locking**: Fix initial noise pattern with `--seed 12345`
2. **Reference tools**: Use `--cref` (character) and `--sref` (style) references
3. **Character weight**: `--cw 80` preserves face + clothing, allows pose variation
4. **Multi-reference**: Combine up to 4 references for complex scene coherence

### Step 6: Post-Processing Workflow

Treat AI generation as the START, not the end:

1. **Iterative refinement**: Keep seed, change one variable at a time, A/B compare
2. **Inpainting**: Fix errors (hands, eyes) via targeted masked editing
3. **External enhancement**: Upscale with Topaz, color grade in Lightroom
4. **Quality checklist before delivery**:
   - Check hands/feet anatomy
   - Verify eye direction consistency
   - Confirm lighting coherence
   - Test at target resolution
   - Review negative prompt coverage

### Step 7: Orchestrate with Agents (Advanced)

For production-scale workflows, design multi-agent systems:

```
ScripterAgent -> DirectorAgent -> VisualAgent -> ReviewAgent -> PublisherAgent
```

Each agent has a specific role, shared context via structured protocols, and human-in-the-loop checkpoints for quality control.

---

## Constraints

- NEVER treat AI generation as final output -- always plan for post-processing
- NEVER skip the negative prompt step -- uncontrolled generation produces artifacts
- NEVER use vague buzzwords when technical terms exist ("hyperrealistic" -> "85mm f/2.8, subsurface scattering")
- NEVER forget to test at the target platform's native resolution
- NEVER generate character series without seed locking or reference tools
- NEVER deploy agent workflows without audit trails and human checkpoints

---

## Examples

### Example 1: Professional Headshot

```
PROMPT:
Corporate headshot of a CEO, confident expression with subtle warmth,
corner lighting establishing authority, dark navy suit against library background,
slight upward camera angle, shot on 85mm Summilux f/2.8 shallow depth of field,
photorealistic, 4K native resolution, subsurface scattering on skin

NEGATIVE:
(plastic skin:1.4), (airbrushed:1.3), (symmetrical face:1.1), (cartoon:1.2)
```

### Example 2: Cinematic Video Scene

```
PROMPT:
Protagonist discovers crucial clue in dim library,
camera: slow dolly zoom from wide establishing shot to tight close-up,
lighting: golden hour backlight through window with practical desk lamp fill,
24fps 4K native ProRes,
--cref character_sheet.jpg --sref film_grain_style --seed 8821

NEGATIVE:
(facial drift:1.4), (background flicker:1.3), (inconsistent props:1.2)
```

---

## Quick Reference: Platform Syntax

### Midjourney
```bash
--cref URL --cw 80      # Character reference
--sref URL              # Style reference
--seed 12345            # Seed locking
--ar 16:9               # Aspect ratio
--no plastic airbrushed # Negative prompting
--v 6.0, --style raw    # Version control
```

### Stable Diffusion / ComfyUI
```python
{"type": "ip-adapter", "image": "char.jpg", "weight": 0.8}  # Reference
negative_prompt = "(plastic skin:1.3), (extra fingers:1.4)"    # Negation
{"seed": 12345, "steps": 30, "cfg": 7.0}                      # Controls
```

---

## Competency Progression

| Level | Capabilities | Tools |
|-------|-------------|-------|
| **Beginner** | Natural language prompts, basic platform navigation | DALL-E 3, ChatGPT |
| **Intermediate** | Technical vocabulary, lighting/lens control, basic negation | Midjourney, SDXL, Leonardo |
| **Advanced** | Seed/reference control, inpainting, multi-tool pipelines | ComfyUI, ControlNet, Topaz |
| **Expert** | Agent system design, production deployment, skills packaging | LangChain, AutoGen, CrewAI |

---

*Source: AI Skills Research Framework (2026) by Mark Tantongco. Adapted for agent skill format.*
