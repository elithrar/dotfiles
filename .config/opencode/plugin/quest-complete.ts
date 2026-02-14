import type { Plugin } from "@opencode-ai/plugin"
import { resolve } from "path"

export const QuestCompletePlugin: Plugin = async ({ $, client }) => {
  if (process.platform !== "darwin") return {}

  const sound = resolve(import.meta.dir, "wow-quest-complete.mp3")
  const timers = new Map<string, Timer>()

  return {
    event: async ({ event }) => {
      if (event.type === "session.busy") {
        const timer = timers.get(event.properties.sessionID)
        if (timer) {
          clearTimeout(timer)
          timers.delete(event.properties.sessionID)
        }
        return
      }
      if (event.type !== "session.idle") return
      try {
        const { sessionID } = event.properties
        const session = await client.session.get({ path: { id: sessionID } })
        if (session.data?.parentID) return
        timers.set(
          sessionID,
          setTimeout(async () => {
            timers.delete(sessionID)
            await $`afplay -v 0.2 ${sound}`.quiet().nothrow()
          }, 3000),
        )
      } catch {}
    },
  }
}
