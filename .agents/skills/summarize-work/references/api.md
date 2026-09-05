# OpenCode history retrieval

Use for session history outside the current conversation. Verify the running version through its [server documentation](https://opencode.ai/docs/server/) and exposed `/doc` schema when an endpoint or response differs. Bundled examples are starting points, not a complete versioned API contract.

## Discover and scope

Use the configured server URL. `http://localhost:4096` is the default for `opencode serve`; a TUI session can use a randomly assigned port. Do not treat failure at port 4096 as proof that OpenCode is stopped.

```bash
curl --fail --silent --show-error --max-time 5 "$OPENCODE_URL/global/health"
```

Check the returned health/version. Use existing connection configuration or process arguments to locate a different port; do not print credentials or sweep unrelated ports. Read `/doc` for supported query parameters and response shapes.

| Need | Read path |
|---|---|
| Identify the current project | `GET /project/current` |
| List projects when cross-project work is requested | `GET /project` |
| List sessions for a known directory | `GET /session` with the supported directory selector |
| Read a session | `GET /session/{id}/message` |
| Clarify task intent | `GET /session/{id}/todo` |

Use `/global/session` only if the running version advertises it. Otherwise enumerate requested projects and query sessions by directory. A global server's current project is not necessarily the repository the user requested.

For directory-scoped requests, encode the directory rather than interpolating it into a URL:

```bash
curl --fail --silent --show-error --max-time 15 --get \
  --data-urlencode "directory=$PROJECT_DIR" "$OPENCODE_URL/session"
```

Confirm filtering, root/child session behavior, limits, archives, and pagination against the running schema. Read additional result pages when needed for the requested period, or state the coverage limit. Include relevant child-session work when it is not represented in the parent.

## Time and content

Compute boundaries in the user's timezone using available timezone-aware tooling. Avoid GNU-only `date -d` commands in these macOS/Linux dotfiles. OpenCode time fields use epoch milliseconds; verify their meaning before filtering. Session update time is a discovery hint, not proof that every message occurred in the requested interval. Filter actual message times for the summary.

Retrieve full relevant messages, including tool results when they substantiate completed work. Text previews can help triage but are not complete evidence. If fetching a bounded message list, inspect pagination and report truncation rather than claiming a full recap.

## Read-only SQLite fallback

If server retrieval fails and local database access fits the request, inspect the actual database schema before selecting columns. Do not assume table or timestamp names mirror API objects. The usual location is `~/.local/share/opencode/opencode.db`; resolve any configured data-directory override first.

```bash
sqlite3 -readonly "$OPENCODE_DB" '.tables'
sqlite3 -readonly "$OPENCODE_DB" '.schema session'
sqlite3 -readonly "$OPENCODE_DB" '.schema message'
```

Use only read queries and bind or correctly quote filter values. If the database is missing, locked, or incompatible, report the gap and use available conversation/git evidence. Do not create, migrate, repair, or copy live database state as a side effect of writing a summary.
