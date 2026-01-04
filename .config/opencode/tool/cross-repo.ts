/**
 * Cross-Repo Tool for OpenCode
 *
 * Enables operations on GitHub repositories other than the current working repository.
 * Useful for coordinated changes across multiple repos, updating related repos,
 * or opening PRs in different repositories.
 *
 * ## Security Model
 *
 * Authentication is context-aware:
 * - **GitHub Actions**: OIDC token exchange (preferred) -> GITHUB_TOKEN fallback
 * - **Interactive/CI**: gh CLI -> GH_TOKEN/GITHUB_TOKEN fallback
 *
 * In GitHub Actions with OIDC, tokens are scoped to only the target repository
 * with minimal permissions (contents:write, pull_requests:write, issues:write).
 *
 * ## Agent Usage
 *
 * Use this tool when you need to:
 * - Clone and modify a different repository
 * - Create coordinated changes across multiple repos
 * - Open PRs in related repositories
 * - Apply changes from current repo context to another repo
 */

import { tool, type ToolContext } from "@opencode-ai/plugin"
import { Shescape } from "shescape"
import { tmpdir } from "os"

const PLUGIN_NAME = "cross-repo"
const EXEC_TIMEOUT_MS = 60_000

const shescape = new Shescape({ shell: "bash" })

function shellEscape(str: string): string {
  return shescape.quote(str)
}

interface RepoState {
  path: string
  token: string
  defaultBranch: string
}

// Session-scoped tracking of cloned repos
// Key format: "{sessionID}/{owner}/{repo}"
const clonedRepos = new Map<string, RepoState>()

// Cache gh CLI availability
let ghCliAvailable: boolean | null = null

function getClonePath(sessionID: string, owner: string, repo: string): string {
  return `${tmpdir()}/${sessionID}/${owner}-${repo}`
}

function getRepoKey(sessionID: string, owner: string, repo: string): string {
  return `${sessionID}/${owner}/${repo}`
}

/**
 * Validate owner/repo names to prevent injection
 */
function validateRepoName(name: string, field: string): string | null {
  // GitHub owner/repo names: alphanumeric, hyphens, underscores, dots
  // Cannot start with hyphen or dot
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
    return `Invalid ${field}: must be alphanumeric with hyphens/underscores/dots, cannot start with - or .`
  }
  if (name.length > 100) {
    return `Invalid ${field}: exceeds maximum length`
  }
  return null
}

/**
 * Validate branch name
 */
