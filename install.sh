#!/usr/bin/env bash

if [ -z "${BASH_VERSION:-}" ]; then
    printf "%s\n" "install.sh requires Bash. Run it with: bash install.sh" >&2
    exit 1
fi

# Via https://github.com/elithrar <matt@eatsleeprepeat.net>
# Sets up a macOS and/or Linux based dev-environment.
# Inspired by https://github.com/minamarkham/formation (great!)

set -euo pipefail

# Configuration
DOTFILES_REPO="https://github.com/elithrar/dotfiles"
BREW_PACKAGES=(age agg asciinema atuin bat cmake curl delta fd ffmpeg fzf gh gifski git glab go htop jq lua make mkcert neovim nmap node pscale pipx pnpm python rbenv rcm ripgrep ruff ruby-build shellcheck stow tmux tree try uv websocat wget wrk yarn zoxide zsh)
CF_BREW_PACKAGES=(cloudflare/cloudflare/cloudflared cloudflare/engineering/cloudflare-certs)
CASKS=(claude ghostty raycast zed@preview)
SSH_EMAIL="matt@eatsleeprepeat.net"

# Set BREW_PARALLEL=true to install missing formulae/casks one-at-a-time in
# parallel. Homebrew handles locking internally, but sequential installs remain
# the conservative default for fresh machines.
BREW_PARALLEL="${BREW_PARALLEL:-false}"
BREW_JOBS="${BREW_JOBS:-4}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-true}"

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

FAILED_STEPS=()
installed_formulae=""
installed_casks=""
ret=0

trap 'ret=$?; [[ $ret -ne 0 ]] && printf "%s\n" "${red}Setup failed${reset}" >&2; exit $ret' EXIT

# --- Helpers
print_success() {
    printf "%s %b\n" "${green}[success]${reset}" "$1"
}

print_error() {
    printf "%s %b\n" "${red}[error]${reset}" "$1"
}

print_info() {
    printf "%s %b\n" "${blue}[info]${reset}" "$1"
}

record_failure() {
    local step="$1"
    FAILED_STEPS+=("${step}")
    print_error "${step}"

    if [[ "${CONTINUE_ON_ERROR}" != "true" ]]; then
        exit 1
    fi
}

retry() {
    local attempts="${RETRY_ATTEMPTS:-3}"
    local delay="${RETRY_DELAY:-5}"
    local attempt=1

    while true; do
        if "$@"; then
            return 0
        fi

        if (( attempt >= attempts )); then
            return 1
        fi

        print_info "Retrying command in ${delay}s: $*"
        sleep "${delay}"
        attempt=$((attempt + 1))
    done
}

ensure_sudo() {
    if sudo -n true &>/dev/null; then
        return 0
    fi

    if [[ "${INTERACTIVE}" == "true" ]]; then
        sudo -v
        return 0
    fi

    print_error "sudo is required, but this is not an interactive shell"
    return 1
}

internet_reachable() {
    local ping_timeout_flag="-w1"
    if [[ "${OS}" == "Darwin" ]]; then
        ping_timeout_flag="-t1"
    fi

    if command -v ping &>/dev/null && ping -q "${ping_timeout_flag}" -c1 google.com &>/dev/null; then
        return 0
    fi

    if command -v curl &>/dev/null && curl -fsSI --connect-timeout 5 https://github.com &>/dev/null; then
        return 0
    fi

    return 1
}

