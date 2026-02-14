---
name: summarize-work
description: Summarizes session work for commit messages or branch reviews. Analyzes session history to extract major changes, bug fixes, challenges requiring multiple iterations, and code review fixes. Load before committing or when preparing to document completed work.
---

# Summarize Work

Generate meaningful summaries of work completed in one or more sessions. Use for commit messages, PR descriptions, or documenting what happened across a time period.

## OpenCode Session Database

OpenCode stores session data in SQLite at `~/.local/share/opencode/opencode.db`. Use `sqlite3 -header` to query. WAL mode is enabled -- safe to read while OpenCode is running.

### Schema

```
project (1) ──< session (many)
                  ├──< message (many)
                  │       └──< part (many)
                  └──< todo (many)
```

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `project` | Git repo / working directory | `id`, `worktree`, `name` |
| `session` | A conversation | `id`, `project_id`, `title`, `time_created`, `time_updated`, `time_archived` |
| `message` | A user or assistant turn | `id`, `session_id`, `data` (JSON), `time_created` |
| `part` | Content within a message | `id`, `message_id`, `session_id`, `data` (JSON) |
| `todo` | Task list items per session | `session_id`, `content`, `status`, `priority`, `position` |

### JSON `data` columns

`message.data` and `part.data` are JSON blobs. The `id`, `session_id`, and `message_id` fields are stored as proper columns, not inside the JSON.

**`message.data`** discriminates on `role`:
- `"user"` -- `time.created`, `agent`, `model` (providerID + modelID)
- `"assistant"` -- `parentID`, `modelID`, `providerID`, `agent`, `cost`, `tokens`, `error`, `summary` (true = compaction summary), `finish`, `time.created`, `time.completed`

**`part.data`** discriminates on `type`: `text`, `tool`, `reasoning`, `step-start`, `step-finish`, `snapshot`, `patch`, `subtask`, `file`, `compaction`, `agent`, `retry`. See `references/queries.md` for how to extract each.

### Key conventions

- **Timestamps** are Unix epoch **milliseconds**. Use `/ 1000` with `datetime()`.
- **Compaction**: sessions that overflow context get a `compaction` part followed by an assistant message with `summary: true`. For summarization, read **all** messages regardless of compaction.
- **Subagent sessions** have a non-null `parent_id`. Filter with `parent_id IS NULL` to get root sessions only.
- **Empty sessions** (1-2 messages) are noise. Filter with a message count threshold (`> 2`).

### SQL reference

See `references/queries.md` for the full query cookbook. The two most common queries:

**Discover sessions** (adapt filters to the request):

```sql
SELECT s.id, s.title, p.name, p.worktree,
       datetime(s.time_created / 1000, 'unixepoch', 'localtime') AS created,
       (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) AS msg_count
FROM session s
JOIN project p ON s.project_id = p.id
WHERE s.time_archived IS NULL AND s.parent_id IS NULL
  AND (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) > 2
ORDER BY s.time_created DESC;
```

Add `WHERE p.worktree = '<path>'` to scope to one project. Add date/time filters as needed.

**Read a session's content:**

```sql
SELECT json_extract(m.data, '$.role') AS role,
       SUBSTR(json_extract(p.data, '$.text'), 1, 1000) AS text
FROM message m
JOIN part p ON p.message_id = m.id
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(p.data, '$.type') = 'text'
ORDER BY m.time_created ASC;
```

## Determining Scope

Read the user's request to decide what to query. Default to the current project unless the request asks for more.

| Request | Action |
|---------|--------|
| "summarize this session" | Use conversation history already in context. Do not query the DB. |
| "summarize my last session" | Query current project. |
| "summarize today's sessions" | Query current project. |
| "summarize this morning" | Query current project. |
| "summarize all my work this morning" | Query all projects -- the user asked for breadth. |
| "what did I do today across repos" | Query all projects. |
| "summarize the bonk sessions" | Query all projects -- named project may not be the current one. |
| "summarize sessions in this repo" | Query current project -- explicit scope. |

If the user says the summary is incomplete or asks "what about X?", widen scope and re-query.

## Workflow

```
- [ ] Gather context (session history + git state)
- [ ] Categorize changes
- [ ] Generate summary
```

### Gather Context

**Current session:** Use the conversation history already in context.

**Other sessions:** Determine scope (above), then query. For each substantive session, read user prompts and assistant responses. Supplement with tool call history if the text alone is unclear.

For repo-scoped requests, also check git state:

```bash
git diff --stat
git diff --cached --stat
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline origin/master..HEAD
```

### Categorize Changes

Group into these categories (skip empty ones):

| Category | Examples |
|----------|---------|
| **Features** | New endpoints, UI components, CLI commands |
| **Fixes** | Edge case handling, validation, error corrections |
| **Refactors** | Extractions, simplifications, performance |
| **Challenges** | Issues requiring 3+ attempts, debugging sessions |
| **Review fixes** | Changes made from code review feedback |

### Generate Summary

Write like a colleague giving a verbal recap. Mix prose and bullets naturally.

- Open with 1-2 sentences of context -- what happened and why
- Follow with bullets only where they add specifics. A list of 3 changes is useful; a list of 15 is not.
- If a session was focused on one thing, a paragraph with no bullets is fine.

**Commit messages:** One subject line, a sentence of context in the body, a few bullets if there were multiple meaningful changes. Most commits don't need bullets.

**PR summaries:** Open with the goal and outcome in prose. Bullet the major functional changes. Skip what the diff already makes obvious.

**Cross-project summaries:** Group by project or theme. A short prose paragraph per group reads better than a flat list of bullets across unrelated repos.

### Calibration

| Context | Shape |
|---------|-------|
| Single commit | 1-3 sentences, maybe a couple bullets. No headers. |
| Multi-commit session | Paragraph of context + grouped bullets. |
| Feature branch | Prose intro + bullets per component. Include challenges if significant. |
| Cross-session / cross-project | Paragraph per project or theme, bullets within each. |

## Guidelines

- Focus on meaningful changes -- skip trivial edits, typo fixes, formatting
- Capture the "why," not just the "what"
- Highlight multi-iteration challenges -- valuable context for future maintainers
- Be specific -- "fix auth token expiry handling" not "fix auth bug"
- Use imperative mood -- "add", "fix", "refactor"
- Match structure to content -- not every summary needs headers, tables, or bullets

## Anti-patterns

- Listing every file changed (the diff shows that)
- Mixing trivial changes with meaningful ones
- Vague descriptions ("various improvements", "code cleanup")
- Omitting context for complex changes
- Querying the DB for the current session when conversation history is already in context
- Forcing a rigid template when the content doesn't fit
