# dotfiles

✏ dotfiles & installation script for my development environment.

## Install

There are two major components:

1. `install.sh` - which sets up dependencies, installs Homebrew and related packages, and links in dotfiles, on macOS and Linux
2. The 'dotfiles' themselves - `.tmux.conf`, `.zshrc`, etc.

Install the dependencies: package manager, packages, tooling:

```sh
bash install.sh 2>&1 | tee ~/install.log

Running...
 _           _        _ _       _
(_)_ __  ___| |_ __ _| | |  ___| |__
| | '_ \/ __| __/ _  | | | / __| '_ \
| | | | \__ \ || (_| | | |_\__ \ | | |
|_|_| |_|___/\__\__,_|_|_(_)___/_| |_|

-----
- Sets up a Linux or macOS based development machine.
- Can be run in WSL on Windows!
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
```

Use [GNU Stow](https://www.gnu.org/software/stow/manual/stow.html) to automatically symlink the dotfiles:

```sh
# Assuming you've cloned to $HOME/repos/dotfiles
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

## macOS repos volume

Every macOS installation runs `.config/dotfiles/repos-volume.bash` before
creating or cloning anything under `~/repos`. Use a complete checkout; a lone
download of `install.sh` is insufficient. On a fresh machine, clone into a
temporary directory outside `~/repos` and run `bash install.sh` there.

The helper adds a native APFS volume to the running startup Data volume's
existing container, discovered from `diskutil` plists. It shares available
space elastically with the startup volumes, with **no reserve or quota**.
This is not extra disk capacity: filling it can exhaust the startup container.
It mounts at the conventional lowercase `~/repos`, with an absolute
UUID-based `rw,nobrowse,owners` entry in `/etc/fstab`. Ownership is explicitly
enabled on subsequent automatic mounts too. Each fstab change uses `vifs`
locking and saves the previous locked contents at `/etc/fstab.dotfiles-backup.*`.
Unrelated entries remain intact; conflicting UUID, label, device or path mappings
stop setup. `vifs` edits in place: on an I/O failure, inspect fstab and its backup
before retrying; a failed editor is not an automatic rollback.

**The new volume is unencrypted.** The helper prints this before creation and
does not handle passwords or enable encryption. Do not assume startup
FileVault protects a separate APFS volume. Review encryption separately before
putting sensitive data there. Back up primary repositories normally: setup
does not add Time Machine or other backup exclusions.

Spotlight indexing is disabled for this volume only. An empty
`~/repos/.fseventsd/no_log` disables persistent filesystem event storage for the
volume. It neither disables the global `fseventsd` service nor guarantees that
live filesystem events disappear. Existing event history is not erased. Tools
that rely on persisted FSEvents, including backup software, may need a full
scan; verify your backup tool supports this setup. `nobrowse` hides the volume
from normal Finder browsing; paths still work.

Reruns verify the root-owned local record at
`/var/db/dotfiles-repos-$(id -u)/record`, the startup container UUID, the volume
UUID/name, its mount path/options, and a matching root-owned marker on the
volume. They never recursively change ownership, remove folders, or migrate
data. An existing empty `~/repos` is accepted. When unmounted, the underlying
empty directory is owned by root with mode `000`, guarding against accidental
writes while the volume is absent. This is not isolation against the same user
or an administrator. A missing mount should produce an error; do not make the
underlying directory writable to work around it.

The helper refuses symlinked mountpoints, unexpected devices, changed identity,
and HOME paths containing whitespace, symlinks or fstab-ambiguous characters.
It requires a modern macOS startup APFS Data volume at `/System/Volumes/Data`;
unsupported layouts fail without guessing a disk number.

### Existing repositories and migration

A nonempty `~/repos` on the original filesystem is never mounted over or
automatically moved. This includes running the installer from an existing
`~/repos/dotfiles` checkout. Setup stops before APFS creation. Back up and
verify the existing contents, close editors/shells using that tree, and move
the whole directory to a distinct sibling such as `~/repos-before-apfs` **as a
separate deliberate action**, after ensuring that destination does not exist.
Run the installer from that sibling checkout or another complete checkout
outside `~/repos`. After setup, copy the saved contents onto the mounted
volume, preserving metadata, then verify files and repositories before
considering removal of the original. Nothing in this installer deletes it.
Separate filesystems cannot use APFS clones or hard links across their boundary.

Optional disposable paths can live on this same filesystem:

```sh
mkdir -p ~/repos/.worktrees ~/repos/.output
git -C ~/repos/project worktree add ~/repos/.worktrees/project-topic topic
```

These worktree/output paths are manual choices. Set output directories in the
relevant tool or task. Global package storage is configured below.
No Codex TOML worktree/output keys or unverified desktop backing-state edits
are added.

### Interrupted setup and recovery

Never delete an APFS volume or remove its ownership record merely to retry.
Inspect `diskutil apfs list` and `sudo cat /var/db/dotfiles-repos-$(id -u)/record`
first. The record contains version, UID, physical HOME, container UUID, unique
volume name, volume UUID (or `-`), and phase, each on its own line.

- A `creating` record means creation may have succeeded before its UUID was
  saved. Setup intentionally refuses to adopt even a same-named volume or
  create another. Manually reconcile the exact unique name, container and
  volume UUID using `diskutil apfs list -plist` and `diskutil info -plist UUID`.
  If it exists, independently verify it belongs to this setup before repairing
  the record to `created` with the confirmed UUID. If no volume was created,
  only then archive the intent record and retry. Do not guess from a disk number.
- A `created` record with a UUID resumes mounting/initialization. A failure
  between recording `ready` and installing the volume marker needs manual
  reconciliation of those two records. Do not replace a mismatched marker
  without establishing which volume contains your data.
- A stale `lock` directory requires checking that no installer remains running
  before removing that empty directory with `sudo rmdir`. Ordinary failures
  release it automatically; abrupt termination or power loss may leave it.
- A volume mounted elsewhere or with different options needs inspection and a
  normal manual unmount after closing its users. The helper never kills
  processes or force-unmounts a busy volume. For an unmounted recorded volume,
  rerun setup to mount it. Inspect fstab with `sudo vifs` if it conflicts.
- If a concurrent write is detected after protecting the underlying directory,
  mounting stops and those files stay there. Inspect with `sudo ls -la ~/repos`.
  After verifying with `diskutil info ~/repos` that no volume is mounted there,
  restore the original directory to your ownership and permissions manually,
  then follow the separate migration steps above. Do not chmod a mounted volume
  as an attempt to recover the underlying directory.

After installing, and again after reboot, verify `diskutil info ~/repos`,
`mount`, `mdutil -s ~/repos`, the UUID mapping in `/etc/fstab`, and the empty
`.fseventsd/no_log` file. Confirm writable ownership and test your backups.

Command semantics are based on Apple's [APFS tools guide](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/APFS_Guide/ToolsandAPIs/ToolsandAPIs.html),
the [`diskutil` manual](https://keith.github.io/xcode-man-pages/diskutil.8.html),
[Disk Arbitration mount implementation](https://github.com/apple-oss-distributions/DiskArbitration/blob/main/diskarbitrationd/DAMount.c),
and [per-volume FSEvents storage documentation](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/FileSystemEventSecurity/FileSystemEventSecurity.html).
Validation: `bash -n install.sh .config/dotfiles/repos-volume.bash`,
`shellcheck install.sh .config/dotfiles/repos-volume.bash .github/tests/repos-volume.sh`,
and `bash .github/tests/repos-volume.sh`. The mocks never run host volume or
mount operations. Native macOS execution and reboot behavior must be checked
on macOS; Windows mock tests cannot establish them.

## What I Use

- [Ghostty](https://ghostty.org/) on macOS as my primary terminal environment - `install.sh` will install it for you.
- zsh and [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) as my shell.
- [Zed](https://zed.dev/) as my editor (previously: VS Code)
- [Berkeley Mono](https://usgraphics.com/products/berkeley-mono) (TX-02) as my font.

## License

📜 See LICENSE file for details.


## Global development tool storage

`install.sh` runs `.config/dotfiles/setup-tool-storage.bash` after preparing
`~/repos` and before installing tools or linking dotfiles. It relocates existing
default directories and leaves absolute compatibility symlinks at their old
paths. Stop package managers, Rust builds, editors and agents before running
setup: relocation across filesystems is a copy followed by removal, not atomic.
Back up your installed tools and configuration first.

| Tool | Storage on the repos filesystem |
| --- | --- |
| pnpm 11+ | `~/repos/.pnpm`: `store`, `cache` (including dlx), `state`, `global` and `bin` |
| npm / npx | `~/repos/.npm` cache; `~/repos/.npm-global` prefix for global packages and `bin` |
| Cargo | `~/repos/.cargo`: registry/git caches, installed binaries, configuration and credentials |
| rustup | `~/repos/.rustup`: toolchains, downloads, settings and temporary files |

The complete Cargo home moves, including any `credentials.toml`. These homes
inherit the repos volume's encryption and backup properties described above.
This is persistent tool state, not a directory to empty as disposable cache.
Homebrew's Node, npm and pnpm executables remain under the Homebrew prefix;
`npm install -g` and `pnpm add -g` use the new package destinations.
Cargo build outputs remain per-project in `target/`; a single shared
`CARGO_TARGET_DIR` is deliberately not set because concurrent builds can contend
on its locks and invalidate each other's outputs.

For an existing dotfiles installation, run this from the updated checkout
**before sourcing the updated shell files or starting another shell**:

```sh
bash .config/dotfiles/setup-tool-storage.bash
. .config/dotfiles/tool-storage.sh
pnpm store path
pnpm bin -g
npm config get cache
npm config get prefix
rustup show active-toolchain
cargo --version
```

The helper requires an already mounted `~/repos` on macOS; it never creates or
mounts a volume. On Linux it uses an existing writable `~/repos` directory.
It moves the macOS pnpm defaults from `~/Library/pnpm`,
`~/Library/Caches/pnpm` and `~/.pnpm-state`; on Linux it uses the corresponding
XDG data/cache/state defaults. It also moves `~/.npm`, `~/.cargo` and `~/.rustup`.
It refuses unexpected symlinks, non-directory paths, or a source and destination
that both exist. It never merges directories. If interrupted, inspect both
paths; a completed move with a missing compatibility link resumes on rerun, but
a partial cross-volume copy needs manual reconciliation. Existing links created
by this helper are accepted on rerun. A stale `~/repos/.tool-storage.lock` after
a crash needs inspection; remove it with `rmdir` only after confirming no setup
is running. No tool data is discarded or pruned.

Custom stores/homes and npm's previous global prefix are not automatically
migrated. Before setup, record `npm config get prefix`, `npm ls -g --depth=0`,
`pnpm store path`, `pnpm bin -g`, and any custom `CARGO_HOME` / `RUSTUP_HOME`.
Reconcile custom paths with the table before enabling the new environment.
Reinstall user-installed npm globals into the new prefix; do not move or delete
the Homebrew prefix (which also contains Node/npm). Existing projects may need
`pnpm install` to adopt the new store. Preserve old custom stores until their
projects and offline installs work. On the inspected Mac, npm's only global
package was its Homebrew-managed npm itself, and Rust used the default homes.

The shared `.config/dotfiles/tool-storage.sh` is sourced by both `.zprofile`
and `.zshrc`, and by the installer before Rust installation. It performs no
filesystem writes and adds the global binary paths without duplicates. It uses
pnpm's `PNPM_CONFIG_*` variables, npm's `npm_config_cache` / `npm_config_prefix`,
and `CARGO_HOME` / `RUSTUP_HOME`; it does not rewrite registry/auth config or
redirect every application's XDG paths. Noninteractive jobs and GUI apps must
inherit this environment or explicitly source the shared file. Old Rust shell
setup using `~/.cargo/env` keeps working through the compatibility symlink.
If switching to a Node version manager, revisit npm's fixed global prefix.

### pnpm worktrees and the global virtual store

Putting the package store on the same filesystem as worktrees permits pnpm's
same-filesystem imports; a store across APFS volumes requires copying rather
than hard links. pnpm's *global virtual store* is a separate optimization that
also shares dependency graph layouts, reducing repeated creation of dependency
files in new worktrees. Relocating the store alone does not enable it.

For a compatible project on pnpm 11.23+, commit this in `pnpm-workspace.yaml`:

```yaml
virtualStoreType: global
```

Validate the project's build, tests, module resolution and file watchers before
adopting it. Shared dependencies are not private mutable copies. Longer resolved
paths can affect generated output; the linked benchmark had to disable generated
debug-path comments to pass Vite's bundle-size check. We do not force this layout
through a global environment variable for every repository.

The [pnpm worktree benchmark](https://github.com/krishhgg/pnpm-worktree-benchmark)
reports roughly 6.94x faster warm offline installs with eight generated-monorepo
worktrees and 3.42x for an adjusted Vite checkout. It compares dependency layouts
on the normal startup volume, uses prepared stores and disables install lifecycle
scripts. It does not compare the dedicated APFS volume, first downloads, or
multiday daemon growth. Those results complement the filesystem comparison:
avoiding repeated filesystem work can help even when raw volume throughput is
similar. A follow-up should cross normal/repos storage with project/global
virtual stores at 1, 2, 4 and 8 workers, pairing repeated cohorts and verifying
builds, resolved dependency targets, worker/system CPU, physical disk traffic
and file counts. Report warm installs separately from cold-store downloads;
keep stores on their corresponding filesystem and include full workflow time.

### Other storage worth considering

- **uv / pip / pipx:** download/build caches, uv-managed Python and tool installs.
  uv cache placement can also affect linking into environments on another volume.
- **Go:** `GOPATH` already points to `~/repos/go` in `.zshrc`, so its default
  module cache is already there; `GOCACHE` still merits a separate move.
- **Bun:** package cache, global packages and binaries if used alongside pnpm.
- **Xcode / SwiftPM:** DerivedData, package downloads and build artifacts can be
  large. Configure Xcode/build commands explicitly; measure simulator/compiler
  contention separately from filesystem throughput.
- **sccache / ccache, Gradle and Homebrew downloads:** useful candidates when
  used heavily. Avoid moving an entire `~/Library/Caches` or every XDG home:
  they also contain unrelated app state.

These are candidates only; this change moves pnpm, npm and Rust storage.
Reference: [pnpm configuration](https://pnpm.io/configuring),
[pnpm store location](https://pnpm.io/settings/store#storedir),
[pnpm global virtual store](https://pnpm.io/settings/node-modules#virtualstoretype),
[npm configuration](https://docs.npmjs.com/cli/v11/using-npm/config/),
[Cargo home](https://doc.rust-lang.org/cargo/guide/cargo-home.html), and
[rustup environment](https://rust-lang.github.io/rustup/environment-variables.html).

Validation: `bash .github/tests/tool-storage.sh` uses disposable homes and mock
mount discovery, exercising migration, symlinks, conflicts, interrupted/failed
moves and repeated shell sourcing. Native pnpm/npm path resolution and an offline
local-package install should also be checked with a disposable HOME.
