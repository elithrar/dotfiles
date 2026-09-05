---
name: code-reviewer
description: Review a specified code change for actionable defects. Use for uncommitted changes, base-branch diffs, commits, PRs or MRs; review alone is read-only, and requested fixes follow the review. Not a repository-wide security or complexity audit.
---

# Code Reviewer

Keep review-only requests read-only. When the user also requests fixes, a PR, or posted findings, complete the review and then perform the authorized follow-up. The skill does not authorize additional external actions.

Use the target named by the user. If no target is given, review uncommitted changes. If the working tree is clean, report that no uncommitted target exists rather than silently reviewing the last commit.

Review behavior introduced or materially affected by the change. Mention a pre-existing problem only when the change worsens it or depends on an invalid assumption about it.

## Workflow

1. Read the applicable `AGENTS.md` and repository review instructions.
2. Resolve the exact review target and inspect the complete diff.
3. For a base-branch review, resolve the requested base and compute its merge base with the review head. Prefer the remote-tracking ref of that base when it is ahead of its local ref; the feature branch's own upstream is not the base.
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
