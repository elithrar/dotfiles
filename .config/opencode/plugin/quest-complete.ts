import type { Plugin } from "@opencode-ai/plugin"
import { resolve } from "path"

export const QuestCompletePlugin: Plugin = async ({ $, client }) => {
  if (process.platform !== "darwin") return {}

  const sound = resolve(import.meta.dir, "wow-quest-complete.mp3")

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      try {
        const { sessionID } = event.properties
        const session = await client.session.get({ path: { id: sessionID } })
        if (session.data?.parentID) return
        await $`afplay -v 0.2 ${sound}`.quiet().nothrow()
      } catch {}
    },
  }
}
