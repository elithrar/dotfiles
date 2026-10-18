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

Every macOS installation runs `repos-volume.sh` before
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
Validation: `bash -n install.sh repos-volume.sh`,
`shellcheck -x install.sh repos-volume.sh .github/tests/repos-volume.sh`,
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


## Tool storage

Caches and Node/Rust installs live in `~/repos`. With tools stopped, run
`bash setup-tool-storage.sh`, then restow and restart your
shell. Existing defaults move with compatibility links; conflicting paths stop
setup.
