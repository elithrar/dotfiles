/**
 * Worktree Plugin for OpenCode
 *
 * Provides git worktree management for concurrent branch development.
 * Enables working on multiple unrelated changes simultaneously without
 * stashing or switching branches in the main repository.
 *
 * ## Agent Usage Guide
 *
 * Use the `use-worktree` tool when you need to:
 * - Work on multiple unrelated changes concurrently
 * - Isolate changes for different branches without affecting the main worktree
 * - Review or test code from another branch while preserving current work
 *
 * ### Workflow Example
 * 1. Create a worktree: `use-worktree` with action "create" and branch name
 * 2. Work in the worktree directory (returned in the result)
 * 3. Merge changes back: `use-worktree` with action "merge"
 * 4. Clean up: `use-worktree` with action "remove" or let session cleanup handle it
 *
 * ### Merge Strategies
 * - "ours": Keep changes from the target branch on conflict
 * - "theirs": Keep changes from the worktree branch on conflict
 * - "manual": Stop on conflict and return diff for user decision
 *
 * Worktrees are automatically cleaned up when the session ends.
 */

import { type Plugin, tool } from "@opencode-ai/plugin"

// Type definitions for better safety
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

// In-memory tracking of worktrees per session
const sessionWorktrees = new Map<string, WorktreeInfo[]>()

/**
 * Safely execute a shell command and handle errors gracefully
 */
async function safeExec(
  $: typeof Bun.$,
  command: string[],
  options?: { cwd?: string }
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const cmd = command.join(" ")
    const result = options?.cwd
      ? await $`cd ${options.cwd} && ${cmd}`.quiet()
      : await $`${cmd}`.quiet()

    return {
      success: result.exitCode === 0,
      stdout: result.stdout.toString().trim(),
      stderr: result.stderr.toString().trim(),
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

/**
 * Get the base path for session worktrees
 */
function getSessionBasePath(sessionID: string): string {
  return `/tmp/opencode-worktree-${sessionID}`
}

/**
 * Get the full worktree path for a branch
 */
function getWorktreePath(sessionID: string, branch: string): string {
  // Sanitize branch name for filesystem safety
  const safeBranch = branch.replace(/[^a-zA-Z0-9_-]/g, "_")
  return `${getSessionBasePath(sessionID)}/${safeBranch}`
}

/**
 * Clean up all worktrees for a session
 */
async function cleanupSessionWorktrees(
  $: typeof Bun.$,
  sessionID: string,
  directory: string
): Promise<{ cleaned: number; errors: string[] }> {
  const worktrees = sessionWorktrees.get(sessionID) || []
  const errors: string[] = []
  let cleaned = 0

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

  // Also try to remove the session base directory
  const basePath = getSessionBasePath(sessionID)
  await safeExec($, ["rm", "-rf", basePath])

  // Prune any dangling worktree references
  await safeExec($, ["git", "worktree", "prune"], { cwd: directory })

  // Clear tracking
  sessionWorktrees.delete(sessionID)

  return { cleaned, errors }
}

/**
 * Worktree Plugin
 *
 * Provides the `use-worktree` tool and handles automatic cleanup on session end.
 */
export const WorktreePlugin: Plugin = async (ctx) => {
  const { $, directory, worktree } = ctx
  const repoRoot = worktree || directory

  return {
    /**
     * Event handler for session lifecycle management
     * Automatically cleans up worktrees when session ends
     */
    event: async ({ event }) => {
      try {
        // Clean up on session end or error
        if (
          event.type === "session.deleted" ||
          event.type === "session.error"
        ) {
          const sessionID = event.properties?.sessionID
          if (sessionID && sessionWorktrees.has(sessionID)) {
            const result = await cleanupSessionWorktrees($, sessionID, repoRoot)
            if (result.errors.length > 0) {
              console.error(
                `[worktree] Cleanup errors for session ${sessionID}:`,
                result.errors
              )
            }
          }
        }
      } catch (error) {
        // Never let plugin errors crash OpenCode
        console.error("[worktree] Event handler error:", error)
      }
    },

    /**
     * Register the use-worktree tool
     */
    tool: {
      "use-worktree": tool({
        description: `Manage git worktrees for concurrent branch development.

## Actions

- **create**: Create a new worktree for a branch
- **list**: List all worktrees in the current session
- **remove**: Remove a specific worktree
- **merge**: Merge worktree changes back to a target branch
- **status**: Get the status of a worktree (changes, commits ahead/behind)
- **cleanup**: Remove all session worktrees

## Merge Strategies

When merging, use the \`mergeStrategy\` parameter:
- **ours**: On conflict, keep changes from the target branch
- **theirs**: On conflict, keep changes from the worktree branch  
- **manual**: Stop on conflict and return diff for user to decide

## Example Usage

1. Create a worktree for a feature branch:
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

Worktrees are stored at \`/tmp/opencode-worktree-{sessionID}/{branch}\` and are automatically cleaned up when the session ends.`,

        args: {
          action: tool.schema
            .enum(["create", "list", "remove", "merge", "status", "cleanup"])
            .describe("The worktree action to perform"),
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
            console.error("[worktree] Tool execution error:", error)
          }

          return formatResult(result)
        },
      }),
    },
  }
}

/**
 * Create a new worktree
 */
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
  await safeExec($, ["mkdir", "-p", basePath])

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

  const result = await safeExec($, cmd, { cwd: repoRoot })

  if (!result.success) {
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

  // Track the worktree
  const worktreeInfo: WorktreeInfo = {
    path: worktreePath,
    branch,
    createdAt: Date.now(),
  }

  if (!sessionWorktrees.has(sessionID)) {
    sessionWorktrees.set(sessionID, [])
  }
  sessionWorktrees.get(sessionID)!.push(worktreeInfo)

  return {
    success: true,
    message: `Created worktree for branch '${branch}'`,
    path: worktreePath,
    branch,
  }
}

/**
 * List all worktrees in the session
 */
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

/**
 * Remove a worktree
 */
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

  // Remove from tracking
  const index = tracked.indexOf(worktree)
  if (index > -1) {
    tracked.splice(index, 1)
  }

  return {
    success: true,
    message: `Removed worktree for branch '${branch}'`,
    branch,
  }
}

/**
 * Merge worktree changes into a target branch
 */
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

  return {
    success: true,
    message: `Successfully merged '${branch}' into '${targetBranch}'`,
    branch,
  }
}

/**
 * Get status of a worktree
 */
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

  // Get commits ahead/behind
  const logResult = await safeExec(
    $,
    ["git", "log", "--oneline", `origin/${branch}..${branch}`, "2>/dev/null", "||", "true"],
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

/**
 * Clean up all worktrees in the session
 */
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

/**
 * Format a result for display
 */
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

export default WorktreePlugin
