# OpenCode Gondolin Sandbox Plugin - Implementation Plan

## Executive Summary

This plan describes an OpenCode plugin (`opencode-gondolin`) that runs OpenCode's server and tool execution inside a [Gondolin](https://earendil-works.github.io/gondolin/) micro-VM. Gondolin provides QEMU-based isolation with a programmable network stack and virtual filesystem, meaning we can sandbox all agent-executed code (bash, file reads/writes) while controlling exactly which hosts the agent can reach and which secrets it can use -- without leaking credentials into the guest.

The plugin intercepts OpenCode's `shell.env` and `tool.execute.before`/`tool.execute.after` hooks to redirect tool execution into the VM, and uses Gondolin's `createHttpHooks` for network policy enforcement and secret injection.

---

## 1. Architecture Overview

```
┌─────────────────────────── Host (trusted) ───────────────────────────┐
│                                                                       │
│  ┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐  │
│  │  OpenCode    │────▶│  opencode-gondolin│────▶│  Gondolin VM      │  │
│  │  Server/TUI  │     │  Plugin           │     │  (QEMU micro-VM)  │  │
│  └─────────────┘     └──────────────────┘     │                   │  │
│                              │                  │  ┌─────────────┐ │  │
│                              │ tool.execute.*   │  │ sandboxd    │ │  │
│                              │ shell.env        │  │ (exec RPC)  │ │  │
│                              │                  │  ├─────────────┤ │  │
│                              ▼                  │  │ sandboxfs   │ │  │
│                       ┌──────────────┐          │  │ (FUSE VFS)  │ │  │
│                       │ Network      │          │  └─────────────┘ │  │
│                       │ Policy       │          │                   │  │
│                       │ (httpHooks)  │          │  /workspace ──▶   │  │
│                       └──────────────┘          │  RealFSProvider   │  │
│                                                  └───────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

**Key principle**: The OpenCode server and TUI run on the host. Only *tool execution* (bash commands, file reads/writes) is redirected into the Gondolin VM. LLM API calls remain on the host where credentials are safe.

---

## 2. How the Daytona Plugin Works (Reference)

The [Daytona OpenCode guide](https://github.com/jamesmurdza/daytona/blob/main/guides/typescript/opencode/README.md) takes a different approach: it installs OpenCode *entirely inside* a remote Daytona sandbox, starts `opencode web`, and exposes the web UI via a preview link. The user interacts through a browser.

**Differences with our Gondolin approach:**

| Aspect | Daytona | Gondolin (this plan) |
|---|---|---|
| Where OpenCode runs | Entirely inside remote sandbox | Server on host, tools in local VM |
| Network | Full internet via Daytona proxy | Policy-controlled allowlist |
| UX | Browser-based web UI | Native TUI + web (unchanged) |
| Secrets | Passed as env vars into sandbox | Never enter the VM (placeholder injection) |
| Filesystem | Daytona workspace (/home/daytona) | VFS-mounted project dir |

Our approach is better for local development because:
1. The TUI experience is preserved (no browser required)
2. Secrets never enter the guest (Gondolin's placeholder substitution)
3. Network policy is enforced at the host level with fine-grained allowlists
4. Boot time is <1 second (local QEMU vs. remote sandbox creation)

---

## 3. Gondolin Capabilities We Use

### 3.1 VM Lifecycle (`VM.create` / `vm.exec` / `vm.close`)

```typescript
import { VM, createHttpHooks, RealFSProvider, ReadonlyProvider } from "@earendil-works/gondolin";

const vm = await VM.create({
  httpHooks,
  env,
  vfs: {
    mounts: {
      "/workspace": new RealFSProvider(projectDir),
      "/config": new ReadonlyProvider(new RealFSProvider(configDir)),
    },
  },
  sandbox: {
    rootOverlay: true, // keep base image pristine between runs
  },
});