function validateBranchName(branch: string): string | null {
  // Reject shell metacharacters and git-unsafe patterns
  if (/[\s;&|`$(){}[\]<>\\'"!*?~^]/.test(branch) || branch.startsWith("-")) {
    return `Invalid branch name: contains unsafe characters`
  }
  if (branch.length > 250) {
    return `Invalid branch name: exceeds maximum length`
  }
  return null
}

type ExecutionContextType = "github-actions" | "interactive" | "non-interactive"

interface ExecutionContext {
  type: ExecutionContextType
  hasOIDC: boolean
  hasGhCli: boolean | null
  hasGitHubToken: boolean
}

function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === "true"
}

function hasOIDCPermissions(): boolean {
  return !!(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)
}

function isInteractive(): boolean {
  if (process.env.CI === "true") {
    return false
  }
  return !!(process.stdin?.isTTY && process.stdout?.isTTY)
}

/**
 * Safe shell execution with timeout and non-interactive mode
 * Uses Bun.spawn with array args to avoid shell interpolation vulnerabilities
 */
async function run(
  command: string[],
  timeoutMs: number = EXEC_TIMEOUT_MS,
  cwd?: string
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const proc = Bun.spawn(command, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_SSH_COMMAND: "ssh -oBatchMode=yes -oStrictHostKeyChecking=accept-new",
        GIT_PAGER: "cat",
        PAGER: "cat",
        DEBIAN_FRONTEND: "noninteractive",
        NO_COLOR: "1",
        TERM: "dumb",
      },
    })

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill()
        reject(new Error(`Command timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    const resultPromise = (async () => {
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ])
      const exitCode = await proc.exited
      return { success: exitCode === 0, stdout: stdout.trim(), stderr: stderr.trim() }
    })()

    return await Promise.race([resultPromise, timeoutPromise])
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Run a shell command string (for complex piping)
 * Only used internally for specific cases like base64 encoding
 */
async function runShell(
  command: string,
  timeoutMs: number = EXEC_TIMEOUT_MS
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const proc = Bun.spawn(["bash", "-c", command], {
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_SSH_COMMAND: "ssh -oBatchMode=yes -oStrictHostKeyChecking=accept-new",
        GIT_PAGER: "cat",
        PAGER: "cat",
        DEBIAN_FRONTEND: "noninteractive",
        NO_COLOR: "1",
        TERM: "dumb",
      },
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill()
        reject(new Error(`Command timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    const resultPromise = (async () => {
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ])
      const exitCode = await proc.exited
      return { success: exitCode === 0, stdout: stdout.trim(), stderr: stderr.trim() }
    })()

    return await Promise.race([resultPromise, timeoutPromise])
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    }
  }
}

async function checkGhCliAvailable(): Promise<boolean> {
  if (ghCliAvailable !== null) {
    return ghCliAvailable
  }
  const result = await run(["gh", "auth", "status"], 5_000)
  ghCliAvailable = result.success
  return ghCliAvailable
}

async function detectExecutionContext(): Promise<ExecutionContext> {
  const env = process.env

  if (isGitHubActions()) {
    return {
      type: "github-actions",
      hasOIDC: hasOIDCPermissions(),
      hasGhCli: false,
      hasGitHubToken: !!(env.GH_TOKEN || env.GITHUB_TOKEN),
    }
  }

  if (isInteractive()) {
    return {
      type: "interactive",
      hasOIDC: false,
      hasGhCli: await checkGhCliAvailable(),
      hasGitHubToken: !!(env.GH_TOKEN || env.GITHUB_TOKEN),
    }
  }

  return {
    type: "non-interactive",
    hasOIDC: false,
    hasGhCli: await checkGhCliAvailable(),
    hasGitHubToken: !!(env.GH_TOKEN || env.GITHUB_TOKEN),
  }
}

async function getGhCliToken(): Promise<string | null> {
  const result = await run(["gh", "auth", "token"], 5_000)
  return result.success ? result.stdout.trim() : null
}

async function getTokenViaOIDC(owner: string, repo: string): Promise<{ token: string } | { error: string }> {
  try {
    const tokenUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL
    const tokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN

    const oidcUrl = `${tokenUrl}&audience=opencode-github-action`
    const oidcResponse = await fetch(oidcUrl, {
      headers: { Authorization: `Bearer ${tokenRequestToken}` },
    })

    if (!oidcResponse.ok) {
      return { error: `Failed to get OIDC token: ${oidcResponse.statusText}` }
    }

    const { value: oidcToken } = (await oidcResponse.json()) as { value: string }

    const oidcBaseUrl = process.env.OIDC_BASE_URL
    if (!oidcBaseUrl) {
      return {
        error:
          "OIDC_BASE_URL environment variable not set. Ensure the workflow passes oidc_base_url to the OpenCode action.",
      }
    }

    const exchangeResponse = await fetch(`${oidcBaseUrl}/exchange_github_app_token_for_repo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ owner, repo }),
    })

    if (!exchangeResponse.ok) {
      const errorBody = await exchangeResponse.text()
      if (exchangeResponse.status === 401) {
        return {
          error: `Authentication failed for ${owner}/${repo}. Ensure the Bonk GitHub App is installed on the target repository.`,
        }
      }
      return { error: `Failed to get installation token: ${errorBody}` }
    }

    const { token } = (await exchangeResponse.json()) as { token: string }
    return { token }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: `OIDC token exchange failed: ${message}` }
  }
}

