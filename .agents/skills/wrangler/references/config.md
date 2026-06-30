# Wrangler Config

Check current Cloudflare docs before changing syntax. Preserve existing `wrangler.jsonc` or `wrangler.toml` unless migration is requested.

## Minimal `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "<project-or-current-date>"
}
```

## Common bindings

```jsonc
{
  "kv_namespaces": [{ "binding": "KV", "id": "<id>" }],
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "my-bucket" }],
  "d1_databases": [{ "binding": "DB", "database_name": "my-db", "database_id": "<id>", "migrations_dir": "./migrations" }],
  "ai": { "binding": "AI" },
  "vectorize": [{ "binding": "VECTOR_INDEX", "index_name": "my-index" }],
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<id>" }]
}
```

Run `wrangler types` after binding changes.