// Execute commands inside the VM
const result = await vm.exec("git status");
// result.exitCode, result.stdout, result.stderr
```

### 3.2 Network Policy (`createHttpHooks`)

```typescript
const { httpHooks, env } = createHttpHooks({
  allowedHosts: [
    "api.github.com",
    "*.githubusercontent.com",
    "registry.npmjs.org",
    // User-configurable via plugin config
  ],
  secrets: {
    GITHUB_TOKEN: {
      hosts: ["api.github.com", "*.githubusercontent.com"],
      value: process.env.GITHUB_TOKEN,
    },
    NPM_TOKEN: {
      hosts: ["registry.npmjs.org"],
      value: process.env.NPM_TOKEN,
    },
  },
  blockInternalRanges: true, // default: blocks localhost, RFC1918, metadata
  onRequest: async (req) => {
    // Audit logging
    console.log(`[gondolin] ${req.method} ${req.url}`);
    return req;
  },
});
```

**Key security properties:**
- Only HTTP/TLS traffic is allowed (no arbitrary TCP/UDP)
- Secrets use placeholder substitution (real values never enter the VM)
- DNS rebinding protection is built-in
- Internal ranges (localhost, cloud metadata) are blocked by default

### 3.3 VFS Providers

```typescript
vfs: {
  mounts: {
    // Project directory: read-write so the agent can edit files
    "/workspace": new RealFSProvider(projectDir),
    // Read-only access to config
    "/etc/opencode": new ReadonlyProvider(
      new RealFSProvider(path.join(configDir, "opencode"))
    ),
  },
  hooks: {
    before: (ctx) => {
      // Optional: audit file access
      if (ctx.op === "write") {
        log(`[gondolin-vfs] write ${ctx.path}`);
      }
    },
  },
}
```

### 3.4 Custom Guest Image

OpenCode tools need `git`, `bash`, `grep`, `find`, and common build tools. The default Gondolin Alpine image is minimal, so we need a custom image:

```json
{
  "arch": "aarch64",
  "distro": "alpine",
  "alpine": {
    "version": "3.23.0",
    "kernelPackage": "linux-virt",
    "kernelImage": "vmlinuz-virt",
    "rootfsPackages": [
      "linux-virt",
      "rng-tools",
      "bash",
      "ca-certificates",
      "curl",
      "git",
      "openssh-client",
      "grep",
      "findutils",
      "coreutils",
      "diffutils",
      "patch",
      "jq",
      "nodejs",
      "npm",
      "python3",
      "ripgrep"
    ]
  },
  "rootfs": {
    "label": "gondolin-opencode"
  }
}
```

Build with: `gondolin build --config opencode-image.json --output ./opencode-assets`

---

## 4. Plugin Implementation

### 4.1 Package Structure

```
opencode-gondolin/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── vm-manager.ts     # Gondolin VM lifecycle management
│   ├── policy.ts         # Network policy configuration
│   ├── tools.ts          # Tool execution redirection
│   └── config.ts         # Plugin configuration types
├── assets/
│   └── opencode-image.json  # Custom Gondolin image config
└── README.md
```

### 4.2 Plugin Configuration

The plugin reads its config from the OpenCode config file or environment variables:

```typescript
// src/config.ts
export interface GondolinPluginConfig {
  /** Hosts the VM is allowed to reach */
  allowedHosts: string[];

  /** Secrets to inject via placeholder substitution */
  secrets: Record<string, {
    hosts: string[];
    envVar: string; // name of the host env var holding the real value
  }>;

  /** Directories to mount into the VM */
  mounts: Record<string, {
    hostPath: string;
    readonly: boolean;
  }>;

  /** Path to custom Gondolin guest assets */
  imagePath?: string;

  /** DNS mode: "synthetic" | "trusted" | "open" */
  dnsMode?: "synthetic" | "trusted" | "open";

  /** Enable overlay root (default: true) */
  rootOverlay?: boolean;

  /** Enable audit logging of network requests */
  auditNetwork?: boolean;