async function getTargetRepoToken(owner: string, repo: string): Promise<{ token: string } | { error: string }> {
  const context = await detectExecutionContext()

  if (context.type === "github-actions") {
    if (context.hasOIDC) {
      return await getTokenViaOIDC(owner, repo)
    }
    if (context.hasGitHubToken) {
      const envToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
      return { token: envToken! }
    }
    return {
      error:
        "In GitHub Actions but no authentication available. Add 'id-token: write' permission for OIDC, or set GITHUB_TOKEN.",
    }
  }

  if (context.hasGhCli) {
    const ghToken = await getGhCliToken()
    if (ghToken) {
      return { token: ghToken }
    }
  }

  if (context.hasGitHubToken) {
    const envToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
    return { token: envToken! }
  }

  const contextHints: Record<ExecutionContextType, string> = {
    "github-actions": "Add 'id-token: write' permission or set GITHUB_TOKEN.",
    interactive: "Run 'gh auth login' to authenticate, or set GH_TOKEN/GITHUB_TOKEN.",
    "non-interactive": "Set GH_TOKEN/GITHUB_TOKEN, or ensure 'gh auth login' was run.",
  }

  return {
    error: `No authentication available (context: ${context.type}). ${contextHints[context.type]}`,
  }
}

// Operation implementations

async function cloneRepo(
  client: any,
  sessionID: string,
  owner: string,
  repo: string,
  branch?: string
): Promise<{ success: boolean; path?: string; defaultBranch?: string; error?: string }> {
  const repoKey = getRepoKey(sessionID, owner, repo)

  if (clonedRepos.has(repoKey)) {
    const state = clonedRepos.get(repoKey)!
    await log(client, "info", "Repository already cloned", { sessionID, owner, repo, path: state.path })
    return {
      success: true,
      path: state.path,
      defaultBranch: state.defaultBranch,
    }
  }

  const tokenResult = await getTargetRepoToken(owner, repo)
  if ("error" in tokenResult) {
    await log(client, "error", "Failed to get token", { sessionID, owner, repo, error: tokenResult.error })
    return { success: false, error: tokenResult.error }
  }

  const clonePath = getClonePath(sessionID, owner, repo)
  await run(["mkdir", "-p", `${tmpdir()}/${sessionID}`])

  const cloneUrl = `https://x-access-token:${tokenResult.token}@github.com/${owner}/${repo}.git`

  await run(["rm", "-rf", clonePath])

  const cloneArgs = ["git", "clone", "--depth", "1"]
  if (branch) {
    cloneArgs.push("--branch", branch)
  }
  cloneArgs.push(cloneUrl, clonePath)

  const cloneResult = await run(cloneArgs)

  if (!cloneResult.success) {
    await log(client, "error", "Clone failed", { sessionID, owner, repo, error: cloneResult.stderr })
    return { success: false, error: `Clone failed: ${cloneResult.stderr}` }
  }

  const defaultBranchResult = await run(["git", "rev-parse", "--abbrev-ref", "HEAD"], 10_000, clonePath)
  const defaultBranch = defaultBranchResult.stdout.trim() || "main"

  await run(["git", "config", "user.email", "bonk[bot]@users.noreply.github.com"], 10_000, clonePath)
  await run(["git", "config", "user.name", "bonk[bot]"], 10_000, clonePath)

  clonedRepos.set(repoKey, {
    path: clonePath,
    token: tokenResult.token,
    defaultBranch,
  })

  await log(client, "info", "Repository cloned", { sessionID, owner, repo, path: clonePath, defaultBranch })

  return { success: true, path: clonePath, defaultBranch }
}

async function createBranch(
  client: any,
  sessionID: string,
  repoPath: string,
  branchName: string
): Promise<{ success: boolean; branch?: string; error?: string }> {
  const result = await run(["git", "checkout", "-b", branchName], 30_000, repoPath)

  if (!result.success) {
    const checkoutResult = await run(["git", "checkout", branchName], 30_000, repoPath)
    if (!checkoutResult.success) {
      await log(client, "error", "Failed to create/checkout branch", { sessionID, branch: branchName, error: result.stderr })
      return { success: false, error: `Failed to create/checkout branch: ${result.stderr}` }
    }
  }

  await log(client, "info", "Branch created/checked out", { sessionID, branch: branchName })
  return { success: true, branch: branchName }
}

