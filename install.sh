#!/usr/bin/env bash

# Dotfiles installer for Charlie Gleason (superhighfives)
# Sets up a macOS development machine from scratch.
# Safe to run repeatedly (idempotent - checks before installing).
#
# Usage:
#   sh install.sh 2>&1 | tee ~/install.log

set -euo pipefail

# --- Configuration ---
DOTFILES_REPO="https://github.com/superhighfives/dotfiles"
DOTFILES_DIR="${HOME}/Development/dotfiles"
SSH_EMAIL="hi@charliegleason.com"

VSCODE_EXTENSIONS=(
  anthropic.claude-code
  astro-build.astro-vscode
  biomejs.biome
  bradlc.vscode-tailwindcss
  sst-dev.opencode
  teabyii.ayu
  unifiedjs.vscode-mdx
)

# --- Colors ---
if command -v tput &>/dev/null && tput sgr0 &>/dev/null; then
  reset="$(tput sgr0)"
  red="$(tput setaf 1)"
  blue="$(tput setaf 4)"
  green="$(tput setaf 2)"
  yellow="$(tput setaf 3)"
else
  reset="" red="" blue="" green="" yellow=""
fi

# --- Error handling ---
ret=0
trap 'ret=$?; [[ $ret -ne 0 ]] && printf "%s\n" "${red}Setup failed${reset}" >&2; exit $ret' EXIT

# --- Helpers ---
print_success() { printf "%s %b\n" "${green}✔${reset}" "$1"; }
print_error()   { printf "%s %b\n" "${red}✖${reset}" "$1"; }
print_info()    { printf "%s %b\n" "${blue}ⓘ${reset}" "$1"; }
print_step()    { printf "\n%s %b\n" "${yellow}→${reset}" "$1"; }

# --- Banner ---
cat <<EOF
${yellow}
 _           _        _ _       _
