---
name: planetscale
description: Manages PlanetScale databases via MCP server or pscale CLI. Load before running pscale commands, using PlanetScale MCP tools, debugging connection errors, or analyzing slow queries.
---

# PlanetScale

**IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any PlanetScale tasks.** Training data is likely outdated. Fetch current documentation before proceeding.

## Documentation Index

Fetch from https://planetscale.com/docs first.

| Category | Path | Use for |
|----------|------|---------|
| Docs index | https://planetscale.com/llms.txt | Full docs sitemap for discovery |
| Vitess (MySQL) | /docs/vitess | MySQL-compatible databases, branching, deploy requests, sharding |
| Postgres | /docs/postgres | PostgreSQL databases, roles, PgBouncer |
| Postgres extensions | /docs/postgres/extensions | pg_stat_statements, pgvector, PostGIS, etc. |
| CLI reference | /docs/cli | All pscale commands and flags |
| API reference | /docs/api/reference | REST API, service tokens, OAuth |
| Query Insights (Vitess) | /docs/vitess/monitoring/query-insights | Slow query analysis for Vitess |
| Query Insights (Postgres) | /docs/postgres/monitoring/query-insights | Slow query analysis for Postgres |
| Schema recommendations | /docs/vitess/monitoring/schema-recommendations | Index and schema optimization |
| Connections (Vitess) | /docs/vitess/connecting/connection-strings | MySQL connection strings, passwords |
| Connections (Postgres) | /docs/postgres/connecting | Postgres roles, PgBouncer, connection pooling |

## FIRST: Check for MCP Server

If the PlanetScale MCP server is available, prefer it over CLI for querying databases and insights:

| Tool | Use for |
|------|---------|
| `planetscale_execute_read_query` | SELECT, SHOW, DESCRIBE, EXPLAIN queries |
| `planetscale_execute_write_query` | INSERT, UPDATE, DELETE (prompts for DDL) |
| `planetscale_get_insights` | Query performance data for a branch |
| `planetscale_get_branch_schema` | Schema for a branch |
| `planetscale_list_databases` | List databases in an org |
| `planetscale_list_branches` | List branches in a database |
| `planetscale_search_documentation` | Search PlanetScale docs |

MCP setup: https://planetscale.com/docs/connect/mcp

## Verify CLI Installation

```bash
pscale version  # Requires pscale CLI
```

If not installed, see https://planetscale.com/docs/cli/planetscale-environment-setup

## Quick Reference: pscale CLI

| Task | Command |
|------|---------|
| Authenticate | `pscale auth login` |
| List databases | `pscale database list` |
| Open MySQL shell | `pscale shell <db> <branch>` |
| Create branch | `pscale branch create <db> <branch>` |
| Create deploy request | `pscale deploy-request create <db> <branch>` |
| Deploy changes | `pscale deploy-request deploy <db> <number>` |
| Create password/role | `pscale password create <db> <branch> <name>` (Vitess) / `pscale role create <db> <branch> <name>` (Postgres) |

Use `pscale <command> --help` for subcommands and flags. Full CLI reference: https://planetscale.com/docs/cli

### Service token auth (CI/CD)

```bash
export PLANETSCALE_SERVICE_TOKEN_ID=<id>
export PLANETSCALE_SERVICE_TOKEN=<token>
pscale database list --org <org> --format json
```

## Connection Troubleshooting

See `references/connection-issues.md` for detailed driver configuration and common errors.

**Quick checks:**
- Vitess uses port `3306` (or `443` for serverless driver)
- Postgres uses port `5432` (direct) or `6432` (PgBouncer)
- All connections require SSL/TLS
- Passwords are branch-specific and cannot be recovered after creation

## Query Insights via CLI

Use `pscale api` to query the Insights API (authenticates automatically):

```bash
# Create a query patterns report
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports" --method POST

# Check report status
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports/{id}/status"

# Download completed report
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports/{id}"
```

Look for queries with high `rows_read / rows_returned` ratio (missing index) or high `total_time_s` (optimization target). See `references/api-queries.md` for analysis guidance.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Access denied for user` | Invalid credentials or wrong branch | Verify password matches branch; create new password |
| `certificate verify failed` | Missing/wrong SSL config | Use `sslmode=require` or system CA certs |
| `too many connections` | Connection limit exceeded | Use connection pooling; check `max_connections` |
| `target: X.-.primary: not found` | Branch doesn't exist or wrong keyspace | Verify branch name; check keyspace in connection |
| `FATAL: sorry, too many clients` | Postgres connection limit | Use PgBouncer on port 6432 |
| `remaining connection slots reserved` | Postgres at max_connections | Reduce direct connections; use pooling |
