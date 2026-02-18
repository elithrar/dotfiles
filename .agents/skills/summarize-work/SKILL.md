---
name: summarize-work
description: Summarizes session work for commit messages or branch reviews. Queries the OpenCode server API to find and read sessions, extract major changes, bug fixes, challenges requiring multiple iterations, and code review fixes. Load before committing or when preparing to document completed work.
---

# Summarize Work

Generate meaningful summaries of work completed in one or more sessions. Use for commit messages, PR descriptions, or documenting what happened across a time period.

## OpenCode Server API

OpenCode exposes session data through its HTTP server. The server runs automatically when OpenCode is active.

### Server URL

Discover the server URL with:

```bash
OPENCODE_URL=$(curl -sf http://localhost:4096/global/health | jq -r '.version' > /dev/null && echo "http://localhost:4096")
```

Default is `http://localhost:4096`. All endpoints below are relative to this base URL.

### API Reference

See `references/api.md` for the full endpoint reference. The key endpoints for summarization:

**Discover sessions across all projects:**

```bash
curl -sf "$OPENCODE_URL/global/session?roots=true&limit=20" | jq '.[] | {id, title, project: .project.worktree}'
```

Query parameters: `directory`, `roots`, `start`, `search`, `limit`, `archived`.

**Discover sessions for the current project:**

```bash
curl -sf "$OPENCODE_URL/session?roots=true&limit=20" | jq '.[] | {id, title}'
```

Query parameters: `directory`, `roots`, `start`, `search`, `limit`.

**Read a session's messages:**

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/message" | jq '[.[] | {role: .info.role, parts: [.parts[] | select(.type == "text") | .text[:1000]]}]'
```

**Get a session's todos:**

```bash
curl -sf "$OPENCODE_URL/session/<SESSION_ID>/todo" | jq '.[] | {content, status, priority}'
```

### Key conventions

- **Timestamps** are Unix epoch **milliseconds**. Use `?start=<ms>` to filter by time.
- **Root sessions** exclude subagent sessions. Use `?roots=true` for session discovery.
- **Archived sessions** are excluded by default. Use `?archived=true` to include them.
- **Global vs project-scoped**: `/global/session` returns sessions across all projects with project metadata. `/session` returns sessions for the current project only.
- **Empty sessions** (1-2 messages) are noise. Filter in post-processing.

## Determining Scope

Read the user's request to decide which endpoint to use. Default to the current project unless the request asks for more.

| Request | Endpoint |
|---------|----------|
| "summarize this session" | Use conversation history already in context. Do not query the API. |
| "summarize my last session" | `GET /session` -- current project. |
| "summarize today's sessions" | `GET /session?start=<today_ms>` -- current project. |
| "summarize this morning" | `GET /session?start=<today_ms>` -- current project, filter by time. |
| "summarize all my work this morning" | `GET /global/session?start=<today_ms>` -- all projects. |
| "what did I do today across repos" | `GET /global/session?start=<today_ms>` -- all projects. |
| "summarize the bonk sessions" | `GET /global/session?search=bonk` -- all projects. |
| "summarize sessions in this repo" | `GET /session` -- current project. |

If the user says the summary is incomplete or asks "what about X?", widen scope and re-query.

## Workflow

```
- [ ] Gather context (session history + git state)
- [ ] Categorize changes
- [ ] Generate summary
```

### Gather Context

**Current session:** Use the conversation history already in context.

**Other sessions:** Determine scope (above), then query the appropriate endpoint. For each substantive session (more than 2 messages), read messages via `/session/:id/message`. Supplement with todo data via `/session/:id/todo` if the text alone is unclear.

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
- Querying the API for the current session when conversation history is already in context
- Forcing a rigid template when the content doesn't fit
