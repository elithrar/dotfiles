/**
 * Git Worktree Plugin for OpenCode
 *
 * Provides git worktree management for concurrent branch development.
 * Worktrees are stored in {repoRoot}/.opencode/worktrees/{name}
 * using direct git commands via Bun's shell.
 *
 * IMPORTANT: Agents should ALWAYS use this tool for any git worktree operations.
 * Direct `git worktree` commands are blocked and will error.
 *
 * ## When to Use
 *
 * - User requests worktree operations (create, list, merge)
 * - Running subagents that make concurrent changes to the same repository
 * - Performing parallel tasks that modify files in the repo
 * - Isolating branch work without affecting the main worktree
 * - Reviewing/testing code from another branch while preserving current work
 *
 * ## Concurrent Subagent Pattern
 *
 * When spawning multiple subagents to work on the same repo:
 * 1. Create a worktree for each subagent
 * 2. Each subagent works in its isolated worktree directory
 * 3. Merge results back to the target branch when complete
 *
 * ## Workflow Example
 *
 * 1. Create: `use-git-worktree` with action "create"
 * 2. Work in the returned worktree directory
 * 3. Merge changes back: `use-git-worktree` with action "merge"
 *
 * ## Merge Strategies
 *
 * - "ours": Keep changes from the target branch on conflict
 * - "theirs": Keep changes from the worktree branch on conflict
 * - "manual": Stop on conflict and return diff for user decision (aborts merge to keep repo clean)
 */

import { type Plugin, tool } from "@opencode-ai/plugin";

const PLUGIN_NAME = "git-worktree";
const MAX_NAME_RETRIES = 5;

interface WorktreeResult {
  success: boolean;
  message: string;
  path?: string;
  branch?: string;
  conflicts?: string[];
  diff?: string;
  worktrees?: string[];
}

/**
 * Validates branch name for git safety.
 * Throws if the name contains unsafe characters.
 */