async function commitChanges(
  client: any,
  sessionID: string,
  repoPath: string,
  message: string
): Promise<{ success: boolean; commit?: string; error?: string }> {
  const addResult = await run(["git", "add", "-A"], 30_000, repoPath)
  if (!addResult.success) {
    await log(client, "error", "Failed to stage changes", { sessionID, error: addResult.stderr })
    return { success: false, error: `Failed to stage changes: ${addResult.stderr}` }
  }

  const statusResult = await run(["git", "status", "--porcelain"], 10_000, repoPath)
  if (!statusResult.stdout.trim()) {
    return { success: false, error: "No changes to commit" }
  }

  const commitResult = await run(["git", "commit", "-m", message], 30_000, repoPath)
  if (!commitResult.success) {
    await log(client, "error", "Failed to commit", { sessionID, error: commitResult.stderr })
    return { success: false, error: `Failed to commit: ${commitResult.stderr}` }
  }

  const shaResult = await run(["git", "rev-parse", "HEAD"], 10_000, repoPath)
  const commit = shaResult.stdout.trim()

  await log(client, "info", "Changes committed", { sessionID, commit })
  return { success: true, commit }
}

async function pushBranch(
  client: any,
  sessionID: string,
  repoPath: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const branchResult = await run(["git", "rev-parse", "--abbrev-ref", "HEAD"], 10_000, repoPath)
  const branch = branchResult.stdout.trim()

  const remoteResult = await run(["git", "remote", "get-url", "origin"], 10_000, repoPath)
  let remoteUrl = remoteResult.stdout.trim()

  if (!remoteUrl.includes("x-access-token")) {
    remoteUrl = remoteUrl.replace("https://", `https://x-access-token:${token}@`)
    await run(["git", "remote", "set-url", "origin", remoteUrl], 10_000, repoPath)
  }

  const pushResult = await run(["git", "push", "-u", "origin", branch], 120_000, repoPath)

  if (!pushResult.success) {
    await log(client, "error", "Push failed", { sessionID, branch, error: pushResult.stderr })
    return { success: false, error: `Push failed: ${pushResult.stderr}` }
  }

  await log(client, "info", "Branch pushed", { sessionID, branch })
  return { success: true }
}

async function createPR(
  client: any,
  sessionID: string,
  repoPath: string,
  token: string,
  title: string,
  body?: string,
  base?: string
): Promise<{ success: boolean; prUrl?: string; prNumber?: number; error?: string }> {
  const branchResult = await run(["git", "rev-parse", "--abbrev-ref", "HEAD"], 10_000, repoPath)
  const headBranch = branchResult.stdout.trim()

  const prArgs = ["gh", "pr", "create", "--title", title, "--body", body || "", "--head", headBranch]
  if (base) {
    prArgs.push("--base", base)
  }

  const prResult = await run(prArgs, 60_000, repoPath)

  if (!prResult.success) {
    await log(client, "error", "PR creation failed", { sessionID, head: headBranch, base, error: prResult.stderr })
    return { success: false, error: `PR creation failed: ${prResult.stderr}` }
  }

  const prUrl = prResult.stdout.trim()
  const prNumberMatch = prUrl.match(/\/pull\/(\d+)/)
  const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : undefined

  await log(client, "info", "PR created", { sessionID, url: prUrl, prNumber })
  return { success: true, prUrl, prNumber }
}

async function readFile(
  client: any,
  sessionID: string,
  repoPath: string,
  filePath: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const fullPath = `${repoPath}/${filePath}`.replace(/\/+/g, "/")
  if (!fullPath.startsWith(repoPath)) {
    return { success: false, error: "Invalid path: path traversal detected" }
  }

  const result = await run(["cat", fullPath])
  if (!result.success) {
    await log(client, "error", "Failed to read file", { sessionID, path: filePath, error: result.stderr })
    return { success: false, error: `Failed to read file: ${result.stderr}` }
  }

  await log(client, "info", "File read", { sessionID, path: filePath })
  return { success: true, content: result.stdout }
}

