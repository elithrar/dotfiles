/**
 * Git Worktree Plugin for OpenCode
 *
 * Provides git worktree management for concurrent branch development.
 * Enables working on multiple unrelated changes simultaneously without
 * stashing or switching branches in the main repository.
 *
 * ## Agent Usage Guide
 *
 * IMPORTANT: Always use the `use-git-worktree` tool for ALL git worktree operations.
 * Do NOT use `git worktree` commands directly via Bash - the plugin provides:
 * - Session-scoped isolation (worktrees are namespaced per session)
 * - Automatic cleanup when sessions end
 * - Proper conflict resolution strategies
 * - Logging and observability for non-interactive workflows
 *
 * Use the `use-git-worktree` tool when you need to:
 * - Work on multiple unrelated changes concurrently
 * - Isolate changes for different branches without affecting the main worktree
 * - Review or test code from another branch while preserving current work
 *
 * ### Workflow Example
 * 1. Create a git worktree: `use-git-worktree` with action "create" and branch name
 * 2. Work in the git worktree directory (returned in the result)
 * 3. Merge changes back: `use-git-worktree` with action "merge"
 * 4. Clean up: `use-git-worktree` with action "remove" or let session cleanup handle it
 *
 * ### Merge Strategies
 * - "ours": Keep changes from the target branch on conflict
 * - "theirs": Keep changes from the worktree branch on conflict
 * - "manual": Stop on conflict and return diff for user decision
 *
 * ## IMPORTANT: Subagent Limitations
 *
 * Plugin tools like `use-git-worktree` are only available to the MAIN AGENT.
 * Task subagents (general, explore) CANNOT directly use this tool because:
 * - Plugin tools are loaded at instance scope but subagents run with filtered tool access
 * - The `external_directory` permission may block operations in non-interactive contexts
 *
 * ### Correct Pattern for Concurrent Work with Subagents
 *
 * 1. **Main agent creates worktrees** using `use-git-worktree` tool
 * 2. **Main agent launches Task subagents** with the worktree PATH (not branch):
 *    ```
 *    Task(subagent_type="general", prompt="Work in /tmp/opencode-git-worktree-{sessionID}/feature-branch.
 *         Use Read/Write/Edit/Bash tools to modify files in that directory.")
 *    ```
 * 3. **Subagents use standard tools** (Read, Write, Edit, Bash) in their assigned paths
 * 4. **Main agent handles merge/cleanup** using `use-git-worktree`
 *
 * ### Required Configuration
 *
 * Your `.opencode/opencode.jsonc` must include:
 * ```json
 * { "permission": { "external_directory": "allow" } }
 * ```
 *
 * Git worktrees are automatically cleaned up when the session ends.
 */

import { type Plugin, tool } from "@opencode-ai/plugin"

