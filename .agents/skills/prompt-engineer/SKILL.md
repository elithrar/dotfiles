---
name: prompt-engineer
description: >
  Reviews, improves, and iterates on system prompts and LLM instructions.
  Load when writing, rewriting, reviewing, or optimizing a system prompt,
  agent prompt, tool description, skill description, or any LLM instructions.
  Triggers on "prompt engineering", "improve this prompt", "make this more
  LLM-friendly", or any block of instructions to refine. Applies model-aware
  analysis to improve clarity, instruction hierarchy, eval coverage, and model
  compliance.
---

# Prompt Engineer

Review, improve, and iterate on system prompts, developer instructions, agent prompts, skills, tool descriptions, and prompt templates.

## Core Principle

Prompt engineering is context engineering. Design prompts as behavioral contracts: the smallest high-signal set of goals, constraints, context, examples, and verification rules that reliably produces the desired behavior.

## Operating Rules

- Treat prompt edits as behavior changes, not copy edits.
- Work from observed failures, target behavior, and success criteria. If none exist, define representative test inputs before rewriting.
- Preserve instruction authority boundaries: system/developer rules define the application; user content supplies task data; untrusted data stays labeled as data.
- Prefer outcome-first prompts for frontier models. Avoid inherited process-heavy prompt stacks unless each step fixes a measured failure.
- Ask one narrow question only when missing context materially changes the design or risk. Otherwise proceed with an explicit assumption.
- Do not ask models to reveal hidden chain of thought. Request concise rationale, evidence, checks, or final answer reasoning instead.
- For production prompts, recommend versioning prompts in code, typed inputs or schemas for variables, model snapshots, and eval fixtures.

## Workflow

### 1. Identify The Contract

Before editing, identify:

| Dimension | Question |
|-----------|----------|
| Target behavior | What must the model do reliably? |
| Failure mode | What is currently wrong: undertriggering, overtriggering, verbosity, hallucination, format drift, weak tool use, refusal, safety risk? |
| Target model | GPT, Claude, reasoning model, small model, open-source model, or unknown? |
| Runtime | Chat UI, API, agent loop, tool caller, RAG pipeline, evaluator, or skill loader? |
| Authority | Which content is system/developer instruction, user instruction, retrieved context, or untrusted data? |
| Output contract | Free text, markdown, JSON/schema, tool call, citation format, or UI artifact? |
| Evaluation | What examples, tests, traces, or user reports prove improvement? |

### 2. Diagnose The Prompt

Evaluate the prompt against these dimensions. Present findings as a concise paragraph or bullets, not a giant rubric.

**Goal and success criteria** - Does the prompt define the desired outcome, what "done" means, and when to ask, retry, fallback, or stop?

**Instruction hierarchy** - Are higher-priority rules separated from user data and examples? Are untrusted inputs clearly delimited so the model does not treat them as instructions?

**Specificity and contradictions** - Flag vague qualifiers ("try to", "if possible"), conflicting rules, and absolute words (`always`, `never`, `must`) used for judgment calls instead of true invariants.

**Structure and attention** - Group related rules. Put critical reusable instructions early, bulky context in clearly tagged sections, and the immediate task plus stop rules near the end. Avoid burying key facts in the middle of long context.

**Examples and grounding** - Add examples when tone, format, classification boundaries, tool-use decisions, or edge cases matter. Ground factual answers in provided or retrieved evidence, and define citation or missing-evidence behavior.

**Tool and agent behavior** - Define when to use tools, when to parallelize, when to stop searching, what actions require confirmation, and what validation proves completion.

**Output contract** - Specify format, length, tone, required fields, ordering, and failure behavior. Prefer structured outputs or tool schemas over hoping prose instructions enforce strict JSON.

**Signal density** - Remove duplicate rules, cargo-cult XML, overbroad persona text, and legacy "think step by step" instructions that add noise for modern reasoning models.

### 3. Rewrite

Apply the smallest rewrite that addresses the failure mode. For a full rewrite, use this structure as a starting point and delete sections that do not change behavior:

