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
- When asked to summarize a specific past session or set of sessions

## OpenCode Session Database

OpenCode stores all session data in a SQLite database at `~/.local/share/opencode/opencode.db`.

### Schema Overview

```
project (1) ──< session (many)
                  ├──< message (many)
                  │       └──< part (many)
                  └──< todo (many)
```

**Core tables:**

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `project` | Git repo / working directory | `id`, `worktree`, `name` |
| `session` | A conversation | `id`, `project_id`, `title`, `slug`, `time_created`, `time_updated`, `time_archived` |
| `message` | A user or assistant turn | `id`, `session_id`, `data` (JSON), `time_created` |
| `part` | Content within a message | `id`, `message_id`, `session_id`, `data` (JSON) |
| `todo` | Task list items per session | `session_id`, `content`, `status`, `priority`, `position` |

### Important: JSON `data` columns

The `message.data` and `part.data` columns are JSON blobs. The `id` and `session_id` (and `message_id` for parts) are stored as proper columns, **not** inside the JSON.

**`message.data`** is a discriminated union on `role`:
- `role: "user"` -- contains `time.created`, `agent`, `model` (providerID + modelID)
- `role: "assistant"` -- contains `parentID`, `modelID`, `providerID`, `agent`, `cost`, `tokens` (input/output/reasoning/cache), `error`, `summary` (boolean -- true means compaction summary), `finish`, `time.created`, `time.completed`

**`part.data`** is a discriminated union on `type`:

| Part type | What it contains |
|-----------|-----------------|
| `text` | Plain text content (`text` field). Main content of user prompts and assistant responses. |
| `tool` | Tool call with `callID`, `tool` name, and `state` (pending/running/completed/error). Completed state has `input`, `output`, `title`, `time`. |
| `reasoning` | Model thinking/reasoning content |
| `step-start` | Start of an inference step, optional `snapshot` |
| `step-finish` | End of step with `cost`, `tokens`, `reason`, optional `snapshot` |
| `snapshot` | Git snapshot reference |
| `patch` | File patch with `hash` and `files` list |
| `subtask` | Delegated sub-agent task with `prompt`, `description`, `agent` |
| `file` | Attached file (image, PDF) with `mime` and `url` |
| `compaction` | Marks a compaction boundary |
| `agent` | Marks an agent invocation |
| `retry` | Records an API retry attempt |

### Querying the Database

Use `sqlite3` to query. The database uses WAL mode, so it's safe to read while OpenCode is running.

```bash
sqlite3 ~/.local/share/opencode/opencode.db
```

**List recent sessions for the current project:**

```sql
SELECT s.id, s.title, s.slug,
       datetime(s.time_created / 1000, 'unixepoch', 'localtime') AS created,
       datetime(s.time_updated / 1000, 'unixepoch', 'localtime') AS updated
FROM session s
JOIN project p ON s.project_id = p.id
WHERE p.worktree = '/path/to/repo'
  AND s.time_archived IS NULL
ORDER BY s.time_updated DESC
LIMIT 20;
```

**Find sessions by title search:**

```sql
SELECT id, title, slug,
       datetime(time_updated / 1000, 'unixepoch', 'localtime') AS updated
FROM session
WHERE title LIKE '%search term%'
  AND time_archived IS NULL
ORDER BY time_updated DESC;
```

**Get all user prompt text for a session (what the user asked):**

```sql
SELECT m.id,
       json_extract(m.data, '$.role') AS role,
       json_extract(p.data, '$.text') AS text
FROM message m
JOIN part p ON p.message_id = m.id
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(m.data, '$.role') = 'user'
  AND json_extract(p.data, '$.type') = 'text'
ORDER BY m.time_created ASC;
```

**Get assistant text responses for a session:**

```sql
SELECT m.id,
       json_extract(p.data, '$.text') AS text
FROM message m
JOIN part p ON p.message_id = m.id
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'text'
ORDER BY m.time_created ASC;
```

**Get tool calls for a session (what tools the agent used):**

```sql
SELECT json_extract(p.data, '$.tool') AS tool,
       json_extract(p.data, '$.state.status') AS status,
       json_extract(p.data, '$.state.title') AS title
FROM part p
JOIN message m ON p.message_id = m.id
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(p.data, '$.type') = 'tool'
ORDER BY p.time_created ASC;
```

**Get token usage and cost for a session:**

