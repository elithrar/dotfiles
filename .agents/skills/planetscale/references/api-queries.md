# Query Insights via pscale CLI

Analyze slow queries and missing indexes using `pscale api`. Fetch current API docs from https://planetscale.com/docs/api/reference—endpoints may have changed.

## Using pscale api

The `pscale api` command makes authenticated API calls using your current login or service token. No need to manage auth headers manually.

```bash
pscale api "<endpoint>" [--method POST] [--field key=value] [--org <org>]
```

## Query Patterns Reports

```bash
# Create a new report
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports" \
  --method POST --org my-org

# Check status (poll until state=complete)
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports/{id}/status"

# Download completed report
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports/{id}"

# List all reports
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports"
```

## Schema Analysis

```bash
# Get branch schema
pscale api "organizations/{org}/databases/{db}/branches/{branch}/schema"

# Lint schema for issues
pscale api "organizations/{org}/databases/{db}/branches/{branch}/schema/lint"
```

## What to Look For

| Metric | Indicates | Action |
|--------|-----------|--------|
| High `rows_read / rows_returned` | Missing or poor index | Add index on WHERE/JOIN columns |
| High `total_time_s` | Heavy query | Optimize or cache |
| High `count` with same pattern | N+1 queries | Batch or eager-load |
| `indexed: false` | Full table scan | Add index |

## Service Token Auth (CI/CD)

For non-interactive environments:

```bash
export PLANETSCALE_SERVICE_TOKEN_ID="<id>"
export PLANETSCALE_SERVICE_TOKEN="<token>"
pscale api "organizations/my-org/databases/my-db/branches/main/query-patterns-reports" --method POST
```

Create tokens with `read_branch` access at **Organization Settings > Service tokens**.
