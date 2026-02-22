/**
 * Git Worktree Plugin for OpenCode
 *
 * Manages git worktrees for concurrent branch development by delegating
 * lifecycle operations (create/remove/reset) to OpenCode's native Worktree API
 * and providing merge, list, prune, and status operations locally.
 *
 * IMPORTANT: Agents should ALWAYS use this tool for any git worktree operations.
 * Direct `git worktree` commands are blocked and will error.
 *
 * ## Architecture
 *
 * - **create/remove/reset**: Delegated to OpenCode's upstream API
 *   (`POST/DELETE /experimental/worktree`, `POST /experimental/worktree/reset`)
 *   which handles branch management, bootstrap, sandbox registration, and
 *   bus event emission (worktree.ready / worktree.failed).
 * - **merge/list/prune/status**: Handled locally via git commands.
 * - **status**: Queries session status (`GET /session/status`) and worktree
 *   list to show which sessions are active and which worktrees exist.
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
 * ## Merge Strategies
 *
 * - "ours": Keep changes from the target branch on conflict
 * - "theirs": Keep changes from the worktree branch on conflict
 * - "manual": Stop on conflict and return diff for user decision (aborts merge to keep repo clean)
 */

import { type Plugin, tool } from "@opencode-ai/plugin";

const PLUGIN_NAME = "git-worktree";

