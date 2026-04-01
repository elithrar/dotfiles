import type { Plugin } from "@opencode-ai/plugin"

/**
 * Auto-compaction plugin for OpenCode.
 *
 * Monitors input token usage and triggers session compaction when the
 * cumulative input tokens exceed a configurable threshold (default: 200k).
 * This provides model-agnostic compaction at a consistent context size,
 * regardless of the model's actual context window.
 *
 * Works by observing `message.updated` events for assistant messages,
 * tracking the latest `tokens.input` value (which reflects the full
 * context sent to the model for that step), and firing `session.compact`
 * via the TUI command API when the threshold is crossed.
 */

const TOKEN_THRESHOLD = 200_000

export const AutoCompactPlugin: Plugin = async ({ client }) => {
  // Track per-session state to avoid duplicate triggers
  const compacting = new Set<string>()

  const log = (
    level: "info" | "warn" | "debug" | "error",
    message: string,
    extra?: Record<string, unknown>,
  ) =>
    client.app
      .log({ body: { service: "auto-compact", level, message, extra } })
      .catch(() => {})

  return {
    event: async ({ event }) => {
      // Track when compaction finishes so we can re-arm
      if (event.type === "session.compacted") {
        const { sessionID } = event.properties
        compacting.delete(sessionID)
        await log("info", "compaction completed, re-armed", { sessionID })
        return
      }

      // Only care about assistant message updates
      if (event.type !== "message.updated") return
      const { info } = event.properties
      if (info.role !== "assistant") return

      const msg = info
      const { sessionID } = msg
      const inputTokens = msg.tokens.input

      // Skip if we're already compacting this session
      if (compacting.has(sessionID)) return

      // Skip if the message hasn't finished (no token count yet)
      if (!inputTokens || inputTokens === 0) return

      if (inputTokens >= TOKEN_THRESHOLD) {
        compacting.add(sessionID)
        await log("info", "triggering compaction", {
          sessionID,
          inputTokens,
          threshold: TOKEN_THRESHOLD,
        })

        try {
          await client.tui.publish({
            body: {
              type: "tui.command.execute",
              properties: { command: "session.compact" },
            },
          })
        } catch (err) {
          // If publish fails, clear the lock so we can retry next message
          compacting.delete(sessionID)
          await log("error", "failed to trigger compaction", {
            sessionID,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    },
  }
}
