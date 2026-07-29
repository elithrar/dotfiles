---
name: add-skill
description: Create or update reusable Agent Skills for Codex, ChatGPT, Claude, OpenCode, and other compatible hosts. Use when defining a SKILL.md trigger boundary, workflow, supporting resources, metadata, or activation and output evals.
---

# Creating Agent Skills

Create skills for reusable, task-specific workflows that need procedural guidance, domain knowledge, tools, or packaged resources.

Use `AGENTS.md` for durable repository conventions and prompt or thread context for one-off instructions. Do not create a skill merely to restate behavior the host already provides reliably.

Treat every skill as a behavioral artifact: define its activation boundary, intended behavior, evidence of success, and safe failure behavior.

## Workflow

1. Resolve the target hosts, installation scope, expected user requests, non-trigger near misses, dependencies, and safety boundaries.
2. For an existing skill, read its complete `SKILL.md` and directly referenced resources before proposing changes.
3. Identify the smallest reusable workflow and decide whether instructions alone are sufficient.
4. Add `references/` for on-demand knowledge, `scripts/` for repeated deterministic work, and `assets/` only for files used in outputs.
5. Write a concise description that distinguishes this skill from adjacent skills.
6. Define expected inputs, workflow steps, outputs, unsupported inferences, and ask, stop, or fallback conditions.
7. Validate the skill against the target host or specification.
8. Test activation and task behavior with representative positive, negative, incomplete, and edge cases.

## Structure

Portable Agent Skills require `SKILL.md` with `name` and `description`. Keep host-specific metadata outside the portable core when possible.

```text
skill-name/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
├── scripts/
├── assets/
└── evals/
```

- `name`: 1-64 lowercase letters, digits, and hyphens; match the directory name.
- `description`: 1-1024 characters; state what the skill does and when to use it.
- `agents/openai.yaml`: Optional Codex and ChatGPT UI metadata, invocation policy, and tool dependencies.
- `evals/`: Harness-specific evaluation fixtures, not part of the portable skill format.

For widest Codex and ChatGPT compatibility, keep frontmatter to `name` and `description` unless the target host explicitly supports additional fields.

Keep `SKILL.md` concise. Move details to directly linked resources when they are not required on every invocation. Keep references one level deep from `SKILL.md`.

## Description Design

Front-load the recognizable user goal and important trigger terms because hosts may truncate descriptions.

Include:

- What workflow the skill performs.
- Requests, artifacts, tools, or file types that should activate it.
- A routing boundary when overlap with another installed skill is likely.

Prefer direct, natural wording. Do not require third-person grammar when a shorter imperative or verb-led description is clearer.

## Match Specificity to Fragility

- **High freedom**: Use concise guidance when multiple approaches are valid and context determines the choice.
- **Medium freedom**: State a preferred pattern and the conditions for meaningful alternatives.
- **Low freedom**: Provide an exact command or deterministic script when ordering, consistency, or safety is fragile.

Use imperative language, assume agent competence, and use one term consistently. Do not hard-code changeable product facts as durable truth. Fetch current primary documentation when the workflow requires current behavior, or clearly label bundled material as fallback guidance.

## Resource Design

Add a command table, prerequisite check, or workflow checklist only when it materially improves repeated execution.

When a dependency is required, define:

- How to verify it.
- Whether a fallback exists.
- What exact blocker to report when it is unavailable.

A missing optional tool does not mean the skill itself is inapplicable.

Prefer instructions over scripts. Add a script only for repeated mechanical work or deterministic reliability, document its dependencies, and run it before claiming the skill is complete.

## Evaluation

Test activation and execution separately.

Activation cases should include:

- A direct request.
- An indirect request expressing the same goal.
- An incomplete request that should prompt one focused question.
- A plausible near miss that should not activate the skill.
- An edge case involving unsupported data or action.

Execution cases should use realistic prompts or artifacts and observable assertions. Verify outputs, tool choices, safety boundaries, and stop behavior rather than relying only on prose such as "produces a good result."

When comparing revisions, change one behavioral lever at a time and rerun the same cases. Do not add a fixed number of fixtures merely to satisfy a quota. Generalize from failures rather than encoding incidental fixture details.

For independent forward tests, pass raw prompts and artifacts without the intended answer or prior diagnosis. Do not call a simulated review equivalent to observed behavior.

## Completion Check

- [ ] The description clearly distinguishes the skill from adjacent skills.
- [ ] Inputs, outputs, unsupported inferences, and stop conditions are explicit.
- [ ] `SKILL.md` contains only always-needed instructions.
- [ ] Every supporting resource is linked directly and has a clear loading condition.
- [ ] Scripts document dependencies and have been executed successfully.
- [ ] Codex metadata matches the skill when `agents/openai.yaml` exists.
- [ ] Structural validation passes for the target host.
- [ ] Positive, negative, incomplete, and edge behavior has been tested.
- [ ] Remaining limitations are reported rather than hidden.
