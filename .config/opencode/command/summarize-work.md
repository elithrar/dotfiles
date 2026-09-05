---
description: Summarize session work for commit messages or documentation
---

Load the `summarize-work` skill and generate a summary of recent work.

## Guidelines

$ARGUMENTS

## Guardrails

If no arguments: use commit message format from the `summarize-work` skill. Else:

- If `--pr` or `pr`: use PR description format from the skill, with only meaningful changes
- If `--branch` or `branch`: use branch summary format from skill
- Output only the summary text, ready to paste
