# Skill Finder - AI Agent Skills Discovery and Evaluation Meta-Skill

> Automates the discovery, evaluation, and installation of AI agent skills from community repositories and platforms. Ensures every new skill is vetted before installation and never duplicates existing capabilities.

*Version: 1.0 | Last Updated: April 2026*

---

## Context

This skill is for finding and evaluating new AI agent skills from external sources. It prevents skill duplication, ensures security vetting, and maintains MECE discipline (one type of work, one owner skill, zero overlap, zero gaps).

Use this skill when:
- You need a capability that doesn't exist in your current skills library
- You want to discover what skills the community has created
- Someone shares a skill URL or recommendation
- You want to periodically audit and expand your skills library
- You need to evaluate whether a skill is safe and valuable before installing

---

## Instructions

### Step 1: Check Existing Skills First (MANDATORY)

Before searching externally, ALWAYS check `/home/z/my-project/skills/` for existing coverage:

```
Check list:
- [ ] Scan all SKILL.md files in /home/z/my-project/skills/
- [ ] Search for keywords related to the needed capability
- [ ] Check if an existing skill partially covers the need (extend, don't duplicate)
- [ ] If found -> EXTEND the existing skill. If not -> proceed to discovery.
```

### Step 2: Search External Sources

Use these discovery sources in priority order:

**Primary Sources:**

| Source | URL | Type | Notes |
|--------|-----|------|-------|
| **skills.sh** | https://skills.sh/trending | Open standard marketplace | Platform-agnostic, works with 40+ agents |
| **GitHub search** | `github.com search: SKILL.md` | Direct search | Find repos with SKILL.md files |
| **Awesome Claude Code** | github.com/.../awesome-claude-code | Curated list | Community-maintained, regularly updated |
| **Anthropic Academy** | anthropic.skilljar.com/claude-code-skills | Official courses | High quality, beginner-friendly |

**Secondary Sources:**

| Source | URL | Type | Notes |
|--------|-----|------|-------|
| **Agent Skills Standard** | https://agentskills.io | Open spec | Reference for creating compatible skills |
| **Claude Skills Library** | github.com/aiaiohhh/claude-skills-library | Collection | 36 marketing/dev skills |
| **Google/GitHub search** | Search: `"SKILL.md" + [topic]` | Broad search | Good for niche skills |

### Step 3: Evaluate Each Candidate Skill

For every skill found, run this evaluation checklist:

```
SKILL EVALUATION SCORECARD

1. RELEVANCE (0-10)
   - Does it solve a real, recurring need?
   - Is the use case clear and well-defined?
   - Score: __/10

2. QUALITY (0-10)
   - Does it have clear context/instructions/constraints/examples?
   - Is the SKILL.md well-structured and complete?
   - Does it follow best practices?
   - Score: __/10

3. COMPATIBILITY (0-10)
   - Does it work with our environment?
   - Does it require platform-specific features we don't have?
   - Can it be adapted to our skill format?
   - Score: __/10

4. SECURITY (0-10)
   - Does it request unnecessary permissions?
   - Does it execute external code without review?
   - Does it have any suspicious patterns?
   - Score: __/10

5. MAINTAINABILITY (0-10)
   - Is it actively maintained?
   - Does it have clear versioning?
   - Can it be extended without breaking?
   - Score: __/10

6. DUPLICATION CHECK
   - Does any existing skill cover >50% of this capability?
   - If yes: EXTEND existing skill instead of installing new one
   - If no: PROCEED with installation
   - Result: EXTEND / PROCEED / REJECT

TOTAL SCORE: __/50
MINIMUM TO INSTALL: 30/50
```

### Step 4: Vet for Security (MANDATORY)

Before any installation, check for these red flags:

```
SECURITY RED FLAGS (any ONE = automatic rejection)

- [ ] Requests filesystem access outside project directory
- [ ] Executes arbitrary shell commands without user confirmation
- [ ] Makes network requests to unknown/suspicious domains
- [ ] Contains obfuscated or minified code
- [ ] Requires root/admin privileges
- [ ] Reads or writes sensitive files (SSH keys, env vars, tokens)
- [ ] Has no license or uses a restrictive license
- [ ] Was created by an unverified or anonymous author with no community trust
- [ ] Contains hardcoded credentials, API keys, or tokens
- [ ] Modifies system files or package manager configurations
```

