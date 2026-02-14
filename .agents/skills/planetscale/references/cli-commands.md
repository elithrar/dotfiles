# pscale CLI Commands

**Full CLI reference:** https://planetscale.com/docs/cli

Use `pscale <command> --help` to discover subcommands and flags.

## Authentication

```bash
pscale auth login      # Opens browser
pscale auth logout
pscale org switch <name>  # Switch organization
```

### Service Token (CI/CD)

```bash
export PLANETSCALE_SERVICE_TOKEN_ID="<id>"
export PLANETSCALE_SERVICE_TOKEN="<token>"
pscale database list --org <org>
```

## Core Commands

```bash
# Databases
pscale database list
pscale database create <name>
pscale database delete <name>

# Branches
pscale branch list <db>
pscale branch create <db> <branch>
pscale branch create <db> <branch> --from <parent>
pscale branch delete <db> <branch>
pscale branch schema <db> <branch>

# Deploy requests (schema changes)
pscale deploy-request create <db> <branch>
pscale deploy-request list <db>
pscale deploy-request deploy <db> <number>
pscale deploy-request close <db> <number>

# Connect
pscale shell <db> <branch>           # MySQL shell
pscale connect <db> <branch>         # Proxy for GUI tools
pscale connect <db> <branch> --port 3307

# Credentials
pscale password create <db> <branch> <name>  # Vitess
pscale role create <db> <branch> <name>      # Postgres
```

## Useful Flags

```bash
--format json    # Output as JSON (also: csv, human)
--org <name>     # Specify organization
--debug          # Debug output
```

## Service Tokens

```bash
pscale service-token create
pscale service-token add-access <id> read_branch --database <db>
pscale service-token show-access <id>
```

## API Calls

```bash
# Make authenticated API calls (no curl needed)
pscale api "organizations/{org}/databases" --format json
pscale api "organizations/{org}/databases/{db}/branches/{branch}/query-patterns-reports" --method POST
```

## Other

```bash
pscale ping              # Check latency to regions
pscale region list       # Available regions
pscale backup list <db> <branch>
```
