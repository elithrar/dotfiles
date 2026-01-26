---
description: Summarize session work for commit messages or documentation
---

Load the `summarize-work` skill and generate a summary of the work completed in this session.

## Arguments

$ARGUMENTS

If no arguments provided, summarize all work in the current session for use as an extended commit message.

## Behavior

1. Analyze session history to identify:
   - Major changes and new features
   - Bug fixes and their root causes
   - Challenges that required multiple iterations
   - Fixes made in response to code review feedback

2. Check git state to correlate session work with staged/unstaged changes:
   - If changes are staged, summarize those changes for a commit message
   - If on a feature branch (not main/master), summarize branch-level work

3. Output a summary suitable for:
   - Extended commit message body (default)
   - PR description (if `--pr` or `pr` argument provided)
   - Branch documentation (if `--branch` or `branch` argument provided)

## Output Format

For commit messages, output:
```
<commit body text ready to paste>
```

For PR descriptions, output a list of 4-8 items (based on volume of changes), focused on the largest, riskiest or most notable changes. Keep formatting, headers and filename references to an absolute minimum.
