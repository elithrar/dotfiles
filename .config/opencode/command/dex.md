---
description: Load dex skill for persistent task tracking across sessions
---

Load the `dex` skill to enable persistent task tracking.

Dex provides task management that survives across sessions - like GitHub Issues but for agent coordination. Tasks are tickets with rich context (description, context, result) not simple todos.

First, load the skill for full instructions:

```
skill({ name: "dex" })
```

Then help the user with their task tracking needs. The dex MCP server provides these tools:
- Create tasks with `dex create -d "description" --context "details"`
- List tasks with `dex list` (add `--all` for completed, `--ready` for unblocked)
- Complete tasks with `dex complete <id> --result "what was done"`
- View task details with `dex show <id>`

$ARGUMENTS