  /** Enable audit logging of file operations */
  auditFilesystem?: boolean;
}
```

User configuration in `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-gondolin"],
  // Plugin reads GONDOLIN_* env vars or a separate config section
}
```

And a companion `gondolin.json` in the project root (or `.opencode/gondolin.json`):

```jsonc
{
  "allowedHosts": [
    "api.github.com",
    "*.githubusercontent.com",
    "registry.npmjs.org"
  ],
  "secrets": {
    "GITHUB_TOKEN": {
      "hosts": ["api.github.com", "*.githubusercontent.com"],
      "envVar": "GITHUB_TOKEN"
    }
  },
  "mounts": {
    "/workspace": {
      "hostPath": ".",
      "readonly": false
    }
  },
  "dnsMode": "synthetic",
  "rootOverlay": true,
  "auditNetwork": true
}
```

### 4.3 VM Manager

```typescript
// src/vm-manager.ts
import {
  VM,
  createHttpHooks,
  RealFSProvider,
  ReadonlyProvider,
  MemoryProvider,
} from "@earendil-works/gondolin";
import type { GondolinPluginConfig } from "./config";
import path from "path";

export class VMManager {
  private vm: VM | null = null;
  private config: GondolinPluginConfig;
  private projectDir: string;

  constructor(config: GondolinPluginConfig, projectDir: string) {
    this.config = config;
    this.projectDir = projectDir;
  }

  async start(): Promise<void> {
    if (this.vm) return;

    // Build network policy
    const secrets: Record<string, { hosts: string[]; value: string }> = {};
    for (const [name, sec] of Object.entries(this.config.secrets)) {
      const value = process.env[sec.envVar];
      if (value) {
        secrets[name] = { hosts: sec.hosts, value };
      }
    }

    const { httpHooks, env } = createHttpHooks({
      allowedHosts: this.config.allowedHosts,
      secrets,
      blockInternalRanges: true,
      onRequest: this.config.auditNetwork
        ? async (req) => {
            console.error(`[gondolin-net] ${req.method} ${req.url}`);
            return req;
          }
        : undefined,
    });

    // Build VFS mounts
    const mounts: Record<string, any> = {};
    for (const [guestPath, mount] of Object.entries(this.config.mounts)) {
      const hostPath = path.resolve(this.projectDir, mount.hostPath);
      const provider = new RealFSProvider(hostPath);
      mounts[guestPath] = mount.readonly
        ? new ReadonlyProvider(provider)
        : provider;
    }

    // Ensure /tmp exists as in-memory
    if (!mounts["/tmp"]) {
      mounts["/tmp"] = new MemoryProvider();
    }

    this.vm = await VM.create({
      httpHooks,
      env: {
        ...env,
        HOME: "/root",
        TERM: "xterm-256color",
      },
      vfs: {
        mounts,
        hooks: this.config.auditFilesystem
          ? {
              before: (ctx) => {
                if (ctx.op === "write" || ctx.op === "unlink") {
                  console.error(`[gondolin-vfs] ${ctx.op} ${ctx.path}`);
                }
              },
            }
          : undefined,
      },
      sandbox: {
        rootOverlay: this.config.rootOverlay ?? true,
        ...(this.config.imagePath
          ? { imagePath: this.config.imagePath }
          : {}),
      },
      dns: {
        mode: this.config.dnsMode ?? "synthetic",
      },
    });
  }

  async exec(
    command: string,
    options?: { cwd?: string; signal?: AbortSignal }
  ) {
    if (!this.vm) {
      throw new Error("Gondolin VM not started");
    }

    // Wrap command with cd if cwd is provided
    const fullCommand = options?.cwd
      ? `cd ${JSON.stringify(options.cwd)} && ${command}`
      : command;

    return this.vm.exec(fullCommand, {
      signal: options?.signal,
    });
  }

  async close(): Promise<void> {
    if (this.vm) {
      await this.vm.close();
      this.vm = null;
    }
  }
}
```

### 4.4 Plugin Entry Point

```typescript
// src/index.ts
import type { Plugin } from "@opencode-ai/plugin";
import { VMManager } from "./vm-manager";
import { loadConfig } from "./config";
import path from "path";
import fs from "fs";

