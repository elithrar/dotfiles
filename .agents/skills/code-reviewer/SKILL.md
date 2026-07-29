---
name: code-reviewer
description: Perform a read-only, defect-first review of a specified code change and return actionable findings. Use for uncommitted changes, base-branch diffs, commits, PRs or MRs, or named changed files. Use differential-review for security-focused audits and simplify for complexity-only reviews.
---

# Code Reviewer

Review the requested change without modifying files, creating commits, pushing branches, posting comments, or resolving threads.

Use the target named by the user. If no target is given, review uncommitted changes. If the working tree is clean, report that no uncommitted target exists rather than silently reviewing the last commit.

Review behavior introduced or materially affected by the change. Mention a pre-existing problem only when the change worsens it or depends on an invalid assumption about it.

## Workflow

1. Read the applicable `AGENTS.md` and repository review instructions.
2. Resolve the exact review target and inspect the complete diff.
3. For a base-branch review, find the merge base and review the changes that would actually merge. Prefer the branch upstream when it exists and is ahead of the local ref.
4. Read enough surrounding implementation, tests, callers, and configuration to understand each changed path.
5. Identify the intended behavior, preserved invariants, externally reachable paths, and highest-risk changes.
6. Verify each candidate finding from code, relevant history, or the smallest diagnostic check that can confirm or disprove it.
7. Continue through the complete diff after finding an issue.
8. Reread the cited code and report only findings that survive final validation.

## Validation

Prefer repository instructions and configured project commands. Run a targeted check only when it can confirm or disprove a candidate finding or material regression.

Do not install dependencies, invoke generic package runners that may download tools, or run broad suites solely because a manifest exists.

Attribute a failure to the reviewed change before presenting it as a finding. Otherwise report it as a verification limitation.

## Review Focus

Look for meaningful, change-introduced defects involving:

- Correctness and state transitions.
- Authorization, validation, secrets, or data exposure.
- Concurrency, persistence, retries, or partial failure.
- Public contracts and compatibility.
- Performance on reachable paths and realistic input sizes.
- Maintainability only when the change creates concrete bug risk or costly coupling.

Spend the most depth on high-impact or externally reachable paths.

Do not report style preferences, speculative future concerns, intentional behavior changes, pre-existing problems, or mechanical issues already enforced reliably by configured tooling.

## Finding Standard

Report a finding only when all of these are true:

- It affects correctness, security, performance, or maintainability meaningfully.
- It is discrete and actionable.
- It was introduced by the reviewed change.
- The affected input, state, sequence, or call path can be demonstrated.
- The author would probably fix it if they knew about it.

Cite the smallest changed line range that causes the issue. The cited range must overlap the reviewed diff. Explain the concrete scenario in the finding paragraph.

Drop speculative concerns and findings that cannot be tied to the reviewed change.

## Review Passes

Use multiple focused passes when useful, but do not delegate unless the user or host workflow explicitly requests independent reviewers. Revalidate every compiled finding against the code. Disagreement is a reason to inspect further, not to choose the higher severity.

## Output

Present findings first, ordered by priority. Use one entry per issue:

```text
[P1] Imperative finding title — path/to/file.ts:42
```

Follow with one short paragraph describing the affected scenario and why the behavior is wrong. Add a fix direction only when it is not obvious.

- `P0`: Universal release blocker or critical failure.
- `P1`: Urgent defect that should be fixed next.
- `P2`: Ordinary defect that should be fixed.
- `P3`: Low-impact issue still worth fixing.

If no finding qualifies, say `No findings.` Then add a brief overall assessment and any material test gaps or residual risks.