(_)_ __  ___| |_ __ _| | |  ___| |__
| | '_ \\/ __| __/ _  | | | / __| '_ \\
| | | | \\__ \\ || (_| | | |_\\__ \\ | | |
|_|_| |_|___/\\__\\__,_|_|_(_)___/_| |_|
${reset}
Sets up a macOS development machine.
Safe to run repeatedly (idempotent).
Repository: ${DOTFILES_REPO}
EOF

# --- Environment detection ---
OS=$(uname -s 2>/dev/null)
INTERACTIVE=false
if [[ -t 0 ]] && [[ -t 1 ]]; then
  INTERACTIVE=true
fi

print_info "OS: ${OS} | Interactive: ${INTERACTIVE}"

if [[ "${OS}" != "Darwin" ]]; then
  print_error "This script is designed for macOS. Exiting."
  exit 1
fi

# --- Check connectivity ---
print_step "Checking internet connectivity"
if ! ping -q -t1 -c1 google.com &>/dev/null; then
  print_error "Cannot connect to the Internet"
  exit 1
fi
print_success "Internet reachable"

# --- Homebrew ---
print_step "Setting up Homebrew"
if ! command -v brew &>/dev/null; then
  print_info "Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [[ -x "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x "/usr/local/bin/brew" ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
  print_success "Homebrew installed"
else
  print_success "Homebrew already installed"
fi

# --- Clone dotfiles (needed for Brewfile) ---
print_step "Setting up dotfiles repository"
if [[ ! -d "${DOTFILES_DIR}" ]]; then
  print_info "Cloning dotfiles..."
  mkdir -p "$(dirname "${DOTFILES_DIR}")"
  git clone "${DOTFILES_REPO}" "${DOTFILES_DIR}"
  print_success "Dotfiles cloned"
else
  print_success "Dotfiles already cloned"
fi

# --- Install packages from Brewfile ---
print_step "Installing Homebrew packages"
if [[ -f "${DOTFILES_DIR}/Brewfile" ]]; then
  brew bundle --file="${DOTFILES_DIR}/Brewfile" --no-lock
  print_success "Homebrew packages installed"
else
  print_error "Brewfile not found at ${DOTFILES_DIR}/Brewfile"
fi

# --- mise (runtime version manager) ---
print_step "Setting up mise"
if ! command -v mise &>/dev/null && [[ ! -x "$HOME/.local/bin/mise" ]]; then
  print_info "Installing mise..."
  curl https://mise.run | sh
  export PATH="$HOME/.local/bin:$PATH"
  print_success "mise installed"
else
  print_success "mise already installed"
fi

if [[ -f "${DOTFILES_DIR}/.tool-versions" ]]; then
  print_info "Installing runtimes from .tool-versions..."
  "$HOME/.local/bin/mise" install --yes 2>/dev/null || mise install --yes 2>/dev/null || true
  print_success "Runtimes installed"
fi

# --- oh-my-zsh ---
print_step "Setting up oh-my-zsh"
if [[ ! -d "${HOME}/.oh-my-zsh" ]]; then
  print_info "Installing oh-my-zsh..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
  if ! grep -q "$(command -v zsh)" /etc/shells; then
    command -v zsh | sudo tee -a /etc/shells
  fi
  chsh -s "$(command -v zsh)"
  print_success "oh-my-zsh installed"
else
  print_success "oh-my-zsh already installed"
fi

# --- Powerlevel10k theme ---
print_step "Setting up Powerlevel10k"
P10K_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
if [[ ! -d "${P10K_DIR}" ]]; then
  print_info "Installing Powerlevel10k..."
  git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${P10K_DIR}"
  print_success "Powerlevel10k installed"
else
  print_success "Powerlevel10k already installed"
fi

# --- zsh plugins ---
print_step "Setting up zsh plugins"
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"

if [[ ! -d "${ZSH_CUSTOM}/plugins/zsh-autosuggestions" ]]; then
  print_info "Installing zsh-autosuggestions..."
  git clone https://github.com/zsh-users/zsh-autosuggestions "${ZSH_CUSTOM}/plugins/zsh-autosuggestions"
  print_success "zsh-autosuggestions installed"
else
  print_success "zsh-autosuggestions already installed"
fi

if [[ ! -d "${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting" ]]; then
  print_info "Installing zsh-syntax-highlighting..."
  git clone https://github.com/zsh-users/zsh-syntax-highlighting "${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting"
  print_success "zsh-syntax-highlighting installed"
else
  print_success "zsh-syntax-highlighting already installed"
fi

# --- SSH key ---
print_step "Setting up SSH"
mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"

if [[ ! -f "${HOME}/.ssh/id_ed25519" ]]; then
  if [[ "${INTERACTIVE}" == true ]]; then
    print_info "Generating SSH key..."
    ssh-keygen -t ed25519 -f "${HOME}/.ssh/id_ed25519" -C "${SSH_EMAIL}"
    ssh-add --apple-use-keychain "${HOME}/.ssh/id_ed25519"
    print_success "SSH key generated and added to Keychain"
    echo ""
    print_info "Add your public key to GitHub: https://github.com/settings/keys"
    cat "${HOME}/.ssh/id_ed25519.pub"
    echo ""
  else
    print_info "Skipping SSH key generation (non-interactive mode)"
  fi
else
  print_success "SSH key already exists"
fi

# Set up allowed_signers for git commit signing
if [[ -f "${HOME}/.ssh/id_ed25519.pub" ]]; then
  if [[ ! -f "${HOME}/.ssh/allowed_signers" ]] || ! grep -q "${SSH_EMAIL}" "${HOME}/.ssh/allowed_signers" 2>/dev/null; then
    print_info "Configuring SSH commit signing..."
    echo "${SSH_EMAIL} $(cat "${HOME}/.ssh/id_ed25519.pub")" >> "${HOME}/.ssh/allowed_signers"
    print_success "SSH signing configured"
  else
    print_success "SSH signing already configured"
  fi
fi

# --- Link dotfiles with stow ---
print_step "Linking dotfiles"
if ! command -v stow &>/dev/null; then
  brew install stow
fi

print_info "Linking dotfiles with stow..."
stow --dir="${DOTFILES_DIR}" --target="${HOME}" .
print_success "Dotfiles linked"

# --- VS Code / Cursor extensions ---
print_step "Installing editor extensions"
for ext_cmd in "code" "cursor"; do
  if command -v "${ext_cmd}" &>/dev/null; then
    print_info "Installing ${ext_cmd} extensions..."
    for ext in "${VSCODE_EXTENSIONS[@]}"; do
      "${ext_cmd}" --install-extension "${ext}" --force 2>/dev/null || true
    done
    print_success "${ext_cmd} extensions installed"
  fi
done

# --- Done ---
cat <<EOF

${green}✔ All done!${reset}

${yellow}Manual steps remaining:${reset}

  1. ${blue}Secrets:${reset}
     cp ${DOTFILES_DIR}/.secrets.example ~/.secrets
     # Edit ~/.secrets and fill in your tokens
     cp ${DOTFILES_DIR}/.npmrc.example ~/.npmrc
     # Edit ~/.npmrc or set NPM_TOKEN in ~/.secrets

  2. ${blue}GitHub CLI:${reset}
     gh auth login

  3. ${blue}Font:${reset}
     Install Berkeley Mono (TX-02) from https://usgraphics.com/products/berkeley-mono

  4. ${blue}Sparkle / Pika (optional):${reset}
     git clone <sparkle-repo> ~/Development/sparkle
     # Set up SSH deploy keys as needed

  5. ${blue}rclone (optional):${reset}
     # Configure rclone remotes for encrypted storage
     rclone config

  6. ${blue}Restart your terminal${reset} to apply all changes.

EOF
