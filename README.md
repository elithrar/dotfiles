# dotfiles

Dotfiles & installation script for my development environment.

## Install

```sh
# Install dependencies, Homebrew, packages, and tooling
sh install.sh 2>&1 | tee ~/install.log

# Symlink dotfiles with GNU Stow (assuming cloned to $HOME/repos/dotfiles)
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

For selective installation of specific dotfiles only:

```sh
# Only symlink zsh configuration
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" -S .zshrc

# Only symlink tmux configuration
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" -S .tmux.conf

# Preview what would be symlinked without making changes
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" --simulate .
```

## What I Use

- [Ghostty](https://ghostty.org/)
- [zsh](https://github.com/robbyrussell/oh-my-zsh)
- [Zed](https://zed.dev/)
- [Berkeley Mono](https://usgraphics.com/products/berkeley-mono)

## Examples

### Customizing Zsh Aliases

Add custom aliases to your `.zshrc`:

```sh
# Add to ~/.zshrc or create ~/.zshrc.local for local overrides
alias gs="git status"
alias gp="git push"
alias dc="docker compose"
alias k="kubectl"

# Reload your shell to apply changes
source ~/.zshrc
```

### Adding New Homebrew Packages

Edit `install.sh` to add packages to the brew installation:

```sh
# Find the brew install section and add your packages
brew install \
    ripgrep \
    fd \
    bat \
    your-new-package
```

Or install manually and track in your dotfiles later:

```sh
brew install package-name
# Then update install.sh to include it for future installs
```

### Modifying Tmux Keybindings

Customize tmux by editing `.tmux.conf`:

```sh
# Change prefix from Ctrl-b to Ctrl-a
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# Split panes with | and -
bind | split-window -h
bind - split-window -v

# Reload tmux config without restarting
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
```

### Customizing the Ghostty Terminal

Edit `.config/ghostty/config` to personalize your terminal:

```ini
# Change font size
font-size = 14

# Use a different theme
theme = orng-dark

# Adjust window padding
window-padding-x = 10
window-padding-y = 10
```

## License

MIT
