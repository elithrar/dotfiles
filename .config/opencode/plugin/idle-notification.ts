import type { Plugin } from "@opencode-ai/plugin"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOUND_PATH = join(__dirname, "smb_coin.wav")

export const IdleNotificationPlugin: Plugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionId = event.properties.sessionID ?? "Unknown"

        // play the coin sound at 10% volume
        $`afplay -v 0.1 ${SOUND_PATH}`.quiet()

        // show macOS notification (terminal-notifier preferred, osascript fallback)
        const message = `${sessionId} is now idle/complete`
        const hasTerminalNotifier = await $`which terminal-notifier`.quiet().then(() => true, () => false)
        if (hasTerminalNotifier) {
          await $`terminal-notifier -title OpenCode -message ${message} -activate com.mitchellh.ghostty`
        } else {
          const script = `display notification "${message}" with title "OpenCode"`
          await $`osascript -e ${script}`
        }
      }
    },
  }
}
