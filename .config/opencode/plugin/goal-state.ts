import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { homedir } from "os"
import { type Plugin, tool } from "@opencode-ai/plugin"

const PLUGIN_NAME = "goal-state"

type GoalStatus =
  | "active"
  | "complete"
  | "blocked"
  | "budget_limited"
  | "usage_limited"
  | "redirected"

type ContinuationPatch = {
  successCriteria?: string[]
  constraints?: string[]
  contextLedger?: string[]
  verificationLedger?: string[]
  completedWork?: string[]
  remainingWork?: string[]
  blockers?: string[]
  nextCheckpoint?: string
}

type GoalRecord = {
  version: 1
  sessionID: string
  directory: string
  objective: string
  rawObjective?: string
  tokenBudget?: number
  status: GoalStatus
  successCriteria: string[]
  constraints: string[]
  contextLedger: string[]
  verificationLedger: string[]
  completedWork: string[]
  remainingWork: string[]
  blockers: string[]
  nextCheckpoint?: string
  blockedCount: number
  createdAt: string
  updatedAt: string
}

type GoalResult = {
  success: boolean
  message: string
  goal?: GoalRecord
}

function stateDir(): string {
  return join(homedir(), ".local", "state", "opencode", "goal-state")
}

function statePath(sessionID: string): string {
  const safeID = sessionID.replace(/[^A-Za-z0-9_.-]/g, "_")
  return join(stateDir(), `${safeID}.json`)
}

async function readGoal(sessionID: string): Promise<GoalRecord | undefined> {
  try {
    return JSON.parse(await readFile(statePath(sessionID), "utf8")) as GoalRecord
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return undefined
    }
    throw error
  }
}

async function writeGoal(goal: GoalRecord): Promise<void> {
  const path = statePath(goal.sessionID)
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(goal, null, 2)}\n`, "utf8")
  await rename(tmp, path)
}

function unique(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

function mergeAppend(current: string[], next: string[] | undefined): string[] {
  return unique([...current, ...unique(next)])
}

function applyContinuation(goal: GoalRecord, patch: ContinuationPatch): GoalRecord {
  return {
    ...goal,
    successCriteria: mergeAppend(goal.successCriteria, patch.successCriteria),
    constraints: mergeAppend(goal.constraints, patch.constraints),
    contextLedger: mergeAppend(goal.contextLedger, patch.contextLedger),
    verificationLedger: mergeAppend(goal.verificationLedger, patch.verificationLedger),
    completedWork: mergeAppend(goal.completedWork, patch.completedWork),
    remainingWork: unique(patch.remainingWork ?? goal.remainingWork),
    blockers: unique(patch.blockers ?? goal.blockers),
    nextCheckpoint: patch.nextCheckpoint?.trim() || goal.nextCheckpoint,
  }
}

function formatGoal(goal: GoalRecord): string {
  const lines = [
    `Status: ${goal.status}`,
    `Objective: ${goal.objective}`,
    `Updated: ${goal.updatedAt}`,
  ]

  if (goal.tokenBudget) {
    lines.push(`Token budget: ${goal.tokenBudget}`)
  }
  if (goal.successCriteria.length > 0) {
    lines.push("", "Success criteria:", ...goal.successCriteria.map((item) => `- ${item}`))
  }
  if (goal.constraints.length > 0) {
    lines.push("", "Constraints:", ...goal.constraints.map((item) => `- ${item}`))
  }
  if (goal.contextLedger.length > 0) {
    lines.push("", "Context ledger:", ...goal.contextLedger.map((item) => `- ${item}`))
  }
  if (goal.verificationLedger.length > 0) {
    lines.push("", "Verification ledger:", ...goal.verificationLedger.map((item) => `- ${item}`))
  }
  if (goal.completedWork.length > 0) {
    lines.push("", "Completed work:", ...goal.completedWork.map((item) => `- ${item}`))
  }
  if (goal.remainingWork.length > 0) {
    lines.push("", "Remaining work:", ...goal.remainingWork.map((item) => `- ${item}`))
  }
  if (goal.blockers.length > 0) {
    lines.push("", "Blockers:", ...goal.blockers.map((item) => `- ${item}`))
  }
  if (goal.nextCheckpoint) {
    lines.push("", `Next checkpoint: ${goal.nextCheckpoint}`)
  }

  return lines.join("\n")
}

function terminalStatusMessage(status: GoalStatus): string {
  switch (status) {
    case "budget_limited":
      return "Marked goal budget-limited."
    case "usage_limited":
      return "Marked goal usage-limited."
    default:
      return `Marked goal ${status}.`
  }
}

function result(output: GoalResult): string {
  if (!output.goal) return `${output.success ? "SUCCESS" : "ERROR"}\n\n${output.message}`
  return `${output.success ? "SUCCESS" : "ERROR"}\n\n${output.message}\n\n${formatGoal(output.goal)}`
}

export const GoalStatePlugin: Plugin = async ({ client }) => {
  const log = (
    level: "info" | "warn" | "error" | "debug",
    message: string,
    extra?: Record<string, unknown>,
  ) =>
    client.app
      .log({ body: { service: PLUGIN_NAME, level, message, extra } })
      .catch(() => {})

  const continuationArgs = {
    successCriteria: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Explicit requirements, deliverables, invariants, commands, or artifacts."),
    constraints: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Budget, safety, scope, style, approval, or process constraints."),
    contextLedger: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Files, issues, branches, tools, external state, and facts inspected."),
    verificationLedger: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Requirement to evidence mapping, including current evidence or gaps."),
    completedWork: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Completed work or evidence gathered since the last checkpoint."),
    remainingWork: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Known remaining requirements or evidence gaps."),
    blockers: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Current blockers. For blocked status, name the repeated blocking condition."),
    nextCheckpoint: tool.schema
      .string()
      .optional()
      .describe("Smallest meaningful next action to run when the goal continues."),
  }

  return {
    tool: {
      create_goal: tool({
        description: `Create durable goal state for a long-running objective.