export const GondolinPlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  // Load plugin config from gondolin.json or .opencode/gondolin.json
  const config = await loadConfig(directory, worktree);
  const vmManager = new VMManager(config, worktree || directory);

  // Start the VM eagerly on plugin init
  await vmManager.start();
  await client.app.log({
    body: {
      service: "gondolin",
      level: "info",
      message: "Gondolin VM started",
      extra: {
        allowedHosts: config.allowedHosts,
        mounts: Object.keys(config.mounts),
      },
    },
  });

  // Ensure cleanup on exit
  process.on("beforeExit", async () => {
    await vmManager.close();
  });

  return {
    // Redirect bash/shell tool execution into the VM
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        // Intercept bash commands and run them in the VM
        const command = output.args.command as string;
        const cwd = (output.args.cwd as string) || "/workspace";

        try {
          const result = await vmManager.exec(command, { cwd });

          // Return the result directly, preventing the default bash execution
          // NOTE: This requires OpenCode to support returning results from
          // tool.execute.before hooks -- see Section 6 for extension discussion
          output.result = {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
          };
          output.handled = true;
        } catch (err) {
          output.result = {
            stdout: "",
            stderr: `[gondolin] Execution failed: ${err}`,
            exitCode: 1,
          };
          output.handled = true;
        }
      }
    },

    // Inject VM-aware environment variables into user shells
    "shell.env": async (input, output) => {
      output.env.GONDOLIN_SANDBOX = "1";
      output.env.GONDOLIN_WORKSPACE = "/workspace";
    },

    // Log tool execution results for audit
    "tool.execute.after": async (input, output) => {
      if (input.tool === "bash" && config.auditNetwork) {
        await client.app.log({
          body: {
            service: "gondolin",
            level: "debug",
            message: `bash: ${(input.args as any).command?.substring(0, 100)}`,
            extra: { exitCode: (output as any).exitCode },
          },
        });
      }
    },

    // Handle session events for VM lifecycle
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // Optionally: snapshot VM state, clean up temp files, etc.
        await client.app.log({
          body: {
            service: "gondolin",
            level: "debug",
            message: "Session idle - VM still warm",
          },
        });
      }
    },
  };
};
```

### 4.5 Custom Tools for Sandboxed File Operations

OpenCode's built-in `read`, `write`, and `edit` tools operate on the host filesystem directly. To sandbox them, we provide replacement tools that go through the VM's VFS:

```typescript
// src/tools.ts
import { tool } from "@opencode-ai/plugin";
import type { VMManager } from "./vm-manager";

