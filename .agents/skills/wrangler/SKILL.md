---
name: wrangler
description: Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, Containers, Queues, Workflows, Pipelines, Secrets Store, and Pages. Load before running wrangler commands, editing wrangler.jsonc, changing bindings, deploying, deleting resources, or handling Worker secrets.
---

# Wrangler CLI

Use this skill for Cloudflare Workers and `wrangler` operations. Prefer current docs and project configuration over memory because Wrangler and Cloudflare platform features change quickly.

## FIRST: Verify Context

Run non-mutating checks before proposing or running commands:

```bash
wrangler --version
wrangler whoami
ls wrangler.jsonc wrangler.toml package.json 2>/dev/null
```

Then inspect the existing config, lockfile, package manager, scripts, and current `compatibility_date` before editing. Do not switch config formats or package managers unless the user asked or the current feature requires it.

If Wrangler is missing, install locally in the project unless the user prefers global install:

```bash
npm install -D wrangler@latest
```

## Retrieval Rules

Fetch or search current Cloudflare docs before using newer or uncertain syntax, especially for deploys, resource creation, compatibility flags, Workflows, Containers, Pipelines, Secrets Store, and breaking Wrangler changes.

Use the narrowest reference file when the task is covered locally:

| Task | Reference |
|---|---|
| Config shape, bindings, compatibility dates | `references/config.md` or `references/command-reference.md` |
| Deploy, versions, rollback, secrets | `references/deploy.md` or `references/command-reference.md` |
| KV, R2, D1, Vectorize, Hyperdrive, Workers AI | `references/resources.md` or `references/command-reference.md` |
| Queues, Workflows, Pipelines, Containers | `references/async-and-containers.md` or `references/command-reference.md` |
| Tail logs and observability | `references/observability.md` or `references/command-reference.md` |
| Vitest and local testing | `references/testing.md` or `references/command-reference.md` |

`references/command-reference.md` contains the previous full command catalog.

## Safety Rules

- Ask for explicit confirmation before `wrangler deploy`, `wrangler delete`, resource deletion, production D1 migrations, secret changes, rollback, or commands that mutate remote state.
- Prefer dry runs and validation before production changes: `wrangler check`, `wrangler deploy --dry-run`, `wrangler types --check`.
- Never print, commit, or summarize secret values. Use `.dev.vars` for local secrets and `wrangler secret put` for remote secrets.
- Preserve existing environments. When editing `env.staging` or `env.production`, avoid changing production config as a side effect.
- Generate types after config changes: `wrangler types` or the project’s configured equivalent.

## Core Guidelines

- Prefer `wrangler.jsonc` for new projects; preserve `wrangler.toml` in existing projects unless migration is requested.
- Set or update `compatibility_date` deliberately. Use the project’s date unless the task requires a newer runtime feature; check docs before bumping.
- Use local bindings by default in `wrangler dev`; set `remote: true` only when the resource must run remotely or the user accepts remote effects/costs.
- Treat dashboard-created variables and config-file variables separately. Use `--keep-vars` only when preserving dashboard-managed values is intentional.
- For D1, test migrations locally before remote apply whenever feasible.

## Quick Reference

| Task | Command |
|---|---|
| Start local dev | `wrangler dev` |
| Validate config | `wrangler check` |
| Generate types | `wrangler types` |
| Dry-run deploy | `wrangler deploy --dry-run` |
| Deploy | `wrangler deploy` |
| Tail logs | `wrangler tail --format json` |
| Auth status | `wrangler whoami` |
| List versions | `wrangler versions list` |
| Rollback | `wrangler rollback` |
| Set secret | `wrangler secret put NAME` |
| List KV namespaces | `wrangler kv namespace list` |
| Execute D1 locally | `wrangler d1 execute DB --local --command "SELECT 1"` |
| Execute D1 remotely | `wrangler d1 execute DB --remote --command "SELECT 1"` |
| Apply D1 migrations locally | `wrangler d1 migrations apply DB --local` |
| Apply D1 migrations remotely | `wrangler d1 migrations apply DB --remote` |

## Workflow

1. Identify the project type, config file, package manager, environment, and requested resource.
2. Verify Wrangler/auth and read current config before changing anything.
3. Check current docs for uncertain or fast-moving features.
4. Make the smallest config/code change that satisfies the request.
5. Run validation: `wrangler check`, `wrangler types`, tests, or a dry run as appropriate.
6. Ask before remote mutation unless the user already gave explicit permission.
7. Summarize changed files, commands run, validation results, and any skipped production steps.

## Routing

- Use `durable-objects` for Durable Object design, RPC methods, alarms, storage, and tests.
- Use `agents-sdk` for Cloudflare Agents SDK, `Agent`, `AIChatAgent`, MCP agents, and Code Mode.
- Use this skill for the Wrangler CLI, bindings, deployments, resources, environments, secrets, and Cloudflare Worker config.
