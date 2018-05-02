#!/bin/bash
set -eu

DOTFILES=https://github.com/elithrar/dotfiles
DOTFILES_DIR=$HOME/.dotfiles

# Homebrew packages
PACKAGES=(
  git
  curl
  wget
  go
  jq
  make
  node
  yarn
  python
  ripgrep
  neovim
  cmake
  tree
  htop
  wrk
  gifski
)

# Apps available as Homebrew Casks
APPS=(
  blockblock
  docker
  dropbox
  evernote
  google-cloud-sdk
  spectacle
  spotify
  visual-studio-code
)

# Enable key repeat
defaults write -g ApplePressAndHoldEnabled -bool false
# Increase ulimit
sudo launchctl limit maxfiles 2048 16384

if test ! $(which brew)
then
  echo "🔨 Installing Homebrew"
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi

if test ! -d $HOME/.oh-my-zsh
then
  echo "🔨 Installing zsh & tmux"
  brew install zsh tmux
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
fi

echo "🔨 Installing developer tooling"
if test $(which brew)
then
  brew update
  brew upgrade

  for pkg in $PACKAGES
  do
    brew install $pkg
  done

  brew tap thoughtbot/formulae
  brew install rcm
fi

# Setup dotfiles
echo "🔨 Configuring dotfiles"
if test ! -d $DOTFILES_DIR
then
  git clone $DOTFILES $DOTFILES_DIR
fi

if test $(which rcup)
then
  # Symlink dotfiles
  rcup -d $DOTFILES_DIR

  # Manually link the theme
  mkdir -p ~/.oh-my-zsh/themes/
  ln -fs $DOTFILES_DIR/dracula.zsh-theme ~/.oh-my-zsh/themes/dracula.zsh-theme
fi

# Install other brew packages
echo "🔨 Installing fonts"
if test $(which brew)
  brew tap caskroom/fonts
  brew cask install font-fira-mono
  brew cask install font-fira-sans
  brew cask install font-ibm-plex
fi

echo "🔨 Installing Python & Node packages"
if test $(which pip)
then
  # Python packages
  pip install requests virtualenv pep8 pylint flake8
fi

if test $(which yarn)
then
  # Node packages
  yarn global add typescript eslint tslint
fi

# Install macOS apps
echo "🔨 Installing macOS applications"
if test $(which brew)
then
  for app in $APPS
  do
    brew cask install $app
  done
fi

# VS Code
echo "🔨 Configuring VS code"
if test -d $DOTFILES_DIR
then
  mkdir -p ~/Library/Application\ Support/Code/User
  ln -fs $DOTFILES_DIR/vs-code/settings.json ~/Library/Application\ Support/Code/User
  ln -fs $DOTFILES_DIR/keybindings.json ~/Library/Application\ Support/Code/User

  if test -f $DOTFILES_DIR/extensions.list; do
    for module in `cat extensions.list`; do
        code --install-extension "$module" || true
    done
  done
else
  echo "🚨 dotfiles directory not found"
  exit 1
fi

echo "💫 Done!"
