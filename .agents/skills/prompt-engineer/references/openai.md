# OpenAI Prompting Notes

Use this when the target model is an OpenAI GPT/frontier model, an o-series reasoning model, or a Responses API agent workflow.

Sources:

- OpenAI prompt engineering guide: <https://platform.openai.com/docs/guides/prompt-engineering>
- OpenAI prompt guidance: <https://platform.openai.com/docs/guides/prompt-guidance>
- OpenAI GPT-5 prompting guide: <https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide>
- OpenAI reasoning best practices: <https://platform.openai.com/docs/guides/reasoning-best-practices>

## Frontier GPT Models

Current frontier GPT guidance favors shorter, outcome-first prompts over process-heavy stacks.

- Define the outcome, success criteria, constraints, evidence sources, and final output shape.
- Keep personality and collaboration style short and separate from task rules.
- Re-evaluate low or medium effort before escalating; higher effort is not automatically better.
- Use preambles for long-running or tool-heavy workflows when perceived responsiveness matters.
- Define retrieval budgets and stop rules so the model knows when enough evidence is enough.
- Prompt the model to validate work when validation tools exist.
- Avoid carrying forward old "be extremely thorough" or "think step by step" blocks unless evals show they help.

Suggested complex prompt shape:

```markdown
Role: [function and domain]

# Personality
[tone and collaboration style]

# Goal
[target outcome]

# Success Criteria
[what must be true before final answer]

# Constraints
[policy, safety, business, evidence, side-effect limits]

# Output
[sections, length, tone, required fields]

# Stop Rules
[when to answer, retry, fallback, ask, or stop]
```

## Instruction Hierarchy

OpenAI models follow message authority. Developer instructions outrank user instructions; user messages provide task data and preferences. Treat developer/system prompts like function definitions and user inputs like arguments.

Prompt implications:

- Keep application rules in developer/system instructions.
- Label user-provided documents and retrieved content as data.
- Do not allow examples or retrieved text to contain active instructions unless that is intentional.
- When user instructions change mid-conversation, state the scoped override and what still applies.

## Reasoning Models

Reasoning models perform best with simple, direct prompts.

- Avoid chain-of-thought requests; reasoning is internal.
- Use delimiters, markdown sections, or XML tags to separate instructions, examples, and input data.
- Try zero-shot first; add few-shot examples only when format, policy boundaries, or task behavior need them.
- Specify the end goal and success criteria clearly.
- Ask for concise rationale, evidence, or checks in the final answer when the user needs transparency.
- For reasoning-agent workflows, prefer the Responses API with persisted reasoning context over stateless chat when tool loops are complex.

## Agent And Tool Prompts

- Define how proactive the agent should be and when it must ask before acting.
- Include safe versus unsafe action thresholds. Reversible local edits can usually proceed; destructive, external, or production-affecting actions need confirmation.
- Use tool preambles only when user-visible progress improves UX; keep them short.
- Define when to search, when to stop searching, and what evidence is sufficient.
- In multi-turn tool loops, preserve assistant-item metadata such as phase values if the integration replays assistant items manually.

## Production Prompt Management

- Store production prompts in code with typed variables or schemas.
- Pin model snapshots where stable behavior matters.
- Add eval fixtures before changing important prompts.
- Prefer structured outputs, tool schemas, or enum fields for strict machine-readable output.
- Roll out prompt changes through normal deployment and review workflows.

## Common Fixes

| Failure | Fix |
|---------|-----|
| Too verbose | Set verbosity or output length; specify only required sections. |
| Premature stopping | Add success criteria and stop rules. |
| Excessive searching | Add retrieval budget and "answer when evidence is enough" rule. |
| Unsupported claims | Require citations or placeholders for missing facts. |
| Tool underuse | State when tools are required and what must be validated. |
| Tool overuse | Add early-stop criteria and lower effort for simple tasks. |
| JSON drift | Use structured outputs or tool schemas instead of prose-only format rules. |
