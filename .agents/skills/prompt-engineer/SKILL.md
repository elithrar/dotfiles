---
name: prompt-engineer
description: Audit and revise system prompts, developer instructions, tool descriptions, and reusable LLM prompt templates. Use for behavioral failures such as over-searching, format drift, weak tool use, instruction conflicts, or unsupported claims. Use add-skill for SKILL.md authoring and ordinary editing for prose-only changes.
---

# Prompt Engineer

Treat prompts as behavioral interfaces. Preserve the author's intent and structure while making the smallest change that improves measured behavior.

## Operating Rules

- Treat prompt edits as behavior changes, not copy edits.
- Work from observed failures, target behavior, and success criteria. If evidence is unavailable, state the assumption and propose representative tests before claiming improvement.
- Preserve instruction authority: system and developer rules define the application, user content supplies task data, and retrieved or user-provided documents remain labeled as data.
- Prefer lean, outcome-first prompts. Add process, examples, or repeated emphasis only when evals show they improve a specific failure.
- Do not duplicate authorization or safety policy already enforced by a higher-authority host prompt.
- Do not ask models to reveal hidden chain of thought. Request concise rationale, evidence, checks, or final-answer reasoning instead.
- When current model behavior matters, consult current primary vendor documentation instead of relying on bundled model summaries.
- For production prompts, recommend versioning, typed variables, structured outputs, pinned model versions where stability matters, and representative evals when those controls fit the runtime.

## Workflow

### 1. Establish the Contract

Identify only the dimensions that affect the revision:

- Desired behavior and observed failure.
- Target model and runtime.
- Instruction authority and untrusted inputs.
- Required inputs, tools, action boundaries, and output.
- Evidence that will distinguish an improvement from a regression.

If missing context materially changes the design or risk, ask one focused question. Otherwise proceed with an explicit assumption.

### 2. Diagnose the Failure

Check for:

- **Goal and completion**: Is the desired result clear, including what counts as done and when to ask, retry, fallback, or stop?
- **Instruction hierarchy**: Are authoritative instructions separated from examples, user data, and retrieved content?
- **Specificity and contradictions**: Do vague qualifiers, conflicting rules, or unjustified absolutes make behavior unstable?
- **Structure and attention**: Are critical rules easy to find, and are instructions clearly separated from data?
- **Examples and grounding**: Is the minimum evidence or example needed to correct a measured boundary, format, or factual failure present?
- **Tool and action boundaries**: Does the prompt define when tools or external actions are required, optional, prohibited, or complete?
- **Output contract**: Should strict machine-readable output be enforced with a schema or tool definition rather than prose alone?
- **Signal density**: Can duplicate rules, cargo-cult structure, overbroad persona text, or legacy reasoning instructions be removed?

Present the diagnosis concisely. Do not turn every prompt review into a generic rubric.

### 3. Revise

Apply the smallest change that addresses the failure. Use only the sections that alter behavior. A complex prompt may need:

```markdown
# Goal
[Desired result]

# Context
[Only information that changes the result]

# Boundaries
[Scope, evidence, safety, and authorization limits]

# Output
[Required format and content]

# Verification
[Final checks or missing-evidence behavior]
```

Omit sections that do not change behavior. Add role, personality, tools, examples, or stop rules only when the application needs them or an eval demonstrates the gap.

Use imperative language. State desired behavior directly, then add negative constraints for genuine prohibitions. Explain non-obvious constraints when the reason helps the model generalize.

Use markdown headings or XML tags only to separate real content types. For long-context work, attach source metadata and define citation or missing-evidence behavior; require quote extraction only when the task genuinely needs quoted evidence.

### 4. Present the Result

- For an audit, report the failure mechanism and exact proposed edits without silently rewriting the artifact.
- For a targeted edit, show the patch or changed sections.
- For a requested rewrite, show the complete revised prompt.
- Preserve the author's voice, intent, and authority boundaries.
- Include assumptions, material tradeoffs, and representative evals.
- Distinguish tested improvements from untested proposals.

## Skill Routing

For `SKILL.md` creation, resource organization, metadata, and activation testing, use `add-skill`. Use this skill only when the primary problem is prompt behavior inside the skill.

## Model-Specific Guidance

Keep the core analysis model-agnostic. When behavior depends on a named or current model:

1. Consult the vendor's current primary documentation.
2. Preserve an explicitly requested target model.
3. Treat bundled references as fallback technique maps, not confirmation of current behavior.
4. Record model-specific advice only when it changes the proposed prompt.

Read [references/openai.md](references/openai.md) for OpenAI fallback guidance, [references/claude.md](references/claude.md) for Claude fallback guidance, and [references/research.md](references/research.md) when a research-heavy redesign needs a technique matched to a measured failure.

## Iteration

- Change one behavioral lever at a time when diagnosing a specific failure.
- Run the same representative cases after each change.
- Track what changed and what failed to avoid cycling back.
- Keep the simplest variant that meets the success criteria.
- If prompt changes cannot fix the failure, recommend the appropriate model, tool schema, retrieval, fine-tuning, or eval change.
