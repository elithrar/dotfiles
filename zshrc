# Path to your oh-my-zsh configuration.
ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
ZSH_THEME="simple"

# Homebrew
PATH="/usr/local/bin:/usr/local/sbin:$PATH"

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
	tmux
	vagrant
	yarn
	)

source $ZSH/oh-my-zsh.sh

# keybinding mode
bindkey -e

# aliases
alias code="code --wait"
# old habits die hard
alias vi="code --wait"
alias vim="code --wait"
alias actuallyvim="nvim"
# Follow symbolic links
alias cd="cd -P"
alias gl="git --no-pager log --oneline --decorate -n 10"
alias zshconfig="nano ~/.zshrc"
alias lsa="ls -alh"
alias airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport"
alias sloc="find . -name '*.go' | xargs wc -l"
alias unixts="date +%s"
alias serve="ruby -run -e httpd -- -p 8000 ."
alias iso8601="date -u +'%Y-%m-%dT%H:%M:%SZ'"
alias vup="vagrant up; vagrant ssh"
unalias gb

# Shortcut to edit long commands in vim via ESC + v
autoload -U edit-command-line
zle -N edit-command-line
bindkey '^xe' edit-command-line
bindkey '^x^e' edit-command-line

# helper functions
mins-ago() {
    echo `expr $(unixts) - 60 \* $1`
}

hours-ago() {
    echo `expr $(unixts) - 3600 \* $1`
}

yesterday() {
    echo `expr $(unixts) - 86400`
}

time-at() {
    date -r $1
}

flush-dns() {
    sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder; echo "DNS cache flushed"
}

# tmux
alias tmux="tmux -2 -u"
if which tmux 2>&1 >/dev/null; then
    test -z "$TMUX" && (tmux attach || tmux new-session)
fi

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

# Ansible
export ANSIBLE_CONFIG=$HOME/.ansible.cfg

# rbenv
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"

# node.js path
export NODE_PATH="/usr/local/lib/node"
export PATH="/usr/local/share/npm/bin:$PATH"

# Packer
export PATH="/usr/local/packer:$PATH"

# Go
export GOPATH=$HOME/.go
export GOBIN=$GOPATH/bin
export PATH=$GOBIN:$PATH:/usr/local/opt/go/libexec/bin
export GOROOT=/usr/local/opt/go/libexec
alias todo="godoc -notes="TODO" ."
alias gtvc="go test -v -race -cover ."
alias godoc-this="godoc -http=:6060; open http://localhost:6060/pkg"
alias coverhtml="go test -coverprofile=coverage.out; go tool cover -html=coverage.out -o coverage.html"

# Swift
if which swiftenv > /dev/null; then eval "$(swiftenv init -)"; fi

# editor
export EDITOR='code --wait -reuse-window'

# Docker
# eval $(docker-machine env default)

# cd directly into these directories
cdpath=(
    $GOPATH/src/github.com
    $GOPATH/src/golang.org
    $HOME/Dropbox/code
    $HOME/Google\ Drive/code
    $HOME/Google\ Drive
    )


export PATH
trim_path
if which swiftenv > /dev/null; then eval "$(swiftenv init -)"; fi
