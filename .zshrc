ZSH=$HOME/.oh-my-zsh
ZSH_THEME="robbyrussell"

# Completion options
CASE_SENSITIVE="false"
HYPHEN_INSENSITIVE="true"

umask 027

autoload -Uz bracketed-paste-magic
zle -N bracketed-paste bracketed-paste-magic

# Plugins: can be found in ~/.oh-my-zsh/plugins/*
plugins=(
	colored-man-pages
	command-not-found
	gem
	git
	github
	golang
	pip
	python
	tmux
	yarn
	zsh-autosuggestions
	zsh-syntax-highlighting
	)

source $ZSH/oh-my-zsh.sh

# keybinding mode
bindkey -e

# Follow symbolic links
alias cd="cd -P"
alias gl="git --no-pager log --oneline --decorate -n 10"
alias zshconfig="$EDITOR ~/.zshrc"
alias lsa="ls -alh"
alias sloc="find . -name '*.go' | xargs wc -l"
alias unixts="date +%s"
alias iso8601="date -u +'%Y-%m-%dT%H:%M:%SZ'"
alias less="less -X"
alias sl="ls"
alias oc="opencode --continue"
unalias gb

# Go
export GOPATH=$HOME/repos/go
export GOBIN=$GOPATH/bin
alias todo="godoc -notes="TODO" ."
alias gtvc="go test -v -race -cover ."
alias godoc-this="godoc -http=:6060; open http://localhost:6060/pkg"
alias coverhtml="go test -coverprofile=coverage.out; go tool cover -html=coverage.out -o coverage.html"

# macOS specific
if [ "$(uname -s 2> /dev/null)" = "Darwin" ]; then
	# Keychain + SSH (macOS only)
	ssh-add --apple-use-keychain ~/.ssh/id_ed25519 2>/dev/null

	# macOS screenshots -> clipboard
	defaults write com.apple.screencapture target clipboard 2>/dev/null

	flush-dns() {
	    sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder; echo "DNS cache flushed"
	}

	get_new_mac() {
	    sudo /System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport -z && \
	    sudo ifconfig en0 ether a0$(openssl rand -hex 5 | sed 's/\(.\{2\}\)/:\1/g') && \
	    networksetup -detectnewhardware
	}

	alias airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport"

	# Homebrew paths (Apple Silicon uses /opt/homebrew, Intel uses /usr/local)
	# These are usually set by /etc/zprofile but we ensure they're present
fi

# Linux specific
if [ "$(uname -s 2> /dev/null)" = "Linux" ]; then
	# WSL specific
	if [[ -n "$USERPROFILE" ]]; then
		cdpath+=(
			$USERPROFILE/Dropbox
			$USERPROFILE/Downloads
		)
	fi
fi

# Shortcut to edit long commands in vim via ESC + v
autoload -U edit-command-line
zle -N edit-command-line
bindkey '^xe' edit-command-line
bindkey '^x^e' edit-command-line

# helper functions
mins-ago() {
    echo $(expr $(unixts) - 60 \* $1)
}

hours-ago() {
    echo $(expr $(unixts) - 3600 \* $1)
}

yesterday() {
    echo $(expr $(unixts) - 86400)
}

time-at() {
    date -r $1
}

# tmux
alias tmux="tmux -2 -u"
if command -v tmux >/dev/null 2>&1; then
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

# prompt
# Git prompt colors and symbols
ZSH_THEME_GIT_PROMPT_PREFIX=" %F{208}("
ZSH_THEME_GIT_PROMPT_SUFFIX=")%f"
ZSH_THEME_GIT_PROMPT_DIRTY=" ✗"
ZSH_THEME_GIT_PROMPT_CLEAN=" ✓"

NEWLINE=$'\n'
export PROMPT='%{$fg_bold[green]%}%p%{$fg_bold[blue]%}%~$(git_prompt_info)% %{$reset_color%}${NEWLINE}${ret_status}%{$reset_color%}➜ '
export TERM="xterm-256color"

# editor
unalias zed 2>/dev/null || true
zed() {
  if [ -d "/Applications/Zed Preview.app" ]; then
    open "$1" -a "Zed Preview" --wait
  else
    open "$1" -a "Zed" --wait
  fi
}
export EDITOR="zed"


# ripgrep
export RIPGREP_CONFIG_PATH=$HOME/.ripgreprc

export NO_D1_WARNING=1

# nvm (https://github.com/nvm-sh/nvm)
export NVM_DIR="$HOME/.nvm"
# Lazy load nvm - only loads when nvm/node/npm/npx is called
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # Defer nvm loading
  nvm() {
    unset -f nvm node npm npx
    source "$NVM_DIR/nvm.sh"
    nvm "$@"
  }

  node() {
    unset -f nvm node npm npx
    source "$NVM_DIR/nvm.sh"
    node "$@"
  }

  npm() {
    unset -f nvm node npm npx
    source "$NVM_DIR/nvm.sh"
    npm "$@"
  }

  npx() {
    unset -f nvm node npm npx
    source "$NVM_DIR/nvm.sh"
    npx "$@"
  }
fi

# rbenv (https://github.com/rbenv/rbenv)
export RBENV_SHELL=zsh
command rbenv rehash 2>/dev/null
rbenv() {
  local command
  command="${1:-}"
  if [[ "$#" -gt 0 ]]; then
    shift
  fi

  case "$command" in
  rehash|shell)
    eval "$(rbenv "sh-$command" "$@")";;
  *)
    command rbenv "$command" "$@";;
  esac
}

# atuin shell plugin
eval "$(atuin init zsh)"

# ============================================================================
# PATH CONFIGURATION - Consolidated for clarity
# ============================================================================
# Note: Order matters! Earlier entries take precedence.

# User-specific bins
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.sst/bin:$PATH"
export PATH="$HOME/.codeium/windsurf/bin:$PATH"

# Ruby (rbenv)
export PATH="$HOME/.rbenv/shims:$PATH"

# Rust
export PATH="$HOME/.cargo/bin:$PATH"

# Go
export PATH="$GOBIN:$PATH"

# Homebrew curl (override system curl)
export PATH="/usr/local/opt/curl/bin:$PATH"

# Remove duplicate PATH entries
trim_path

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
