---
description: Summarize session work for commit messages or documentation
---

Load the `summarize-work` skill and generate a summary.

## Arguments

$ARGUMENTS

## Guardrails

- If no arguments: use commit message format from skill
- If `--pr` or `pr`: use branch summary format from skill, limited to 4-8 items
- If `--branch` or `branch`: use branch summary format from skill
- Output only the summary text, ready to paste
