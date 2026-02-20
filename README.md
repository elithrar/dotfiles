# dotfiles

Dotfiles and installation script for my development environment. Run once on any new Mac and you're good to go.

## Quick Start

```sh
git clone https://github.com/superhighfives/dotfiles ~/Development/dotfiles
cd ~/Development/dotfiles
sh install.sh 2>&1 | tee ~/install.log
```

The script is idempotent — safe to run multiple times. It will skip anything already installed.

## What It Does

The install script handles everything in order:

1. **Homebrew** — installs the package manager if missing
2. **Packages** — installs CLI tools and apps from `Brewfile`
3. **mise** — sets up runtime version management (Node, Bun, pnpm, uv)
4. **oh-my-zsh** — installs zsh framework with Powerlevel10k theme
5. **Plugins** — zsh-autosuggestions, zsh-syntax-highlighting
6. **SSH** — generates an Ed25519 key and configures commit signing
7. **Dotfiles** — symlinks configs to `~` using [GNU Stow](https://www.gnu.org/software/stow/)
8. **Extensions** — installs VS Code / Cursor extensions

## What's Included

### Dotfiles

| File | Purpose |
|------|---------|
| `.zshrc` | Shell config — Powerlevel10k, plugins, aliases, fzf, zoxide, mise |
| `.p10k.zsh` | Powerlevel10k prompt theme |
| `.zprofile` | Shell profile (OrbStack integration) |
| `.gitconfig` | Git settings — delta diffs, SSH signing, color, aliases |
| `.gitignore_global` | Global git ignores (macOS artifacts) |
| `.tool-versions` | Runtime versions for mise (Node, Bun, pnpm, uv) |
| `.ripgreprc` | Ripgrep config (smart-case, hidden files) |
| `.ssh/config` | SSH hosts and settings |
| `.config/git/ignore` | Per-user git ignore patterns |
| `.config/gh/config.yml` | GitHub CLI settings |
| `.local/bin/mount-encrypted-storage` | rclone NFS mount helper script |

### CLI Tools (via Brewfile)

| Tool | Replaces | Purpose |
|------|----------|---------|
| [bat](https://github.com/sharkdp/bat) | `cat` | Syntax-highlighted file viewer |
| [delta](https://github.com/dandavella/delta) | `diff` | Git diff viewer with syntax highlighting |
| [fd](https://github.com/sharkdp/fd) | `find` | Fast, user-friendly file finder |
| [fzf](https://github.com/junegunn/fzf) | — | Fuzzy finder for files, history, etc. |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | `grep` | Very fast regex search |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | `cd` | Smart directory jumping |
| [htop](https://htop.dev/) | `top` | Interactive process viewer |
| [prettyping](https://github.com/denilsonsa/prettyping) | `ping` | Prettier ping output |

### Casks (macOS Apps)

1Password, ChatGPT, Claude, Conductor, Cursor, Discord, Figma, Fork, Google Chrome, LM Studio, Obsidian, Ollama, OpenCode Desktop, OrbStack, Plex, Postman, Raycast, Transmit, WhatsApp

### VS Code / Cursor Extensions

- `anthropic.claude-code` — Claude Code
- `astro-build.astro-vscode` — Astro
- `biomejs.biome` — Biome (linter/formatter)
- `bradlc.vscode-tailwindcss` — Tailwind CSS
- `sst-dev.opencode` — OpenCode
- `teabyii.ayu` — Ayu theme
- `unifiedjs.vscode-mdx` — MDX support

## Post-Install (Manual Steps)

### 1. Secrets

```sh
cp ~/Development/dotfiles/.secrets.example ~/.secrets
# Edit ~/.secrets and add your NPM_TOKEN, Cloudflare keys, etc.

cp ~/Development/dotfiles/.npmrc.example ~/.npmrc
# Or rely on NPM_TOKEN from .secrets
```

### 2. GitHub CLI

```sh
gh auth login
```

### 3. Font

Install [Berkeley Mono](https://usgraphics.com/products/berkeley-mono) (TX-02).

### 4. Sparkle / Pika (optional)

[Pika](https://superhighfives.com/pika) requires:
1. Clone the Sparkle repo to `~/Development/sparkle`
2. Set up SSH deploy keys
3. Add any required env vars to `~/.secrets`

### 5. rclone (optional)

For encrypted cloud storage mounts:
```sh
rclone config
# Set up b2-storage-general, b2-storage-brightly, b2-storage-titan remotes
```

## What I Use

- **Terminal**: macOS Terminal / [OrbStack](https://orbstack.dev/) for containers
- **Shell**: zsh + [oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh) + [Powerlevel10k](https://github.com/romkatv/powerlevel10k)
- **Editor**: [Cursor](https://cursor.sh/) (VS Code fork)
- **Font**: [Berkeley Mono](https://usgraphics.com/products/berkeley-mono) (TX-02)
- **Version manager**: [mise](https://mise.jdx.dev/)

## Updating

After making changes to dotfiles on your machine, copy them back to the repo and commit:

```sh
cd ~/Development/dotfiles
git add -A && git commit -m "Update dotfiles"
git push
```

Since stow creates symlinks, changes to `~/.zshrc` etc. are already reflected in the repo.

## License

MIT. See [LICENSE](LICENSE) for details.
