# Chain-of-Thought Reasoning

## Context

Activate this skill when the user presents a **complex problem** that benefits from explicit, step-by-step reasoning before arriving at a conclusion. This includes:

- Multi-step mathematical, logical, or analytical problems
- Architecture or design decisions with many moving parts
- Debugging scenarios requiring causal reasoning
- Any task where showing the reasoning process is as valuable as the answer
- Situations where the agent might otherwise jump to a wrong conclusion by skipping steps

**Do not use** for simple factual lookups, greetings, or tasks where the user only wants a direct answer.

## Instructions

### Step 1: Restate the Problem
Paraphrase the problem in your own words to confirm understanding. Identify what is being asked, what is given, and what the expected output looks like.

### Step 2: Identify and State Assumptions
List every assumption you are making before reasoning begins. Number them explicitly. If any assumption is uncertain, flag it with `[ASSUMPTION — UNVERIFIED]`.

### Step 3: Decompose into Sub-Problems
Break the problem into the smallest discrete steps possible. Each step should be independently verifiable. Assign a number to each step.

### Step 4: Solve Each Step Explicitly
For every sub-problem:
- State what you are calculating or reasoning about
- Show the work (equations, logic, references)
- State the intermediate result
- Verify the result makes sense before moving on

### Step 5: Cross-Check and Validate
After completing all steps, revisit the chain:
- Do the intermediate results chain together correctly?
- Does the final answer satisfy the original problem statement?
- Run a quick sanity check (e.g., back-of-the-envelope, boundary test)

### Step 6: Flag Uncertainties
After presenting the final answer, list any remaining uncertainties, caveats, or areas where assumptions could change the result. Rate confidence as High / Medium / Low for each.

## Constraints

1. **Never skip steps.** Every logical jump must be explicit. If you find yourself wanting to skip, add a step explaining why.
2. **Number every step.** Use `Step N:` format consistently.
3. **Assumptions come first.** Never reason from hidden assumptions — state them upfront.
4. **Show your work.** Intermediate calculations, logical derivations, and references must be visible.
5. **One conclusion per chain.** If the problem branches, start a new numbered chain for each branch.
6. **Flag, don't hide.** If you are unsure about a step, mark it clearly rather than presenting it as confident.
7. **No premature answers.** The final answer appears only after Step 5 is complete.

## Examples

### Example 1: Technical Architecture Decision

**User:** "We need to choose between a monolith and microservices for our e-commerce platform with 50k daily users."

**Output:**

```
Chain-of-Thought Reasoning

Step 1: Restate the Problem
  We must choose between a monolithic architecture and microservices for an
  e-commerce platform serving approximately 50,000 daily active users. The
  decision should optimize for reliability, developer velocity, and future
  scalability.

Step 2: Assumptions
  1. [ASSUMPTION] The team size is small-to-medium (3–10 developers).
  2. [ASSUMPTION] Traffic growth is expected to be steady, not exponential.
  3. [ASSUMPTION — UNVERIFIED] The platform includes checkout, inventory,
     user accounts, and a recommendation engine.

Step 3: Decompose
  3a. Evaluate monolith against our criteria
  3b. Evaluate microservices against our criteria
  3c. Compare at current scale (50k DAU)
  3d. Compare at projected 2x scale
  3e. Consider team-structure alignment

Step 4: Solve
  4a. Monolith: simpler deployment, single database, faster initial dev...
  4b. Microservices: independent scaling per service, fault isolation...
  4c. At 50k DAU, a well-built monolith handles this comfortably...
  4d. At 100k DAU, checkout may need independent scaling...

Step 5: Cross-Check
  The monolith is the stronger fit at current scale. Microservices become
  justified when a specific service hits a scaling ceiling.

Step 6: Uncertainties
  - [Medium confidence] Assumption #1 about team size — if the team is
    larger than 15, microservices gain advantage.
  - [Low confidence] Future traffic projections are not confirmed.

Recommendation: Start with a modular monolith...
```

### Example 2: Mathematical Problem

**User:** "A factory produces 400 units/day. Defect rate is 3%. Each defective unit costs $15 to rework. What is the monthly rework cost?"

**Output:**

```
Chain-of-Thought Reasoning

Step 1: Restate the Problem
  Calculate total monthly cost of reworking defective units given a daily
  production of 400 units with a 3% defect rate and a $15 rework cost per
  defective unit.

Step 2: Assumptions
  1. The factory operates 7 days a week (30-day month).
  2. Defect rate is consistent and independent of production volume.

Step 3: Decompose
  3a. Calculate daily defective units
  3b. Calculate daily rework cost
  3c. Calculate monthly rework cost

Step 4: Solve
  4a. Daily defective units = 400 × 0.03 = 12 units
  4b. Daily rework cost = 12 × $15 = $180
  4c. Monthly rework cost = $180 × 30 = $5,400

Step 5: Cross-Check
  Sanity: 3% of 400 is ~12. 12 × 30 = 360 defective/month.
  360 × $15 = $5,400. ✓ Matches.

Step 6: Uncertainties
  - [Low confidence] Operating days assumption — if 5-day work week,
    result drops to ~$3,900/month.

Final Answer: $5,400/month under 7-day operations.
```
