# dotfiles

Dotfiles & installation script for my development environment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         install.sh                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Package Managers                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Homebrew   │  │     apt     │  │   Others    │              │
│  │   (macOS)   │  │   (Linux)   │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Dotfiles                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│  │  .zshrc   │ │.tmux.conf │ │  .vimrc   │ │ .config/* │        │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GNU Stow (Symlinks)                          │
│                                                                 │
│    ~/repos/dotfiles/.zshrc  ──────►  ~/.zshrc                   │
│    ~/repos/dotfiles/.vimrc  ──────►  ~/.vimrc                   │
│    ~/repos/dotfiles/.config ──────►  ~/.config                  │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. `install.sh` detects your OS and installs the appropriate package manager (Homebrew on macOS, apt on Linux)
2. Package managers install required tools and dependencies (zsh, tmux, vim, etc.)
3. Dotfiles in this repository contain your personalized configurations
4. GNU Stow creates symlinks from the repo to your home directory, keeping configs version-controlled

## Prerequisites

Before running the install script, ensure you have the following tools available:

### Required Tools

- **git** - for cloning this repository
- **curl** - for downloading packages and scripts
- **bash** - the install script requires bash (v3.2+)

### OS-Specific Requirements

**macOS:**
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools (`xcode-select --install`)
- Admin privileges for Homebrew installation

**Linux:**
- A Debian/Ubuntu-based distribution (for apt package manager) or equivalent
- `sudo` access for installing system packages
- `build-essential` package (or equivalent) for compiling some tools

### WSL Compatibility

This setup is fully compatible with Windows Subsystem for Linux (WSL). For best results:
- Use WSL 2 with Ubuntu 20.04 or later
- Ensure Windows Terminal is installed for optimal terminal experience
- Some GUI-dependent tools may require additional configuration

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

## Troubleshooting

### Common Issues

#### Stow Conflicts

**Problem:** When running `stow`, you see errors like:
```
WARNING! stowing . would cause conflicts:
  * existing target is neither a link nor a directory: .zshrc
```

**Solution:** This happens when existing files conflict with the symlinks stow wants to create. Back up and remove the conflicting files:
```sh
# Back up existing files
mv ~/.zshrc ~/.zshrc.backup
mv ~/.tmux.conf ~/.tmux.conf.backup

# Then run stow again
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

Alternatively, use the `--adopt` flag to move existing files into the dotfiles directory:
```sh
stow --adopt --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

#### Permission Errors

**Problem:** Installation fails with permission denied errors.

**Solution:** 
1. Ensure you own your home directory:
   ```sh
   sudo chown -R $(whoami) ~
   ```

2. If Homebrew has permission issues on macOS:
   ```sh
   sudo chown -R $(whoami) /usr/local/bin /usr/local/lib /usr/local/share
   ```

3. On Linux, ensure your user is in the appropriate groups:
   ```sh
   sudo usermod -aG sudo $(whoami)
   ```

#### Missing Dependencies

**Problem:** Commands not found after installation, or install script fails.

**Solution:**
1. Ensure `curl` and `git` are installed first:
   ```sh
   # Debian/Ubuntu
   sudo apt-get update && sudo apt-get install -y curl git
   
   # macOS (Xcode CLI tools)
   xcode-select --install
   ```

2. Restart your shell after installation:
   ```sh
   exec $SHELL -l
   ```

3. Verify Homebrew is in your PATH:
   ```sh
   eval "$(/opt/homebrew/bin/brew shellenv)"  # macOS Apple Silicon
   eval "$(/usr/local/bin/brew shellenv)"     # macOS Intel
   eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"  # Linux
   ```

### Getting Help

If you encounter issues not covered above:

1. **Check the install log:** Review `~/install.log` for detailed error messages
2. **Open an issue:** [Create a new issue](https://github.com/elithrar/dotfiles/issues/new) with:
   - Your operating system and version
   - The full error message
   - Steps to reproduce the problem
3. **Search existing issues:** [Browse issues](https://github.com/elithrar/dotfiles/issues) to see if your problem has been addressed

## License

MIT
