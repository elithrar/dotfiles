# Wrangler Resource Commands

Check current docs before using newer flags.

## KV

```bash
wrangler kv namespace create MY_KV
wrangler kv namespace list
wrangler kv key put --namespace-id <ID> key value
wrangler kv key get --namespace-id <ID> key
```

## R2

```bash
wrangler r2 bucket create my-bucket
wrangler r2 bucket list
wrangler r2 object put my-bucket/path/file --file ./file
wrangler r2 object get my-bucket/path/file
```

## D1

```bash
wrangler d1 create my-db
wrangler d1 migrations create my-db create_table
wrangler d1 migrations apply my-db --local
wrangler d1 migrations apply my-db --remote
wrangler d1 execute my-db --local --command "SELECT 1"
wrangler d1 execute my-db --remote --command "SELECT 1"
```

Run local migrations before remote when feasible.

## Vectorize / Hyperdrive / Workers AI

Use `wrangler vectorize`, `wrangler hyperdrive`, and `wrangler ai` subcommands. Verify current docs and account availability before resource creation.