interface WorktreeResult {
  success: boolean;
  message: string;
  path?: string;
  branch?: string;
  conflicts?: string[];
  diff?: string;
  worktrees?: string[];
  sessions?: Record<string, { type: string }>;
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

export const GitWorktreePlugin: Plugin = async (ctx) => {
  const { client, directory, worktree, serverUrl, $ } = ctx;
  const repoRoot = worktree || directory;

  /**
   * Calls the OpenCode server API.
   * Uses the plugin's serverUrl to hit the local OpenCode server directly.
   */
  async function serverFetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = new URL(path, serverUrl);
    url.searchParams.set("directory", directory);
    const headers: Record<string, string> = {};
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url.toString(), {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });
  }

  /**
   * Creates a worktree via the OpenCode upstream API.
   * POST /experimental/worktree
   */
  async function createWorktreeViaAPI(
    sessionID: string,
    name?: string,
    startCommand?: string,
  ): Promise<WorktreeResult> {
    await log(client, "info", "Creating worktree via upstream API", {
      sessionID,
      name,
      startCommand: startCommand ?? "none",
    });

    try {
      const body: Record<string, string> = {};
      if (name) body.name = name;
      if (startCommand) body.startCommand = startCommand;

      const response = await serverFetch("/experimental/worktree", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        await log(client, "error", "Upstream worktree create failed", {
          sessionID,
          status: response.status,
          error: errorBody,
        });
        return {
          success: false,
          message: `Failed to create worktree: ${errorBody}`,
        };
      }

      const info = (await response.json()) as {
        name: string;
        branch: string;
        directory: string;
      };

      await log(client, "info", "Worktree created via upstream API", {
        sessionID,
        name: info.name,
        branch: info.branch,
        directory: info.directory,
      });

      return {
        success: true,
        message: `Created worktree '${info.name}' with branch '${info.branch}'`,
        path: info.directory,
        branch: info.branch,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      await log(client, "error", "Worktree create error", {
        sessionID,
        error: message,
      });
      return {
        success: false,
        message: `Failed to create worktree: ${message}`,
      };
    }
  }

  /**
   * Removes a worktree via the OpenCode upstream API.
   * DELETE /experimental/worktree
   */
  async function removeWorktreeViaAPI(
    sessionID: string,
    name?: string,
  ): Promise<WorktreeResult> {
    if (!name) {
      return {
        success: false,
        message: "Worktree name is required for remove action",
      };
    }

    // Find the worktree directory by name from git
    const worktreeDir = await findWorktreeDirectory(name);
    if (!worktreeDir) {
      return {
        success: false,
        message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
      };
    }

    // Don't allow removing the main worktree
    if (worktreeDir === repoRoot) {
      return {
        success: false,
        message: "Cannot remove the main worktree",
      };
    }

    await log(client, "info", "Removing worktree via upstream API", {
      sessionID,
      name,
      directory: worktreeDir,
    });

    try {
      const response = await serverFetch("/experimental/worktree", {
        method: "DELETE",
        body: JSON.stringify({ directory: worktreeDir }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        await log(client, "error", "Upstream worktree remove failed", {
          sessionID,
          status: response.status,
          error: errorBody,
        });
        return {
          success: false,
          message: `Failed to remove worktree: ${errorBody}`,
        };
      }

      await log(client, "info", "Worktree removed via upstream API", {
        sessionID,
        name,
      });

      return {
        success: true,
        message: `Removed worktree '${name}' and cleaned up branch`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      await log(client, "error", "Worktree remove error", {
        sessionID,
        error: message,
      });
      return {
        success: false,
        message: `Failed to remove worktree: ${message}`,
      };
    }
  }

  /**
   * Resets a worktree to the default branch via the OpenCode upstream API.
   * POST /experimental/worktree/reset
   */
  async function resetWorktreeViaAPI(
    sessionID: string,
    name?: string,
  ): Promise<WorktreeResult> {
    if (!name) {
      return {
        success: false,
        message: "Worktree name is required for reset action",
      };
    }

    const worktreeDir = await findWorktreeDirectory(name);
    if (!worktreeDir) {
      return {
        success: false,
        message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
      };
    }

    await log(client, "info", "Resetting worktree via upstream API", {
      sessionID,
      name,
      directory: worktreeDir,
    });

    try {
      const response = await serverFetch("/experimental/worktree/reset", {
        method: "POST",
        body: JSON.stringify({ directory: worktreeDir }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        await log(client, "error", "Upstream worktree reset failed", {
          sessionID,
          status: response.status,
          error: errorBody,
        });
        return {
          success: false,
          message: `Failed to reset worktree: ${errorBody}`,
        };
      }

      await log(client, "info", "Worktree reset via upstream API", {
        sessionID,
        name,
      });

      return {
        success: true,
        message: `Reset worktree '${name}' to default branch`,
        path: worktreeDir,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      await log(client, "error", "Worktree reset error", {
        sessionID,
        error: message,
      });
      return {
        success: false,
        message: `Failed to reset worktree: ${message}`,
      };
    }
  }

  /**
   * Finds a worktree directory by name using git worktree list.
   */
  async function findWorktreeDirectory(
    name: string,
  ): Promise<string | undefined> {
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
  }

  /**
   * Finds the branch name for a worktree directory from git worktree list --porcelain.
   */
  async function findWorktreeBranch(
    worktreeDir: string,
  ): Promise<string | undefined> {
    const result = await $`git worktree list --porcelain`
      .quiet()
      .nothrow()
      .cwd(repoRoot);

    if (result.exitCode !== 0) return undefined;

    const stdout = getStdout(result);
    const lines = stdout.split("\n");
    let currentPath: string | undefined;

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        currentPath = line.slice(9);
      } else if (line.startsWith("branch ") && currentPath === worktreeDir) {
        return line.slice(7).replace(/^refs\/heads\//, "");
      } else if (line === "") {
        currentPath = undefined;
      }
    }
    return undefined;
  }

  /**
   * Queries session status from the OpenCode server.
   * GET /session/status
   */
  async function getSessionStatus(): Promise<
    Record<string, { type: string }> | undefined
  > {
    try {
      const response = await serverFetch("/session/status");
      if (!response.ok) return undefined;
      return (await response.json()) as Record<string, { type: string }>;
    } catch {
      return undefined;
    }
  }

  /**
   * Lists worktree sandboxes from the OpenCode server.
   * GET /experimental/worktree
   */
  async function getWorktreeSandboxes(): Promise<string[] | undefined> {
    try {
      const response = await serverFetch("/experimental/worktree");
      if (!response.ok) return undefined;
      return (await response.json()) as string[];
    } catch {
      return undefined;
    }
  }

  return {
    "tool.execute.before": async (input, output) => {
      // Intercept direct `git worktree` commands
      if (input.tool === "bash" && typeof output.args?.command === "string") {
        const cmd = output.args.command;
        if (/(?:^|[\s\/])git\s+worktree\b/.test(cmd)) {
          throw new Error(
            `Direct 'git worktree' commands are not allowed. ` +
              `Use the 'use-git-worktree' tool instead for managed worktree operations. ` +
              `Available actions: create, list, merge, remove, reset, prune, status.`,
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
- You want to check if other sessions are active before starting parallel work

**Concurrent/parallel work pattern:** When spawning multiple subagents to work on the same repo simultaneously, create a worktree for each subagent. This prevents git conflicts and allows each agent to work independently. Merge results back when complete.

## Actions

- **create**: Create a new git worktree via the OpenCode API (handles branch, bootstrap, and sandbox registration)
- **list**: List all project worktrees with branch and session info
- **merge**: Merge worktree changes back to a target branch (done inside the worktree to avoid disrupting the main working directory)
- **remove**: Remove a worktree via the OpenCode API (handles branch cleanup and sandbox deregistration)
- **reset**: Reset a worktree branch to the default branch (e.g., main/master) via the OpenCode API
- **prune**: Remove stale worktree entries (where the directory no longer exists)
- **status**: Show active sessions and registered worktrees to understand concurrent activity

## Merge Strategies

When merging, use the \`mergeStrategy\` parameter:
- **ours**: On conflict, keep changes from the target branch
- **theirs**: On conflict, keep changes from the worktree branch
- **manual**: Stop on conflict and return diff for user to decide (merge is aborted to keep repo clean)

## Example Workflow

1. Status: action "status" to check for active sessions
2. Create: action "create", name "feature-work"
3. Work in the returned worktree directory
4. Merge: action "merge", name "feature-work", targetBranch "main", mergeStrategy "theirs"
5. Remove: action "remove", name "feature-work"`,

        args: {
          action: tool.schema
            .enum(["create", "list", "merge", "remove", "reset", "prune", "status"])
            .describe("The git worktree action to perform"),
          name: tool.schema
            .string()
            .optional()
            .describe(
              "Worktree name for create/merge/remove/reset actions (auto-generated if not provided for create)",
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
              "Optional shell command to run after creating the worktree (e.g., 'npm install')",
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
                result = await createWorktreeViaAPI(
                  sessionID,
                  args.name,
                  args.startCommand,
                );
                break;

              case "list":
                result = await listWorktrees($, repoRoot, getSessionStatus);
                break;

              case "merge":
                result = await mergeWorktree(
                  client,
                  $,
                  findWorktreeDirectory,
                  findWorktreeBranch,
                  repoRoot,
                  sessionID,
                  args.name,
                  args.targetBranch,
                  args.mergeStrategy,
                  args.commitMessage,
                );
                break;

              case "remove":
                result = await removeWorktreeViaAPI(sessionID, args.name);
                break;

              case "reset":
                result = await resetWorktreeViaAPI(sessionID, args.name);
                break;

              case "prune":
                result = await pruneWorktrees(client, $, repoRoot, sessionID);
                break;

              case "status":
                result = await getStatus(
                  getSessionStatus,
                  getWorktreeSandboxes,
                  $,
                  repoRoot,
                );
                break;

              default: {
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
 * Gets combined status of sessions and worktrees.
 */
async function getStatus(
  getSessionStatus: () => Promise<Record<string, { type: string }> | undefined>,
  getWorktreeSandboxes: () => Promise<string[] | undefined>,
  $: any,
  repoRoot: string,
): Promise<WorktreeResult> {
  const [sessions, sandboxes, gitWorktrees] = await Promise.all([
    getSessionStatus(),
    getWorktreeSandboxes(),
    (async () => {
      const result = await $`git worktree list --porcelain`
        .quiet()
        .nothrow()
        .cwd(repoRoot);
      if (result.exitCode !== 0) return [];
      const stdout = getStdout(result);
      const entries: { path: string; branch?: string }[] = [];
      let current: { path: string; branch?: string } | undefined;
      for (const line of stdout.split("\n")) {
        if (line.startsWith("worktree ")) {
          current = { path: line.slice(9) };
          entries.push(current);
        } else if (line.startsWith("branch ") && current) {
          current.branch = line.slice(7).replace(/^refs\/heads\//, "");
        } else if (line === "") {
          current = undefined;
        }
      }
      return entries;
    })(),
  ]);

  let message = "## Session Status\n\n";

  if (sessions && Object.keys(sessions).length > 0) {
    const busySessions = Object.entries(sessions).filter(
      ([, s]) => s.type === "busy",
    );
    message += `Active sessions: ${Object.keys(sessions).length} (${busySessions.length} busy)\n`;
    for (const [id, status] of Object.entries(sessions)) {
      message += `  - ${id}: ${status.type}\n`;
    }
  } else {
    message += "No active sessions\n";
  }

  message += "\n## Git Worktrees\n\n";

  if (gitWorktrees.length > 0) {
    message += `Worktrees: ${gitWorktrees.length}\n`;
    for (const wt of gitWorktrees) {
      const dirName = wt.path.split("/").pop();
      message += `  - ${dirName}: ${wt.path}`;
      if (wt.branch) message += ` (branch: ${wt.branch})`;
      message += "\n";
    }
  } else {
    message += "No worktrees\n";
  }

  if (sandboxes && sandboxes.length > 0) {
    message += "\n## Registered Sandboxes\n\n";
    for (const sb of sandboxes) {
      message += `  - ${sb}\n`;
    }
  }

  return {
    success: true,
    message,
    sessions,
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
 * Lists all git worktrees in the repository, augmented with session status.
 */
async function listWorktrees(
  $: any,
  repoRoot: string,
  getSessionStatus: () => Promise<Record<string, { type: string }> | undefined>,
): Promise<WorktreeResult> {
  const [gitResult, sessions] = await Promise.all([
    $`git worktree list --porcelain`.quiet().nothrow().cwd(repoRoot),
    getSessionStatus(),
  ]);

  if (gitResult.exitCode !== 0) {
    return {
      success: false,
      message: `Failed to list worktrees: ${getStderr(gitResult)}`,
    };
  }

  const stdout = getStdout(gitResult);
  const entries: { path: string; branch?: string }[] = [];
  let current: { path: string; branch?: string } | undefined;

  for (const line of stdout.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice(9) };
      entries.push(current);
    } else if (line.startsWith("branch ") && current) {
      current.branch = line.slice(7).replace(/^refs\/heads\//, "");
    } else if (line === "") {
      current = undefined;
    }
  }

  let message = `Repository worktrees: ${entries.length}\n`;

  if (entries.length > 0) {
    message += "\nWorktrees:\n";
    for (const entry of entries) {
      const dirName = entry.path.split("/").pop();
      message += `  - ${dirName}: ${entry.path}`;
      if (entry.branch) message += ` (branch: ${entry.branch})`;
      message += "\n";
    }
  }

  if (sessions && Object.keys(sessions).length > 0) {
    const busySessions = Object.entries(sessions).filter(
      ([, s]) => s.type === "busy",
    );
    message += `\nActive sessions: ${Object.keys(sessions).length} (${busySessions.length} busy)`;
  }

  message += `\nRaw output:\n${stdout}`;

  return {
    success: true,
    message,
    worktrees: entries.map((e) => e.path),
  };
}

/**
 * Merges a worktree branch into a target branch.
 *
 * IMPORTANT: This performs the merge INSIDE the worktree directory to avoid
 * disrupting the main working directory. The worktree fetches the target branch
 * and merges locally, then the result is available on the worktree's branch.
 *
 * If the caller wants the merge result on the target branch in the main worktree,
 * they should fast-forward the target branch after this operation.
 */
async function mergeWorktree(
  client: any,
  $: any,
  findWorktreeDirectory: (name: string) => Promise<string | undefined>,
  findWorktreeBranch: (worktreeDir: string) => Promise<string | undefined>,
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
  const worktreeDir = await findWorktreeDirectory(name);
  if (!worktreeDir) {
    return {
      success: false,
      message: `No worktree found with name '${name}'. Use 'list' action to see available worktrees.`,
    };
  }

  const branch = await findWorktreeBranch(worktreeDir);
  if (!branch) {
    return {
      success: false,
      message: `Could not determine branch for worktree '${name}'.`,
    };
  }

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

  // Guard: if targetBranch is checked out in the main worktree, update-ref
  // would desync the working tree (index/working dir won't match HEAD).
  // Check this BEFORE doing the merge to avoid leaving the worktree in
  // a partially-merged state we can't propagate.
  const mainBranchResult = await $`git symbolic-ref --short HEAD`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  if (
    mainBranchResult.exitCode === 0 &&
    getStdout(mainBranchResult) === targetBranch
  ) {
    return {
      success: false,
      message: `Target branch '${targetBranch}' is currently checked out in the main worktree. ` +
        `Updating its ref would desync the working directory. ` +
        `Check out a different branch in the main worktree first, or use a different target branch.`,
      branch,
    };
  }

  await log(client, "info", "Merging worktree", {
    sessionID,
    name,
    branch,
    targetBranch,
    strategy,
  });

  // ---- Merge inside the worktree to avoid disrupting the main working directory ----
  //
  // Strategy: merge the target branch INTO the worktree branch (inside the worktree),
  // then update the target branch ref to point at the merge result.
  // This avoids checking out any branch in the main worktree.

  // First, ensure all changes in the worktree are committed
  const statusCheck = await $`git status --porcelain`
    .quiet()
    .nothrow()
    .cwd(worktreeDir);

  if (statusCheck.exitCode === 0 && getStdout(statusCheck)) {
    return {
      success: false,
      message: `Worktree '${name}' has uncommitted changes. Commit or stash them before merging.\n\nUncommitted files:\n${getStdout(statusCheck)}`,
    };
  }

  // Merge the target branch into the worktree branch (inside the worktree)
  let mergeResult: { exitCode: number; stdout: Uint8Array; stderr: Uint8Array };

  if (strategy === "ours") {
    // "ours" means keep the target branch's changes on conflict
    // Since we're merging target INTO worktree, "theirs" in git terms = target's changes
    mergeResult = await $`git merge -X theirs -m ${message} ${targetBranch}`
      .quiet()
      .nothrow()
      .cwd(worktreeDir);
  } else if (strategy === "theirs") {
    // "theirs" means keep the worktree branch's changes on conflict
    // Since we're merging target INTO worktree, "ours" in git terms = worktree's changes
    mergeResult = await $`git merge -X ours -m ${message} ${targetBranch}`
      .quiet()
      .nothrow()
      .cwd(worktreeDir);
  } else {
    // Manual - try merge without auto-commit
    mergeResult = await $`git merge --no-commit --no-ff ${targetBranch}`
      .quiet()
      .nothrow()
      .cwd(worktreeDir);
  }

  const mergeStdout = getStdout(mergeResult);
  const mergeStderr = getStderr(mergeResult);

  // Check for conflicts
  if (mergeResult.exitCode !== 0) {
    if (mergeStderr.includes("CONFLICT") || mergeStdout.includes("CONFLICT")) {
      // Get diff and status for context (inside the worktree)
      const diffResult = await $`git diff`.quiet().nothrow().cwd(worktreeDir);

      const statusResult = await $`git status --porcelain`
        .quiet()
        .nothrow()
        .cwd(worktreeDir);

      // Extract conflicted files
      const conflicts = getStdout(statusResult)
        .split("\n")
        .filter((line) => /^(UU|AA|AU|UA|DU|UD|DD)/.test(line))
        .map((line) => line.slice(3));

      // Abort merge to keep worktree clean
      await $`git merge --abort`.quiet().nothrow().cwd(worktreeDir);

      if (strategy === "manual") {
        return {
          success: false,
          message: `Merge has conflicts that require resolution. The merge was aborted to keep the worktree clean.\n\nConflicted files:\n${conflicts.join("\n")}\n\nUse mergeStrategy 'ours' or 'theirs' to auto-resolve, or resolve conflicts manually in the worktree.`,
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
      message: `Merge failed: ${mergeStderr || mergeStdout}`,
    };
  }

  // For manual strategy with no conflicts, commit the merge
  if (strategy === "manual") {
    const commitResult = await $`git commit -m ${message}`
      .quiet()
      .nothrow()
      .cwd(worktreeDir);

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

  // Update the target branch ref to point at the merge commit.
  // Safety: we already verified targetBranch is NOT checked out in the main worktree above.
  const mergeHead = await $`git rev-parse HEAD`
    .quiet()
    .nothrow()
    .cwd(worktreeDir);

  if (mergeHead.exitCode !== 0) {
    return {
      success: false,
      message: `Merge succeeded but failed to read HEAD: ${getStderr(mergeHead)}`,
    };
  }

  const mergeCommit = getStdout(mergeHead);

  const updateRef = await $`git update-ref refs/heads/${targetBranch} ${mergeCommit}`
    .quiet()
    .nothrow()
    .cwd(repoRoot);

  if (updateRef.exitCode !== 0) {
    return {
      success: false,
      message: `Merge succeeded in worktree but failed to update '${targetBranch}' ref: ${getStderr(updateRef)}. The merge commit is at ${mergeCommit} on branch '${branch}'.`,
      branch,
    };
  }

  await log(client, "info", "Worktree merged", {
    sessionID,
    name,
    branch,
    targetBranch,
    strategy,
    mergeCommit,
  });

  return {
    success: true,
    message: `Successfully merged '${targetBranch}' into worktree branch '${branch}' and updated '${targetBranch}' to ${mergeCommit.slice(0, 8)}`,
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
