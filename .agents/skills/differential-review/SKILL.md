---
name: differential-review
description: >
  Performs security-focused differential review of code changes (PRs, commits, diffs).
  Load for security audit, regression review, auth/crypto/access-control changes,
  validation removal, blast-radius analysis, adversarial review, or comprehensive
  markdown reports. Use standard code-reviewer for ordinary quick reviews.
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash
---

# Differential Security Review

Review code changes as security regressions relative to a baseline. Focus on changed behavior, removed invariants, reachable attack paths, and test coverage.

## Routing

- Use `code-reviewer` for ordinary bug-focused or quick code review.
- Use this skill when the user asks for security, audit, regression, blast radius, adversarial review, or when the diff touches auth, authorization, crypto, validation, secrets, external calls, data exposure, or value transfer.
- If the user explicitly asks for a quick summary, scale the report down and state coverage limits instead of forcing a full audit artifact.

## Retrieval Rules

Read the narrowest reference needed:

| Need | Reference |
|---|---|
| Detailed phases 0-4 | `methodology.md` |
| Attacker modeling and exploitability | `adversarial.md` |
| Final report template | `reporting.md` |
| Vulnerability pattern lookup | `patterns.md` |
| Previous full skill text | `references/full-workflow.md` |

## Core Principles

1. **Risk-first:** Spend depth on auth, crypto, value transfer, external calls, validation, secrets, and data exposure.
2. **Evidence-based:** Every finding needs changed code lines, concrete scenario, and security impact.
3. **Differential:** Look for removed checks, widened access, changed trust boundaries, and broken historical fixes.
4. **Adaptive:** Scale to codebase size and user intent; be explicit about coverage limits.
5. **Adversarial when needed:** For high-risk changes, model the attacker and exploit path.

## Risk Triage

| Risk | Triggers | Depth |
|---|---|---|
| High | Auth, authorization, crypto, external calls, value transfer, validation removal, secrets, data exposure | Read history, callers, tests, and adversarial reference |
| Medium | Business logic, persistence, state transitions, public APIs, concurrency | Read changed files and direct dependencies |
| Low | Comments, tests, formatting, logging-only changes | Surface scan unless coupled to high-risk code |

Treat “refactor” as high risk until preserved invariants are proven when the touched path is security-sensitive.

## Workflow

1. Establish baseline: diff range, changed files, purpose, and security-relevant surfaces.
2. Classify each changed file by risk.
3. Read high-risk changed files in full, plus direct callers, callees, config, tests, and entry points.
4. Check git history for removed security code or previous fixes:
   ```bash
   git log -S "pattern" --all --oneline --grep="fix\|security\|CVE"
   git blame <file>
   ```
5. Estimate blast radius for high-risk changes: externally reachable routes, callers, tenants/users affected, privilege boundaries crossed.
6. Check test coverage for changed invariants. Missing tests elevate uncertainty and may elevate severity.
7. For high-risk findings, create concrete attack scenarios and exploitability ratings using `adversarial.md`.
8. Generate a report file when the user asked for an audit/report or the review is substantial; otherwise provide concise findings in chat.

## Red Flags

Stop and investigate immediately when you see:

- Removed or weakened permission checks, ownership checks, role checks, or validation.
- `internal` to `external`, private route to public route, or broader token/session acceptance.
- Algorithm/mode changes, signature verification changes, key handling changes, or disabled TLS/verification.
- External calls before state updates, missing idempotency, or value transfer without replay protection.
- High blast radius plus any high-risk trigger.

## Evidence Standard

Before reporting:

- Cite `file:line` for the changed or directly affected code.
- Provide a concrete attacker action or failure sequence.
- Explain the security property that fails.
- Distinguish `Confirmed`, `Likely`, and `Design concern`.
- Drop generic findings without a reachable scenario.

## Output

Order findings by severity. Use this format:

```markdown
**[SEVERITY] [CONFIDENCE]** Brief description
`file:line` - Evidence from the diff and surrounding code.
Attack scenario: Concrete sequence an attacker or untrusted caller can perform.
Impact: Confidentiality, integrity, availability, privilege, funds/value, or compliance impact.
Suggested fix: Smallest safe change or invariant-restoring direction.
```

If generating a report file, use `reporting.md` and tell the user the path. If no confirmed issues are found, say what was reviewed, what validation ran or was skipped, and any coverage limits.
