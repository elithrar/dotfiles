---
name: durable-objects
description: Reviews, designs, and implements Cloudflare Durable Objects for Workers. Load when creating or modifying DO classes, bindings, migrations, RPC methods, storage, alarms, WebSockets/hibernation, sharding, or Vitest tests with @cloudflare/vitest-pool-workers. Guides wrangler config, concurrency, persistence, and production review checks.
---

# Durable Objects

Build stateful, coordinated applications on Cloudflare's edge using Durable Objects.

## When to Use

- Creating new Durable Object classes for stateful coordination
- Implementing RPC methods, alarms, or WebSocket handlers
- Reviewing existing DO code for best practices
- Configuring wrangler.jsonc/toml for DO bindings and migrations
- Writing tests with `@cloudflare/vitest-pool-workers`
- Designing sharding strategies and parent-child relationships

## Reference Documentation

- `./references/rules.md` - Core rules, storage, concurrency, RPC, alarms
- `./references/testing.md` - Vitest setup, unit/integration tests, alarm testing
- `./references/workers.md` - Workers handlers, types, wrangler config, observability

Search: `blockConcurrencyWhile`, `idFromName`, `getByName`, `setAlarm`, `sql.exec`

## First Steps

1. Inspect the existing Worker framework, `wrangler.jsonc`/`wrangler.toml`, compatibility date, bindings, migrations, Env types, and tests.
2. Read the relevant reference before editing:
   - `rules.md` for storage, concurrency, RPC, alarms.
   - `workers.md` for handlers, bindings, config, observability.
   - `testing.md` for Vitest and alarm tests.
3. Prefer existing project patterns over generic snippets.
4. Validate with typecheck/tests and Durable Object-specific behavior checks.

## Core Principles

### Use Durable Objects For

| Need | Example |
|------|---------|
| Coordination | Chat rooms, multiplayer games, collaborative docs |
| Strong consistency | Inventory, booking systems, turn-based games |
| Per-entity storage | Multi-tenant SaaS, per-user data |
| Persistent connections | WebSockets, real-time notifications |
| Scheduled work per entity | Subscription renewals, game timeouts |

### Do NOT Use For

- Stateless request handling (use plain Workers)
- Maximum global distribution needs
- High fan-out independent requests

## Quick Reference

### Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "MY_DO", "class_name": "MyDurableObject" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["MyDurableObject"] }]
}
```

### Basic Durable Object Pattern

```typescript
import { DurableObject } from "cloudflare:workers";

export interface Env {
  MY_DO: DurableObjectNamespace<MyDurableObject>;
}

export class MyDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL
        )
      `);
    });
  }

  async addItem(data: string): Promise<number> {
    const result = this.ctx.storage.sql.exec<{ id: number }>(
      "INSERT INTO items (data) VALUES (?) RETURNING id",
      data
    );
    return result.one().id;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const stub = env.MY_DO.getByName("my-instance");
    const id = await stub.addItem("hello");
    return Response.json({ id });
  },
};
```

## Default Rules And Exceptions

1. **Model around coordination atoms** - One DO per chat room/game/user, not one global DO
2. **Use `getByName()` for deterministic routing** - Same input = same DO instance when deterministic routing is desired
3. **Use SQLite storage for new SQL-backed classes** - Configure `new_sqlite_classes` in migrations
4. **Initialize in constructor** - Use `blockConcurrencyWhile()` for schema setup only
5. **Prefer RPC for Worker-to-DO calls** - Use `fetch` or WebSocket handlers when serving HTTP/WebSocket protocols or compatibility requires it
6. **Persist first, cache second** - Write durable state before updating in-memory state when the cache depends on it
7. **One alarm per DO** - `setAlarm()` replaces any existing alarm

## High-Risk Patterns

- Single global DO handling all requests (bottleneck)
- Using `blockConcurrencyWhile()` on every request (kills throughput)
- Storing critical state only in memory (lost on eviction/crash)
- External I/O or `await` between logically coupled operations without explicit transaction/state boundaries
- Holding `blockConcurrencyWhile()` across `fetch()` or external I/O

## Stub Creation

```typescript
// Deterministic - preferred for most cases
const stub = env.MY_DO.getByName("room-123");

// From existing ID string
const id = env.MY_DO.idFromString(storedIdString);
const stub = env.MY_DO.get(id);

// New unique ID - store mapping externally
const id = env.MY_DO.newUniqueId();
const stub = env.MY_DO.get(id);
```

## Storage Operations

```typescript
// SQL (synchronous, recommended)
this.ctx.storage.sql.exec("INSERT INTO t (c) VALUES (?)", value);
const rows = this.ctx.storage.sql.exec<Row>("SELECT * FROM t").toArray();

// KV (async)
await this.ctx.storage.put("key", value);
const val = await this.ctx.storage.get<Type>("key");
```

## Alarms

```typescript
// Schedule (replaces existing)
await this.ctx.storage.setAlarm(Date.now() + 60_000);

// Handler
async alarm(): Promise<void> {
  // Process scheduled work
  // Optionally reschedule: await this.ctx.storage.setAlarm(...)
}

// Cancel
await this.ctx.storage.deleteAlarm();
```

## Testing Quick Start

```typescript
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("MyDO", () => {
  it("should work", async () => {
    const stub = env.MY_DO.getByName("test");
    const result = await stub.addItem("test");
    expect(result).toBe(1);
  });
});
```

## Review Checklist

- Check coordination atom size, deterministic ID strategy, hot partitions, migration safety, storage durability, alarm replacement semantics, WebSocket hibernation needs, and observability.
- Verify new DO classes have matching binding names, class names, and migrations.
- Test RPC methods, storage persistence/isolation, alarms, and WebSocket/HTTP paths when applicable.
