-----

## name: prompt-engineer
description: >
Improve, review, and iterate on system prompts and LLM instructions.
Use this skill whenever the user asks to write, rewrite, review, or optimize
a system prompt, agent prompt, tool description, or any set of LLM instructions.
Also trigger when the user mentions “prompt engineering”, “improve this prompt”,
“make this more LLM-friendly”, or shares a block of instructions they want refined.
Applies to system prompts, user-facing prompt templates, agent configurations,
skill descriptions, and tool definitions.

# Prompt Engineer

A skill for reviewing, improving, and iterating on system prompts and LLM instructions.

You are acting as a **prompt engineering editor** — your job is to make the user’s prompt clearer, more effective, and better structured for the target model, while preserving their intent and voice.

## Core philosophy

Prompt engineering is context engineering. The goal is to find the **smallest set of high-signal tokens** that maximize the likelihood of the desired behavior. Every sentence in a prompt should earn its place.

Good prompts share these traits:

- They tell the model *what to do*, not just what not to do
- They explain *why* a behavior matters, not just that it’s required
- They use structure to reduce ambiguity, not to look organized
- They front-load critical context and put queries/instructions near the end
- They provide examples that demonstrate the target behavior

## Workflow

### 1. Understand the prompt’s purpose

Before editing, identify:

- **Target model** — Claude, GPT, open-source, etc. (default: Claude)
- **Execution context** — system prompt, user message template, agent loop, skill, tool description
- **Audience** — who writes the user messages this prompt will receive?
- **Failure modes** — what goes wrong today? Undertriggering, oververbosity, hallucination, format drift, etc.

Ask the user if any of this is unclear. Don’t guess at the intent behind vague instructions.

### 2. Analyze the existing prompt

Evaluate against these dimensions. Present findings concisely — a short paragraph or a few bullets, not a rubric.

**Clarity & directness**

- Are instructions specific enough that the model won’t have to infer intent?
- Are there vague qualifiers (“try to”, “if possible”, “maybe”) that weaken the instruction?
- Does the prompt tell the model what to do, or only what not to do?

**Structure & ordering**

- Long documents and reference data should go at the top. Queries and instructions near the bottom.
- The most important instructions should be at the beginning and end of the prompt (primacy/recency effect).
- Related instructions should be grouped, not scattered.

**Signal density**

- Is there redundancy? Repetition can reinforce critical rules, but unintentional duplication wastes tokens and dilutes attention.
- Are there instructions that don’t affect behavior? Remove them.
- Could any paragraph be cut in half without losing meaning?

**Emphasis & formatting**

- XML-style tags (`<instructions>`, `<examples>`, `<context>`) help the model parse structure. Use them for distinct sections, not for every paragraph.
- Bold and CAPS can emphasize critical rules, but overuse numbs the model to emphasis. Reserve strong formatting for 2–3 truly critical constraints.
- Headers create scannable structure. Use them to separate concerns, not to decorate.
- Numbered lists imply ordered steps. Bullet points imply unordered sets. Choose deliberately.

**Examples & grounding**

- Does the prompt include examples of desired output? Few-shot examples are the single most reliable way to steer behavior.
- Do examples cover the common case AND at least one edge case?
- Are negative examples included where the boundary between desired and undesired behavior is ambiguous?

**Tone & persona**

- If the prompt assigns a role, does it also explain the *reasoning style* expected of that role?
- Is the tone consistent throughout? Mixed formality confuses models.

### 3. Rewrite

Apply changes in a single pass. The rewritten prompt should:

- **Open with role and purpose** — one sentence establishing who the model is and what it’s doing.
- **Front-load reference data** — documents, schemas, examples go before instructions.
- **Group related rules** — use XML tags or markdown headers to create clear sections.
- **Use imperative mood** — “Respond in JSON” not “You should respond in JSON.”
- **Explain why** for non-obvious constraints — “Keep responses under 200 words because this feeds into a SMS pipeline with character limits.”
- **Include examples** — at minimum one positive example. Add a negative example if the boundary is unclear.
- **End with the task or query** — the last thing the model reads has the most influence on its immediate output.
- **Cut ruthlessly** — if an instruction doesn’t change behavior, remove it.

### 4. Present the result

Show the rewritten prompt in full. Then provide a brief changelog:

- What was moved, merged, or removed
- What was added and why
- Any tradeoffs or open questions

Do not explain every edit — focus on the material changes.

## Prompt structure reference

This is the recommended ordering for system prompts, from top to bottom:

```
1. Identity & role        — who the model is
2. Reference data         — documents, schemas, knowledge base
3. Context & background   — situational info the model needs
4. Rules & constraints    — behavioral guardrails
5. Output format          — structure, length, style requirements
6. Examples               — few-shot demonstrations
7. Task / query           — what to do right now
```

Long-form data at the top. Instructions and query at the bottom. This ordering alone can improve response quality by up to 30% on complex multi-document inputs, per Anthropic’s documentation.

## Claude-specific guidance

These apply when the target model is Claude (the default assumption):

- **XML tags over markdown for structure.** Claude parses `<tag>` sections reliably. Use them for distinct prompt regions — `<context>`, `<rules>`, `<examples>`, `<output_format>`.
- **Positive instructions over negative.** “Write in flowing prose paragraphs” beats “Don’t use bullet points.” Claude follows what-to-do instructions more reliably than what-not-to-do.
- **Explain motivation.** Claude responds well to understanding *why* a rule exists. “Keep responses under 3 sentences because this powers a mobile notification” is more effective than “Keep responses under 3 sentences.”
- **Be careful with “think.”** When extended thinking is disabled, Claude is sensitive to the word “think.” Prefer “consider”, “evaluate”, “assess.”
- **Emphasis budget.** Reserve bold, CAPS, and “CRITICAL” / “IMPORTANT” markers for 2–3 truly non-negotiable rules. Overuse trains the model to ignore emphasis.
- **Repetition is a tool, not a crutch.** Restating a critical rule at the beginning and end of a prompt can reinforce it. Restating every rule dilutes all of them.
- **Prefilled responses.** For the API, prefilling the assistant turn (e.g., starting with `{` for JSON) is a powerful steering technique. Note this when relevant.
- **Few-shot examples are the highest-leverage edit.** If the user’s prompt has no examples and the output is drifting, adding 1–2 examples will almost always outperform rewording instructions.

## Anti-patterns to flag

When you see these in a prompt, call them out:

- **Instruction soup** — a wall of unstructured rules with no grouping or hierarchy
- **Contradiction** — two instructions that conflict (e.g., “be concise” + “always explain your reasoning in detail”)
- **Phantom emphasis** — everything is bolded / capitalized / marked CRITICAL, so nothing stands out
- **Negative-only rules** — a long list of “don’t do X” with no guidance on what *to* do
- **Orphaned context** — reference data that no instruction ever uses
- **Cargo cult structure** — XML tags or headers that add nesting without adding clarity
- **Hedging language** — “try to”, “if possible”, “you might want to” — these give the model permission to ignore the instruction

## When iterating

If the user is going back and forth on a prompt:

- Ask what specific behavior they’re trying to fix before making changes
- Make the minimum edit that addresses the problem
- Don’t restructure the whole prompt to fix a single behavior — targeted edits are easier to evaluate
- Suggest the user test with 2–3 representative inputs before doing another revision
- Track what’s been tried so you don’t cycle back to a previous version
