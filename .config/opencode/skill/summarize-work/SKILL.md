---
name: summarize-work
description: Summarizes session work for commit messages or branch reviews. Analyzes session history to extract major changes, bug fixes, challenges requiring multiple iterations, and code review fixes. Load before committing or when preparing to document completed work.
---

# Summarize Work

Generate meaningful summaries of work completed in a session. Use for extended commit messages or branch-level documentation.

## When to Use

- Before committing to generate extended commit messages
- When reviewing work on a feature branch before creating a PR
- To document challenges and iterations for team context

## Workflow

```
Summary Progress:
- [ ] Phase 1: Gather context (session history + git state)
- [ ] Phase 2: Categorize changes
- [ ] Phase 3: Generate summary
```

### Phase 1: Gather Context

Analyze the session history to understand:

1. **What changed** — Files modified, functions added/removed, APIs changed
2. **Why it changed** — User requests, bug reports, review feedback
3. **How it evolved** — Iterations, failed approaches, pivots

Check git state to correlate with session work:

```bash
# Staged and unstaged changes
git diff --stat
git diff --cached --stat

# If on a branch, changes since divergence from main
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline origin/master..HEAD
```

### Phase 2: Categorize Changes

Group work into these categories (skip empty categories):

| Category | Description | Examples |
|----------|-------------|----------|
| **Features** | New functionality | New endpoints, UI components, CLI commands |
| **Fixes** | Bug corrections | Edge case handling, validation fixes, error corrections |
| **Refactors** | Code improvements | Extractions, simplifications, performance |
| **Challenges** | Multi-iteration problems | Issues requiring 3+ attempts, debugging sessions |
| **Review fixes** | Code review feedback | Changes made in response to review comments |

### Phase 3: Generate Summary

Produce a summary following this structure:

**For commit messages (extended body):**

```
<short description>

<One-sentence context — the problem or motivation>

Changes:
- <Major change 1>
- <Major change 2>

<Optional: Challenges section if significant iteration occurred>
```

**For branch summaries (PR descriptions):**

```
<short description>

<2-3 sentences describing the overall goal and outcome>

- <Grouped by feature/component>
- <Major change 2>

<Optional: Document any significant debugging or iteration>

<Optional: Changes made from code review feedback>
```

## Key Guidelines

- **Focus on meaningful changes** — Skip trivial edits, typo fixes, or formatting
- **Capture the "why"** — Not just what changed but why it mattered
- **Highlight challenges** — Multi-iteration problems are valuable context for future maintainers
- **Be specific** — "Fix auth token expiry handling" not "Fix auth bug"
- **Use imperative mood** — "Add", "Fix", "Refactor" not "Added", "Fixed"

## Output Calibration

| Context | Detail Level |
|---------|--------------|
| Single commit | 1-3 bullet points, focus on the "what" |
| Multi-commit session | Group by theme, include challenges |
| Feature branch | Full summary with context and challenges |

## Anti-patterns

- Listing every file changed (the diff shows that)
- Including trivial changes alongside meaningful ones
- Vague descriptions ("various improvements", "code cleanup")
- Missing context for complex changes
