/**
 * Git Worktree Plugin for OpenCode
 *
 * Provides git worktree management for concurrent branch development.
 * Worktrees are stored in $XDG_DATA_HOME/opencode/worktree/{projectID}/{name}
 * using OpenCode's managed worktree API.
 *
 * ## Agent Usage Guide
 *
 * CRITICAL: The `use-git-worktree` tool MUST be used for ALL git worktree operations.
 * - Do NOT use `git worktree` commands directly via Bash
 * - Do NOT delegate worktree creation to Task subagents
 * - The tool.execute.before hook blocks direct `git worktree` commands, but this
 *   hook ONLY applies to the main agent - subagents bypass plugin hooks entirely
 *
 * The plugin provides:
 * - Project-scoped worktrees via managed API
 * - Proper conflict resolution strategies for merging
 * - Logging via OpenCode SDK
 *
 * Use the `use-git-worktree` tool when you need to:
 * - Work on multiple unrelated changes concurrently
 * - Isolate changes for different branches without affecting the main worktree
 * - Review or test code from another branch while preserving current work
 *
 * ### Workflow Example
 * 1. Create a git worktree: `use-git-worktree` with action "create"
 * 2. Work in the git worktree directory (returned in the result)
 * 3. Merge changes back: `use-git-worktree` with action "merge"
 * 4. Clean up: `use-git-worktree` with action "remove"
 *
 * ### Merge Strategies
 * - "ours": Keep changes from the target branch on conflict
 * - "theirs": Keep changes from the worktree branch on conflict
 * - "manual": Stop on conflict and return diff for user decision
 *
 * ## Subagent Usage - IMPORTANT
 *
 * Plugin tools and hooks are NOT available to Task subagents. Subagents run in
 * isolated contexts without access to plugin state or hooks. This means:
 *
 * 1. The `use-git-worktree` tool is NOT available to subagents
 * 2. The `tool.execute.before` hook that blocks `git worktree` commands does NOT
 *    apply to subagents - they can run any bash command
 * 3. Subagents cannot create, manage, or cleanup worktrees
 *
 * ### Correct Pattern for Concurrent Work:
 * 1. **Main agent creates ALL worktrees first** using `use-git-worktree` tool
 * 2. **Main agent launches Task subagents** with the worktree PATH (not branch):
 *    ```
 *    Task(subagent_type="general", prompt="Work in {worktree_path}.
 *         Use Read/Write/Edit/Bash tools to modify files in that directory.
 *         Do NOT use git worktree commands - the worktree is already set up.")
 *    ```
 * 3. **Subagents use standard tools** (Read, Write, Edit, Bash) in their assigned paths
 * 4. **Main agent handles merge/cleanup** using `use-git-worktree` after subagents complete
 */

import { type Plugin, tool } from "@opencode-ai/plugin"

interface WorktreeInfo {
  name: string
  branch: string
  directory: string
}

interface WorktreeResult {
  success: boolean
  message: string
  path?: string
  branch?: string
  conflicts?: string[]
  diff?: string
  worktrees?: string[]
}

const EXEC_TIMEOUT_MS = 30_000

async function safeExec(
  command: string[],
  options?: { cwd?: string; timeoutMs?: number }
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  const timeout = options?.timeoutMs ?? EXEC_TIMEOUT_MS

  try {
    const proc = Bun.spawn(command, {
      cwd: options?.cwd,
      stdout: "pipe",
      stderr: "pipe",
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill()
        reject(new Error(`Command timed out after ${timeout}ms: ${command.join(" ")}`))
      }, timeout)
    })

    const [stdout, stderr] = await Promise.race([
      Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]),
      timeoutPromise,
    ])

    const exitCode = await proc.exited

    return {
      success: exitCode === 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      stdout: "",
      stderr: message,
    }
  }
}

