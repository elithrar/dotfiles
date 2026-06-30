# Wrangler Observability

```bash
wrangler tail
wrangler tail <worker-name>
wrangler tail --status error
wrangler tail --search "term"
wrangler tail --format json
```

Prefer JSON tail output when debugging with tools. Avoid pasting sensitive log fields into summaries.

Config pattern:

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

Check current docs before adding or changing observability configuration.
