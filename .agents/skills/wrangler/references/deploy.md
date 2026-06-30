# Deploy, Secrets, Versions

Ask for confirmation before remote mutation unless the user clearly authorized it.

| Task | Command |
|---|---|
| Dry run | `wrangler deploy --dry-run` |
| Deploy production | `wrangler deploy` |
| Deploy environment | `wrangler deploy --env staging` |
| Keep dashboard vars | `wrangler deploy --keep-vars` |
| Set secret | `wrangler secret put NAME` |
| List secrets | `wrangler secret list` |
| Delete secret | `wrangler secret delete NAME` |
| List versions | `wrangler versions list` |
| View version | `wrangler versions view <VERSION_ID>` |
| Rollback | `wrangler rollback [VERSION_ID]` |

Never echo secrets in chat, logs, commits, or command history when avoidable. Prefer stdin or interactive secret prompts.