function sanitizeBranchName(branch: string): string {
  if (/[\s;&|`$(){}[\]<>\\'"!*?~^]/.test(branch) || branch.startsWith("-")) {
    throw new Error(`Invalid branch name: contains unsafe characters`)
  }
  return branch
}

export const GitWorktreePlugin: Plugin = async (ctx) => {
  const { client, directory, worktree } = ctx
  const repoRoot = worktree || directory

  // Helper to log via SDK
  const log = async (level: "info" | "error" | "warn", message: string, extra?: Record<string, any>) => {
    await client.app.log({ 
      service: "git-worktree", 
      level, 
      message, 
      extra 
    }).catch(() => {})
  }

  // Helper to find worktree directory by name
  const findWorktreeByName = async (name: string): Promise<string | undefined> => {
    const response = await client.worktree.list().catch(() => ({ data: [] }))
    const list = response.data ?? []
    
    // The API returns full directory paths, find one that ends with the name
    return list.find(dir => {
      const parts = dir.split('/')
      return parts[parts.length - 1] === name
    })
  }

  return {
    "tool.execute.before": async (input, output) => {
      // Intercept direct `git worktree` commands and guide the agent to use the plugin
      if (input.tool === "bash" && typeof output.args?.command === "string") {
        const cmd = output.args.command
        if (/\bgit\s+worktree\b/.test(cmd)) {
          throw new Error(
            `Direct 'git worktree' commands are not allowed. ` +
            `Use the 'use-git-worktree' tool instead for managed worktree operations, ` +
            `automatic cleanup, and proper logging. ` +
            `Available actions: create, list, remove, merge, status, cleanup.`
          )
        }
      }
    },

    tool: {
      "use-git-worktree": tool({
        description: `Manage git worktrees for concurrent branch development.

CRITICAL: This tool MUST be used for ALL git worktree operations.
- Do NOT use \`git worktree\` commands directly via Bash - they will be blocked
- Do NOT delegate worktree creation to Task subagents - plugin tools are NOT available to subagents

## Actions

- **create**: Create a new git worktree with a project-scoped branch
- **list**: List all project worktrees
- **remove**: Remove a specific git worktree by name
- **merge**: Merge git worktree changes back to a target branch
- **status**: Get the status of a git worktree (changes, commits ahead/behind)
- **cleanup**: Remove all project worktrees

## Merge Strategies

When merging, use the \`mergeStrategy\` parameter:
- **ours**: On conflict, keep changes from the target branch
- **theirs**: On conflict, keep changes from the git worktree branch  
- **manual**: Stop on conflict and return diff for user to decide

## Example Usage

1. Create a git worktree:
   \`\`\`
   action: "create", name: "feature-work"
   \`\`\`

2. Work in the worktree directory (use Read/Write/Edit/Bash with the returned path)

3. After making changes, merge back to main:
   \`\`\`
   action: "merge", name: "feature-work", targetBranch: "main", mergeStrategy: "theirs"
   \`\`\`

4. Clean up when done:
   \`\`\`
   action: "remove", name: "feature-work"
   \`\`\`

## Subagent Pattern for Concurrent Work

Since plugin tools are NOT available to Task subagents:

1. **Main agent creates all worktrees first** using this tool
2. **Main agent gets the worktree paths** from the create results
3. **Main agent launches Task subagents** with explicit paths:
   \`\`\`
   Task(prompt="Work in /path/to/worktree. Edit files using Read/Write/Edit tools.
                Do NOT use git worktree commands - the worktree is already created.")
   \`\`\`
4. **Main agent handles merge/cleanup** after subagents complete

Worktrees are stored in \`$XDG_DATA_HOME/opencode/worktree/{projectID}/{name}\` with branches named \`opencode/{name}\`.`,

        args: {
          action: tool.schema
            .enum(["create", "list", "remove", "merge", "status", "cleanup"])
            .describe("The git worktree action to perform"),
          name: tool.schema
            .string()
            .optional()
            .describe("Worktree name for create/remove/merge/status actions (auto-generated like 'calm-comet' if not provided for create)"),
          targetBranch: tool.schema
            .string()
            .optional()
            .describe("Target branch to merge into (for merge action)"),
          mergeStrategy: tool.schema
            .enum(["ours", "theirs", "manual"])
            .optional()
            .describe(
              "Conflict resolution strategy: 'ours' (keep target), 'theirs' (keep worktree), 'manual' (return diff)"
            ),
          startCommand: tool.schema
            .string()
            .optional()
            .describe("Optional command to run after creating the worktree (e.g., 'npm install')"),
          commitMessage: tool.schema
            .string()
            .optional()
            .describe("Commit message for merge commit"),
        },

        async execute(args, toolCtx): Promise<string> {
          const { sessionID } = toolCtx
          let result: WorktreeResult

          try {
            switch (args.action) {
              case "create":
                result = await createWorktree(
                  client,
                  log,
                  sessionID,
                  args.name,
                  args.startCommand
                )
                break

              case "list":
                result = await listWorktrees(client, repoRoot, log)
                break

              case "remove":
                result = await removeWorktree(client, findWorktreeByName, repoRoot, log, sessionID, args.name)
                break

              case "merge":
                result = await mergeWorktree(
                  findWorktreeByName,
                  repoRoot,
                  log,
                  sessionID,
                  args.name,
                  args.targetBranch,
                  args.mergeStrategy,
                  args.commitMessage
                )
                break

              case "status":
                result = await getWorktreeStatus(findWorktreeByName, log, sessionID, args.name)
                break

              case "cleanup":
                result = await cleanupAll(client, repoRoot, log, sessionID)
                break

              default:
                result = {
                  success: false,
                  message: `Unknown action: ${args.action}`,
                }
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            result = {
              success: false,
              message: `Unexpected error: ${message}`,
            }
            await log("error", "Tool execution error", { error: message, sessionID })
          }

          return formatResult(result)
        },
      }),
    },
  }
}

