#!/usr/bin/env bash

# Via https://github.com/elithrar <matt@eatsleeprepeat.net>
# Sets up a macOS and/or Linux based dev-environment.
# Inspired by https://github.com/minamarkham/formation (great!)

# Configuration
DOTFILES_REPO="https://github.com/elithrar/dotfiles"
BREW_PACKAGES=(age agg asciinema atuin bat cmake curl delta fd ffmpeg fzf gh gifski git glab go htop jj jq lua make mkcert neovim nmap node pipx pnpm python rbenv rcm ripgrep ruff ruby-build shellcheck stow tmux tree uv websocat wget wrk yarn zoxide zsh)
CF_BREW_PACKAGES=(cloudflare/cloudflare/cloudflared cloudflare/engineering/cloudflare-certs)
CASKS=(ghostty raycast)
SSH_EMAIL="matt@eatsleeprepeat.net"

# Colors - use fallbacks if tput unavailable
if command -v tput &>/dev/null && tput sgr0 &>/dev/null; then
    reset="$(tput sgr0)"
    red="$(tput setaf 1)"
    blue="$(tput setaf 4)"
    green="$(tput setaf 2)"
    yellow="$(tput setaf 3)"
else
    reset=""
    red=""
    blue=""
    green=""
    yellow=""
fi

# Error handling
ret=0
trap 'ret=$?; [[ $ret -ne 0 ]] && printf "%s\n" "${red}Setup failed${reset}" >&2; exit $ret' EXIT
set -euo pipefail

# --- Helpers
print_success() {
    printf "%s %b\n" "${green}✔ success:${reset}" "$1"
}

print_error() {
    printf "%s %b\n" "${red}✖ error:${reset}" "$1"
}

print_info() {
    printf "%s %b\n" "${blue}ⓘ info:${reset}" "$1"
}

# ------
# Setup
# ------
cat <<EOF
${yellow}
Running...
 _           _        _ _       _
(_)_ __  ___| |_ __ _| | |  ___| |__
| | '_ \/ __| __/ _  | | | / __| '_ \\
| | | | \__ \\ || (_| | | |_\__ \\ | | |
|_|_| |_|___/\\__\\__,_|_|_(_)___/_| |_|

-----
- Sets up a macOS or Linux based development machine.
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
${reset}
EOF

# Check environments
OS=$(uname -s 2> /dev/null)
INTERACTIVE=false
if [ -t 0 ] && [ -t 1 ]; then
    INTERACTIVE=true
fi

print_info "Detected OS: ${OS}"
print_info "Interactive shell session: ${INTERACTIVE}"

# On Linux, we may need to install some packages.
DISTRO=""
if [ "${OS}" = "Linux" ]; then
    if [ -f /etc/os-release ] && grep -iq "Debian" /etc/os-release; then
        DISTRO="Debian"
        print_info "Detected Linux distro: ${DISTRO}"
    fi
fi

# Check for connectivity
ping_timeout_flag="-w1"
if [ "${OS}" = "Darwin" ]; then
    ping_timeout_flag="-t1"
fi

if ! ping -q "${ping_timeout_flag}" -c1 google.com &>/dev/null; then
    print_error "Cannot connect to the Internet"
    exit 1
else
    print_success "Internet reachable"
fi

# Ask for sudo
sudo -v &> /dev/null

# Update the system & install core dependencies
if [ "${OS}" = "Linux" ] && [ "${DISTRO}" = "Debian" ]; then
    print_info "Updating system packages"
    sudo apt update
    sudo apt -y upgrade
    sudo apt -y install build-essential curl file git
else
    print_info "Skipping system package updates"
fi

# Generate an SSH key (if none) if we're in an interactive shell
if [ "${INTERACTIVE}" = true ] && ! [[ -f "${HOME}/.ssh/id_ed25519" ]]; then
    printf "🔑 Generating new SSH key\n"
    # Ensure .ssh directory exists with correct permissions
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
    ssh-keygen -t ed25519 -f "${HOME}/.ssh/id_ed25519" -C "${SSH_EMAIL}"
    print_info "Key generated!"
    if [ "${OS}" = "Darwin" ]; then
        print_info "Adding key to Keychain"
        ssh-add --apple-use-keychain "${HOME}/.ssh/id_ed25519"
    fi
fi

# Set up repos directory
if [ ! -d "${HOME}/repos" ]; then
    mkdir -p "${HOME}/repos"
fi

# Install Homebrew
if ! [ -x "$(command -v brew)" ]; then
    print_info "Installing Homebrew..."
    # Use NONINTERACTIVE=1 to run without prompts, matching the script's style.
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to the PATH for the rest of this script's execution.
    # The location is architecture-dependent.
    if [ -x "/opt/homebrew/bin/brew" ]; then # Apple Silicon macOS
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x "/usr/local/bin/brew" ]; then # Intel macOS
        eval "$(/usr/local/bin/brew shellenv)"
    elif [ -x "/home/linuxbrew/.linuxbrew/bin/brew" ]; then # Linux
        eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    fi
    print_success "Homebrew installed"
