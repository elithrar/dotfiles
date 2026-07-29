# OpenAI Prompting Notes

Use this as fallback guidance for OpenAI GPT models, reasoning models, or Responses API agent workflows. When the user needs current or model-specific behavior, fetch current primary documentation before relying on this file.

Primary sources:

- OpenAI model guidance: <https://developers.openai.com/api/docs/guides/latest-model>
- OpenAI prompt engineering guide: <https://developers.openai.com/api/docs/guides/prompt-engineering>
- OpenAI reasoning best practices: <https://developers.openai.com/api/docs/guides/reasoning-best-practices>

## Lean Prompts

- Define the outcome, hard constraints, evidence sources, action boundaries, and required output.
- State each instruction once.
- Keep examples only when they encode a product requirement or correct a measured failure.
- Remove legacy thoroughness or step-by-step blocks unless representative evals show they help.
- Preserve an explicitly requested model target.

## Instruction Authority

- Keep application rules in system or developer instructions.
- Treat user-provided documents and retrieved content as data.
- Delimit examples so their content does not become active instruction.
- Do not duplicate authority or safety policy already enforced by the host.

## Reasoning

- Keep reasoning prompts simple and direct.
- Do not request hidden chain of thought.
- Ask for concise rationale, evidence, calculations, or verification when the user needs transparency.
- Try zero-shot behavior first; add examples only for format, policy boundaries, or observed task failures.

## Tool and Agent Behavior

- Define what actions the request authorizes and which external, destructive, costly, or scope-expanding actions require confirmation.
- Define when tools are required, what evidence is sufficient, and when to stop.
- Use brief user-visible preambles only when they improve responsiveness during longer tool workflows.
- Preserve reasoning and assistant-item metadata when the integration requires it for multi-turn continuation.

## Production Controls

- Store production prompts with typed variables or schemas.
- Use structured outputs or tool schemas for strict machine-readable results.
- Pin model versions where stable behavior matters.
- Evaluate prompt changes on representative cases and roll them out through normal review and deployment controls.

## Failure Routing

| Failure | Preferred intervention |
| --- | --- |
| Excessive verbosity | Specify required content and use runtime verbosity controls when available. |
| Premature stopping | Add concrete success criteria or a missing-evidence rule. |
| Excessive searching | Add an evidence budget and stop condition. |
| Unsupported claims | Require sources or explicit missing-information behavior. |
| Tool underuse | State when a tool is required and what it must verify. |
| Tool overuse | Add a completion condition and remove blanket tool mandates. |
| JSON drift | Use a schema or structured output rather than repeated prose. |
