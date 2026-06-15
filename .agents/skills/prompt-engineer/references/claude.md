# Claude Prompting Notes

Use this when the target model is Claude, especially Opus-class or long-horizon agentic Claude deployments.

Sources:

- Anthropic prompt engineering overview: <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview>
- Anthropic prompting best practices: <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices>

## Start With Evals

Anthropic recommends prompt engineering after success criteria and empirical tests exist. If the user only has a vague prompt, first define what a good response looks like and capture a few representative inputs.

## Clear And Direct

- Be explicit about the desired output, constraints, and level of effort.
- Add context or motivation for non-obvious rules. Claude generalizes better when it knows why the rule matters.
- Use role prompting when domain, tone, or reasoning style matters.
- Use positive instructions before negative constraints.

## Examples

Examples are high leverage for Claude. Use them when output format, tone, or classification boundaries matter.

- Include examples that closely mirror real inputs.
- Cover edge cases and avoid accidental patterns.
- Wrap examples in `<example>` or `<examples>` tags.
- For complex Claude prompts, 3-5 diverse examples can outperform repeated rule wording.

## XML Structure

Claude parses XML-style tags reliably. Use tags for distinct prompt regions such as `<instructions>`, `<context>`, `<documents>`, `<examples>`, `<input>`, and `<output_format>`.

Best practice:

- Use consistent, descriptive tag names.
- Nest only when the content has a real hierarchy, such as multiple documents with metadata.
- Avoid cargo-cult tags around every paragraph.

## Long Context

For large document or data-rich inputs:

- Put long-form data above the immediate query and instructions when the prompt is primarily a document-analysis task.
- Use document metadata tags like `<source>` and `<document_content>`.
- Put the user's immediate question near the end.
- For high-accuracy document work, ask Claude to extract relevant quotes first, then synthesize from those quotes.

## Output And Formatting

- Tell Claude what to do instead of only what not to do.
- Match the prompt style to the desired output style when formatting drift persists.
- Prefer structured outputs or tool schemas for strict JSON, classification, and enum outputs.
- Check current Anthropic docs before recommending assistant prefill; newer Claude models have reduced or removed support for last-turn prefills.

## Tool And Agent Behavior

- If the user wants action, say so directly: "Make these edits" beats "Suggest changes".
- Calibrate eagerness. Opus-class models may overtrigger on aggressive tool or thoroughness prompts that were useful for older models.
- Use explicit confirmation thresholds for destructive, irreversible, externally visible, or production-affecting actions.
- Encourage parallel tool calls only when calls are independent and parameters are known.
- For codebase questions, require inspection before claims: never speculate about files that have not been opened unless the answer is truly known.

## Reasoning And Effort

- Use effort or thinking controls where the API supports them; do not simulate them with repetitive "think deeply" text.
- Ask Claude to self-check against concrete criteria before finalizing high-stakes answers.
- When explicit thinking is disabled, avoid overusing the word "think" in prompts that are meant to produce direct answers; use "evaluate", "assess", or "verify" instead.

## Overengineering Controls

Claude can overbuild when asked for quality or thoroughness. Add constraints like these when minimality matters:

```text
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Do not add features, abstractions, fallback paths, or documentation unless they are required for the current task.
```

## Migration Watchouts

- Dial back "always use tools" and "be maximally thorough" language for newer Opus-class prompts.
- Prefer decision rules: when to search, when to ask, when to stop, and what evidence is enough.
- Keep prompt changes tied to eval failures; newer models often need less scaffolding, not more.