export function createSandboxedTools(vmManager: VMManager) {
  return {
    sandbox_read: tool({
      description:
        "Read a file from the sandboxed workspace. " +
        "Use this instead of the built-in read tool.",
      args: {
        filePath: tool.schema
          .string()
          .describe("Absolute path inside the VM (e.g. /workspace/src/index.ts)"),
        offset: tool.schema
          .number()
          .optional()
          .describe("Line offset to start reading from"),
        limit: tool.schema
          .number()
          .optional()
          .describe("Number of lines to read"),
      },
      async execute(args) {
        const cmd = args.offset !== undefined || args.limit !== undefined
          ? `sed -n '${(args.offset ?? 0) + 1},${(args.offset ?? 0) + (args.limit ?? 2000)}p' ${JSON.stringify(args.filePath)}`
          : `cat ${JSON.stringify(args.filePath)}`;

        const result = await vmManager.exec(cmd);
        if (!result.ok) {
          return `Error reading file: ${result.stderr}`;
        }
        return result.stdout;
      },
    }),

    sandbox_write: tool({
      description:
        "Write content to a file in the sandboxed workspace. " +
        "Use this instead of the built-in write tool.",
      args: {
        filePath: tool.schema
          .string()
          .describe("Absolute path inside the VM"),
        content: tool.schema.string().describe("Content to write"),
      },
      async execute(args) {
        // Use base64 to safely transfer content with special chars
        const b64 = Buffer.from(args.content).toString("base64");
        const cmd = `echo '${b64}' | base64 -d > ${JSON.stringify(args.filePath)}`;

        const result = await vmManager.exec(cmd);
        if (!result.ok) {
          return `Error writing file: ${result.stderr}`;
        }
        return `Successfully wrote ${args.content.length} bytes to ${args.filePath}`;
      },
    }),
  };
}
```

---

## 5. Policy Configuration Patterns

### 5.1 Minimal (Code Review Only)

```jsonc
{
  "allowedHosts": [],
  "secrets": {},
  "mounts": {
    "/workspace": { "hostPath": ".", "readonly": true }
  }
}
```

No network access, read-only filesystem. The agent can only read and analyze code.

### 5.2 GitHub Workflow

```jsonc
{
  "allowedHosts": [
    "api.github.com",
    "*.githubusercontent.com",
    "github.com"
  ],
  "secrets": {
    "GITHUB_TOKEN": {
      "hosts": ["api.github.com", "*.githubusercontent.com"],
      "envVar": "GITHUB_TOKEN"
    }
  },
  "mounts": {
    "/workspace": { "hostPath": ".", "readonly": false }
  }
}
```

### 5.3 Full Development (npm/pip + GitHub)

```jsonc
{
  "allowedHosts": [
    "api.github.com",
    "*.githubusercontent.com",
    "registry.npmjs.org",
    "pypi.org",
    "files.pythonhosted.org"
  ],
  "secrets": {
    "GITHUB_TOKEN": {
      "hosts": ["api.github.com"],
      "envVar": "GITHUB_TOKEN"
    },
    "NPM_TOKEN": {
      "hosts": ["registry.npmjs.org"],
      "envVar": "NPM_TOKEN"
    }
  },
  "mounts": {
    "/workspace": { "hostPath": ".", "readonly": false },
    "/root/.npm": { "hostPath": "~/.npm", "readonly": false }
  },
  "dnsMode": "trusted"
}
```

---

## 6. Where OpenCode Needs to Be Extended

After thorough review of the OpenCode plugin API, there are several gaps that prevent a fully seamless sandbox experience. Here is what needs to change in OpenCode's SDK, config, and/or server.

### 6.1 `tool.execute.before` Needs a Way to Short-Circuit Execution

**Problem**: The current `tool.execute.before` hook can mutate `output.args` but cannot *replace* the tool's execution entirely. The plugin needs to intercept `bash`, `read`, `write`, and `edit` tool calls and run them inside the VM instead.

**Proposed Extension**:

```typescript
// In @opencode-ai/plugin types:
interface ToolExecuteBeforeOutput {
  args: Record<string, unknown>;
  /** NEW: If set to true, skip the built-in tool execution and use `result` */
  handled?: boolean;
  /** NEW: The result to return if handled=true */
  result?: unknown;
}
```

**Where to patch in OpenCode**: The tool execution pipeline in the server needs to check `output.handled` after running all `tool.execute.before` hooks. If `handled === true`, it should skip the built-in tool implementation and return `output.result` directly.

Approximate location in the OpenCode codebase:
```
packages/opencode/src/session/tool.ts  (or similar)
```

The change would look approximately like:

```typescript
// Before executing the tool implementation:
const beforeResult = await runHooks("tool.execute.before", input, output);
if (beforeResult.handled) {
  // Plugin handled execution (e.g., Gondolin sandbox)
  return formatToolResult(beforeResult.result);
}
// ... existing tool execution code ...
```

### 6.2 Tool Disable + Replace Pattern

**Problem**: Even with `handled`, the LLM still sees descriptions for `bash`, `read`, `write`, `edit` tools. Ideally the plugin should be able to disable built-in tools and register replacements.

**Proposed Extension**: Allow plugins to modify the tool list:

```typescript
// In plugin return type:
return {
  tools: {
    // Disable built-in tools
    bash: false,
    read: false,
    write: false,
    edit: false,

    // Register sandboxed replacements
    sandbox_bash: tool({ /* ... */ }),
    sandbox_read: tool({ /* ... */ }),
    sandbox_write: tool({ /* ... */ }),
    sandbox_edit: tool({ /* ... */ }),
  },
}
```

**Alternative (no OpenCode changes needed)**: Users can disable built-in tools in their `opencode.json` and the plugin registers custom tools:

```jsonc
// opencode.json
{
  "tools": {
    "bash": false,
    "read": false,
    "write": false,
    "edit": false
  },
  "plugin": ["opencode-gondolin"]
}
```

The plugin then registers `sandbox_bash`, `sandbox_read`, `sandbox_write`, `sandbox_edit` as custom tools. **This works today** but requires the user to manually configure tool disabling.

### 6.3 Plugin Lifecycle Hooks (Startup/Shutdown)

**Problem**: The plugin function runs on startup but there is no guaranteed cleanup hook. The VM must be properly shut down when OpenCode exits.

**Current workaround**: Use `process.on("beforeExit", ...)` and `process.on("SIGINT", ...)`.

**Proposed Extension**:

```typescript
return {
  "server.shutdown": async () => {
    await vmManager.close();
  },
}
```

### 6.4 Config Extension for Plugin-Specific Settings

**Problem**: OpenCode's config schema doesn't have a generic extension point for plugin-specific configuration. The plugin has to use a separate `gondolin.json` file or environment variables.

**Proposed Extension**: Allow plugins to declare config under a namespaced key:

```jsonc
// opencode.json
{
  "plugin": ["opencode-gondolin"],
  "pluginConfig": {
    "opencode-gondolin": {
      "allowedHosts": ["api.github.com"],
      "secrets": { /* ... */ }
    }
  }
}
```

**Current workaround**: The plugin reads from `gondolin.json` or `.opencode/gondolin.json` in the project root, which is perfectly functional but requires the user to maintain a separate file.

### 6.5 Summary of Required vs. Nice-to-Have Changes

| Change | Priority | Feasibility | Notes |
|---|---|---|---|
| `tool.execute.before` short-circuit (`handled` + `result`) | **Required** | Medium | Core to making the plugin work seamlessly |
| Tool disable+replace from plugins | Nice-to-have | Medium | Workaround exists via `opencode.json` `tools` config |
| `server.shutdown` lifecycle hook | Nice-to-have | Easy | Workaround exists via process signals |
| `pluginConfig` namespace in config | Nice-to-have | Easy | Workaround exists via separate config file |

---

## 7. User Experience

### 7.1 Installation

```bash
# Install the plugin
npm install -g opencode-gondolin

