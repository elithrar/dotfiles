import type { Plugin } from "@opencode-ai/plugin"
import type { Subprocess } from "bun"

export const CaffeinatePlugin: Plugin = async ({ client }) => {
  // macOS only
  if (process.platform !== "darwin") {
    return { event: async () => {} }
  }

  const busySessions = new Set<string>()
  let caffeinateProc: Subprocess | null = null
  let starting = false

  const log = (message: string) =>
    client.app.log({
      service: "caffeinate",
      level: "info",
      message,
    })

  const startCaffeinate = async () => {
    if (caffeinateProc || starting) return
    starting = true
    try {
      caffeinateProc = Bun.spawn(["caffeinate", "-i"], {
        stdout: "ignore",
        stderr: "ignore",
      })
      await log("preventing system sleep")
    } catch (err) {
      await log(`failed to start caffeinate: ${err}`)
    } finally {
      starting = false
    }
  }

  const stopCaffeinate = async () => {
    if (!caffeinateProc) return
    caffeinateProc.kill()
    caffeinateProc = null
    await log("allowing system sleep")
  }

  // sync cleanup on exit (async won't complete)
  process.on("exit", () => {
    caffeinateProc?.kill()
  })

  return {
    event: async ({ event }) => {
      if (event.type !== "session.status") return

      const { sessionID, status } = event.properties

      if (status.type === "idle") {
        busySessions.delete(sessionID)
        if (busySessions.size === 0) {
          await stopCaffeinate()
        }
      } else {
        const wasEmpty = busySessions.size === 0
        busySessions.add(sessionID)
        if (wasEmpty) {
          await startCaffeinate()
        }
      }
    },
  }
}
