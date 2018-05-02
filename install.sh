#!/bin/bash
set -eu

# Lives at https://github.com/elithrar/dotfiles
# Inspired by https://github.com/skovhus/setup

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

SETTINGS=(
  # Enable repeat on keydown
  "defaults write -g ApplePressAndHoldEnabled -bool false"
  # Use current directory as default search scope in Finder
  "defaults write com.apple.finder FXDefaultSearchScope -string 'SCcf'"
  # Show Path bar in Finder
  "defaults write com.apple.finder ShowPathbar -bool true"
  # Show Status bar in Finder
  "defaults write com.apple.finder ShowStatusBar -bool true"
  # Hide the Dock
  "defaults write com.apple.Dock autohide -bool TRUE;"
  "killall Dock"
  # Set a blazingly fast keyboard repeat rate
  "defaults write NSGlobalDomain KeyRepeat -int 1"
  # Set a shorter Delay until key repeat
  "defaults write NSGlobalDomain InitialKeyRepeat -int 15"
  # Enable Safari’s debug menu
  "defaults write com.apple.Safari IncludeInternalDebugMenu -bool true"
  # Add a context menu item for showing the Web Inspector in web views
  "defaults write NSGlobalDomain WebKitDeveloperExtras -bool true"
  # Show the ~/Library folder
  "chflags nohidden ~/Library"
  # Increase ulimit
  "sudo launchctl limit maxfiles 2048 16384"
)

# Apply macOS preferences
for setting in $SETTINGS do
  sh -c $setting
done

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

  # Manually link our themes
  mkdir -p ~/.oh-my-zsh/themes/
  for theme in $(ls *.zsh-theme) do
    ln -fs $DOTFILES_DIR/$theme ~/.oh-my-zsh/themes/$theme
  done
fi

# Install other brew packages
echo "🔨 Installing fonts"
if test $(which brew)
  brew tap caskroom/fonts
  brew cask install font-fira-mono
  brew cask install font-fira-sans
  brew cask install font-ibm-plex
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