function validateBranchName(branch: string): void {
  if (
    /[\s;&|`$(){}[\]<>\\'"!*?~^]/.test(branch) ||
    branch.startsWith("-") ||
    branch.includes("..") ||
    branch.endsWith(".lock") ||
    /[\x00-\x1f\x7f]/.test(branch)
  ) {
    throw new Error(`Invalid branch name: contains unsafe characters`);
  }
}

/**
 * Extracts stderr as string from Bun shell result.
 */
function getStderr(result: { stderr: Uint8Array }): string {
  return new TextDecoder().decode(result.stderr).trim();
}

/**
 * Extracts stdout as string from Bun shell result.
 */
function getStdout(result: { stdout: Uint8Array }): string {
  return new TextDecoder().decode(result.stdout).trim();
}

// Logging helper - uses `any` to avoid SDK type complexity
async function log(
  client: any,
  level: "info" | "error" | "warn" | "debug",
  message: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  await client.app
    .log({
      service: PLUGIN_NAME,
      level,
      message,
      extra,
    })
    .catch(() => {
      // Logging failures should not break operations
    });
}

// Name generation helpers
const ADJECTIVES = [
  "brave", "calm", "clever", "cosmic", "crisp", "curious", "eager", "gentle",
  "glowing", "happy", "hidden", "jolly", "kind", "lucky", "mighty", "misty",
  "neon", "nimble", "playful", "proud", "quick", "quiet", "shiny", "silent",
  "stellar", "sunny", "swift", "tidy", "witty",
] as const;

const NOUNS = [
  "cabin", "cactus", "canyon", "circuit", "comet", "eagle", "engine", "falcon",
  "forest", "garden", "harbor", "island", "knight", "lagoon", "meadow", "moon",
  "mountain", "nebula", "orchid", "otter", "panda", "pixel", "planet", "river",
  "rocket", "sailor", "squid", "star", "tiger", "wizard", "wolf",
] as const;

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomName(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/**
 * Slugifies input string for use in branch names.
 * Returns a random name if input produces empty string.
 */
function slug(input: string): string {
  const result = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return result || randomName();
}

export const GitWorktreePlugin: Plugin = async (ctx) => {
  const { client, directory, worktree, $ } = ctx;
  const repoRoot = worktree || directory;

  /**
   * Finds a worktree directory by name using git commands.
   */
  const findWorktreeByName = async (
    name: string,
  ): Promise<string | undefined> => {
    const result = await $`git worktree list --porcelain`
      .quiet()
      .nothrow()
      .cwd(repoRoot);

    if (result.exitCode !== 0) return undefined;

    const stdout = getStdout(result);
    for (const line of stdout.split("\n")) {
      if (line.startsWith("worktree ")) {
        const dir = line.slice(9);
        const dirName = dir.split("/").pop();
        if (dirName === name) {
          return dir;
        }
      }
    }
    return undefined;
  };

  return {
    "tool.execute.before": async (input, output) => {
      // Intercept direct `git worktree` commands
      if (input.tool === "bash" && typeof output.args?.command === "string") {
        const cmd = output.args.command;
        if (/(?:^|[\s\/])git\s+worktree\b/.test(cmd)) {
          throw new Error(
            `Direct 'git worktree' commands are not allowed. ` +
              `Use the 'use-git-worktree' tool instead for managed worktree operations. ` +
              `Available actions: create, list, merge, remove, prune.`,
          );
        }
      }
    },

    tool: {
      "use-git-worktree": tool({
        description: `REQUIRED: Use this tool for ALL git worktree operations. Do NOT run \`git worktree\` commands directly via bash.

## When to use this tool

**Always use this tool when:**
- The user asks to create, list, or manage git worktrees
- The user mentions "worktree", "worktrees", or wants isolated branch work
- You need to work on a branch without affecting the current working directory
- Running subagents that make concurrent changes to the same repository (each subagent should use its own worktree to avoid conflicts)
- Performing parallel tasks that modify files (e.g., multiple refactors, concurrent feature work)
- Testing or reviewing code from another branch while preserving current uncommitted changes

**Concurrent/parallel work pattern:** When spawning multiple subagents to work on the same repo simultaneously, create a worktree for each subagent. This prevents git conflicts and allows each agent to work independently. Merge results back when complete.

## Actions

- **create**: Create a new git worktree with a project-scoped branch
- **list**: List all project worktrees
- **merge**: Merge git worktree changes back to a target branch
- **remove**: Remove a worktree and optionally delete its branch
- **prune**: Remove stale worktree entries (where the directory no longer exists)

## Merge Strategies

When merging, use the \`mergeStrategy\` parameter:
- **ours**: On conflict, keep changes from the target branch
- **theirs**: On conflict, keep changes from the git worktree branch
- **manual**: Stop on conflict and return diff for user to decide (merge is aborted to keep repo clean)

## Example Workflow

1. Create: action "create", name "feature-work"
2. Work in the returned worktree directory
3. Merge: action "merge", name "feature-work", targetBranch "main", mergeStrategy "theirs"
4. Prune: action "prune" to clean up stale entries

Worktrees are stored in \`{repoRoot}/.opencode/worktrees/{name}\` with branches named \`opencode/{name}\`.`,

        args: {
          action: tool.schema
            .enum(["create", "list", "merge", "remove", "prune"])
            .describe("The git worktree action to perform"),
          name: tool.schema
            .string()
            .optional()
            .describe(
              "Worktree name for create/merge actions (auto-generated if not provided for create)",
            ),
          targetBranch: tool.schema
            .string()
            .optional()
            .describe("Target branch to merge into (for merge action)"),
          mergeStrategy: tool.schema
            .enum(["ours", "theirs", "manual"])
            .optional()
            .describe(
              "Conflict resolution strategy: 'ours' (keep target), 'theirs' (keep worktree), 'manual' (return diff, aborts merge)",
            ),
          startCommand: tool.schema
            .string()
            .optional()
            .describe(
              "Optional shell command to run after creating the worktree (e.g., 'npm install'). WARNING: Runs arbitrary shell commands.",
            ),
          commitMessage: tool.schema
            .string()
            .optional()
            .describe("Commit message for merge commit"),
        },

        async execute(args, toolCtx): Promise<string> {
          const { sessionID } = toolCtx;
          let result: WorktreeResult;

          try {
            switch (args.action) {
              case "create":
                result = await createWorktree(
                  client,
                  $,
                  repoRoot,
                  sessionID,
                  args.name,
                  args.startCommand,
                );
                break;

              case "list":
                result = await listWorktrees($, repoRoot);
                break;

              case "merge":
                result = await mergeWorktree(
                  client,
                  $,
                  findWorktreeByName,
                  repoRoot,
                  sessionID,
                  args.name,
                  args.targetBranch,
                  args.mergeStrategy,
                  args.commitMessage,
                );
                break;

              case "remove":
                result = await removeWorktree(
                  client,
                  $,
                  findWorktreeByName,
                  repoRoot,
                  sessionID,
                  args.name,
                );
                break;

              case "prune":
                result = await pruneWorktrees(client, $, repoRoot, sessionID);
                break;

              default: {
                // Exhaustiveness check
                const _exhaustive: never = args.action;
                result = {
                  success: false,
                  message: `Unknown action: ${_exhaustive}`,
                };
              }
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            result = {
              success: false,
              message: `Unexpected error: ${message}`,
            };
            await log(client, "error", "Tool execution error", {
              error: message,
              sessionID,
            });
          }

          return formatResult(result);
        },
      }),
    },
  };
};

