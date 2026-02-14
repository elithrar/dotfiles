# Connection Issues

Fetch current docs before troubleshooting—driver configurations change frequently:
- Vitess: https://planetscale.com/docs/vitess/connecting
- Postgres: https://planetscale.com/docs/postgres/connecting

## Vitess (MySQL) Connections

**Connection string format:**
```
mysql://<username>:<password>@<host>/<database>?ssl={"rejectUnauthorized":true}
```

**mysql2 (Node.js)** — the most common driver:
```javascript
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: true }
});
```

**PlanetScale Serverless Driver** — for edge runtimes (Vercel Edge, Cloudflare Workers):
```javascript
import { connect } from '@planetscale/database';

const conn = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});
const results = await conn.execute('SELECT * FROM users WHERE id = ?', [1]);
```

For ORMs (Prisma, Drizzle, etc.), see https://planetscale.com/docs/vitess/tutorials

### Common Vitess Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ER_ACCESS_DENIED_ERROR` | Wrong credentials | Passwords are branch-specific; create new one |
| `certificate verify failed` | SSL misconfigured | Add `ssl: { rejectUnauthorized: true }` |
| `target: X.-.primary: not found` | Invalid keyspace/branch | Verify branch exists; check database name |

## Postgres Connections

**Connection string format:**
```
postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=require
```

Ports: `5432` (direct), `6432` (PgBouncer—recommended for apps)

**node-postgres (pg)** — the most common driver:
```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});
```

**Neon Serverless Driver** — for edge runtimes:
```javascript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

For ORMs and other drivers, see https://planetscale.com/docs/postgres/connecting

### Common Postgres Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `FATAL: password authentication failed` | Wrong credentials | Check role name format: `<role>.<branch_id>` |
| `FATAL: sorry, too many clients already` | Connection limit | Use PgBouncer (port 6432) |
| `SSL connection is required` | Missing SSL | Add `sslmode=require` to connection string |

## SSL Notes

All PlanetScale connections require SSL. Use `sslmode=require` (Postgres) or `ssl: { rejectUnauthorized: true }` (MySQL). If `verify-full` fails, fall back to `require`.