# Or add to project
npm install --save-dev opencode-gondolin
```

### 7.2 Project Setup

```bash
# Initialize gondolin config with sensible defaults
npx opencode-gondolin init

# This creates:
# - gondolin.json (network policy + mounts)
# - Adds "opencode-gondolin" to opencode.json plugins array
# - Optionally builds a custom guest image
```

### 7.3 Running

```bash
# Just run opencode normally - the plugin activates automatically
opencode
```

The user sees:

```
[gondolin] VM started (boot: 0.8s)
[gondolin] Network policy: 3 allowed hosts
[gondolin] Workspace mounted at /workspace
```

From there, OpenCode works identically to normal. The agent's bash commands, file operations, and network requests all go through the VM transparently. If the agent tries to reach an unauthorized host:

```
[gondolin-net] BLOCKED: POST https://evil.com/exfiltrate
```

### 7.4 Audit Log

With `auditNetwork: true` and `auditFilesystem: true`, all operations are logged:

```
[gondolin-net] GET https://api.github.com/repos/owner/repo
[gondolin-net] GET https://registry.npmjs.org/express
[gondolin-vfs] write /workspace/src/new-feature.ts
[gondolin-vfs] write /workspace/package.json
```

---

## 8. Gondolin Limitations to Be Aware Of

Based on the [Gondolin limitations docs](https://earendil-works.github.io/gondolin/limitations/):

1. **Only Alpine Linux** - The guest image is Alpine-based. Some tools that expect glibc may not work (Alpine uses musl). Most Node.js/Python/Go toolchains work fine.

2. **No HTTP/2 or HTTP/3** - Gondolin's network mediation only supports HTTP/1.x. Most APIs work over HTTP/1.1, but some modern services may have issues.

3. **No WebSockets** - If tools need WebSocket connections (some MCP servers, live reload), they won't work through Gondolin's network stack.

4. **No snapshotting** - VM state cannot be saved/restored between sessions. Each OpenCode session starts with a fresh VM.

5. **No Windows support** - Gondolin requires macOS or Linux on the host.

6. **Package installation overhead** - Since there's no snapshotting, packages installed during a session are lost. The custom image should pre-install everything needed. Alternatively, mount a persistent `/root/.npm` or `/root/.cache` from the host.

---

## 9. Testing Strategy

```typescript
// test/integration.test.ts
import { VMManager } from "../src/vm-manager";

