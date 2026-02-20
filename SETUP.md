# Setup Instructions for Another Machine

This document is for an agent (or human) setting up Charlie's dev environment on a new Mac. It was generated on the source machine (macOS Sequoia 26.2, Apple Silicon) on 2026-02-11.

## Step 0: Commit and Push (Source Machine)

Before leaving the source machine, commit and push these changes:

```sh
cd ~/Development/dotfiles
git add -A
git commit -m "Overhaul dotfiles: replace with actual system configs, modernize toolchain"
git push
```

## Step 1: Run the Install Script (New Machine)

On the new machine, open Terminal and run:

```sh
git clone https://github.com/superhighfives/dotfiles ~/Development/dotfiles
cd ~/Development/dotfiles
sh install.sh 2>&1 | tee ~/install.log
```

This will:
- Install Homebrew and all packages from `Brewfile`
- Install mise + runtimes (Node 24.11.0, Bun, pnpm, uv 0.9.7)
- Install oh-my-zsh + Powerlevel10k + plugins
- Generate an SSH key (interactive prompt)
- Symlink all dotfiles to `~` via GNU Stow
- Install VS Code / Cursor extensions

## Step 2: Manual Setup

After the script finishes, it will print these steps. Do them in order:

### 2a. Add SSH Key to GitHub

The script prints your new public key. Copy it and add at:
https://github.com/settings/keys

### 2b. GitHub CLI

```sh
gh auth login
```

### 2c. Secrets

```sh
cp ~/Development/dotfiles/.secrets.example ~/.secrets
```

Edit `~/.secrets` and fill in:
- `NPM_TOKEN` — your npm auth token
- Cloudflare credentials (if needed)

```sh
cp ~/Development/dotfiles/.npmrc.example ~/.npmrc
```

### 2d. Font

Install **Berkeley Mono (TX-02)** from https://usgraphics.com/products/berkeley-mono

### 2e. Restart Terminal

Close and reopen Terminal. Powerlevel10k will run its configuration wizard if the font isn't detected.

## Step 3: Verify

After restarting terminal, check that everything works:

```sh
# Shell should show Powerlevel10k prompt
echo $ZSH_THEME  # should print: powerlevel10k/powerlevel10k

# Modern tools should be available
bat --version     # cat replacement
fd --version      # find replacement
rg --version      # grep replacement
zoxide --version  # cd replacement (z/zi)
delta --version   # git diff viewer
fzf --version     # fuzzy finder

# mise should manage runtimes
mise ls           # should show node, bun, pnpm, uv

# Git should be configured
git config user.name   # Charlie Gleason
git config user.email  # hi@charliegleason.com

# SSH signing should work
git log --show-signature -1  # on a signed repo
```

## Things That Might Have Been Missed

The following were on the source machine but are **not** included in this dotfiles repo. Review and set up manually if needed:

### Configs Not Tracked

| Item | Location on source machine | Why not tracked |
|------|---------------------------|-----------------|
| **rclone config** | `~/.config/rclone/rclone.conf` | Contains B2/R2 credentials and encryption passwords |
| **Claude user settings** | `~/.claude/settings.json` (home dir) | Machine-specific; has `model: opus` and `alwaysThinkingEnabled: true` |
| **Cursor/VS Code argv** | `~/.cursor/argv.json` | Machine-specific crash reporter ID |
| **Docker config** | `~/.docker/config.json` | Just `{"currentContext": "orbstack"}` — set by OrbStack |
| **GHI token** | macOS Keychain | Retrieved via `security` command in `.gitconfig` — set up automatically |
| **oh-my-zsh custom plugins** | `~/.oh-my-zsh/custom/plugins/` | Installed by `install.sh` (git clones) |
| **Powerlevel10k theme** | `~/.oh-my-zsh/custom/themes/powerlevel10k/` | Installed by `install.sh` (git clone) |

### Brew Formulae Possibly Missing

The Brewfile includes ~20 intentionally-chosen packages. The source machine had ~160 formulae total (mostly transitive deps from ffmpeg). If something is missing:

```sh
# Check what's installed on source vs new
brew list --formula | sort > /tmp/brew-new.txt
# Compare with source machine's list
```

Key formulae that were on the source machine but **not** in the Brewfile (intentionally — they're niche or dependencies):

- `asdf` — replaced by mise, but still installed on source
- `autojump` — replaced by zoxide
- `gcc` — included in Brewfile
- `openssl@3` — included in Brewfile
- `nlohmann-json`, `protobuf`, `numpy`, `opencv`-related — ffmpeg dependencies, auto-installed
- `opencode` — included in Brewfile
- `imlib2`, `jack`, various codec libs — media dependencies

### Brew Taps

These taps are in the Brewfile:
- `amiaopensource/amiaos`
- `anomalyco/tap`
- `homebrew-ffmpeg/ffmpeg`
- `lescanauxdiscrets/tap`

The source machine also had `thoughtbot/formulae` and `tobi/try` (from the old install.sh) — these were removed as they're not currently used.

### macOS Apps Installed Outside Homebrew

These were on the source machine but installed outside Homebrew (App Store, direct download, etc.):
- **Private Internet Access** VPN (Launch Agent found)
- **Handy** (Launch Agent found)
- **Google Updater** (Launch Agent found)

### Launch Agents

Source machine had these in `~/Library/LaunchAgents/`:
- `com.google.GoogleUpdater.wake.plist`
- `com.google.keystone.agent.plist`
- `com.google.keystone.xpcservice.plist`
- `com.privateinternetaccess.vpn.client.plist`
- `Handy.plist`

These are app-specific and will be recreated when those apps are installed.

### Sparkle / Pika

The source machine had `~/Development/sparkle/bin` in PATH. This is for [Pika](https://superhighfives.com/pika). The `.zshrc` conditionally adds it to PATH if the directory exists. To set up:

1. Clone the Sparkle repo to `~/Development/sparkle`
2. Set up SSH deploy keys for the project
3. Add any required env vars to `~/.secrets`

### Things Changed From Source Machine

These modernizations were made during the dotfiles overhaul — the new machine will get the modern versions:

| Change | Old (source machine) | New (dotfiles repo) |
|--------|---------------------|---------------------|
| Directory jumping | `autojump` | `zoxide` (`z`/`zi`) |
| fzf file search | basic `fzf` | `fd`-powered fzf with bat previews |
| Git diffs | default | `delta` with syntax highlighting |
| Version manager | `mise` (via asdf compat) | `mise` (native) |
| Plugins | `git`, `zsh-autosuggestions` | + `colored-man-pages`, `command-not-found`, `uv`, `zsh-syntax-highlighting` |
| Git config | no signing, basic colors | SSH commit signing, delta pager, histogram diffs, zdiff3 merges |
| ripgrep | `--smart-case` only | + `--hidden`, `--glob=!.git` |

### If Something Goes Wrong

1. Check `~/install.log` for errors
2. The script is idempotent — re-run `sh install.sh` to retry failed steps
3. If stow conflicts (file already exists at target), back up the existing file and re-run:
   ```sh
   mv ~/.zshrc ~/.zshrc.backup
   stow --dir=~/Development/dotfiles --target=$HOME .
   ```
4. If Powerlevel10k prompt looks broken, install the Berkeley Mono font and restart terminal
