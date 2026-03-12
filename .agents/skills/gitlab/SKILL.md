---
name: gitlab
description: Manages GitLab merge requests, CI/CD pipelines, and issues via glab CLI. Load before running glab commands, creating MRs, debugging pipeline failures, checking CI status, or any GitLab operation. Triggers on "merge request", "pipeline", "CI failure", "glab", or when git remote contains "gitlab".
---

# GitLab Workflow

Operate on GitLab repositories using the `glab` CLI — merge requests, CI/CD pipelines, issues, and releases.

## FIRST: Verify Environment

Run both checks before any `glab` command. If either fails, STOP.

```bash
git remote -v | grep -i gitlab
glab auth status
```

If `glab` is not installed, ask the user to install it (`brew install glab` on macOS, `sudo apt install glab` on Debian/Ubuntu). If not authenticated, run `glab auth login`. For self-managed instances, use `glab auth login --hostname gitlab.example.com`.

## Critical Rules

- **Avoid interactive commands.** `glab ci view` launches a TUI the agent cannot operate. Use `glab ci status` for pipeline state and `glab ci view --web` to open in browser. Always pass `--fill --yes` to `glab mr create` to skip interactive prompts.
- **Check CI before requesting review.** Run `glab ci status` after pushing. A broken pipeline wastes reviewer time and signals the MR isn't ready.
- **Pull logs first on CI failure.** Run `glab ci trace <job-name>` before anything else — 90% of failures are self-explanatory from the logs.

## Behavioral Guidelines

- Use draft MRs for work in progress: create with `--draft`, mark ready with `glab mr update <id> --ready`
- Reference issues explicitly: `Closes #123` for auto-close, `Relates to #123` for tracking only
- Retry flaky failures, fix real ones: `glab ci retry <job-name>` once. If it fails again, it's a real issue — read the logs and fix the code.

## Quick Reference: MR Commands

| Task | Command |
|------|---------|
| Create MR (non-interactive) | `glab mr create --fill --yes -b main` |
| Create draft MR | `glab mr create --fill --yes --draft -b main` |
| List open MRs | `glab mr list` |
| View MR details | `glab mr view 123` |
| View MR comments | `glab mr view 123 --comments` |
| View MR diff | `glab mr diff 123` |
| Check out MR locally | `glab mr checkout 123` |
| Mark draft as ready | `glab mr update 123 --ready` |
| Add reviewers | `glab mr update 123 --reviewer user1,user2` |
| Approve MR | `glab mr approve 123` |
| Squash and merge | `glab mr merge 123 --squash` |
| Merge without waiting for CI | `glab mr merge 123 --auto-merge=false` |
| Add MR comment | `glab mr note 123 -m "message"` |

## Quick Reference: CI Commands

| Task | Command |
|------|---------|
| Check pipeline status | `glab ci status` |
| Watch pipeline live | `glab ci status --live` |
| Open pipeline in browser | `glab ci view --web` |
| List recent pipelines | `glab ci list` |
| Pull job logs | `glab ci trace <job-name>` |
| Retry failed job | `glab ci retry <job-name>` |
| Run new pipeline | `glab ci run` |
| Run with variables | `glab ci run --variables "KEY:value"` |
| Download artifacts | `glab job artifact <ref> <job-name>` |

## Workflow: Branch to Merged MR

After branching, committing, and pushing:

```bash
glab mr create --fill --yes -b main    # create MR
glab ci status --live                   # watch pipeline
# if CI fails:
glab ci trace <failed-job-name>         # pull logs, fix, push
glab ci status --live                   # verify fix
# when CI passes and MR is approved:
glab mr merge --squash --remove-source-branch
```

## CI Failure Remediation

1. `glab ci status` — identify which pipeline failed
2. `glab ci trace <job-name>` — pull the failed job's logs
3. Read the logs from the bottom up — the final error is usually the root cause
4. Reproduce locally if possible (run the same commands from `.gitlab-ci.yml`)
5. Fix, commit, push
6. `glab ci status --live` — watch the new pipeline
7. If still failing, repeat from step 2

### Common CI Log Signatures

| Pattern | Log Signature |
|---------|---------------|
| Test failure | `FAIL`, `AssertionError`, `expected ... got` |
| Build failure | `compilation failed`, `cannot find module` |
| Timeout | `Job timed out`, `exceeded limit` |
| Missing env/secret | `undefined`, `authentication failed` |
| Dependency issue | `404 Not Found`, `version not found` |

For operations not covered by glab subcommands, use `glab api` directly. For detailed command options, issue management, releases, search, and advanced CI debugging, see [references/commands.md](references/commands.md).

Use `--fill --yes` for MR creation and `glab ci status` instead of `glab ci view` — interactive TUI commands will hang.