async function createWorktree(
  client: any,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>,
  sessionID: string,
  name?: string,
  startCommand?: string
): Promise<WorktreeResult> {
  await log("info", "Creating worktree", { sessionID, name, startCommand: startCommand ?? "none" })

  try {
    const response = await client.worktree.create({
      name,
      startCommand,
    })

    if (!response.data) {
      return {
        success: false,
        message: "Failed to create worktree: No data returned from API",
      }
    }

    const worktree = response.data
    await log("info", "Worktree created", { 
      sessionID, 
      name: worktree.name, 
      branch: worktree.branch, 
      directory: worktree.directory 
    })

    return {
      success: true,
      message: `Created worktree '${worktree.name}' with branch '${worktree.branch}'`,
      path: worktree.directory,
      branch: worktree.branch,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await log("error", "Failed to create worktree", { sessionID, error: message })
    return {
      success: false,
      message: `Failed to create worktree: ${message}`,
    }
  }
}

async function listWorktrees(
  client: any,
  repoRoot: string,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>
): Promise<WorktreeResult> {
  try {
    // Get project worktrees from managed API
    const response = await client.worktree.list().catch(() => ({ data: [] }))
    const worktrees = response.data ?? []

    // Also get all git worktrees for full picture
    const gitResult = await safeExec(["git", "worktree", "list", "--porcelain"], {
      cwd: repoRoot,
    })

    let message = `Project worktrees: ${worktrees.length}\n`

    if (worktrees.length > 0) {
      message += "\nManaged worktrees:\n"
      for (const dir of worktrees) {
        const name = dir.split('/').pop()
        message += `  - ${name}: ${dir}\n`
      }
    }

    if (gitResult.success && gitResult.stdout) {
      message += `\nAll repository worktrees:\n${gitResult.stdout}`
    }

    return {
      success: true,
      message,
      worktrees,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await log("error", "Failed to list worktrees", { error: message })
    return {
      success: false,
      message: `Failed to list worktrees: ${message}`,
    }
  }
}

async function removeWorktree(
  client: any,
  findWorktreeByName: (name: string) => Promise<string | undefined>,
  repoRoot: string,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>,
  sessionID: string,
  name?: string
): Promise<WorktreeResult> {
  if (!name) {
    return {
      success: false,
      message: "Worktree name is required for remove action",
    }
  }

  const directory = await findWorktreeByName(name)
  if (!directory) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    }
  }

  const result = await safeExec(["git", "worktree", "remove", "--force", directory], {
    cwd: repoRoot,
  })

  if (!result.success) {
    await log("error", "Failed to remove worktree", { sessionID, name, directory, error: result.stderr })
    return {
      success: false,
      message: `Failed to remove worktree: ${result.stderr}`,
    }
  }

  await log("info", "Worktree removed", { sessionID, name, directory })

  return {
    success: true,
    message: `Removed worktree '${name}'`,
  }
}

