---
description: Summarize the current session as a chronological transcript
---

Summarize the current OpenCode session as a concise, chronological transcript.

## Instructions

1. Review the entire conversation history from this session
2. Create a bulleted list that alternates between user prompts and agent responses
3. For each **user prompt**: summarize in less than 30 words, capturing the key request or question
4. For each **agent response**: summarize in 10-15 words, focusing on the primary action taken or answer given

## Output Format

Use this exact format:

```
## Session Summary

- **User**: <summarized prompt, < 30 words>
- **Agent**: <summarized response, 10-15 words>
- **User**: <summarized prompt, < 30 words>
- **Agent**: <summarized response, 10-15 words>
...
```

## Guidelines

- Maintain strict chronological order
- Be concise but capture the essential intent/action
- For multi-step agent responses, focus on the most significant outcome
- Omit tool calls and internal processing details
- If the agent asked clarifying questions, note that briefly
- If code was written, mention the files/features affected
- Never include sensitive data: API keys, credentials, secrets, tokens, passwords, env vars, private URLs

## Example

```
## Session Summary

- **User**: Asked to add a dark mode toggle to the application settings page
- **Agent**: Created ThemeContext and DarkModeToggle component
- **User**: Requested tests be run and any failures fixed
- **Agent**: Ran tests, fixed 2 failing assertions in theme tests
- **User**: Asked to commit the changes with a descriptive message
- **Agent**: Committed changes with message about dark mode feature
```
