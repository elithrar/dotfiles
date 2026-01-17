---
name: get-opencode-session
description: Extract session history and user prompts from OpenCode's local storage. Load when asked to retrieve conversation history, find previous prompts, or reference past sessions.
---

# OpenCode Session History

Extract user prompts and messages from OpenCode's session storage.

## Storage Location

```
~/.local/share/opencode/storage/
├── session/          # Session metadata by project
├── message/          # Message metadata by session
└── part/             # Message content (text, tool calls, etc.)
```

## Find Sessions

Sessions are stored per-project. List recent sessions:

```bash
ls -lt ~/.local/share/opencode/storage/session/*/ses_*.json | head -10
```

Session metadata format:
```json
{
  "id": "ses_abc123...",
  "title": "Session title",
  "directory": "/path/to/project",
  "time": { "created": 1234567890, "updated": 1234567899 }
}
```

## Extract User Prompts

Messages are stored in `message/{session_id}/`. Each message has parts in `part/{message_id}/`.

To get all user prompts from a session:

```bash
SESSION_ID="ses_abc123..."

for msg in ~/.local/share/opencode/storage/message/$SESSION_ID/*.json; do
  role=$(jq -r '.role' "$msg")
  if [ "$role" = "user" ]; then
    msgid=$(basename "$msg" .json)
    partfile=$(ls ~/.local/share/opencode/storage/part/$msgid/*.json 2>/dev/null | head -1)
    [ -f "$partfile" ] && jq -r '.text // empty' "$partfile"
  fi
done
```

## Message Structure

Message metadata (`message/{session_id}/msg_*.json`):
- `role`: "user" or "assistant"
- `sessionID`: Parent session
- `time.created`: Timestamp

Part content (`part/{message_id}/prt_*.json`):
- `type`: "text", "tool_use", "tool_result", etc.
- `text`: Message content (for text parts)
- `input`: Tool input (for tool_use parts)

## Find Sessions by Project

```bash
# Current project's sessions
PROJECT_HASH=$(echo -n "$(pwd)" | shasum -a 256 | cut -c1-40)
ls ~/.local/share/opencode/storage/session/$PROJECT_HASH/
```