### Step 5: Install the Skill

If the skill passes all checks:

1. **Create directory**: `mkdir -p /home/z/my-project/skills/{skill-name}/`
2. **Save SKILL.md**: Write the skill file to the directory
3. **Adapt format**: Ensure it follows our SKILL.md structure:
   - `context`: What the skill is for and when to use it
   - `instructions`: Step-by-step workflow from input to output
   - `constraints`: Hard rules the skill must never violate
   - `examples`: 1-2 samples of ideal output
4. **Log the installation**: Record in worklog with skill name, source, date, and evaluation score

### Step 6: Verify Installation

After installing:
```
VERIFICATION CHECKLIST
- [ ] SKILL.md exists at correct path
- [ ] Skill has all 4 required sections (context, instructions, constraints, examples)
- [ ] Skill does not conflict with existing skills
- [ ] Skill references are correct (no broken paths)
- [ ] Skill has been tested with a sample input
```

### Step 7: Schedule Periodic Audits (Optional)

To keep the skills library current, set up a recurring audit:

```
AUDIT FREQUENCY: Monthly
AUDIT TASKS:
1. Check each skill for updates from its source
2. Evaluate new trending skills on skills.sh
3. Review Anthropic Academy for new course content
4. Check for deprecated or broken skills
5. Update skill versions and changelogs
6. Report findings to user
```

---

## Constraints

- NEVER install a skill without running the security vet
- NEVER install a skill that duplicates >50% of an existing skill's functionality
- NEVER install a skill that scores below 30/50 on the evaluation scorecard
- NEVER skip the "check existing skills first" step
- NEVER install a skill without testing it with a sample input
- NEVER modify existing skills during installation without user approval
- NEVER install skills from untrusted sources without additional scrutiny

---

## Examples

### Example 1: Discovering a New Skill

**Scenario:** User needs a capability for generating flowcharts from text.

**Step 1 - Check existing:** Scan `/home/z/my-project/skills/`... Found `charts` skill with Mermaid reference. It already covers flowcharts. **RESULT: EXTEND existing skill, do not install new one.**

**Step 2 - Skip (not needed).**

**Step 3 - Extend:** Add flowchart-specific templates to the existing `charts` skill.

### Example 2: Installing a New Skill

**Scenario:** User needs a capability for conducting JTBD product research.

**Step 1 - Check existing:** Scan skills... No product research or JTBD skill found. **RESULT: PROCEED to discovery.**

**Step 2 - Search:** Found `snowtema/ajtbd-skills` on GitHub (56 stars, active maintenance).

**Step 3 - Evaluate:**
- Relevance: 9/10 (directly solves the need)
- Quality: 8/10 (well-structured, 7 chained skills)
- Compatibility: 6/10 (Claude-specific format, needs adaptation)
- Security: 9/10 (no red flags, well-documented)
- Maintainability: 7/10 (active repo, clear structure)
- Total: 39/50 **PASS**

**Step 4 - Security:** No red flags detected.

**Step 5 - Install:** Created `/home/z/my-project/skills/jtbd-research/SKILL.md` adapted to our format.

**Step 6 - Verify:** All checklist items passed.

---

## Source Directory

The following sources are pre-verified and regularly monitored:

| Source | URL | Last Checked | Status |
|--------|-----|-------------|--------|
| skills.sh Trending | https://skills.sh/trending | 2026-04-11 | Active |
| Anthropic Academy | https://anthropic.skilljar.com/claude-code-skills | 2026-04-11 | Active |
| Agent Skills Standard | https://agentskills.io | 2026-04-11 | Active |
| Claude Skills Library | https://github.com/aiaiohhh/claude-skills-library | 2026-04-11 | Active |
| Awesome Claude Code | GitHub search | 2026-04-11 | Active |

---

*This meta-skill follows the operating principle: build systems, not one-off tasks. Every skill found is vetted, scored, and integrated into a growing, self-maintaining skills library.*
