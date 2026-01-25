---
description: Create dex task from markdown planning document
subtask: true
---

Convert the provided markdown planning document into a trackable dex task.

First, load the dex-plan skill for detailed instructions:

```
skill({ name: "dex-plan" })
```

## Input

$ARGUMENTS

## Quick Reference

1. Read the markdown file specified above
2. Extract the title from the first `#` heading (strip "Plan: " prefix if present)
3. Create a dex task: `dex create -d "<title>" --context "<full-markdown>"`
4. Analyze structure for potential subtask breakdown (3-7 items)
5. Create subtasks if beneficial: `dex create --parent <id> -d "..." --context "..."`
6. Report task ID and subtask count
