# SQL Query Reference

All queries target `~/.local/share/opencode/opencode.db`. Use `sqlite3 -header` for readable output.

## Session Discovery

**List sessions for the current project:**

```sql
SELECT s.id, s.title,
       datetime(s.time_created / 1000, 'unixepoch', 'localtime') AS created,
       (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) AS msg_count
FROM session s
JOIN project p ON s.project_id = p.id
WHERE p.worktree = '<REPO_PATH>'
  AND s.time_archived IS NULL
  AND s.parent_id IS NULL
  AND (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) > 2
ORDER BY s.time_created DESC
LIMIT 20;
```

**List sessions across all projects (for cross-repo requests):**

```sql
SELECT s.id, s.title, p.name, p.worktree,
       datetime(s.time_created / 1000, 'unixepoch', 'localtime') AS created,
       (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) AS msg_count
FROM session s
JOIN project p ON s.project_id = p.id
WHERE s.time_archived IS NULL
  AND s.parent_id IS NULL
  AND (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) > 2
ORDER BY s.time_created DESC
LIMIT 50;
```

Add time filters as needed:

```sql
-- Today only
AND date(s.time_created / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')

-- Before noon (morning)
AND time(s.time_created / 1000, 'unixepoch', 'localtime') < '12:00:00'

-- This week
AND s.time_created / 1000 >= strftime('%s', 'now', 'localtime', 'weekday 0', '-7 days')
```

**Find sessions by title:**

```sql
SELECT id, title, datetime(time_updated / 1000, 'unixepoch', 'localtime') AS updated
FROM session
WHERE title LIKE '%search term%'
  AND time_archived IS NULL
ORDER BY time_updated DESC;
```

## Session Content

**User prompts + assistant responses (primary query for understanding a session):**

```sql
SELECT json_extract(m.data, '$.role') AS role,
       SUBSTR(json_extract(p.data, '$.text'), 1, 1000) AS text
FROM message m
JOIN part p ON p.message_id = m.id
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(p.data, '$.type') = 'text'
ORDER BY m.time_created ASC;
```

**Tool calls (what the agent did):**

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

**Files changed via patches:**

```sql
SELECT DISTINCT json_each.value AS file
FROM part p
JOIN message m ON p.message_id = m.id,
     json_each(json_extract(p.data, '$.files'))
WHERE m.session_id = '<SESSION_ID>'
  AND json_extract(p.data, '$.type') = 'patch'
ORDER BY file;
```

## Cost and Usage

**Token usage and cost per model:**

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

**Todos for a session:**

```sql
SELECT content, status, priority
FROM todo
WHERE session_id = '<SESSION_ID>'
ORDER BY position;
```