is_positive_int() {
    [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

setup_homebrew_path() {
    if command -v brew &>/dev/null; then
        return 0
    fi

    if [[ -x "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -x "/usr/local/bin/brew" ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
    elif [[ -x "/home/linuxbrew/.linuxbrew/bin/brew" ]]; then
        eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    fi
}

refresh_brew_state() {
    installed_formulae=$'\n'"$(brew list --formula 2>/dev/null || true)"$'\n'
    installed_casks=""
    if [[ "${OS}" == "Darwin" ]]; then
        installed_casks=$'\n'"$(brew list --cask 2>/dev/null || true)"$'\n'
    fi
}

brew_formula_installed() {
    [[ "${installed_formulae}" == *$'\n'"$1"$'\n'* ]]
}

brew_cask_installed() {
    [[ "${installed_casks}" == *$'\n'"$1"$'\n'* ]]
}

install_brew_batch() {
    local kind="$1"
    shift

    if [[ "${kind}" == "cask" ]]; then
        brew install --cask "$@"
    else
        brew install --quiet "$@"
    fi
}

install_brew_single() {
    local kind="$1"
    local package="$2"

    if [[ "${kind}" == "cask" ]]; then
        retry brew install --cask "${package}"
    else
        retry brew install --quiet "${package}"
    fi
}

install_brew_parallel() {
    local kind="$1"
    shift

    if [[ "${kind}" == "cask" ]]; then
        printf "%s\0" "$@" | xargs -0 -n1 -P "${BREW_JOBS}" brew install --cask
    else
        printf "%s\0" "$@" | xargs -0 -n1 -P "${BREW_JOBS}" brew install --quiet
    fi
}

formula_name() {
    printf "%s\n" "${1##*/}"
}

install_missing_formulae() {
    local label="$1"
    shift
    local missing=()
    local package
    local name
    local failed=()

    refresh_brew_state
    for package in "$@"; do
        name="$(formula_name "${package}")"
        print_info "Checking formula ${name}"
        if ! brew_formula_installed "${name}"; then
            missing+=("${package}")
        else
            print_success "${name} already installed"
        fi
    done

    if (( ${#missing[@]} == 0 )); then
        print_success "All ${label} already installed"
        return 0
    fi

    print_info "Installing ${label}: ${missing[*]}"
    if [[ "${BREW_PARALLEL}" == "true" && ${#missing[@]} -gt 1 ]]; then
        if is_positive_int "${BREW_JOBS}"; then
            install_brew_parallel formula "${missing[@]}" || true
        else
            print_error "BREW_JOBS must be a positive integer; using sequential installs"
            install_brew_batch formula "${missing[@]}" || true
        fi
    else
        install_brew_batch formula "${missing[@]}" || true
    fi

    refresh_brew_state
    failed=()
    for package in "${missing[@]}"; do
        name="$(formula_name "${package}")"
        if brew_formula_installed "${name}"; then
            print_success "${name} installed"
            continue
        fi

        print_info "Retrying formula individually: ${package}"
        if install_brew_single formula "${package}"; then
            refresh_brew_state
        fi

        if ! brew_formula_installed "${name}"; then
            failed+=("${package}")
        fi
    done

    if (( ${#failed[@]} > 0 )); then
        record_failure "Failed to install ${label}: ${failed[*]}"
    fi
}

install_missing_casks() {
    local missing=()
    local package
    local failed=()

    refresh_brew_state
    for package in "$@"; do
        print_info "Checking cask ${package}"
        if ! brew_cask_installed "${package}"; then
            missing+=("${package}")
        else
            print_success "${package} already installed"
        fi
    done

    if (( ${#missing[@]} == 0 )); then
        print_success "All Homebrew casks already installed"
        return 0
    fi

    print_info "Installing Homebrew casks: ${missing[*]}"
    if [[ "${BREW_PARALLEL}" == "true" && ${#missing[@]} -gt 1 ]]; then
        if is_positive_int "${BREW_JOBS}"; then
            install_brew_parallel cask "${missing[@]}" || true
        else
            print_error "BREW_JOBS must be a positive integer; using sequential installs"
            install_brew_batch cask "${missing[@]}" || true
        fi
    else
        install_brew_batch cask "${missing[@]}" || true
    fi

    refresh_brew_state
    failed=()
    for package in "${missing[@]}"; do
        if brew_cask_installed "${package}"; then
            print_success "${package} installed"
            continue
        fi

        print_info "Retrying cask individually: ${package}"
        if install_brew_single cask "${package}"; then
            refresh_brew_state
        fi

        if ! brew_cask_installed "${package}"; then
            failed+=("${package}")
        fi
    done

    if (( ${#failed[@]} > 0 )); then
        record_failure "Failed to install Homebrew casks: ${failed[*]}"
    fi
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
OS=$(uname -s 2>/dev/null)
INTERACTIVE=false
if [[ -t 0 ]] && [[ -t 1 ]]; then
    INTERACTIVE=true
fi

print_info "Detected OS: ${OS}"
print_info "Interactive shell session: ${INTERACTIVE}"

# On Linux, we may need to install some packages.
DISTRO=""
if [[ "${OS}" == "Linux" ]]; then
    if [[ -f /etc/os-release ]] && grep -iq "Debian" /etc/os-release; then
        DISTRO="Debian"
        print_info "Detected Linux distro: ${DISTRO}"
    fi
fi

# Check for connectivity.
if internet_reachable; then
    print_success "Internet reachable"
else
    print_error "Cannot connect to the Internet"
    exit 1
fi

# Update the system & install core dependencies
if [[ "${OS}" == "Linux" ]] && [[ "${DISTRO}" == "Debian" ]]; then
    print_info "Updating apt package metadata"
    ensure_sudo
    retry sudo apt update
    retry sudo apt -y install build-essential curl file git

    print_info "Upgrading system packages"
    if ! retry sudo apt -y upgrade; then
        record_failure "apt upgrade failed"
    fi
else
    print_info "Skipping system package updates"
fi

# Generate an SSH key (if none) if we're in an interactive shell
if [[ "${INTERACTIVE}" == "true" ]] && [[ ! -f "${HOME}/.ssh/id_ed25519" ]]; then
    print_info "Generating new SSH key"
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
    ssh-keygen -t ed25519 -f "${HOME}/.ssh/id_ed25519" -C "${SSH_EMAIL}"
    print_success "Key generated"
    if [[ "${OS}" == "Darwin" ]]; then
        print_info "Adding key to Keychain"
        if ! ssh-add --apple-use-keychain "${HOME}/.ssh/id_ed25519"; then
            record_failure "Failed to add SSH key to Keychain"
        fi
    fi
fi

# Set up allowed_signers file for SSH commit signing
if [[ -f "${HOME}/.ssh/id_ed25519.pub" ]]; then
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
    if [[ ! -f "${HOME}/.ssh/allowed_signers" ]] || ! grep -q "${SSH_EMAIL}" "${HOME}/.ssh/allowed_signers" 2>/dev/null; then
        print_info "Adding SSH key to allowed_signers for git commit verification"
        printf "%s %s\n" "${SSH_EMAIL}" "$(cat "${HOME}/.ssh/id_ed25519.pub")" >> "${HOME}/.ssh/allowed_signers"
        chmod 600 "${HOME}/.ssh/allowed_signers"
        print_success "SSH signing configured"
    else
        print_success "SSH key already in allowed_signers"
    fi
fi

# Set up repos directory
mkdir -p "${HOME}/repos"

# Install Homebrew
setup_homebrew_path
if ! command -v brew &>/dev/null; then
    print_info "Installing Homebrew"
    retry bash -c 'set -euo pipefail; curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | env NONINTERACTIVE=1 /bin/bash'
    setup_homebrew_path

    if ! command -v brew &>/dev/null; then
        print_error "Homebrew installed, but brew is not on PATH"
        exit 1
    fi

    print_success "Homebrew installed"
else
    print_success "Homebrew/Linuxbrew already installed"
fi

# --- Homebrew
print_info "Installing Homebrew packages"

if ! retry brew tap thoughtbot/formulae; then
    record_failure "Failed to tap thoughtbot/formulae"
fi

if ! retry brew tap tobi/try https://github.com/tobi/try; then
    record_failure "Failed to tap tobi/try"
fi

install_missing_formulae "Homebrew packages" "${BREW_PACKAGES[@]}"

if [[ "${CF:-false}" == "true" ]]; then
    print_info "Installing Cloudflare Homebrew packages"
    if ! retry brew tap cloudflare/cloudflare; then
        record_failure "Failed to tap cloudflare/cloudflare"
    fi
    if ! retry brew tap cloudflare/engineering; then
        record_failure "Failed to tap cloudflare/engineering"
    fi
    install_missing_formulae "Cloudflare Homebrew packages" "${CF_BREW_PACKAGES[@]}"
else
    print_info "Skipping Cloudflare Homebrew packages (set CF=true to enable)"
fi

# Bun (Homebrew per https://bun.com/docs/installation)
install_missing_formulae "Bun" oven-sh/bun/bun

# reattach-to-user-namespace
if [[ "${OS}" == "Darwin" ]]; then
    install_missing_formulae "macOS tmux packages" reattach-to-user-namespace
fi

# Casks
if [[ "${OS}" == "Darwin" ]]; then
    print_info "Installing Homebrew casks"
    install_missing_casks "${CASKS[@]}"
else
    print_info "Skipping cask installation: not on macOS"
fi

print_success "Homebrew packages"

# --- dotfiles
# Clone & install dotfiles
print_info "Configuring dotfiles"
if ! command -v stow &>/dev/null; then
    install_missing_formulae "GNU Stow" stow
fi

if [[ ! -d "${HOME}/repos/dotfiles" ]]; then
    print_info "Cloning dotfiles"
    if ! retry git clone "${DOTFILES_REPO}" "${HOME}/repos/dotfiles"; then
        record_failure "Failed to clone dotfiles"
    fi
else
    print_info "dotfiles already cloned"
fi

if [[ -d "${HOME}/repos/dotfiles" ]] && command -v stow &>/dev/null; then
    print_info "Linking dotfiles"
    if stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .; then
        print_success "dotfiles installed"
    else
        record_failure "Failed to link dotfiles with stow"
    fi
else
    record_failure "Skipped dotfiles linking because the repo or stow is unavailable"
fi

# --- Configure zsh
if [[ ! -d "${HOME}/.oh-my-zsh" ]]; then
    print_info "Installing oh-my-zsh"
    if retry bash -c 'set -euo pipefail; curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | env RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -s -- --unattended'; then
        print_success "oh-my-zsh installed"
    else
        record_failure "Failed to install oh-my-zsh"
    fi
else
    print_success "oh-my-zsh already installed"
fi

if command -v zsh &>/dev/null; then
    zsh_path="$(command -v zsh)"
    if ! grep -qx "${zsh_path}" /etc/shells 2>/dev/null; then
        print_info "Adding ${zsh_path} to /etc/shells"
        if ensure_sudo && printf "%s\n" "${zsh_path}" | sudo tee -a /etc/shells >/dev/null; then
            print_success "zsh added to /etc/shells"
        else
            record_failure "Failed to add zsh to /etc/shells"
        fi
    fi

    if [[ "${INTERACTIVE}" == "true" ]] && [[ "${SHELL:-}" != "${zsh_path}" ]]; then
        print_info "Changing default shell to ${zsh_path}"
        if chsh -s "${zsh_path}"; then
            print_success "Default shell changed to zsh"
        else
            record_failure "Failed to change default shell to zsh"
        fi
    else
        print_info "Skipping chsh (noninteractive or already using zsh)"
    fi
else
    record_failure "zsh is unavailable; skipping shell configuration"
fi

# --- Install Atuin
if ! command -v atuin &>/dev/null && [[ ! -d "${HOME}/.atuin" ]]; then
    print_info "Installing Atuin"
    if ! retry bash -c "set -euo pipefail; curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh"; then
        record_failure "Failed to install Atuin"
    fi
else
    print_success "Atuin already installed"
fi

# --- Install nvm
if [[ ! -d "${HOME}/.nvm" ]]; then
    print_info "Installing nvm"
    if ! retry bash -c "set -euo pipefail; curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | PROFILE=/dev/null bash"; then
        record_failure "Failed to install nvm"
    fi
else
    print_success "nvm already installed"
fi

# Install uv - skip if already installed via brew
if ! command -v uv &>/dev/null; then
    print_info "Installing uv"
    if ! retry bash -c "set -euo pipefail; curl -LsSf https://astral.sh/uv/install.sh | sh"; then
        record_failure "Failed to install uv"
    fi
else
    print_success "uv already installed"
fi

# Install Rust via rustup
if ! command -v rustc &>/dev/null; then
    print_info "Installing Rust via rustup"
    if ! retry bash -c "set -euo pipefail; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"; then
        record_failure "Failed to install Rust via rustup"
    fi
else
    print_success "Rust already installed"
fi

if (( ${#FAILED_STEPS[@]} > 0 )); then
    print_error "Completed with failures:"
    for failed_step in "${FAILED_STEPS[@]}"; do
        printf "  - %s\n" "${failed_step}" >&2
    done
    exit 1
fi

print_success "All done! Visit https://github.com/elithrar/dotfiles for the full source & related configs."