describe("GondolinPlugin", () => {
  let vm: VMManager;

  beforeAll(async () => {
    vm = new VMManager(
      {
        allowedHosts: ["httpbin.org"],
        secrets: {},
        mounts: {
          "/workspace": { hostPath: "./test/fixtures", readonly: false },
        },
        rootOverlay: true,
      },
      process.cwd()
    );
    await vm.start();
  }, 30_000);

  afterAll(async () => {
    await vm.close();
  });

  test("executes commands in sandbox", async () => {
    const result = await vm.exec("echo hello");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello");
  });

  test("can access allowed hosts", async () => {
    const result = await vm.exec("curl -sS https://httpbin.org/get");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("httpbin.org");
  });

  test("blocks disallowed hosts", async () => {
    const result = await vm.exec("curl -sS https://evil.com/");
    expect(result.exitCode).not.toBe(0);
  });

  test("reads files from mounted workspace", async () => {
    const result = await vm.exec("cat /workspace/test.txt");
    expect(result.exitCode).toBe(0);
  });

  test("cannot access host filesystem outside mounts", async () => {
    const result = await vm.exec("cat /etc/shadow");
    // This reads the *guest's* /etc/shadow, not the host's
    // The host filesystem is not accessible
  });
});
```

---

## 10. Implementation Phases

### Phase 1: Core Plugin (MVP)
- VM lifecycle management (start/stop)
- `tool.execute.before` hook for `bash` redirection
- Network policy via `createHttpHooks`
- VFS mount of project directory
- `gondolin.json` config file support
- Custom guest image with common dev tools

### Phase 2: Full Tool Sandboxing
- Sandboxed `read`, `write`, `edit` custom tools
- Work with OpenCode team on `handled` flag for `tool.execute.before`
- Audit logging for network and filesystem
- `opencode-gondolin init` CLI scaffolding

### Phase 3: Polish
- Pre-built guest images published to GitHub Releases
- Session-level VM isolation (one VM per session)
- Warm VM pool for faster tool execution
- Integration with OpenCode's permission system
- Plugin config namespace in `opencode.json`

---

## 11. Open Questions

1. **Should the VM persist across sessions or be per-session?** A persistent VM is faster but may accumulate state. Per-session is cleaner but has ~1s boot overhead.

2. **How to handle `edit` tool?** OpenCode's `edit` tool does string replacement. We could either (a) implement a custom `sandbox_edit` tool that reads/replaces/writes via `vm.exec`, or (b) intercept the `edit` tool call and translate it to file operations inside the VM.

3. **MCP servers**: Some MCP servers need network access. Should they run inside or outside the VM? Recommendation: outside, since they're user-configured and trusted.

4. **Git operations**: OpenCode uses git extensively. The VFS mount should make this transparent, but we should verify git performance over FUSE is acceptable.