async function writeFile(
  client: any,
  sessionID: string,
  repoPath: string,
  filePath: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const fullPath = `${repoPath}/${filePath}`.replace(/\/+/g, "/")
  if (!fullPath.startsWith(repoPath)) {
    return { success: false, error: "Invalid path: path traversal detected" }
  }

  const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"))
  await run(["mkdir", "-p", dirPath])

  // Use base64 encoding to safely pass arbitrary content
  const base64Content = Buffer.from(content).toString("base64")
  const result = await runShell(`echo ${shellEscape(base64Content)} | base64 -d > ${shellEscape(fullPath)}`)

  if (!result.success) {
    await log(client, "error", "Failed to write file", { sessionID, path: filePath, error: result.stderr })
    return { success: false, error: `Failed to write file: ${result.stderr}` }
  }

  await log(client, "info", "File written", { sessionID, path: filePath })
  return { success: true }
}

async function listFiles(
  client: any,
  sessionID: string,
  repoPath: string,
  subPath?: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  const targetPath = subPath ? `${repoPath}/${subPath}`.replace(/\/+/g, "/") : repoPath
  if (!targetPath.startsWith(repoPath)) {
    return { success: false, error: "Invalid path: path traversal detected" }
  }

  const result = await runShell(`find ${shellEscape(targetPath)} -type f ! -path '*/.git/*' | sed 's|^${repoPath}/||'`)

  if (!result.success) {
    await log(client, "error", "Failed to list files", { sessionID, path: subPath || "/", error: result.stderr })
    return { success: false, error: `Failed to list files: ${result.stderr}` }
  }

  const files = result.stdout.trim().split("\n").filter(Boolean)
  await log(client, "info", "Files listed", { sessionID, path: subPath || "/", count: files.length })
  return { success: true, files }
}

async function execCommand(
  client: any,
  sessionID: string,
  repoPath: string,
  command: string
): Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }> {
  const result = await runShell(`cd ${shellEscape(repoPath)} && ${command}`)

  await log(client, "info", "Command executed", { sessionID, command: command.substring(0, 50), success: result.success })
  return {
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.success ? undefined : result.stderr,
  }
}

// Global logging helper
async function log(client: any, level: "info" | "error" | "warn" | "debug", message: string, extra?: Record<string, unknown>) {
  await client.app.log({
    service: PLUGIN_NAME,
    level,
    message,
    extra,
  }).catch(() => {})
}

