import type { Plugin } from "@opencode-ai/plugin"
import type { Subprocess } from "bun"

export const CaffeinatePlugin: Plugin = async ({ client }) => {
  const busySessions = new Set<string>()
  let caffeinateProc: Subprocess | null = null

  const log = (message: string) =>
    client.app.log({
      service: "caffeinate",
      level: "info",
      message,
    })

  const startCaffeinate = async () => {
    if (caffeinateProc) return
    caffeinateProc = Bun.spawn(["caffeinate", "-i"], {
      stdout: "ignore",
      stderr: "ignore",
    })
    await log("preventing system sleep")
  }

  const stopCaffeinate = async () => {
    if (!caffeinateProc) return
    caffeinateProc.kill()
    caffeinateProc = null
    await log("allowing system sleep")
  }

  process.on("exit", () => stopCaffeinate())

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
