---
name: prompt-engineer
description: >
  Reviews, improves, and iterates on system prompts and LLM instructions.
  Load when writing, rewriting, reviewing, or optimizing a system prompt,
  agent prompt, tool description, skill description, or any LLM instructions.
  Triggers on "prompt engineering", "improve this prompt", "make this more
  LLM-friendly", or any block of instructions to refine. Applies structured
  analysis to maximize instruction clarity and model compliance.
---

# Prompt Engineer

Review, improve, and iterate on system prompts and LLM instructions.

## Core Principle

Prompt engineering is context engineering. Find the **smallest set of high-signal tokens** that maximize the likelihood of the desired behavior. Every sentence must earn its place.

## Workflow

### 1. Understand the prompt's purpose

Before editing, identify:

| Dimension | Question | Default |
|-----------|----------|---------|
| Target model | Claude, GPT, open-source? | Claude |
| Execution context | System prompt, user template, agent loop, skill, tool description? | — |
| Audience | Who writes the user messages this prompt receives? | — |
| Failure modes | Undertriggering, oververbosity, hallucination, format drift? | — |

Ask the user if any dimension is unclear. Do not guess at intent behind vague instructions.

### 2. Analyze the existing prompt

Evaluate against these dimensions. Present findings as a short paragraph or a few bullets — not a rubric.

**Clarity & directness** — Are instructions specific enough that the model won't infer intent? Flag vague qualifiers ("try to", "if possible", "maybe") that give the model permission to ignore the instruction. Flag negative-only rules ("don't do X") that lack guidance on what *to* do.

**Structure & ordering** — Follow this ordering from top to bottom:

```
1. Identity & role        — who the model is
2. Reference data         — documents, schemas, knowledge base
3. Context & background   — situational info the model needs
4. Rules & constraints    — behavioral guardrails
5. Output format          — structure, length, style requirements
6. Examples               — few-shot demonstrations
7. Task / query           — what to do right now
```

Long-form data at the top. Instructions and query at the bottom. The most important instructions go at the beginning and end of the prompt (primacy/recency effect). Related instructions must be grouped, not scattered.

**Signal density** — Flag redundancy (unintentional duplication wastes tokens and dilutes attention), instructions that don't affect behavior, and paragraphs that could be cut in half.

**Emphasis & formatting** — XML-style tags (`<instructions>`, `<examples>`) help the model parse structure; use them for distinct sections, not every paragraph. Bold and CAPS emphasize critical rules, but overuse numbs the model. Reserve strong formatting for 2–3 truly critical constraints. Numbered lists imply ordered steps; bullet points imply unordered sets. Choose deliberately.

**Examples & grounding** — Few-shot examples are the single most reliable way to steer behavior. Flag prompts that lack them. Good example coverage: one common case + one edge case. Add negative examples where the desired/undesired boundary is ambiguous.

**Tone & persona** — If the prompt assigns a role, check that it also defines the expected *reasoning style*. Flag inconsistent formality.

### 3. Rewrite

Apply all changes in a single pass. The rewritten prompt must:

- Open with role and purpose in one sentence
- Front-load reference data before instructions
- Group related rules with XML tags or markdown headers
- Use imperative mood — "Respond in JSON" not "You should respond in JSON"
- Explain *why* for non-obvious constraints — "Keep responses under 200 words because this feeds an SMS pipeline with character limits"
- Include at minimum one positive example; add a negative example if the boundary is unclear
- End with the task or query (last thing the model reads has the most influence)
- Cut ruthlessly — if an instruction doesn't change behavior, remove it

### 4. Present the result

Show the rewritten prompt in full. Then provide a brief changelog:

- What was moved, merged, or removed
- What was added and why
- Any tradeoffs or open questions

Focus on material changes, not every edit.

## When Iterating

- Ask what specific behavior the user is trying to fix before making changes
- Make the minimum edit that addresses the problem
- Do not restructure the whole prompt to fix a single behavior — targeted edits are easier to evaluate
- Suggest the user test with 2–3 representative inputs before another revision
- Track what's been tried to avoid cycling back to a previous version

## Example

**Before** (vague, negative-only, no examples, buried intent):

```
You are a helpful assistant. Try to be concise if possible. Don't use bullet points.
Don't include unnecessary information. You should always be professional.
If the user asks about pricing, try to give them accurate information.
Don't make things up. Be helpful and friendly.
```

**After** (clear role, positive instructions, explains why, includes example):

```xml
<role>
You are a customer support agent for Acme Corp, a B2B SaaS platform.
</role>

<rules>
- Write in flowing prose paragraphs, not lists — responses appear in a chat widget with limited formatting support
- Keep responses under 3 sentences unless the question requires a detailed walkthrough
- For pricing questions, reference only the current published tiers in <pricing_data>. If a question falls outside published pricing, say "I'll connect you with our sales team" and offer to transfer
- When uncertain about any fact, say so directly rather than speculating
</rules>

<example>
User: What's the difference between Pro and Enterprise?
Agent: Pro includes up to 50 seats and standard integrations, while Enterprise adds unlimited seats, SSO, and a dedicated account manager. The full comparison is on our pricing page at acme.com/pricing — happy to walk you through any specific feature if that helps.
</example>
```

**What changed:** Replaced 7 vague/negative instructions with 4 specific positive rules. Added role context, explained *why* for the prose constraint, grounded pricing answers in a data source, and added a concrete example showing target tone and length.

## Quick Reference: Anti-Patterns

| Anti-pattern | Description |
|-------------|-------------|
| Instruction soup | Wall of unstructured rules with no grouping or hierarchy |
| Contradiction | Conflicting instructions (e.g., "be concise" + "always explain reasoning in detail") |
| Phantom emphasis | Everything bolded/capitalized/CRITICAL, so nothing stands out |
| Negative-only rules | Long list of "don't do X" with no guidance on what *to* do |
| Orphaned context | Reference data that no instruction ever uses |
| Cargo cult structure | XML tags or headers that add nesting without adding clarity |
| Hedging language | "try to", "if possible", "you might want to" — weakens instruction |

## Claude-Specific Guidance

For detailed Claude-specific prompting techniques (XML tags, positive instructions, emphasis budgets, prefilled responses, extended thinking caveats), see [references/claude.md](references/claude.md).
