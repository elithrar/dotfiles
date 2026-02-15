---
description: Review changes with parallel @code-review subagents
agent: plan
---

Review uncommitted changes by default. If no uncommitted changes, review the last commit. If the user provides a PR/MR number or link, fetch it with CLI tools first.

Guidance: $ARGUMENTS

Launch THREE (3) @code-review subagents in parallel. Give each a different focus area. If the user guidance specifies areas, use those. Otherwise default to: (1) correctness, (2) security & resilience, (3) complexity & maintainability. Include the focus area in each subagent's prompt.

After all three complete, deduplicate their findings — keep the version with better evidence, use the higher severity when they disagree, and drop anything without a `file:line` reference. Run the project's lint/test commands to catch anything the reviewers missed.

Then launch ONE (1) final @code-review subagent to validate. Pass it the compiled findings, the user guidance, and this instruction: "For each finding, read the code at the referenced file:line. Classify as **Confirmed** (provably real), **Disputed** (not supported by the code), or **Acknowledged** (real but not worth fixing). Return only Confirmed findings."

Present only Confirmed findings to the user, ranked by severity. If nothing survived validation, say so.
