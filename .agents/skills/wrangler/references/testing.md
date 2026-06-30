# Wrangler Testing

Use project scripts when present. For Workers-specific Vitest setup, inspect the existing test config before changing it.

Common setup:

```bash
npm install -D @cloudflare/vitest-pool-workers vitest
```

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },
});
```

Scheduled events:

```bash
wrangler dev --test-scheduled
curl http://localhost:8787/__scheduled
```