async function mergeWorktree(
  findWorktreeByName: (name: string) => Promise<string | undefined>,
  repoRoot: string,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>,
  sessionID: string,
  name?: string,
  targetBranch?: string,
  mergeStrategy?: "ours" | "theirs" | "manual",
  commitMessage?: string
): Promise<WorktreeResult> {
  if (!name) {
    return {
      success: false,
      message: "Worktree name is required for merge action",
    }
  }

  if (!targetBranch) {
    return {
      success: false,
      message: "Target branch is required for merge action. Specify which branch to merge into.",
    }
  }

  // Find the worktree to determine its branch
  const directory = await findWorktreeByName(name)
  if (!directory) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    }
  }

  // Construct the branch name (convention: opencode/{name})
  const branch = `opencode/${name}`

  try {
    sanitizeBranchName(branch)
    sanitizeBranchName(targetBranch)
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const strategy = mergeStrategy || "manual"
  const message = commitMessage || `Merge branch '${branch}' into ${targetBranch}`

  // First, ensure we're on the target branch in the main worktree
  const checkoutResult = await safeExec(["git", "checkout", targetBranch], {
    cwd: repoRoot,
  })

  if (!checkoutResult.success) {
    return {
      success: false,
      message: `Failed to checkout target branch '${targetBranch}': ${checkoutResult.stderr}`,
    }
  }

  // Build merge command based on strategy
  let mergeCmd: string[]
  if (strategy === "ours") {
    mergeCmd = ["git", "merge", "-X", "ours", "-m", message, branch]
  } else if (strategy === "theirs") {
    mergeCmd = ["git", "merge", "-X", "theirs", "-m", message, branch]
  } else {
    // Manual - try merge without auto-commit, return conflicts if any
    mergeCmd = ["git", "merge", "--no-commit", "--no-ff", branch]
  }

  const mergeResult = await safeExec(mergeCmd, { cwd: repoRoot })

  // Check for conflicts
  if (!mergeResult.success) {
    if (
      mergeResult.stderr.includes("CONFLICT") ||
      mergeResult.stdout.includes("CONFLICT")
    ) {
      // Get the diff for manual resolution
      const diffResult = await safeExec(["git", "diff"], { cwd: repoRoot })
      const statusResult = await safeExec(["git", "status", "--porcelain"], {
        cwd: repoRoot,
      })

      // Extract conflicted files
      const conflicts = statusResult.stdout
        .split("\n")
        .filter((line) => line.startsWith("UU") || line.startsWith("AA"))
        .map((line) => line.slice(3))

      if (strategy === "manual") {
        return {
          success: false,
          message: `Merge has conflicts that require manual resolution.\n\nConflicted files:\n${conflicts.join("\n")}\n\nUse mergeStrategy 'ours' or 'theirs' to auto-resolve, or resolve manually in the worktree.`,
          conflicts,
          diff: diffResult.stdout,
        }
      }

      // For ours/theirs, conflicts should have been auto-resolved
      return {
        success: false,
        message: `Merge failed with conflicts that couldn't be auto-resolved: ${mergeResult.stderr}`,
        conflicts,
      }
    }

    return {
      success: false,
      message: `Merge failed: ${mergeResult.stderr}`,
    }
  }

  // For manual strategy with no conflicts, commit the merge
  if (strategy === "manual") {
    const commitResult = await safeExec(["git", "commit", "-m", message], {
      cwd: repoRoot,
    })

    if (!commitResult.success && !commitResult.stderr.includes("nothing to commit")) {
      return {
        success: false,
        message: `Merge completed but commit failed: ${commitResult.stderr}`,
      }
    }
  }

  await log("info", "Worktree merged", { sessionID, name, branch, targetBranch, strategy })

  return {
    success: true,
    message: `Successfully merged '${branch}' into '${targetBranch}'`,
    branch,
  }
}

