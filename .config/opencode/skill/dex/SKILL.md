---
name: dex
description: Manage tasks via dex CLI for persistent task tracking across sessions. Load when breaking down complex work, tracking implementation items, or coordinating multi-session projects.
---

# Task Coordination with dex

Dex provides persistent task tracking for LLM workflows. Tasks are tickets (not todos) with rich context that survives across sessions.

## FIRST: Verify Installation

```bash
command -v dex &>/dev/null && dex --version
```

If not available, use `npx @zeeg/dex <command>` instead of `dex <command>`.

## Core Concept: Tickets, Not Todos

Dex tasks are structured artifacts:
- **Description**: One-line summary (issue title)
- **Context**: Full requirements, approach, constraints (issue body)
- **Result**: Implementation details, decisions, outcomes (PR description)

## When to Use dex

| Use dex | Skip dex |
|---------|----------|
| Multi-step work (3+ steps) | Single atomic action |
| Cross-session persistence needed | Fits in one session |
| Coordinate with other agents | No follow-up expected |
| Record decisions for future | Simple, self-explanatory change |

## Quick Reference

| Task | Command |
|------|---------|
| Create task | `dex create -d "Description" --context "Details"` |
| List pending | `dex list` |
| List all | `dex list --all` |
| List ready (unblocked) | `dex list --ready` |
| View task | `dex show <id>` |
| Complete task | `dex complete <id> --result "What was done"` |
| Edit task | `dex edit <id> -d "New desc" --context "New context"` |
| Delete task | `dex delete <id>` |

## Creating Tasks

```bash
dex create -d "Short description" --context "Full implementation context"
```

### Options

| Flag | Purpose |
|------|---------|
| `-d, --description` | One-line summary (required) |
| `--context` | Full details, requirements, approach (required) |
| `-p, --priority <n>` | Lower = higher priority (default: 1) |
| `-b, --blocked-by <ids>` | Comma-separated blocker task IDs |
| `--parent <id>` | Create as subtask of parent |

### Good Context Example

```bash
dex create -d "Migrate storage to one file per task" \
  --context "Change storage format for git-friendliness:

Structure: .dex/tasks/{id}.json (one file per task, no index)

Implementation:
1. Update storage.ts read() to scan directory
2. Update write() for single-file operations
3. Add migration from old single-file format
4. Update tests

Done when: All tests pass, git diffs show isolated task changes"
```

## Completing Tasks

```bash
dex complete <id> --result "Implementation summary"
```

### Link Commits

```bash
dex complete <id> --result "What was done" --commit <sha>
```

### Good Result Example

```bash
dex complete abc123 --result "Migrated storage to one-file-per-task:

Implementation:
- Modified Storage.read() to scan .dex/tasks/ directory
- Modified Storage.write() for individual file operations
- Added auto-migration from old format

Verification:
- All 60 tests passing
- Build successful
- Manual test: create/update/delete operations work"
```

## Hierarchy

Dex supports 3 levels maximum:

| Level | Name | Purpose |
|-------|------|---------|
| L0 | Epic | Large initiative (5+ tasks) |
| L1 | Task | Significant work item |
| L2 | Subtask | Atomic implementation step |

### Create Subtask

```bash
dex create --parent <parent-id> -d "Subtask description" --context "..."
```

### Completion Rules

- Complete all subtasks before completing parent
- Parent task cannot complete with pending children

## Blocking Dependencies

```bash
# Create blocked task
dex create -d "Deploy" --context "..." --blocked-by abc123

# Add blocker to existing task
dex edit xyz789 --add-blocker abc123

# Remove blocker
dex edit xyz789 --remove-blocker abc123
```

View blocked tasks: `dex list --blocked`
View ready tasks: `dex list --ready`

## Important Rules

1. **Never reference task IDs in commits/PRs** - task IDs are ephemeral
2. **Verify before completing** - include test results in `--result`
3. **Right-size tasks** - completable in one focused session
4. **3-7 children per parent** - avoid over-decomposition

## Storage

Tasks stored as individual JSON files:
- `<git-root>/.dex/tasks/{id}.json` (in git repos)
- `~/.dex/tasks/{id}.json` (fallback)

Override with `--storage-path` or `DEX_STORAGE_PATH` env var.
