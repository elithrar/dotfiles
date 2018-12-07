#!/usr/bin/env bash

# Via https://github.com/elithrar <matt@eatsleeprepeat.net>
# Sets up a Linux and/or WSL (Windows Subsystem for Linux) based dev-environment.
# Inspired by https://github.com/minamarkham/formation (great!)

# Configuration
DOTFILES_REPO="https://github.com/elithrar/dotfiles"
BREW_PACKAGES=(asciinema cmake curl gifski git go htop jq jupyter lua make neovim nmap node python ripgrep tree wget wrk yarn youtube-dl zsh)
SSH_EMAIL="matt@eatsleeprepeat.net"

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
    printf "${blue}🛈 info:${reset} %b\n" "$1"
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
- Sets up a Linux or macOS based development machine.
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
${reset}
"

# Check environments
OS=$(uname -s 2> /dev/null)
if [ "${OS}" = "Linux" ]; then
    IS_WSL=false
    # Check Debian vs. RHEL
    if [ -f /etc/os-release ] && $(grep -iq "Debian" /etc/os-release); then
        DISTRO="Debian"
    fi

    if $(grep -q "Microsoft" /proc/version); then
        IS_WSL=true
    fi
fi
print_info "Detected environment: ${OS} - ${DISTRO} (WSL: ${IS_WSL})"

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
    sudo apt-get update
    sudo apt-get -y upgrade
    sudo apt-get -y install build-essential curl file git
else
    print_info "Skipping system package updates"
fi

# Generate an SSH key (if none)
if ! [[ -f "$HOME/.ssh/id_ed25519" ]]; then
    printf "🔑 Generating new SSH key"
    ssh-keygen -t ed25519 -f $HOME/.ssh/id_ed25519 -C "matt@eatsleeprepeat.net"
    print "Key generated!"
fi

# Install Homebrew
if ! [ -x "$(command -v brew)" ]; then
    if [ "${OS}" = "Linux" ]; then
        # Install Linuxbrew - http://linuxbrew.sh/
        print_info "Installing Linuxbrew..."
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/Linuxbrew/install/master/install.sh)"
        test -d ~/.linuxbrew && export PATH="$HOME/.linuxbrew/bin:$HOME/.linuxbrew/sbin:$PATH"
        print_success "Linuxbrew installed"
    elif [ "$OS_ENV" = "macOS" ]; then
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
for pkg in "${BREW_PACKAGES[@]}"; do
    # Check if $pkg is already installed
    print_info "Checking package $pkg"
    if test ! $(brew list | grep $pkg); then
        print_info "Installing $pkg"
        brew install $pkg
    else 
        print_success "$pkg already installed"
    fi
done
print_success "Homebrew packages installed"

# --- Configure zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    print_info "Installing oh-my-zsh"
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
    command -v zsh | sudo tee -a /etc/shells
    chsh -s $(which zsh)
else
    print_success "oh-my-zsh already installed"
fi

# Set up repos directory outside of WSL
if [[ "${WSL}" = true ]] && [[ -z "${USERPROFILE}"]]; then
    mkdir -p "${USERPROFILE}/repos"
fi

# --- dotfiles
# Clone & install dotfiles
print_info "Configuring dotfiles"
if ! [ -x "$(command -v rcup)" ]; then
    # Install rcup
    brew tap thoughtbot/formulae
    brew install rcm
elif ! [ -d "${USERPROFILE}/repos/dotfiles"]; then
    print_info "Cloning dotfiles"
    git clone ${DOTFILES_REPO} "${USERPROFILE}/repos/dotfiles"
else
    print_info "Linking dotfiles"
    rcup -d "${USERPROFILE}/repos/dotfiles"
    print_success "dotfiles installed"
fi

# --- Setup VSCode (dotfiles -> copy into /mnt/c/ location)

print_success "All done! Visit https://github.com/elithrar/dotfiles for the full source & related configs."
