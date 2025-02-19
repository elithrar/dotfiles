ZSH=$HOME/.oh-my-zsh
# Set name of the theme to load.
# Looks in ~/.oh-my-zsh/themes/
ZSH_THEME="dracula"

umask 027

autoload -Uz bracketed-paste-magic
zle -N bracketed-paste bracketed-paste-magic

# Plugins: can be found in ~/.oh-my-zsh/plugins/*
plugins=(
	gem
	git
	github
	golang
	pip
	python
	tmux
	yarn
	)

source $ZSH/oh-my-zsh.sh

# keybinding mode
bindkey -e

# Follow symbolic links
alias cd="cd -P"
alias gl="git --no-pager log --oneline --decorate -n 10"
alias zshconfig="nano ~/.zshrc"
alias lsa="ls -alh"
alias sloc="find . -name '*.go' | xargs wc -l"
alias unixts="date +%s"
alias iso8601="date -u +'%Y-%m-%dT%H:%M:%SZ'"
alias less="less -X"
unalias gb

# Rust
export PATH=$HOME/.cargo/bin:$PATH

# Go
export GOPATH=$HOME/repos/go
export GOBIN=$GOPATH/bin
export PATH=$GOBIN:$PATH
alias todo="godoc -notes="TODO" ."
alias gtvc="go test -v -race -cover ."
alias godoc-this="godoc -http=:6060; open http://localhost:6060/pkg"
alias coverhtml="go test -coverprofile=coverage.out; go tool cover -html=coverage.out -o coverage.html"

# macOS specific
if [ "$(uname -s 2> /dev/null)" = "Darwin" ]; then
	printf "Applying macOS specific settings\n"
	flush-dns() {
	    sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder; echo "DNS cache flushed"
	}

	get_new_mac() {
	    sudo /System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport -z && \
	    sudo ifconfig en0 ether a0$(openssl rand -hex 5 | sed 's/\(..\)/:\1/g') && \
	    networksetup -detectnewhardware
	}

	alias airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport"

	# Homebrew
	PATH="/usr/local/bin:/usr/local/sbin:$PATH"
fi

# Linux specific
if [ "$(uname -s 2> /dev/null)" = "Linux" ]; then
	# Linuxbrew
	test -d ~/.linuxbrew && PATH="$HOME/.linuxbrew/bin:$HOME/.linuxbrew/sbin:$PATH"
	test -d /home/linuxbrew/.linuxbrew && PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin:$PATH"

	# WSL specific
	if [ ! -z "$USERPROFILE" ]; then
		cdpath+=(
			$USERPROFILE/Dropbox
			$USERPROFILE/Downloads
		)
	fi
fi

# gcloud SDK
GCLOUD_SDK_DIR="$HOME/repos/google-cloud-sdk"
if [[ -d "${GCLOUD_SDK_DIR}/bin" ]]; then
	PATH=$PATH:$GCLOUD_SDK_DIR/bin
fi

# cd directly into these directories
cdpath+=(
    $GOPATH/src/github.com
    $GOPATH/src/golang.org
    )

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

# editor
if [ -x "$(command -v zed)" ]; then
    export EDITOR='zed'
else
    export EDITOR="vim"
fi

# ripgrep
export RIPGREP_CONFIG_PATH=$HOME/.ripgreprc

NEWLINE=$'\n'
export PROMPT='%{$fg_bold[green]%}%p%{$fg_bold[blue]%}%~ $(git_prompt_info)% %{$reset_color%}${NEWLINE}${ret_status}%{$reset_color%} '
export TERM="xterm-256color"

export PATH="/usr/local/opt/curl/bin:$PATH"
export NO_D1_WARNING=1

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/matt/repos/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/matt/repos/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/matt/repos/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/matt/repos/google-cloud-sdk/completion.zsh.inc'; fi

# nvm (https://github.com/nvm-sh/nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# rbenv (https://github.com/rbenv/rbenv)
eval "$(rbenv init - zsh)"

# sst
export PATH=/Users/matt/.sst/bin:$PATH

# Created by `pipx` on 2024-07-11 12:31:03
export PATH="$PATH:/Users/matt/.local/bin"

# atuin shell plugin
eval "$(atuin init zsh)"

export PATH
trim_path

# Added by Windsurf
export PATH="/Users/matt/.codeium/windsurf/bin:$PATH"
