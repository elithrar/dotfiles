---
name: summarize-work
description: Summarize OpenCode session history into work recaps, commit messages, or PR descriptions. Use when a summary needs past sessions or cross-project history; ordinary commits and summaries fully supported by the current conversation do not need this skill.
---

# OpenCode work summaries

Use the requested project and time range. Default to the current project; expand across projects only when requested or needed to answer an explicit correction. Use the user's timezone for time boundaries.

For the current session, use the conversation and relevant git state without querying OpenCode. For past sessions, read [references/api.md](references/api.md) to discover the configured server and retrieve only relevant history. Do not silently drop short sessions or truncate their substantive content; even one message can record an important fix.

Reconcile session claims with the relevant diff, commits, or file state when available. Resolve the actual base branch or upstream rather than assuming `origin/main` or `origin/master`. Distinguish planned, attempted, implemented, tested, and merged work. Todos and an assistant's success claim alone are not proof of completion.

Write the requested recap, commit message, or PR description. Explain why the change mattered and what it accomplished. Group cross-project work by project and omit empty categories. Keep the output proportional to the meaningful changes, and follow the user's requested structure.

Exclude secrets and sensitive transcript data. If history cannot be retrieved, summarize the available evidence and state the coverage gap. Do not infer missing work or ask for a service setup before completing a summary the visible context already supports.