This mirrors Codex's create_goal tool for OpenCode sessions. Use it before substantive /goal work on a new objective. If an active unfinished goal already exists, resume it with get_goal unless the user explicitly asked to replace, clear, pause, or redirect the goal. Set replace_existing only when the user explicitly asked to replace the active goal with this new objective.`,
        args: {
          objective: tool.schema.string().describe("Concrete objective to pursue."),
          token_budget: tool.schema
            .number()
            .int()
            .positive()
            .optional()
            .describe("Optional explicit token budget supplied by the user."),
          rawObjective: tool.schema
            .string()
            .optional()
            .describe("Verbatim user-provided objective, when different from objective."),
          replace_existing: tool.schema
            .boolean()
            .optional()
            .describe("Replace an active unfinished goal. Use only after an explicit user replacement or redirection request."),
          ...continuationArgs,
        },
        async execute(args, context) {
          const existing = await readGoal(context.sessionID)
          const objective = args.objective.trim()
          if (!objective) {
            return result({
              success: false,
              message: "objective must not be empty.",
              goal: existing,
            })
          }

          if (existing?.status === "active" && !args.replace_existing) {
            return result({
              success: false,
              message:
                "An unfinished goal already exists. Use get_goal to resume it, or call create_goal with replace_existing only when the user explicitly asked to replace or redirect it.",
              goal: existing,
            })
          }

          const now = new Date().toISOString()
          const goal: GoalRecord = {
            version: 1,
            sessionID: context.sessionID,
            directory: context.directory,
            objective,
            rawObjective: args.rawObjective,
            tokenBudget: args.token_budget,
            status: "active",
            successCriteria: unique(args.successCriteria),
            constraints: unique(args.constraints),
            contextLedger: unique([
              ...(existing?.status === "active" && args.replace_existing
                ? [`Replaced previous active goal: ${existing.objective}`]
                : []),
              ...(args.contextLedger ?? []),
            ]),
            verificationLedger: unique(args.verificationLedger),
            completedWork: [],
            remainingWork: unique(args.remainingWork),
            blockers: [],
            nextCheckpoint: args.nextCheckpoint?.trim() || undefined,
            blockedCount: 0,
            createdAt: now,
            updatedAt: now,
          }
          await writeGoal(goal)
          await log("info", existing?.status === "active" ? "replaced goal" : "created goal", {
            sessionID: context.sessionID,
          })
          return result({
            success: true,
            message: existing?.status === "active" ? "Replaced active goal." : "Created goal.",
            goal,
          })
        },
      }),

      get_goal: tool({
        description: `Read durable goal state for the current session.

Use before resuming /goal work and when create_goal reports that an unfinished goal already exists. The custom OpenCode harness cannot report Codex's exact elapsed time or token usage; rely on user/system budget messages for hard limits.`,
        args: {},
        async execute(_args, context) {
          const goal = await readGoal(context.sessionID)
          if (!goal) {
            return result({
              success: false,
              message: "No goal exists for this session. Use create_goal for a new objective.",
            })
          }
          return result({ success: true, message: "Loaded goal.", goal })
        },
      }),

      update_goal: tool({
        description: `Update durable goal state.

This mirrors Codex's update_goal terminal statuses and adds explicit stop states needed by /goal in OpenCode. Set status to complete only after the completion audit passes, blocked only after the strict blocked audit passes, redirected when the user changes/pauses/clears/cancels the objective, and budget_limited or usage_limited when a hard limit requires stopping. Omitting status records continuation metadata while leaving the goal active.`,
        args: {
          status: tool.schema
            .enum(["complete", "blocked", "redirected", "budget_limited", "usage_limited"])
            .optional()
            .describe("Goal status. Use complete/blocked only after the corresponding goal skill audit passes."),
          ...continuationArgs,
        },
        async execute(args, context) {
          const existing = await readGoal(context.sessionID)
          if (!existing) {
            return result({
              success: false,
              message: "No goal exists for this session. Use create_goal before updating it.",
            })
          }

          const now = new Date().toISOString()
          const goal = applyContinuation(existing, args)
          goal.updatedAt = now

          switch (args.status) {
            case "complete":
              goal.status = "complete"
              goal.remainingWork = []
              goal.blockers = []
              goal.nextCheckpoint = undefined
              break
            case "blocked":
              goal.status = "blocked"
              goal.blockedCount = Math.max(existing.blockedCount + 1, 3)
              break
            case "redirected":
              goal.status = "redirected"
              goal.nextCheckpoint = undefined
              break
            case "budget_limited":
            case "usage_limited":
              goal.status = args.status
              break
            default:
              goal.status = "active"
              goal.blockedCount = args.blockers?.length ? existing.blockedCount + 1 : 0
              break
          }

          await writeGoal(goal)
          await log("info", "updated goal", {
            sessionID: context.sessionID,
            status: goal.status,
          })

          const message = args.status ? terminalStatusMessage(args.status) : "Recorded goal progress."
          return result({ success: true, message, goal })
        },
      }),
    },
  }
}

export default GoalStatePlugin