```sql
SELECT json_extract(m.data, '$.modelID') AS model,
       SUM(json_extract(m.data, '$.cost')) AS total_cost,
       SUM(json_extract(m.data, '$.tokens.input')) AS input_tokens,
       SUM(json_extract(m.data, '$.tokens.output')) AS output_tokens
FROM message m
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(m.data, '$.role') = 'assistant'
GROUP BY json_extract(m.data, '$.modelID');
```

**Get files changed via patches in a session:**

```sql
SELECT DISTINCT json_each.value AS file
FROM part p
JOIN message m ON p.message_id = m.id,
     json_each(json_extract(p.data, '$.files'))
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(p.data, '$.type') = 'patch'
ORDER BY file;
```

**Get todos for a session:**

```sql
SELECT content, status, priority
FROM todo
WHERE session_id = '<SESSION_ID>'
ORDER BY position;
```

### Timestamps

All `time_created` and `time_updated` values are **Unix epoch milliseconds** (not seconds). Use `/ 1000` when converting with `datetime()`.

### Compaction

Sessions that exceed context limits get compacted. When this happens:
- A user message with a `compaction` part is inserted
- An assistant message with `summary: true` in its JSON data follows, containing a summary of everything before the compaction point
- Old tool call outputs get their `state.time.compacted` set, and their output becomes `"[Old tool result content cleared]"`

To get only post-compaction messages (what the model currently "remembers"), find the most recent compaction boundary and read from there. For summarization purposes, you usually want **all** messages regardless of compaction.

### Identifying the Current Session

If summarizing the current session, you already have access to the conversation history in context. Prefer using that over querying the database -- it's faster and more complete.

Only query the database when:
- The user asks about a **different** session
- The user wants to compare or aggregate across **multiple** sessions
- The user references a session by title, slug, date, or ID

## Workflow

```
Summary Progress:
- [ ] Phase 1: Gather context (session history + git state)
- [ ] Phase 2: Categorize changes
- [ ] Phase 3: Generate summary
```

### Phase 1: Gather Context

**For the current session:** Analyze the conversation history already in context.

**For other sessions:** Query the database to reconstruct what happened.

```bash
# Find the project ID for the current repo
sqlite3 ~/.local/share/opencode/opencode.db \
  "SELECT id, name FROM project WHERE worktree = '$(git rev-parse --show-toplevel)'"

# List recent sessions for that project
sqlite3 -header ~/.local/share/opencode/opencode.db \
  "SELECT id, title, datetime(time_updated/1000, 'unixepoch', 'localtime') AS updated
   FROM session WHERE project_id = '<PROJECT_ID>' AND time_archived IS NULL
   ORDER BY time_updated DESC LIMIT 20"

# Get the full conversation for a session (user prompts + assistant responses)
sqlite3 -header ~/.local/share/opencode/opencode.db \
  "SELECT json_extract(m.data, '$.role') AS role,
          json_extract(p.data, '$.type') AS type,
          SUBSTR(json_extract(p.data, '$.text'), 1, 500) AS text_preview
   FROM message m
   JOIN part p ON p.message_id = m.id
   WHERE m.session_id = '<SESSION_ID>'
     AND json_extract(p.data, '$.type') IN ('text', 'tool')
   ORDER BY m.time_created ASC"
```

For understanding **what changed**, check git state:

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

<One-sentence context -- the problem or motivation>

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

- **Focus on meaningful changes** -- Skip trivial edits, typo fixes, or formatting
- **Capture the "why"** -- Not just what changed but why it mattered
- **Highlight challenges** -- Multi-iteration problems are valuable context for future maintainers
- **Be specific** -- "Fix auth token expiry handling" not "Fix auth bug"
- **Use imperative mood** -- "Add", "Fix", "Refactor" not "Added", "Fixed"

## Output Calibration

| Context | Detail Level |
|---------|--------------|
| Single commit | 1-3 bullet points, focus on the "what" |
| Multi-commit session | Group by theme, include challenges |
| Feature branch | Full summary with context and challenges |
| Cross-session summary | Aggregate themes, note progression across sessions |

## Anti-patterns

- Listing every file changed (the diff shows that)
- Including trivial changes alongside meaningful ones
- Vague descriptions ("various improvements", "code cleanup")
- Missing context for complex changes
- Querying the database for the current session when conversation history is already in context