interface WorktreeInfo {
  path: string
  branch: string
  createdAt: number
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

const sessionWorktrees = new Map<string, WorktreeInfo[]>()

function log(sessionID: string, action: string, detail: string): void {
  console.log(`[git-worktree] session=${sessionID} action=${action} ${detail}`)
}

const EXEC_TIMEOUT_MS = 30_000

async function safeExec(
  _$: typeof Bun.$,
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

function getSessionBasePath(sessionID: string): string {
  return `/tmp/opencode-git-worktree-${sessionID}`
}

function sanitizeBranchName(branch: string): string {
  // Reject branches with shell metacharacters or git-unsafe patterns
  if (/[\s;&|`$(){}[\]<>\\'"!*?~^]/.test(branch) || branch.startsWith("-")) {
    throw new Error(`Invalid branch name: contains unsafe characters`)
  }
  return branch
}

function getWorktreePath(sessionID: string, branch: string): string {
  const safeBranch = branch.replace(/[^a-zA-Z0-9_\-/]/g, "_")
  return `${getSessionBasePath(sessionID)}/${safeBranch}`
}

async function cleanupSessionWorktrees(
  $: typeof Bun.$,
  sessionID: string,
  directory: string
): Promise<{ cleaned: number; errors: string[] }> {
  const worktrees = sessionWorktrees.get(sessionID) || []
  const errors: string[] = []
  let cleaned = 0

  log(sessionID, "cleanup", `worktrees=${worktrees.length}`)

  for (const wt of worktrees) {
    const result = await safeExec($, ["git", "worktree", "remove", "--force", wt.path], {
      cwd: directory,
    })
    if (result.success) {
      cleaned++
    } else {
      errors.push(`Failed to remove ${wt.path}: ${result.stderr}`)
    }
  }

  const basePath = getSessionBasePath(sessionID)
  await safeExec($, ["rm", "-rf", basePath])

  await safeExec($, ["git", "worktree", "prune"], { cwd: directory })

  sessionWorktrees.delete(sessionID)

  return { cleaned, errors }
}

export const GitWorktreePlugin: Plugin = async (ctx) => {
  const { $, directory, worktree } = ctx
  const repoRoot = worktree || directory

  return {
    "tool.execute.before": async (input, output) => {
      // Intercept direct `git worktree` commands and guide the agent to use the plugin
      if (input.tool === "bash" && typeof output.args?.command === "string") {
        const cmd = output.args.command
        if (/\bgit\s+worktree\b/.test(cmd)) {
          throw new Error(
            `Direct 'git worktree' commands are not allowed. ` +
            `Use the 'use-git-worktree' tool instead for session-scoped worktree management, ` +
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
            const result = await cleanupSessionWorktrees($, sessionID, repoRoot)
            if (result.errors.length > 0) {
              console.error(
                `[git-worktree] Cleanup errors for session ${sessionID}:`,
                result.errors
              )
            }
          }
        }
      } catch (error) {
        console.error("[git-worktree] Event handler error:", error)
      }
    },

    tool: {
      "use-git-worktree": tool({
        description: `Manage git worktrees for concurrent branch development.

IMPORTANT: Always use this tool instead of running \`git worktree\` commands directly via Bash.
This tool provides session-scoped worktrees, automatic cleanup, and proper logging.

NOTE: This tool is only available to the MAIN AGENT. Task subagents cannot use this tool directly.
For concurrent work: main agent creates worktrees first, then launches subagents with the worktree PATH.
Subagents should use standard tools (Read, Write, Edit, Bash) in their assigned worktree directory.

## Actions

- **create**: Create a new git worktree for a branch
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

1. Create a git worktree for a feature branch:
   \`\`\`
   action: "create", branch: "feature/new-ui"
   \`\`\`

2. After making changes, merge back to main:
   \`\`\`
   action: "merge", branch: "feature/new-ui", targetBranch: "main", mergeStrategy: "theirs"
   \`\`\`

3. Clean up when done:
   \`\`\`
   action: "remove", branch: "feature/new-ui"
   \`\`\`

Git worktrees are stored at \`/tmp/opencode-git-worktree-{sessionID}/{branch}\` and are automatically cleaned up when the session ends.`,

        args: {
          action: tool.schema
            .enum(["create", "list", "remove", "merge", "status", "cleanup"])
            .describe("The git worktree action to perform"),
          branch: tool.schema
            .string()
            .optional()
            .describe("Branch name for create/remove/merge/status actions"),
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
          createBranch: tool.schema
            .boolean()
            .optional()
            .describe("Create new branch if it doesn't exist (for create action)"),
          baseBranch: tool.schema
            .string()
            .optional()
            .describe("Base branch to create new branch from (defaults to HEAD)"),
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
                  $,
                  sessionID,
                  repoRoot,
                  args.branch,
                  args.createBranch,
                  args.baseBranch
                )
                break

              case "list":
                result = await listWorktrees($, sessionID, repoRoot)
                break

              case "remove":
                result = await removeWorktree($, sessionID, repoRoot, args.branch)
                break

              case "merge":
                result = await mergeWorktree(
                  $,
                  sessionID,
                  repoRoot,
                  args.branch,
                  args.targetBranch,
                  args.mergeStrategy,
                  args.commitMessage
                )
                break

              case "status":
                result = await getWorktreeStatus($, sessionID, repoRoot, args.branch)
                break

              case "cleanup":
                result = await cleanupAll($, sessionID, repoRoot)
                break

              default:
                result = {
                  success: false,
                  message: `Unknown action: ${args.action}`,
                }
            }
          } catch (error) {
            // Catch-all for any unhandled errors - never crash OpenCode
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

async function createWorktree(
  $: typeof Bun.$,
  sessionID: string,
  repoRoot: string,
  branch?: string,
  createBranch?: boolean,
  baseBranch?: string
): Promise<WorktreeResult> {
  if (!branch) {
    return {
      success: false,
      message: "Branch name is required for create action",
    }
  }

  try {
    sanitizeBranchName(branch)
    if (baseBranch) sanitizeBranchName(baseBranch)
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  const worktreePath = getWorktreePath(sessionID, branch)

  // Check if worktree already exists
  const existing = sessionWorktrees.get(sessionID) || []
  if (existing.some((w) => w.branch === branch)) {
    const existingWt = existing.find((w) => w.branch === branch)!
    return {
      success: true,
      message: `Worktree for branch '${branch}' already exists`,
      path: existingWt.path,
      branch,
    }
  }

  // Ensure session directory exists
  const basePath = getSessionBasePath(sessionID)
  const mkdirResult = await safeExec($, ["mkdir", "-p", basePath])
  if (!mkdirResult.success) {
    return {
      success: false,
      message: `Failed to create session directory '${basePath}': ${mkdirResult.stderr}. Check filesystem permissions.`,
    }
  }
  log(sessionID, "mkdir", `path=${basePath}`)

  // Build the git worktree add command
  let cmd: string[]
  if (createBranch) {
    // Create new branch
    const base = baseBranch || "HEAD"
    cmd = ["git", "worktree", "add", "-b", branch, worktreePath, base]
  } else {
    // Use existing branch
    cmd = ["git", "worktree", "add", worktreePath, branch]
  }

  log(sessionID, "exec", `cmd="${cmd.join(" ")}" cwd=${repoRoot}`)
  const result = await safeExec($, cmd, { cwd: repoRoot })

  if (!result.success) {
    log(sessionID, "error", `stderr="${result.stderr}"`)
    // Check if branch doesn't exist and suggest creating it
    if (result.stderr.includes("invalid reference") || result.stderr.includes("not a valid")) {
      return {
        success: false,
        message: `Branch '${branch}' does not exist. Set createBranch: true to create it, or specify an existing branch.`,
      }
    }
    // Check if branch is already checked out
    if (result.stderr.includes("already checked out")) {
      return {
        success: false,
        message: `Branch '${branch}' is already checked out in another worktree. Use a different branch name or remove the existing worktree first.`,
      }
    }
    return {
      success: false,
      message: `Failed to create worktree: ${result.stderr}`,
    }
  }

  const worktreeInfo: WorktreeInfo = {
    path: worktreePath,
    branch,
    createdAt: Date.now(),
  }

  if (!sessionWorktrees.has(sessionID)) {
    sessionWorktrees.set(sessionID, [])
  }
  sessionWorktrees.get(sessionID)!.push(worktreeInfo)

  log(sessionID, "create", `branch=${branch} path=${worktreePath}`)

  return {
    success: true,
    message: `Created worktree for branch '${branch}'`,
    path: worktreePath,
    branch,
  }
}

async function listWorktrees(
  $: typeof Bun.$,
  sessionID: string,
  repoRoot: string
): Promise<WorktreeResult> {
  const tracked = sessionWorktrees.get(sessionID) || []

  // Also get all git worktrees to show the full picture
  const gitResult = await safeExec($, ["git", "worktree", "list", "--porcelain"], {
    cwd: repoRoot,
  })

  let message = `Session worktrees: ${tracked.length}\n`

  if (tracked.length > 0) {
    message += "\nSession-managed worktrees:\n"
    for (const wt of tracked) {
      message += `  - ${wt.branch}: ${wt.path}\n`
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
  $: typeof Bun.$,
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
    return {
      success: false,
      message: `No worktree found for branch '${branch}' in this session`,
    }
  }

  const result = await safeExec($, ["git", "worktree", "remove", "--force", worktree.path], {
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

  log(sessionID, "remove", `branch=${branch} path=${worktree.path}`)

  return {
    success: true,
    message: `Removed worktree for branch '${branch}'`,
    branch,
  }
}

async function mergeWorktree(
  $: typeof Bun.$,
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

  const tracked = sessionWorktrees.get(sessionID) || []
  const worktree = tracked.find((w) => w.branch === branch)

  if (!worktree) {
    return {
      success: false,
      message: `No worktree found for branch '${branch}' in this session. Create it first or check the branch name.`,
    }
  }

  const strategy = mergeStrategy || "manual"
  const message = commitMessage || `Merge branch '${branch}' into ${targetBranch}`

  // First, ensure we're on the target branch in the main worktree
  const checkoutResult = await safeExec($, ["git", "checkout", targetBranch], {
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

  const mergeResult = await safeExec($, mergeCmd, { cwd: repoRoot })

  // Check for conflicts
  if (!mergeResult.success) {
    if (
      mergeResult.stderr.includes("CONFLICT") ||
      mergeResult.stdout.includes("CONFLICT")
    ) {
      // Get the diff for manual resolution
      const diffResult = await safeExec($, ["git", "diff"], { cwd: repoRoot })
      const statusResult = await safeExec($, ["git", "status", "--porcelain"], {
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
      // This means there was a different error
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
    const commitResult = await safeExec($, ["git", "commit", "-m", message], {
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
  $: typeof Bun.$,
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
  const worktree = tracked.find((w) => w.branch === branch)

  if (!worktree) {
    return {
      success: false,
      message: `No worktree found for branch '${branch}' in this session`,
    }
  }

  // Get status in the worktree
  const statusResult = await safeExec($, ["git", "status", "--porcelain"], {
    cwd: worktree.path,
  })

  // Get commits ahead/behind (ignore errors if remote branch doesn't exist)
  const logResult = await safeExec(
    $,
    ["git", "log", "--oneline", `origin/${branch}..${branch}`],
    { cwd: worktree.path }
  )

  let message = `Worktree status for '${branch}':\n`
  message += `Path: ${worktree.path}\n`
  message += `Created: ${new Date(worktree.createdAt).toISOString()}\n\n`

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
    path: worktree.path,
    branch,
  }
}

async function cleanupAll(
  $: typeof Bun.$,
  sessionID: string,
  repoRoot: string
): Promise<WorktreeResult> {
  const result = await cleanupSessionWorktrees($, sessionID, repoRoot)

  if (result.errors.length > 0) {
    return {
      success: false,
      message: `Cleaned ${result.cleaned} worktrees with errors:\n${result.errors.join("\n")}`,
    }
  }

  return {
    success: true,
    message: `Cleaned up ${result.cleaned} worktrees`,
  }
}

function formatResult(result: WorktreeResult): string {
  let output = result.success ? "SUCCESS" : "ERROR"
  output += `\n\n${result.message}`

  if (result.path) {
    output += `\n\nWorktree path: ${result.path}`
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
