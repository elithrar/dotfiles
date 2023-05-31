#!/usr/bin/env bash

# Via https://github.com/elithrar <matt@eatsleeprepeat.net>
# Sets up a Linux and/or WSL (Windows Subsystem for Linux) based dev-environment.
# Inspired by https://github.com/minamarkham/formation (great!)

# Configuration
DOTFILES_REPO="https://github.com/elithrar/dotfiles"
BREW_PACKAGES=(asciinema cmake curl fd gifski git go htop jq lua make mkcert neovim nmap node python rcm ripgrep tmux tree wget wrk yarn youtube-dl zsh)
SSH_EMAIL="matt@eatsleeprepeat.net"
CLOUDSDK_INSTALL_DIR="${HOME}/repos"

# Colors
reset="$(tput sgr0)"
highlight="$(tput smso)"
dim="$(tput dim)"
red="$(tput setaf 1)"
blue="$(tput setaf 4)"
green="$(tput setaf 2)"
yellow="$(tput setaf 3)"
bold=$(tput bold)
normal=$(tput sgr0)
underline="$(tput smul)"
indent="   "

# Error handling
trap 'ret=$?; test $ret -ne 0 && printf "${red}Setup failed${reset}\n" >&2; exit $ret' EXIT
set -e

# --- Helpers
print_success() {
    printf "${green}✔ success:${reset} %b\n" "$1"
}

print_error() {
    printf "${red}✖ error:${reset} %b\n" "$1"
}

print_info() {
    printf "${blue}ⓘ info:${reset} %b\n" "$1"
}

# ------
# Setup
# ------
printf "
${yellow}
Running...
 _           _        _ _       _     
(_)_ __  ___| |_ __ _| | |  ___| |__  
| | '_ \/ __| __/ _  | | | / __| '_ \ 
| | | | \__ \ || (_| | | |_\__ \ | | |
|_|_| |_|___/\__\__,_|_|_(_)___/_| |_|
                                      
-----
- Sets up a macOS or Linux based development machine.
- Can be run in WSL on Windows
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
${reset}
"

# Check environments
OS=$(uname -s 2> /dev/null)
DISTRO=""
IS_WSL=false
INTERACTIVE=true
if [ "${OS}" = "Linux" ]; then
    # Check Debian vs. RHEL
    if [ -f /etc/os-release ] && $(grep -iq "Debian" /etc/os-release); then
        DISTRO="Debian"
    fi

    if $(grep -q "Microsoft" /proc/version); then
        IS_WSL=true
    fi
    
    if [[ $- == *i* ]]; then
        INTERACTIVE=true
    else
        INTERACTIVE=false
    fi
fi

print_info "Detected environment: ${OS} (distro: ${DISTRO})"
print_info "Windows for Linux Subsystem (WSL): ${IS_WSL}"
print_info "Interactive shell session: ${INTERACTIVE}"

# Check for connectivity
if [ ping -q -w1 -c1 google.com &>/dev/null ]; then
    print_error "Cannot connect to the Internet"
    exit 0
else
    print_success "Internet reachable"
fi

# Ask for sudo
sudo -v &> /dev/null

# Update the system & install core dependencies
if [ "$OS" = "Linux" ] && [ "$DISTRO" = "Debian" ]; then
    print_info "Updating system packages"
    sudo apt update
    sudo apt -y upgrade
    sudo apt -y install build-essential curl file git
else
    print_info "Skipping system package updates"
fi

# Generate an SSH key (if none) if we're in an interactive shell
if [ "$INTERACTIVE" = true ] && ! [[ -f "$HOME/.ssh/id_ed25519" ]]; then
    printf "🔑 Generating new SSH key"
    ssh-keygen -t ed25519 -f $HOME/.ssh/id_ed25519 -C "matt@eatsleeprepeat.net"
    print_info "Key generated!"
    if [ "$OS" = "Darwin" ]; then
      print_info "Adding key to Keychain"
      ssh-add --apple-use-keychain $HOME/.ssh/id_ed25519
    fi 
fi

# Set up repos directory
if [ ! -d "${HOME}/repos" ]; then
    mkdir -p $HOME/repos
fi

# Install Homebrew
if ! [ -x "$(command -v brew)" ]; then
    if [ "${OS}" = "Linux" ]; then
        # Install Linuxbrew - http://linuxbrew.sh/
        print_info "Installing Linuxbrew..."
        # Unattended
        echo "" | /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
        # Put 'brew' on the current path
        test -d ~/.linuxbrew && export PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:$PATH"
        eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
        print_success "Linuxbrew installed"
    elif [ "$OS" = "Darwin" ]; then
        print_info "Installing Homebrew..."
        curl -fsS 'https://raw.githubusercontent.com/Homebrew/install/master/install' | ruby
        export PATH="/usr/local/bin:$PATH"
        print_success "Homebrew installed"
    fi
else
    print_success "Homebrew/Linuxbrew already installed."
fi

# --- Homebrew
print_info "Installing Homebrew packages"
# Install taps first
brew tap thoughtbot/formulae
for pkg in "${BREW_PACKAGES[@]}"; do
    # Check if $pkg is already installed
    print_info "Checking package $pkg"
    if test ! $(brew list | grep $pkg); then
        print_info "Installing $pkg"
        brew install --quiet $pkg
    else 
        print_success "$pkg already installed"
    fi
done

# reattach-to-user-namespace
if [ "$OS" = "Darwin" ]; then
    brew install --quiet reattach-to-user-namespace
fi

# Casks
if [ "$OS" = "Darwin" ]; then
    print_info "Installing Homebrew Casks"
    for pkg in "${CASKS[@]}"; do
        # Check if $pkg is already installed
        print_info "Checking package $pkg"
        if test ! $(brew list --cask | grep $pkg); then
            print_info "Installing $pkg"
            brew install --cask $pkg
        else 
            print_success "$pkg already installed"
        fi
    done
else
    print_info "Skipping Cask installation: not on macOS"
fi

print_success "Homebrew packages 
# --- dotfiles
# Clone & install dotfiles
print_info "Configuring dotfiles"
if ! [ -x "$(command -v stow)" ]; then
    # Install GNU stow
    # https://linux.die.net/man/8/stow
    brew install stow
fi

if [ ! -d "${HOME}/repos/dotfiles"]; then
    print_info "Cloning dotfiles"
    git clone ${DOTFILES_REPO} "${HOME}/repos/dotfiles"
else
    print_info "dotfiles already cloned"
fi

print_info "Linking dotfiles"
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}"
print_success "dotfiles installed"

installed"

# --- Configure zsh
if [ ! -d "${HOME}/.oh-my-zsh" ]; then
    print_info "Installing oh-my-zsh"
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
    command -v zsh | sudo tee -a /etc/shells
    chsh -s $(which zsh)
else
    print_success "oh-my-zsh already installed"
fi

# gcloud SDK
if ! [ -f "${CLOUDSDK_INSTALL_DIR}/google-cloud-sdk" ]; then
    print_info "Installing gcloud SDK"
    curl https://sdk.cloud.google.com > install_gcloud.sh
    bash install_gcloud.sh --disable-prompts --install-dir="${CLOUDSDK_INSTALL_DIR}/google-cloud-sdk"
    print_success "gcloud SDK installed"
else
    print_success "gcloud SDK already installed"
fi

# Fly.io
if ! [ -f "${HOME}/.fly" ]; then
    print_info "Installing flyctl"
    curl -L https://fly.io/install.sh | sh
    print_success "flyctl installed"
else
    print_success "flyctl already installed"
fi

print_success "All done! Visit https://github.com/elithrar/dotfiles for the full source & related configs."
