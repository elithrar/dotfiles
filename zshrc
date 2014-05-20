# Path to your oh-my-zsh configuration.
ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
ZSH_THEME="simple"

# aliases
alias zshconfig="nano ~/.zshrc"
alias lsa="ls -alh"
alias airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport"

# Set to this to use case-sensitive completion
# CASE_SENSITIVE="true"

# Comment this out to disable weekly auto-update checks
# DISABLE_AUTO_UPDATE="true"

# Uncomment following line if you want to disable colors in ls
# DISABLE_LS_COLORS="true"

# Uncomment following line if you want to disable autosetting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment following line if you want red dots to be displayed while waiting for completion
# COMPLETION_WAITING_DOTS="true"

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
plugins=(
	brew
	gem
	git
	github
	golang
	heroku
	pip
	python
	sublime
	tmux
	vagrant
	)

# tmux
alias tmux="tmux -2"
if which tmux 2>&1 >/dev/null; then
    test -z "$TMUX" && (tmux attach || tmux new-session)
fi

# irssi + tmux (via http://alexyu.se/comment/35)

IRSSI_PATH=`which irssi`

source $ZSH/oh-my-zsh.sh

# PATH related settings

# Removes duplicate PATH entries but keeps the original order.
# https://github.com/gabebw/dotfiles/blob/master/zsh/path.zsh
trim_path() {
  # http://chunchung.blogspot.com/2007/11/remove-duplicate-paths-from-path-in.html
  export PATH=$(awk -F: '{for(i=1;i<=NF;i++){if(!($i in a)){a[$i];printf s$i;s=":"}}}'<<<$PATH)
}

env-update() { export PATH=$PATH; }

# man pages
MANPATH=/usr/share/man:/usr/local/share/man:/usr/X11/share/man:/usr/X11/man:/usr/local/man

# cd directly into these directories
cdpath=($HOME/Dropbox/code $HOME/Dropbox/uni)

# Homebrew
PATH="/usr/local/bin:/usr/local/sbin:$PATH"

# rbenv
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"

# node.js path
export NODE_PATH="/usr/local/lib/node"
export PATH="/usr/local/share/npm/bin:$PATH"

# virtualenvwrapper
export WORKON_HOME=~/.envs

# DigitalOcean
export SSL_CERT_FILE=/usr/local/opt/curl-ca-bundle/share/ca-bundle.crt

# Packer
export PATH="/usr/local/packer:$PATH"

# Bower
alias bower='noglob bower'

# app-specific vars
export WWG_SETTINGS="/Users/matt/Dropbox/code/workwithgo/dev-sql.toml"

# golang
export GOPATH=$HOME/.go
export PATH=$HOME/.go/bin:$PATH

# editor
export EDITOR='vim'

export PATH
trim_path

