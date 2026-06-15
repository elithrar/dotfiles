# Research Notes

Use this as a technique map, not a checklist. Pick methods that match the observed failure mode and validate them against evals.

Sources:

- The Prompt Report: <https://arxiv.org/abs/2406.06608>
- Chain-of-Thought Prompting Elicits Reasoning in Large Language Models: <https://arxiv.org/abs/2201.11903>
- Self-Consistency Improves Chain of Thought Reasoning in Language Models: <https://arxiv.org/abs/2203.11171>
- ReAct: Synergizing Reasoning and Acting in Language Models: <https://arxiv.org/abs/2210.03629>
- Lost in the Middle: How Language Models Use Long Contexts: <https://arxiv.org/abs/2307.03172>
- Large Language Models Are Human-Level Prompt Engineers: <https://arxiv.org/abs/2211.01910>

## Technique Selection

The Prompt Report surveys many prompting techniques, but the practical rule is simple: diagnose the failure before choosing a technique.

- Format or tone drift: add examples and output contracts.
- Reasoning errors: add task decomposition, verification, or model-side self-checks.
- Retrieval hallucination: add grounding, citation rules, and missing-evidence behavior.
- Tool errors: define action/observation loops, tool preconditions, and stop rules.
- Long-context misses: restructure context and keep critical instructions or questions away from the middle.

## Chain Of Thought

Chain-of-thought demonstrations improved complex reasoning in earlier large models, especially arithmetic, commonsense, and symbolic tasks. For current frontier and reasoning models, do not reflexively ask for hidden chain of thought.

Use instead:

- Few-shot examples that show input-output structure.
- A concise visible rationale when the user needs explanation.
- A private self-check instruction such as "Before finalizing, verify the answer against the success criteria."
- Structured intermediate artifacts only when the product actually needs them, such as calculations, citations, or a plan.

## Self-Consistency

Self-consistency samples multiple reasoning paths and selects the most consistent answer. It is useful when accuracy matters more than latency and the task has a checkable final answer.

Prompt/application pattern:

- Generate multiple candidate answers or approaches.
- Judge them against the same rubric or test oracle.
- Return the best-supported result and note uncertainty.

Do not use this for cheap conversational tasks where latency and cost dominate.

## ReAct And Tool Loops

ReAct-style prompting interleaves reasoning and actions so the model can update its plan from observations. This is most useful in search, coding, browsing, and tool-heavy agents.

Modern prompt version:

- Define when to act with tools.
- Require observation-based updates after tool results.
- Add stop rules so the agent does not keep searching after it has enough evidence.
- Keep user-visible reasoning concise; do not expose raw hidden chain of thought.

## Long Context

Lost in the Middle shows models can underuse information buried in the middle of long contexts.

Mitigations:

- Put critical instructions, task, or stop rules at the beginning or end.
- Split long documents with source metadata.
- Ask for relevant quote extraction before synthesis in high-accuracy tasks.
- Avoid relying on one buried sentence to carry an invariant.
- Use retrieval or chunking when the prompt becomes mostly archival data.

## Automatic Prompt Optimization

Automatic Prompt Engineer frames prompts as candidate programs selected by a score function.

Practical version:

- Generate several prompt variants.
- Score them against eval fixtures, not taste.
- Keep the simplest variant that passes.
- Preserve the winning prompt and eval cases together so future edits can be measured.
