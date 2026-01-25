---
description: Create dex task from markdown planning document
subtask: true
---

Convert the provided markdown planning document into a trackable dex task.

## Input

$ARGUMENTS

## Instructions

1. Read the markdown file specified above
2. Extract the title from the first `#` heading (strip "Plan: " prefix if present)
3. Create a dex task with the full markdown content as context:

```bash
dex create -d "<extracted-title>" --context "<full-markdown-content>"
```

4. Analyze the plan structure for potential subtask breakdown:
   - Look for numbered lists with 3-7 items
   - Look for distinct implementation sections/phases
   - Look for file-specific changes

5. If breakdown adds value, create subtasks:

```bash
dex create --parent <parent-id> -d "<subtask-description>" --context "<section-content>"
```

6. Report results:
   - Task ID created
   - Number of subtasks (if any)
   - Command to view: `dex show <id>`

## When NOT to Break Down

- Only 1-2 steps present
- Plan is a single cohesive fix
- Content is exploratory/research
- Breaking down creates artificial boundaries

## Example Output

```
Created task abc123: "Add JWT Authentication"

Analyzed plan: Found 4 implementation steps
Created 4 subtasks:
- abc124: Create User model
- abc125: Add /auth/register endpoint
- abc126: Add /auth/login endpoint
- abc127: Create JWT middleware

View structure: dex show abc123
```