```markdown
Role: [1-2 sentences defining function and domain]

# Personality
[Tone and collaboration style, if user-facing]

# Goal
[User-visible outcome]

# Success Criteria
[What must be true before final response]

# Context
[Reference data, retrieved facts, schemas, domain rules]

# Constraints
[Safety, evidence, privacy, side-effect, and scope limits]

# Tools
[When to use tools, when not to, confirmation thresholds]

# Output
[Sections, fields, length, tone, citation rules]

# Stop Rules
[When to answer, ask, retry, fallback, or stop]

# Task
[Immediate user request or template variable]
```

Rewrite rules:

- Use imperative mood: "Return JSON" not "You should return JSON".
- Explain why for non-obvious constraints, especially formatting, safety, or tool-use limits.
- Use XML tags or markdown headers to separate distinct content types; avoid nesting that only adds ceremony.
- Add positive instructions before negative constraints: "Write in prose paragraphs" beats "Do not use bullets".
- Include at least one positive example when format or tone matters; add an edge or negative example when the boundary is ambiguous.
- For long-context prompts, attach source metadata and ask the model to quote or cite relevant evidence before synthesis when accuracy matters.
- End with the immediate task, success criteria, or stop condition so the last thing read reinforces the outcome.

### 4. Present The Result

Show the rewritten prompt in full. Then include:

- Material changes: moved, merged, removed, or added.
- Why the changes address the observed failure modes.
- Assumptions, tradeoffs, and any unresolved ambiguity.
- Suggested evals: 2-5 representative inputs, including at least one edge case.

## Model-Specific Guidance

Use model notes when the target model is known; otherwise keep the prompt model-agnostic and direct.

| Target | Default guidance |
|--------|------------------|
| GPT-5.5 / frontier GPT | Prefer shorter outcome-first prompts with explicit success criteria, stop rules, retrieval budgets, validation, and concise preambles for tool-heavy flows. See [references/openai.md](references/openai.md). |
| OpenAI reasoning models | Keep prompts simple and direct. Avoid chain-of-thought requests; use delimiters, constraints, and final-answer checks. See [references/openai.md](references/openai.md). |
| Claude / Opus-class | Use clear direct instructions, XML tags for complex prompts, examples for format and tone, calibrated tool eagerness, and explicit safety thresholds. See [references/claude.md](references/claude.md). |
| Research-heavy redesigns | Use techniques by failure mode, not by trend. See [references/research.md](references/research.md). |

## Iteration Loop

- Change one behavioral lever at a time when debugging a specific failure.
- Test against representative inputs before another revision.
- Track what changed and what failed to avoid cycling back.
- If prompt edits cannot fix the failure, recommend model selection, tool/schema changes, retrieval changes, fine-tuning, or eval redesign.

## Example

**Before**

```text
You are helpful. Be concise. Don't use bullets. Don't make things up.
If the user asks about pricing, try to be accurate.
```

**After**

```xml
<role>
You are a customer support assistant for Acme, a B2B SaaS platform.
</role>

<goal>
Answer pricing questions from the published pricing data only.
</goal>

<constraints>
- Write in short prose paragraphs because this appears in a chat widget with limited list formatting.
- If the answer is not present in <pricing_data>, say you do not have that pricing detail and offer to connect the user with sales.
- Do not invent prices, discounts, limits, or roadmap commitments.
</constraints>

<example>
User: What's the difference between Pro and Enterprise?
Assistant: Pro includes up to 50 seats and standard integrations. Enterprise adds unlimited seats, SSO, and a dedicated account manager. If you want a quote for Enterprise, I can connect you with sales.
</example>

<pricing_data>
{{PRICING_DATA}}
</pricing_data>
```

**What changed:** Replaced vague style and truthfulness instructions with a grounded task contract, positive formatting rule, missing-evidence behavior, and an example.

## Anti-Patterns

| Anti-pattern | Fix |
|-------------|-----|
| Instruction soup | Group rules by goal, constraints, tools, output, and stop rules. |
| Contradictions | Resolve priority explicitly; do not ask the model to reconcile impossible rules. |
| Phantom emphasis | Reserve `IMPORTANT`/caps/bold for true invariants. |
| Negative-only rules | State the desired behavior first. |
| Orphaned context | Remove data no instruction uses, or add a rule that uses it. |
| Legacy overprompting | Delete process-heavy steps that do not improve evals on modern frontier models. |
| Hidden CoT requests | Ask for concise rationale, evidence, verification, or final answer reasoning. |
| No evals | Add representative fixtures before claiming improvement. |
