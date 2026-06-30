---
name: code-reviewer
description: Reviews code changes for bugs, security regressions, type-safety issues, and maintainability. Use when asked to review uncommitted changes, the last commit, a PR/MR, a diff, or specific changed files.
---

# Code Reviewer

Use this skill for evidence-based code review. Prioritize real behavioral risks over style preferences.

## Routing

- Use `differential-review` instead when the user requests a security-focused audit, regression analysis, blast-radius report, or comprehensive PR security review.
- Use `simplify` instead when the user asks only for complexity, maintainability, readability, or cognitive-load review.
- Use this skill for normal code review of diffs, commits, PRs, MRs, or changed files.

## Scope

- Review uncommitted changes by default.
- If there are no uncommitted changes, review the last commit.
- If the user provides a PR/MR number or URL, fetch the diff with the appropriate CLI first.
- Apply any user-provided focus areas. Otherwise review with three lenses: correctness, security and resilience, complexity and maintainability.
- Review only changed behavior. Mention pre-existing issues only when the change makes them worse or relies on them.

## Workflow

1. Build context before judging the diff.
2. Read changed files in full, plus direct imports, callers, or config referenced by the change.
3. Keep context proportional: for 3 changed files, read roughly 5-10 total files, not the whole repository.
4. Identify the change purpose, maintained invariants, and risky paths.
5. Check relevant git history when a change touches security, validation, auth, crypto, access control, or a suspicious regression.
6. Run the project's configured validation commands when feasible. Avoid destructive commands and broad long-running suites unless they are the project default or the user asked for them.
7. Verify every finding against the referenced code before presenting it.

Useful history checks:

```bash
git log -S "pattern" --all --oneline --grep="fix\|security\|CVE"
git diff <range>
```

## Validation Commands

Prefer project commands over generic fallbacks.

| Project signal | Preferred validation |
| --- | --- |
| `package.json` | Use `lint`, `typecheck`, `check`, or `test` scripts if present; otherwise consider `npx tsc --noEmit` |
| `Makefile` or `Justfile` | Use `lint`, `check`, `test`, or `vet` targets if present |
| `Cargo.toml` | `cargo check` and `cargo clippy -- -D warnings` |
| `pyproject.toml` or `setup.cfg` | `ruff check`, `mypy`, or configured test commands |
| `go.mod` | `go vet ./...` and relevant `go test ./...` packages |

Tool failures are evidence. Include only failures relevant to the reviewed change.

## Risk Triage

| Risk | Triggers |
| --- | --- |
| High | Auth, authorization, crypto, external calls, value transfer, data exposure, validation removal, access-control changes |
| Medium | Business logic, state changes, new public APIs, error handling, persistence, concurrency |
| Low | Comments, tests, UI polish, logging, formatting, internal refactors |

Spend review depth where the risk is highest. For critical paths, estimate blast radius by checking callers and externally reachable entry points.

## Review Criteria

### Bugs

- Logic errors: incorrect conditions, wrong operator precedence, off-by-one behavior, inverted flags.
- Missing guards: null checks, bounds checks, validation, authorization checks, and error handling.
- Missing early returns after failure paths such as `throw`, `setFailed`, `res.status(4xx)`, or equivalent project patterns.
- Edge cases: empty input, zero values, boundary limits, partial failures, duplicate input, retries, and idempotency.
- Race conditions: shared mutable state, non-atomic writes, stale reads, and unsafe concurrent access.
- Regressions: removed code that previously fixed a bug or enforced an invariant.

### Type System Integrity

- Flag `any`, `as unknown as T`, unjustified assertions, `@ts-ignore`, and non-null assertions only when they hide a real bug or weaken guarantees.
- When a non-null assertion appears after a guard, check whether the root cause is a missing early return.
- Prefer fixes that let the type system prove the invariant instead of suppressing the error.

### Security

- Check input validation, auth checks, authorization boundaries, injection vectors, secret handling, and data exposure.
- For auth changes, verify access was not widened and session or token handling follows existing project patterns.
- Treat removed validation or permission checks as high risk until proven safe.

### Complexity and Maintainability

- Flag complexity only when it increases bug risk or makes the change hard to maintain.
- Look for deep nesting, hidden coupling, single-use abstractions, unclear state transitions, and inconsistent patterns.
- Do not flag a different-but-valid implementation merely because you prefer another approach.

### Performance

- Flag only obvious, change-related risks: unbounded O(n^2) work, N+1 queries, blocking I/O on hot paths, missing pagination, or repeated expensive calls.
- Include the input size or execution path that makes the issue matter.

## Evidence Standard

Before reporting a finding:

- Confirm it against the full file, not only the diff.
- Provide a concrete scenario where the bug appears.
- Reference `file:line` for the changed or directly affected code.
- Classify provability as `Provable`, `Likely`, or `Design concern`.
- Drop findings without a `file:line` reference or concrete scenario.
- Do not report style issues unless they break configured tooling or create real risk.

Provability labels:

- `Provable`: a concrete input, state, or sequence triggers the issue.
- `Likely`: the code strongly suggests a real issue, but full confirmation needs runtime context not available in the repository.
- `Design concern`: the issue is about maintainability, coupling, or approach rather than a definite bug.

## Parallel Review Pattern

For substantial reviews, use multiple focused passes or subagents:

- Run three parallel review passes when feasible: correctness, security and resilience, complexity and maintainability.
- Deduplicate findings. Keep the version with stronger evidence and use the higher severity when reviewers disagree.
- Run one final validation pass over the compiled findings. For each finding, reread the referenced code and classify it as `Confirmed`, `Disputed`, or `Acknowledged`.
- Present only `Confirmed` findings. If nothing survives validation, say that no confirmed issues were found.

## Output Format

List findings first, ordered by severity. Keep summaries brief and secondary.

Use this format for each finding:

```markdown
**[SEVERITY] [PROVABILITY]** Brief description
`file.ts:42` - Explain the evidence and why the behavior is wrong.
Scenario: Concrete input, state, or sequence that triggers the issue.
Suggested fix: Short fix direction or code-level change, if clear.
```

Severity labels:

- `CRITICAL`: security break, data loss, fund/value loss, or broadly reachable crash.
- `HIGH`: logic error, type-safety break, auth regression, or important broken behavior.
- `MEDIUM`: validation gap, edge case, resilience issue, or maintainability risk with concrete impact.
- `LOW`: minor but real issue, usually tooling, documentation accuracy, or narrowly scoped correctness.

If no confirmed issues exist, use this shape:

```markdown
No confirmed issues found.
Validation: <commands run, skipped, or not available>.
Notes: <coverage limits, if any>.
```
