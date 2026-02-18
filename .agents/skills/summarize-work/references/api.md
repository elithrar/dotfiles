# API Reference

All endpoints target the OpenCode server. Default base URL: `http://localhost:4096`.

## Session Discovery

**List sessions across all projects (cross-repo requests):**

```bash
curl -sf "$OPENCODE_URL/global/session?roots=true&limit=20"
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `directory` | string | Filter by project directory path |
| `roots` | boolean | Only root sessions (exclude subagent sessions) |
| `start` | number | Filter sessions updated on or after this timestamp (ms since epoch) |
| `search` | string | Filter by title (case-insensitive) |
| `limit` | number | Max results (default 100) |
| `archived` | boolean | Include archived sessions (default false) |

Response includes project metadata on each session:

```json
[{
  "id": "session_abc123",
  "title": "fix auth token handling",
  "projectID": "proj_xyz",
  "parentID": null,
  "time": { "created": 1739836800000, "updated": 1739840400000 },
  "project": { "id": "proj_xyz", "name": "my-app", "worktree": "/home/user/my-app" }
}]
```

**List sessions for the current project:**

```bash
curl -sf "$OPENCODE_URL/session?roots=true&limit=20"
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `directory` | string | Filter by project directory path |
| `roots` | boolean | Only root sessions (exclude subagent sessions) |
| `start` | number | Filter sessions updated on or after this timestamp (ms since epoch) |
| `search` | string | Filter by title (case-insensitive) |
| `limit` | number | Max results |

**Filter by time:**

```bash
# Today only (compute start-of-day in ms)
START=$(date -d "today 00:00" +%s)000
curl -sf "$OPENCODE_URL/global/session?roots=true&start=$START"

# This week
START=$(date -d "last monday" +%s)000
curl -sf "$OPENCODE_URL/global/session?roots=true&start=$START"
```

**Search sessions by title:**

```bash
curl -sf "$OPENCODE_URL/global/session?search=auth&roots=true"
```

## Session Content

**Messages (primary query for understanding a session):**

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message"
```

Returns an array of `{ info, parts }` objects. Each message has:

- `info.role`: `"user"` or `"assistant"`
- `info.cost`, `info.tokens`: usage data (assistant messages)
- `parts[]`: array of content parts, each with a `type` field

Extract text content:

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message" | \
  jq '[.[] | {role: .info.role, text: [.parts[] | select(.type == "text") | .text[:1000]] | join(" ")}]'
```

Extract tool calls (what the agent did):

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message" | \
  jq '[.[] | .parts[] | select(.type == "tool") | {tool, status: .state.status, title: .state.title}]'
```

**Limit messages** (useful for large sessions):

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message?limit=50"
```

## Todos

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/todo"
```

Returns:

```json
[{
  "content": "Fix validation logic",
  "status": "completed",
  "priority": "high"
}]
```

## Projects

**List all projects:**

```bash
curl -sf "$OPENCODE_URL/project"
```

**Get current project:**

```bash
curl -sf "$OPENCODE_URL/project/current"
```

Returns `{ id, name, worktree }` -- use `worktree` to scope session queries by directory.

## Fallback: Direct SQLite

If the API server is unreachable, query `~/.local/share/opencode/opencode.db` directly. Tables mirror the API: `session`, `message`, `todo`. JSON columns use SQLite `json_extract()`.

```bash
sqlite3 ~/.local/share/opencode/opencode.db "SELECT id, title FROM session ORDER BY updated_at DESC LIMIT 10"
```

## Cost and Usage

Token usage is embedded in assistant message metadata:

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message" | \
  jq '[.[] | select(.info.role == "assistant") | {model: .info.modelID, cost: .info.cost, tokens: .info.tokens}]'
```
