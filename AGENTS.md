# Agent Notes

## Repo Shape

- This repo is a Stow-managed home directory mirror: most root dotfiles are intended to symlink into `$HOME` with `stow --dir="$HOME/repos/dotfiles" --target="$HOME" .`.
- `install.sh` is the machine bootstrapper, not a normal test script. It can ask for sudo, install Homebrew/Linuxbrew packages and casks, clone/stow this repo, install oh-my-zsh/Atuin/nvm/uv/Rust, generate SSH keys, and change the login shell.
- There is no root package manifest or CI workflow. Do not assume `npm test`, `make`, or GitHub Actions exist for the whole repo.

## Validation

- For `install.sh` changes, run `bash -n install.sh` and `shellcheck install.sh`.
- For Stow-sensitive changes, run `stow --dir="$PWD" --target="$HOME" --simulate --verbose .`. Existing live-file conflicts can be local state, especially under `.codex/`, `.config/opencode/`, and `.zcompdump*`; inspect before treating them as regressions.
- Do not run `sh install.sh` unless the user explicitly wants machine bootstrap changes applied.

## OpenCode And Agent Config

- Primary OpenCode config lives in `.config/opencode/opencode.jsonc`; it loads `{env:HOME}/.config/opencode/INSTRUCTIONS.md` and the `opencode-cross-repo` plugin.
- Broad style and git workflow preferences are already in `.config/opencode/INSTRUCTIONS.md`; avoid duplicating them here unless the repo wiring makes them easy to miss.
- OpenCode plugins are TypeScript files in `.config/opencode/plugin/`. `.config/opencode/package.json` has dependencies but no scripts; `node_modules`, `bun.lock`, and `package-lock.json` there are ignored local artifacts.
- `.opencode/worktrees/` and `.opencode/node_modules/` are runtime state and ignored. The tracked `.opencode/package-lock.json` exists, but `.opencode/package.json` is ignored local state.
- Agent skills live under `.agents/skills/`; edit each skill’s `SKILL.md` and references directly rather than generating a separate registry by hand.

## Gotchas

- `.gitconfig` enables SSH commit and tag signing via `~/.ssh/id_ed25519.pub` and `~/.ssh/allowed_signers`; bootstrap changes should preserve that flow.
- `.zshrc` auto-attaches or creates tmux sessions when `tmux` is available and `$TMUX` is empty. Be careful when changing shell startup behavior.
- `.codex/config.toml` mirrors OpenCode-style permissions and marks `/Users/matt/repos/dotfiles` as trusted; command rules are in `.codex/rules/default.rules`.