/**
 * Creates a git worktree with retry logic for name collisions.
 */
async function createWorktree(
  client: any,
  $: any,
  repoRoot: string,
  sessionID: string,
  name?: string,
  startCommand?: string,
): Promise<WorktreeResult> {
  await log(client, "info", "Creating worktree", {
    sessionID,
    name,
    startCommand: startCommand ?? "none",
  });

  const baseName = name ? slug(name) : "";

  // Retry loop to handle race conditions
  for (let attempt = 0; attempt < MAX_NAME_RETRIES; attempt++) {
    const worktreeName =
      attempt === 0 && baseName
        ? baseName
        : baseName
          ? `${baseName}-${randomName()}`
          : randomName();
    const branch = `opencode/${worktreeName}`;
    const worktreeDir = `${repoRoot}/.opencode/worktrees/${worktreeName}`;

    // Attempt to create the worktree directly - let git handle the collision
    const result = await $`git worktree add -b ${branch} ${worktreeDir}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);

    if (result.exitCode === 0) {
      // Success - run start command if provided
      if (startCommand) {
        // WARNING: This runs arbitrary shell commands - intentional for user flexibility
        const cmdResult = await $`bash -lc ${startCommand}`
          .quiet()
          .nothrow()
          .cwd(worktreeDir);

        if (cmdResult.exitCode !== 0) {
          const stderr = getStderr(cmdResult);
          await log(client, "warn", "Start command failed", {
            sessionID,
            error: stderr,
          });
          // Continue despite startCommand failure - worktree is created
        }
      }

      await log(client, "info", "Worktree created", {
        sessionID,
        name: worktreeName,
        branch,
        directory: worktreeDir,
      });

      return {
        success: true,
        message: `Created worktree '${worktreeName}' with branch '${branch}'`,
        path: worktreeDir,
        branch,
      };
    }

    // Check if failure was due to name collision
    const stderr = getStderr(result);
    if (stderr.includes("already exists")) {
      // Name collision - retry with different name
      continue;
    }

    // Other error - don't retry
    await log(client, "error", "Failed to create worktree", {
      sessionID,
      error: stderr,
      attempt,
    });
    return {
      success: false,
      message: `Failed to create worktree: ${stderr}`,
    };
  }

  return {
    success: false,
    message: `Failed to create worktree after ${MAX_NAME_RETRIES} attempts due to name collisions`,
  };
}

/**
 * Removes a worktree and deletes its branch.
 */
async function removeWorktree(
  client: any,
  $: any,
  findWorktreeByName: (name: string) => Promise<string | undefined>,
  repoRoot: string,
  sessionID: string,
  name?: string,
): Promise<WorktreeResult> {
  if (!name) {
    return {
      success: false,
      message: "Worktree name is required for remove action",
    };
  }

  const directory = await findWorktreeByName(name);
  if (!directory) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    };
  }

  // Don't allow removing the main worktree
  if (directory === repoRoot) {
    return {
      success: false,
      message: "Cannot remove the main worktree",
    };
  }

  const branch = `opencode/${name}`;

  await log(client, "info", "Removing worktree", {
    sessionID,
    name,
    directory,
    branch,
  });

  // Remove the worktree (--force handles uncommitted changes)
  const result = await $`git worktree remove --force ${directory}`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  if (result.exitCode !== 0) {
    const stderr = getStderr(result);
    await log(client, "error", "Failed to remove worktree", {
      sessionID,
      error: stderr,
    });
    return {
      success: false,
      message: `Failed to remove worktree: ${stderr}`,
    };
  }

  // Delete the branch if it exists
  const branchResult = await $`git branch -D ${branch}`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  const branchDeleted = branchResult.exitCode === 0;

  await log(client, "info", "Worktree removed", {
    sessionID,
    name,
    branchDeleted,
  });

  return {
    success: true,
    message: branchDeleted
      ? `Removed worktree '${name}' and deleted branch '${branch}'`
      : `Removed worktree '${name}' (branch '${branch}' was not found or already deleted)`,
  };
}

/**
 * Prunes stale worktree entries (where the directory no longer exists).
 */
async function pruneWorktrees(
  client: any,
  $: any,
  repoRoot: string,
  sessionID: string,
): Promise<WorktreeResult> {
  await log(client, "info", "Pruning stale worktrees", { sessionID });

  // Run with verbose flag to capture what was pruned
  const result = await $`git worktree prune -v`.quiet().nothrow().cwd(repoRoot);

  if (result.exitCode !== 0) {
    const stderr = getStderr(result);
    await log(client, "error", "Failed to prune worktrees", {
      sessionID,
      error: stderr,
    });
    return {
      success: false,
      message: `Failed to prune worktrees: ${stderr}`,
    };
  }

  const stdout = getStdout(result);
  const prunedEntries = stdout
    .split("\n")
    .filter((line) => line.startsWith("Removing"))
    .map((line) => line.replace(/^Removing\s+/, "").replace(/:.*$/, ""));

  await log(client, "info", "Worktrees pruned", {
    sessionID,
    pruned: prunedEntries.length,
  });

  if (prunedEntries.length === 0) {
    return {
      success: true,
      message: "No stale worktree entries to prune",
    };
  }

  return {
    success: true,
    message: `Pruned ${prunedEntries.length} stale worktree entries:\n${prunedEntries.map((e) => `  - ${e}`).join("\n")}`,
  };
}

/**
 * Lists all git worktrees in the repository.
 */
async function listWorktrees($: any, repoRoot: string): Promise<WorktreeResult> {
  const result = await $`git worktree list --porcelain`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  if (result.exitCode !== 0) {
    return {
      success: false,
      message: `Failed to list worktrees: ${getStderr(result)}`,
    };
  }

  const stdout = getStdout(result);
  const worktreePaths: string[] = [];

  for (const line of stdout.split("\n")) {
    if (line.startsWith("worktree ")) {
      worktreePaths.push(line.slice(9));
    }
  }

  let message = `Repository worktrees: ${worktreePaths.length}\n`;

  if (worktreePaths.length > 0) {
    message += "\nWorktrees:\n";
    for (const dir of worktreePaths) {
      const dirName = dir.split("/").pop();
      message += `  - ${dirName}: ${dir}\n`;
    }
  }

  message += `\nRaw output:\n${stdout}`;

  return {
    success: true,
    message,
    worktrees: worktreePaths,
  };
}

/**
 * Merges a worktree branch into a target branch.
 * Aborts merge on conflicts when strategy is "manual" to keep repo clean.
 */
async function mergeWorktree(
  client: any,
  $: any,
  findWorktreeByName: (name: string) => Promise<string | undefined>,
  repoRoot: string,
  sessionID: string,
  name?: string,
  targetBranch?: string,
  mergeStrategy?: "ours" | "theirs" | "manual",
  commitMessage?: string,
): Promise<WorktreeResult> {
  if (!name) {
    return {
      success: false,
      message: "Worktree name is required for merge action",
    };
  }

  if (!targetBranch) {
    return {
      success: false,
      message:
        "Target branch is required for merge action. Specify which branch to merge into.",
    };
  }

  // Find the worktree
  const directory = await findWorktreeByName(name);
  if (!directory) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    };
  }

  const branch = `opencode/${name}`;

  try {
    validateBranchName(branch);
    validateBranchName(targetBranch);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const strategy = mergeStrategy || "manual";
  const message =
    commitMessage || `Merge branch '${branch}' into ${targetBranch}`;

  // Check if target branch exists
  const branchCheck =
    await $`git show-ref --verify --quiet refs/heads/${targetBranch}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);

  if (branchCheck.exitCode !== 0) {
    return {
      success: false,
      message: `Target branch '${targetBranch}' does not exist`,
    };
  }

  // Checkout target branch
  const checkoutResult = await $`git checkout ${targetBranch}`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  if (checkoutResult.exitCode !== 0) {
    return {
      success: false,
      message: `Failed to checkout target branch '${targetBranch}': ${getStderr(checkoutResult)}`,
    };
  }

  // Execute merge based on strategy
  let mergeResult: { exitCode: number; stdout: Uint8Array; stderr: Uint8Array };

  if (strategy === "ours") {
    mergeResult = await $`git merge -X ours -m ${message} ${branch}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);
  } else if (strategy === "theirs") {
    mergeResult = await $`git merge -X theirs -m ${message} ${branch}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);
  } else {
    // Manual - try merge without auto-commit
    mergeResult = await $`git merge --no-commit --no-ff ${branch}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);
  }

  const mergeStdout = getStdout(mergeResult);
  const mergeStderr = getStderr(mergeResult);

  // Check for conflicts
  if (mergeResult.exitCode !== 0) {
    if (mergeStderr.includes("CONFLICT") || mergeStdout.includes("CONFLICT")) {
      // Get diff and status for context
      const diffResult = await $`git diff`.quiet().nothrow().cwd(repoRoot);

      const statusResult = await $`git status --porcelain`
        .quiet()
        .nothrow()
        .cwd(repoRoot);

      // Extract conflicted files - include all conflict types
      const conflicts = getStdout(statusResult)
        .split("\n")
        .filter((line) => /^(UU|AA|AU|UA|DU|UD|DD)/.test(line))
        .map((line) => line.slice(3));

      // Abort merge to keep repo clean
      await $`git merge --abort`.quiet().nothrow().cwd(repoRoot);

      if (strategy === "manual") {
        return {
          success: false,
          message: `Merge has conflicts that require manual resolution. The merge was aborted to keep the repository clean.\n\nConflicted files:\n${conflicts.join("\n")}\n\nUse mergeStrategy 'ours' or 'theirs' to auto-resolve.`,
          conflicts,
          diff: getStdout(diffResult),
        };
      }

      return {
        success: false,
        message: `Merge failed with conflicts that couldn't be auto-resolved: ${mergeStderr}`,
        conflicts,
      };
    }

    return {
      success: false,
      message: `Merge failed: ${mergeStderr}`,
    };
  }

  // For manual strategy with no conflicts, commit the merge
  if (strategy === "manual") {
    const commitResult = await $`git commit -m ${message}`
      .quiet()
      .nothrow()
      .cwd(repoRoot);

    if (
      commitResult.exitCode !== 0 &&
      !getStderr(commitResult).includes("nothing to commit")
    ) {
      return {
        success: false,
        message: `Merge completed but commit failed: ${getStderr(commitResult)}`,
      };
    }
  }

  await log(client, "info", "Worktree merged", {
    sessionID,
    name,
    branch,
    targetBranch,
    strategy,
  });

  return {
    success: true,
    message: `Successfully merged '${branch}' into '${targetBranch}'`,
    branch,
  };
}

function formatResult(result: WorktreeResult): string {
  let output = result.success ? "SUCCESS" : "ERROR";
  output += `\n\n${result.message}`;

  if (result.path) {
    output += `\n\nWorktree path: ${result.path}`;
  }

  if (result.branch) {
    output += `\nBranch: ${result.branch}`;
  }

  if (result.conflicts && result.conflicts.length > 0) {
    output += `\n\nConflicted files:\n${result.conflicts.map((f) => `  - ${f}`).join("\n")}`;
  }

  if (result.diff) {
    output += `\n\nDiff:\n${result.diff}`;
  }

  return output;
}

export default GitWorktreePlugin;
