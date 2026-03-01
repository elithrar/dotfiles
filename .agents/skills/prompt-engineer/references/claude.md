# Claude-Specific Prompting Guidance

Apply these techniques when the target model is Claude (the default assumption).

## XML Tags Over Markdown for Structure

Claude parses `<tag>` sections reliably. Use them for distinct prompt regions — `<context>`, `<rules>`, `<examples>`, `<output_format>`. Reserve markdown headers for human-readable sections within those regions.

## Positive Instructions Over Negative

"Write in flowing prose paragraphs" beats "Don't use bullet points." Claude follows what-to-do instructions more reliably than what-not-to-do.

## Explain Motivation

Claude responds well to understanding *why* a rule exists. "Keep responses under 3 sentences because this powers a mobile notification" is more effective than "Keep responses under 3 sentences."

## Extended Thinking Sensitivity

When extended thinking is disabled, Claude is sensitive to the word "think." Prefer "consider", "evaluate", "assess" as alternatives.

## Emphasis Budget

Reserve bold, CAPS, and "CRITICAL" / "IMPORTANT" markers for 2–3 truly non-negotiable rules. Overuse trains the model to ignore emphasis entirely.

## Strategic Repetition

Restating a critical rule at the beginning and end of a prompt reinforces it. Restating every rule dilutes all of them. Use repetition as a precision tool, not a pattern.

## Prefilled Responses

For the API, prefilling the assistant turn (e.g., starting with `{` for JSON output) is a powerful steering technique. Mention this when the user is working with the API directly and needs strict output format adherence.

## Few-Shot Examples

If a prompt has no examples and output is drifting, adding 1–2 examples will almost always outperform rewording instructions. This is the highest-leverage single edit for most prompts.

## System Prompt Length

Claude handles long system prompts well, but attention is not uniform. Place the highest-priority instructions at the very beginning and very end of the system prompt. Mid-prompt instructions receive the least attention — put reference data there.