export default tool({
  description: `Operate on GitHub repositories other than the current working repository.

Use this tool when you need to:
- Clone and make changes to a different repository
- Create coordinated changes across multiple repos
- Open PRs in related repositories based on changes in the current repo
- Apply changes from the current repo to another repo

The tool handles authentication automatically based on execution context:

**GitHub Actions**: Uses OIDC token exchange (requires id-token: write permission), falls back to GITHUB_TOKEN env var.
**Interactive** (terminal): Uses gh CLI (supports OAuth flow), falls back to GH_TOKEN/GITHUB_TOKEN env var.
**Non-interactive** (CI, sandbox, scripts): Uses gh CLI if authenticated, falls back to GH_TOKEN/GITHUB_TOKEN env var.

## Supported Operations

- **clone**: Clone a repo to {tmpdir}/{sessionID}/{owner}-{repo}. Returns the local path.
- **read**: Read a file from the cloned repo (path relative to repo root).
- **write**: Write content to a file in the cloned repo (path relative to repo root).
- **list**: List files in the cloned repo (optionally under a subpath).
- **branch**: Create and checkout a new branch from the default branch.
- **commit**: Stage all changes and commit with a message.
- **push**: Push the current branch to remote.
- **pr**: Create a pull request using gh CLI. IMPORTANT: Always include a meaningful PR body via the 'message' parameter.
- **exec**: Run arbitrary shell commands in the cloned repo directory.

## Typical Workflow

1. clone the target repo
2. Use read/write/list operations to view and modify files
3. branch to create a feature branch
4. commit your changes
5. push the branch
6. pr to create a pull request with a descriptive body (use message parameter with markdown formatting)`,

  args: {
    owner: tool.schema.string().describe("Repository owner (org or user)"),
    repo: tool.schema.string().describe("Repository name"),
    operation: tool.schema
      .enum(["clone", "branch", "commit", "push", "pr", "exec", "read", "write", "list"])
      .describe("Operation to perform on the target repository"),
    branch: tool.schema
      .string()
      .optional()
      .describe("Branch name for 'branch' operation, or specific branch to clone for 'clone'"),
    message: tool.schema
      .string()
      .optional()
      .describe(
        "Commit message for 'commit' operation. For 'pr' operation, this is the PR body/description - include a meaningful summary of changes."
      ),
    title: tool.schema.string().optional().describe("PR title for 'pr' operation"),
    base: tool.schema.string().optional().describe("Base branch for PR (defaults to repo's default branch)"),
    command: tool.schema.string().optional().describe("Shell command to execute for 'exec' operation"),
    path: tool.schema.string().optional().describe("File path for 'read', 'write', or 'list' operations (relative to repo root)"),
    content: tool.schema.string().optional().describe("File content for 'write' operation"),
  },

  async execute(args, ctx: ToolContext) {
    const { sessionID, client } = ctx
    const repoKey = getRepoKey(sessionID, args.owner, args.repo)

    const stringify = (result: object) => JSON.stringify(result)

    try {
      // Validate owner/repo names
      const ownerError = validateRepoName(args.owner, "owner")
      if (ownerError) {
        return stringify({ success: false, error: ownerError })
      }

      const repoError = validateRepoName(args.repo, "repo")
      if (repoError) {
        return stringify({ success: false, error: repoError })
      }

      // Validate branch name if provided
      if (args.branch) {
        const branchError = validateBranchName(args.branch)
        if (branchError) {
          return stringify({ success: false, error: branchError })
        }
      }

      switch (args.operation) {
        case "clone":
          return stringify(await cloneRepo(client, sessionID, args.owner, args.repo, args.branch))

        case "branch": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.branch) {
            return stringify({ success: false, error: "Branch name required for 'branch' operation" })
          }
          return stringify(await createBranch(client, sessionID, state.path, args.branch))
        }

        case "commit": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.message) {
            return stringify({ success: false, error: "Commit message required for 'commit' operation" })
          }
          return stringify(await commitChanges(client, sessionID, state.path, args.message))
        }

        case "push": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          return stringify(await pushBranch(client, sessionID, state.path, state.token))
        }

        case "pr": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.title) {
            return stringify({ success: false, error: "PR title required for 'pr' operation" })
          }
          return stringify(await createPR(client, sessionID, state.path, state.token, args.title, args.message, args.base || state.defaultBranch))
        }

        case "exec": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.command) {
            return stringify({ success: false, error: "Command required for 'exec' operation" })
          }
          return stringify(await execCommand(client, sessionID, state.path, args.command))
        }

        case "read": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.path) {
            return stringify({ success: false, error: "Path required for 'read' operation" })
          }
          return stringify(await readFile(client, sessionID, state.path, args.path))
        }

        case "write": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          if (!args.path) {
            return stringify({ success: false, error: "Path required for 'write' operation" })
          }
          if (args.content === undefined) {
            return stringify({ success: false, error: "Content required for 'write' operation" })
          }
          return stringify(await writeFile(client, sessionID, state.path, args.path, args.content))
        }

        case "list": {
          const state = clonedRepos.get(repoKey)
          if (!state) {
            return stringify({
              success: false,
              error: `Repository ${args.owner}/${args.repo} not cloned. Run clone operation first.`,
            })
          }
          return stringify(await listFiles(client, sessionID, state.path, args.path))
        }

        default:
          return stringify({ success: false, error: `Unknown operation: ${args.operation}` })
      }
    } catch (error) {
      // Catch-all for any unhandled errors - never crash OpenCode
      const message = error instanceof Error ? error.message : String(error)
      await log(client, "error", "Unexpected error", { sessionID, operation: args.operation, error: message })
      return stringify({ success: false, error: `Unexpected error: ${message}` })
    }
  },
})
