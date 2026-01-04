/**
 * Git Worktree Plugin for OpenCode
 *
 * Provides git worktree management for concurrent branch development.
 * Worktrees are stored in a session-scoped directory within the project's
 * .opencode/worktrees/ folder to maintain isolation between sessions.
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
 * - Session-scoped worktrees with automatic cleanup
 * - Proper conflict resolution strategies
 * - Logging and observability for non-interactive workflows
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
 *
 * Git worktrees are stored in .opencode/worktrees/{sessionID}/{name}/.
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
  worktrees?: WorktreeInfo[]
}

// Session-scoped tracking of worktrees created in this session
const sessionWorktrees = new Map<string, WorktreeInfo[]>()

function log(sessionID: string, action: string, detail: string): void {
  console.log(`[git-worktree] session=${sessionID} action=${action} ${detail}`)
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
  const { directory, worktree } = ctx
  const repoRoot = worktree || directory
  // Worktrees are stored within the project directory to avoid permission issues
  const worktreeBaseDir = `${repoRoot}/.opencode/worktrees`

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

    event: async ({ event }) => {
      try {
        if (
          event.type === "session.deleted" ||
          event.type === "session.error"
        ) {
          const sessionID = event.properties?.sessionID
          if (sessionID && sessionWorktrees.has(sessionID)) {
            log(sessionID, "cleanup", "session ended, clearing local tracking")
            sessionWorktrees.delete(sessionID)
          }
        }
      } catch (error) {
        console.error("[git-worktree] Event handler error:", error)
      }
    },

    tool: {
      "use-git-worktree": tool({
        description: `Manage git worktrees for concurrent branch development.

CRITICAL: This tool MUST be used for ALL git worktree operations.
- Do NOT use \`git worktree\` commands directly via Bash - they will be blocked
- Do NOT delegate worktree creation to Task subagents - plugin tools are NOT available to subagents

## Actions

- **create**: Create a new git worktree with a session-scoped branch
- **list**: List all git worktrees in the current session
- **remove**: Remove a specific git worktree
- **merge**: Merge git worktree changes back to a target branch
- **status**: Get the status of a git worktree (changes, commits ahead/behind)
- **cleanup**: Remove all session git worktrees

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
   action: "merge", branch: "opencode/feature-work", targetBranch: "main", mergeStrategy: "theirs"
   \`\`\`

4. Clean up when done:
   \`\`\`
   action: "remove", branch: "opencode/feature-work"
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

Git worktrees are stored at \`.opencode/worktrees/{sessionID}/{name}\` with branches named \`opencode/{name}\`.`,

        args: {
          action: tool.schema
            .enum(["create", "list", "remove", "merge", "status", "cleanup"])
            .describe("The git worktree action to perform"),
          name: tool.schema
            .string()
            .optional()
            .describe("Worktree name for create action (optional - auto-generated like 'calm-comet' if not provided)"),
          branch: tool.schema
            .string()
            .optional()
            .describe("Branch name. For create: custom branch name (default: 'opencode/{name}'). For remove/merge/status: the branch to operate on."),
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
                  repoRoot,
                  worktreeBaseDir,
                  sessionID,
                  args.name,
                  args.branch,
                  args.startCommand
                )
                break

              case "list":
                result = await listWorktrees(sessionID, repoRoot)
                break

              case "remove":
                result = await removeWorktree(sessionID, repoRoot, args.branch)
                break

              case "merge":
                result = await mergeWorktree(
                  sessionID,
                  repoRoot,
                  args.branch,
                  args.targetBranch,
                  args.mergeStrategy,
                  args.commitMessage
                )
                break

              case "status":
                result = await getWorktreeStatus(sessionID, repoRoot, args.branch)
                break

              case "cleanup":
                result = await cleanupAll(sessionID, repoRoot)
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
            console.error("[git-worktree] Tool execution error:", error)
          }

          return formatResult(result)
        },
      }),
    },
  }
}

function generateWorktreeName(): string {
  const adjectives = ["calm", "swift", "bright", "bold", "quiet", "keen", "warm", "cool", "soft", "wild"]
  const nouns = ["comet", "river", "storm", "cloud", "flame", "frost", "dawn", "dusk", "peak", "wave"]
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}-${noun}`
}

async function createWorktree(
  repoRoot: string,
  worktreeBaseDir: string,
  sessionID: string,
  name?: string,
  branch?: string,
  startCommand?: string
): Promise<WorktreeResult> {
  const worktreeName = name ?? generateWorktreeName()
  const branchName = branch ?? `opencode/${worktreeName}`
  
  log(sessionID, "create", `name=${worktreeName} branch=${branchName} startCommand=${startCommand ?? "none"}`)

  try {
    // Sanitize branch name
    sanitizeBranchName(branchName)
    
    // Create session-scoped worktree directory
    const sessionWorktreeDir = `${worktreeBaseDir}/${sessionID}`
    const worktreePath = `${sessionWorktreeDir}/${worktreeName}`
    
    // Ensure the base directory exists
    const mkdirResult = await safeExec(["mkdir", "-p", sessionWorktreeDir])
    if (!mkdirResult.success) {
      return {
        success: false,
        message: `Failed to create worktree directory: ${mkdirResult.stderr}`,
      }
    }
    
    // Check if worktree already exists
    const existingWorktrees = sessionWorktrees.get(sessionID) || []
    const existing = existingWorktrees.find(w => w.name === worktreeName)
    if (existing) {
      return {
        success: true,
        message: `Worktree '${worktreeName}' already exists`,
        path: existing.directory,
        branch: existing.branch,
      }
    }
    
    // Create the worktree with a new branch
    const gitResult = await safeExec(
      ["git", "worktree", "add", "-b", branchName, worktreePath, "HEAD"],
      { cwd: repoRoot }
    )
    
    if (!gitResult.success) {
      // If branch already exists, try without -b
      if (gitResult.stderr.includes("already exists")) {
        const retryResult = await safeExec(
          ["git", "worktree", "add", worktreePath, branchName],
          { cwd: repoRoot }
        )
        if (!retryResult.success) {
          return {
            success: false,
            message: `Failed to create worktree: ${retryResult.stderr}`,
          }
        }
      } else {
        return {
          success: false,
          message: `Failed to create worktree: ${gitResult.stderr}`,
        }
      }
    }

    const worktreeInfo: WorktreeInfo = {
      name: worktreeName,
      branch: branchName,
      directory: worktreePath,
    }

    // Track in session
    if (!sessionWorktrees.has(sessionID)) {
      sessionWorktrees.set(sessionID, [])
    }
    sessionWorktrees.get(sessionID)!.push(worktreeInfo)

    // Run start command if provided
    if (startCommand) {
      log(sessionID, "start-command", `running: ${startCommand}`)
      await safeExec(["sh", "-c", startCommand], { cwd: worktreePath })
    }

    log(sessionID, "created", `name=${worktreeName} branch=${branchName} path=${worktreePath}`)

    return {
      success: true,
      message: `Created worktree '${worktreeName}' with branch '${branchName}'`,
      path: worktreePath,
      branch: branchName,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(sessionID, "error", `create failed: ${message}`)
    return {
      success: false,
      message: `Failed to create worktree: ${message}`,
    }
  }
}

async function listWorktrees(
  sessionID: string,
  repoRoot: string
): Promise<WorktreeResult> {
  const tracked = sessionWorktrees.get(sessionID) || []

  // Get all git worktrees to show the full picture
  const gitResult = await safeExec(["git", "worktree", "list", "--porcelain"], {
    cwd: repoRoot,
  })

  let message = `Session worktrees: ${tracked.length}\n`

  if (tracked.length > 0) {
    message += "\nSession-managed worktrees:\n"
    for (const wt of tracked) {
      message += `  - ${wt.name} (${wt.branch}): ${wt.directory}\n`
    }
  }

  if (gitResult.success && gitResult.stdout) {
    message += `\nAll repository worktrees:\n${gitResult.stdout}`
  }

  return {
    success: true,
    message,
    worktrees: tracked,
  }
}

async function removeWorktree(
  sessionID: string,
  repoRoot: string,
  branch?: string
): Promise<WorktreeResult> {
  if (!branch) {
    return {
      success: false,
      message: "Branch name is required for remove action",
    }
  }

  const tracked = sessionWorktrees.get(sessionID) || []
  const worktree = tracked.find((w) => w.branch === branch)

  if (!worktree) {
    // Try to find by name if branch doesn't match
    const byName = tracked.find((w) => w.name === branch || `opencode/${w.name}` === branch)
    if (byName) {
      return removeWorktreeByInfo(sessionID, repoRoot, byName, tracked)
    }
    return {
      success: false,
      message: `No worktree found for branch '${branch}' in this session. Use 'list' action to see available worktrees.`,
    }
  }

  return removeWorktreeByInfo(sessionID, repoRoot, worktree, tracked)
}

async function removeWorktreeByInfo(
  sessionID: string,
  repoRoot: string,
  worktree: WorktreeInfo,
  tracked: WorktreeInfo[]
): Promise<WorktreeResult> {
  const result = await safeExec(["git", "worktree", "remove", "--force", worktree.directory], {
    cwd: repoRoot,
  })

  if (!result.success) {
    return {
      success: false,
      message: `Failed to remove worktree: ${result.stderr}`,
    }
  }

  const index = tracked.indexOf(worktree)
  if (index > -1) {
    tracked.splice(index, 1)
  }

  log(sessionID, "remove", `name=${worktree.name} branch=${worktree.branch} path=${worktree.directory}`)

  return {
    success: true,
    message: `Removed worktree '${worktree.name}'`,
    branch: worktree.branch,
  }
}

async function mergeWorktree(
  sessionID: string,
  repoRoot: string,
  branch?: string,
  targetBranch?: string,
  mergeStrategy?: "ours" | "theirs" | "manual",
  commitMessage?: string
): Promise<WorktreeResult> {
  if (!branch) {
    return {
      success: false,
      message: "Branch name is required for merge action",
    }
  }

  if (!targetBranch) {
    return {
      success: false,
      message:
        "Target branch is required for merge action. Specify which branch to merge into.",
    }
  }

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

  log(sessionID, "merge", `branch=${branch} target=${targetBranch} strategy=${strategy}`)

  return {
    success: true,
    message: `Successfully merged '${branch}' into '${targetBranch}'`,
    branch,
  }
}

async function getWorktreeStatus(
  sessionID: string,
  repoRoot: string,
  branch?: string
): Promise<WorktreeResult> {
  if (!branch) {
    return {
      success: false,
      message: "Branch name is required for status action",
    }
  }

  const tracked = sessionWorktrees.get(sessionID) || []
  let worktree = tracked.find((w) => w.branch === branch)
  
  // Try to find by name if branch doesn't match
  if (!worktree) {
    worktree = tracked.find((w) => w.name === branch || `opencode/${w.name}` === branch)
  }

  if (!worktree) {
    return {
      success: false,
      message: `No worktree found for '${branch}' in this session. Use 'list' action to see available worktrees.`,
    }
  }

  // Get status in the worktree
  const statusResult = await safeExec(["git", "status", "--porcelain"], {
    cwd: worktree.directory,
  })

  // Get commits ahead/behind (ignore errors if remote branch doesn't exist)
  const logResult = await safeExec(
    ["git", "log", "--oneline", `origin/${worktree.branch}..${worktree.branch}`],
    { cwd: worktree.directory }
  )

  let message = `Worktree status for '${worktree.name}':\n`
  message += `Path: ${worktree.directory}\n`
  message += `Branch: ${worktree.branch}\n\n`

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
    path: worktree.directory,
    branch: worktree.branch,
  }
}

async function cleanupAll(
  sessionID: string,
  repoRoot: string
): Promise<WorktreeResult> {
  const worktrees = sessionWorktrees.get(sessionID) || []
  const errors: string[] = []
  let cleaned = 0

  log(sessionID, "cleanup", `worktrees=${worktrees.length}`)

  for (const wt of worktrees) {
    const result = await safeExec(["git", "worktree", "remove", "--force", wt.directory], {
      cwd: repoRoot,
    })
    if (result.success) {
      cleaned++
    } else {
      errors.push(`Failed to remove ${wt.name}: ${result.stderr}`)
    }
  }

  await safeExec(["git", "worktree", "prune"], { cwd: repoRoot })

  sessionWorktrees.delete(sessionID)

  if (errors.length > 0) {
    return {
      success: false,
      message: `Cleaned ${cleaned} worktrees with errors:\n${errors.join("\n")}`,
    }
  }

  return {
    success: true,
    message: `Cleaned up ${cleaned} worktrees`,
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
