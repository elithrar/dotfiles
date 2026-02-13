import type { Plugin } from "@opencode-ai/plugin"
import { resolve } from "path"

export const QuestCompletePlugin: Plugin = async ({ $ }) => {
  if (process.platform !== "darwin") return {}

  const sound = resolve(import.meta.dir, "wow-quest-complete.mp3")

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      try {
        await $`afplay -v 0.2 ${sound}`.quiet().nothrow()
      } catch {}
    },
  }
}
