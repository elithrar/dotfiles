import type { Plugin } from "@opencode-ai/plugin"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOUND_PATH = join(__dirname, "smb_1-up.wav")

export const IdleNotificationPlugin: Plugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionId = event.properties.sessionID ?? "Unknown"

        // play the 1-up sound
        $`afplay ${SOUND_PATH}`.quiet()

        // show macOS notification
        await $`osascript -e 'display notification "${sessionId} is now idle/complete" with title "OpenCode"'`
      }
    },
  }
}