else
    print_success "Homebrew/Linuxbrew already installed."
fi

# --- Homebrew
print_info "Installing Homebrew packages"
# Install taps first
brew tap thoughtbot/formulae
for pkg in "${BREW_PACKAGES[@]}"; do
    # Check if $pkg is already installed
    print_info "Checking package ${pkg}"
    if ! brew list "${pkg}" &>/dev/null; then
        print_info "Installing ${pkg}"
        brew install --quiet "${pkg}"
    else
        print_success "${pkg} already installed"
    fi
done

if [ "${CF:-false}" = "true" ]; then
    print_info "Installing Cloudflare Homebrew packages"
    for pkg in "${CF_BREW_PACKAGES[@]}"; do
        # Check if $pkg is already installed
        print_info "Checking package ${pkg}"
        if ! brew list "${pkg}" &>/dev/null; then
            print_info "Installing ${pkg}"
            brew install --quiet "${pkg}"
        else
            print_success "${pkg} already installed"
        fi
    done
else
    print_info "Skipping Cloudflare Homebrew packages (set CF=true to enable)"
fi

# Bun (Homebrew per https://bun.com/docs/installation)
print_info "Checking package bun"
if ! brew list bun &>/dev/null; then
    print_info "Installing bun"
    brew install --quiet bun
else
    print_success "bun already installed"
fi

# reattach-to-user-namespace
if [ "${OS}" = "Darwin" ]; then
    brew install --quiet reattach-to-user-namespace
fi

# Casks
if [ "${OS}" = "Darwin" ]; then
    print_info "Installing Homebrew Casks"
    for pkg in "${CASKS[@]}"; do
        # Check if $pkg is already installed
        print_info "Checking package ${pkg}"
        if ! brew list --cask "${pkg}" &>/dev/null; then
            print_info "Installing ${pkg}"
            brew install --cask "${pkg}"
        else
            print_success "${pkg} already installed"
        fi
    done
else
    print_info "Skipping Cask installation: not on macOS"
fi

print_success "Homebrew packages"
# --- dotfiles
# Clone & install dotfiles
print_info "Configuring dotfiles"
if ! [ -x "$(command -v stow)" ]; then
    # Install GNU stow
    # https://linux.die.net/man/8/stow
    brew install stow
fi

if [ ! -d "${HOME}/repos/dotfiles" ]; then
    print_info "Cloning dotfiles"
    git clone "${DOTFILES_REPO}" "${HOME}/repos/dotfiles"
else
    print_info "dotfiles already cloned"
fi

print_info "Linking dotfiles"
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
print_success "dotfiles installed"

# --- Configure zsh
if [ ! -d "${HOME}/.oh-my-zsh" ]; then
    print_info "Installing oh-my-zsh"
    # Use --unattended to prevent oh-my-zsh from changing the shell or starting zsh
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    if ! grep -q "$(command -v zsh)" /etc/shells; then
        command -v zsh | sudo tee -a /etc/shells
    fi
    chsh -s "$(command -v zsh)"
else
    print_success "oh-my-zsh already installed"
fi

# --- Install Atuin
if [ ! -d "${HOME}/.atuin" ]; then
    print_info "Installing Atuin"
    curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh
else
    print_success "Atuin already installed"
fi

# --- Install nvm
if [ ! -d "${HOME}/.nvm" ]; then
    print_info "Installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | PROFILE=/dev/null bash
else
    print_success "nvm already installed"
fi

# Install uv - skip if already installed via brew
if ! [ -x "$(command -v uv)" ]; then
    print_info "Installing uv"
    curl -LsSf https://astral.sh/uv/install.sh | sh
else
    print_success "uv already installed."
fi

# Install Rust via rustup
if ! [ -x "$(command -v rustc)" ]; then
    print_info "Installing Rust via rustup"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
else
    print_success "Rust already installed."
fi

print_success "All done! Visit https://github.com/elithrar/dotfiles for the full source & related configs."