async function getWorktreeStatus(
  findWorktreeByName: (name: string) => Promise<string | undefined>,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>,
  sessionID: string,
  name?: string
): Promise<WorktreeResult> {
  if (!name) {
    return {
      success: false,
      message: "Worktree name is required for status action",
    }
  }

  const directory = await findWorktreeByName(name)
  if (!directory) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    }
  }

  const branch = `opencode/${name}`

  // Get status in the worktree
  const statusResult = await safeExec(["git", "status", "--porcelain"], {
    cwd: directory,
  })

  // Get commits ahead/behind (ignore errors if remote branch doesn't exist)
  const logResult = await safeExec(
    ["git", "log", "--oneline", `origin/${branch}..${branch}`],
    { cwd: directory }
  )

  let message = `Worktree status for '${name}':\n`
  message += `Path: ${directory}\n`
  message += `Branch: ${branch}\n\n`

  if (statusResult.stdout) {
    message += `Changed files:\n${statusResult.stdout}\n`
  } else {
    message += "Working tree clean\n"
  }

  if (logResult.stdout) {
    message += `\nUnpushed commits:\n${logResult.stdout}`
  }

  return {
    success: true,
    message,
    path: directory,
    branch,
  }
}

async function cleanupAll(
  client: any,
  repoRoot: string,
  log: (level: string, message: string, extra?: Record<string, any>) => Promise<void>,
  sessionID: string
): Promise<WorktreeResult> {
  try {
    // Get all worktrees from managed API
    const response = await client.worktree.list().catch(() => ({ data: [] }))
    const worktrees = response.data ?? []

    await log("info", "Cleaning up worktrees", { sessionID, count: worktrees.length })

    const errors: string[] = []
    let cleaned = 0

    for (const directory of worktrees) {
      const name = directory.split('/').pop()
      const result = await safeExec(["git", "worktree", "remove", "--force", directory], {
        cwd: repoRoot,
      })
      if (result.success) {
        cleaned++
      } else {
        errors.push(`Failed to remove ${name}: ${result.stderr}`)
      }
    }

    // Prune stale worktree references
    await safeExec(["git", "worktree", "prune"], { cwd: repoRoot })

    if (errors.length > 0) {
      await log("warn", "Cleanup completed with errors", { sessionID, cleaned, errors })
      return {
        success: false,
        message: `Cleaned ${cleaned} worktrees with errors:\n${errors.join("\n")}`,
      }
    }

    await log("info", "Cleanup completed", { sessionID, cleaned })

    return {
      success: true,
      message: `Cleaned up ${cleaned} worktrees`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await log("error", "Cleanup failed", { sessionID, error: message })
    return {
      success: false,
      message: `Cleanup failed: ${message}`,
    }
  }
}

function formatResult(result: WorktreeResult): string {
  let output = result.success ? "SUCCESS" : "ERROR"
  output += `\n\n${result.message}`

  if (result.path) {
    output += `\n\nWorktree path: ${result.path}`
  }

  if (result.branch) {
    output += `\nBranch: ${result.branch}`
  }

  if (result.conflicts && result.conflicts.length > 0) {
    output += `\n\nConflicted files:\n${result.conflicts.map((f) => `  - ${f}`).join("\n")}`
  }

  if (result.diff) {
    output += `\n\nDiff:\n${result.diff}`
  }

  return output
}

export default GitWorktreePlugin
