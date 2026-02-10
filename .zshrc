ZSH=$HOME/.oh-my-zsh
ZSH_THEME="robbyrussell"

# Force async git prompt since we wrap git_prompt_info in _vcs_prompt_info
# and oh-my-zsh's auto-detection doesn't find it in PROMPT directly
zstyle ':omz:alpha:lib:git' async-prompt force

# Completion options
CASE_SENSITIVE="false"
HYPHEN_INSENSITIVE="true"

# Skip oh-my-zsh's compinit and compaudit - we handle it ourselves for faster startup
# DISABLE_COMPFIX skips compaudit, skip_global_compinit skips compinit entirely
DISABLE_COMPFIX=true
export skip_global_compinit=1

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
	jj
	tmux
	uv
	zsh-autosuggestions
	zsh-syntax-highlighting
	)

source $ZSH/oh-my-zsh.sh

# keybinding mode - vim
bindkey -v
export KEYTIMEOUT=1

# Vim mode indicator for prompt
# "ins" for insert mode (bold yellow), "nrm" for normal mode (light grey)
function zle-line-init zle-keymap-select {
  case ${KEYMAP} in
    vicmd)      VI_MODE="%{$fg_bold[white]%}nrm%{$reset_color%}" ;;
    viins|main) VI_MODE="%{$fg_bold[yellow]%}ins%{$reset_color%}" ;;
  esac
  zle reset-prompt
}
zle -N zle-line-init
zle -N zle-keymap-select

# Initialize VI_MODE for first prompt
VI_MODE="%{$fg_bold[yellow]%}ins%{$reset_color%}"

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
alias ocr="opencode run"
unalias gb 2>/dev/null

# Go
export GOPATH=$HOME/repos/go
export GOBIN=$GOPATH/bin
alias todo='godoc -notes="TODO" .'
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
	    sudo ifconfig en0 ether "a0$(openssl rand -hex 5 | sed 's/\(.\{2\}\)/:\1/g')" && \
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
			"$USERPROFILE/Dropbox"
			"$USERPROFILE/Downloads"
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
    echo $(($(date +%s) - 60 * $1))
}

hours-ago() {
    echo $(($(date +%s) - 3600 * $1))
}

yesterday() {
    echo $(($(date +%s) - 86400))
}

time-at() {
    date -r "$1"
}

# tmux
alias tmux="tmux -2 -u"
if command -v tmux &>/dev/null; then
    test -z "$TMUX" && (tmux attach || tmux new-session)
fi

# PATH related settings
# Removes duplicate PATH entries but keeps the original order.
# https://github.com/gabebw/dotfiles/blob/master/zsh/path.zsh
trim_path() {
  # http://chunchung.blogspot.com/2007/11/remove-duplicate-paths-from-path-in.html
  PATH=$(awk -F: '{for(i=1;i<=NF;i++){if(!($i in a)){a[$i];printf s$i;s=":"}}}'<<<"$PATH")
  export PATH
}

# Reload PATH from shell config (useful after installing new tools)
env-update() { source ~/.zshrc; }

# prompt
# Git prompt colors and symbols
ZSH_THEME_GIT_PROMPT_PREFIX=" %F{208}("
ZSH_THEME_GIT_PROMPT_SUFFIX=")%f"
ZSH_THEME_GIT_PROMPT_DIRTY=" ✗"
ZSH_THEME_GIT_PROMPT_CLEAN=" ✓"

# jj (Jujutsu) prompt integration
# Detects whether current directory is a jj repo, git repo, or neither.
# In colocated repos (both .jj and .git), jj takes precedence since git
# would show an unhelpful "detached HEAD" state.
_detect_vcs_type() {
  local dir="$PWD"
  while [[ -n "$dir" ]]; do
    [[ -e "$dir/.jj" ]] && { echo "jj"; return; }
    [[ -e "$dir/.git" ]] && { echo "git"; return; }
    dir="${dir%/*}"
  done
}

# jj prompt: shows change ID, commit ID, bookmarks, and status indicators
# Uses --ignore-working-copy for performance (avoids snapshotting on every prompt)
_jj_prompt_info() {
  command -v jj &> /dev/null || return
  local jj_info
  jj_info=$(jj log --ignore-working-copy --no-pager --no-graph -r @ -T '
    separate(" ",
      change_id.shortest(4),
      commit_id.shortest(4),
      bookmarks,
      if(conflict, "conflict"),
      if(empty, "(empty)"),
      if(description.first_line() == "", "(no desc)")
    )
  ' 2>/dev/null) || return
  [[ -n "$jj_info" ]] && echo " %F{141}jj:($jj_info)%f"
}

# VCS prompt: shows jj info in jj repos, git info in git-only repos
_vcs_prompt_info() {
  case "$(_detect_vcs_type)" in
    jj)  _jj_prompt_info ;;
    git) git_prompt_info ;;
  esac
}

NEWLINE=$'\n'
export PROMPT='%{$fg_bold[green]%}%p%{$fg_bold[blue]%}%~$(_vcs_prompt_info)% %{$reset_color%}${NEWLINE}${ret_status}%{$reset_color%}${VI_MODE} ➜ '
export TERM="xterm-256color"

# editor
unalias zed 2>/dev/null || true
zed() {
  local app="Zed"
  [[ -d "/Applications/Zed Preview.app" ]] && app="Zed Preview"
  open "$@" -a "$app"
}
export EDITOR="zed --wait"


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

# fzf - fuzzy finder
# Uses fd for speed and .gitignore respect, bat for previews
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_DEFAULT_OPTS='--height 40% --reverse --border --preview "bat --style=numbers --color=always --line-range :500 {} 2>/dev/null || ls -la {}"'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
export FZF_ALT_C_OPTS='--preview "ls -la {}"'
# Source fzf keybindings (Ctrl+T, Alt+C) and completion
source <(fzf --zsh 2>/dev/null) || {
  # Fallback for older fzf versions
  [[ -f ~/.fzf.zsh ]] && source ~/.fzf.zsh
}

# atuin - shell history (MUST be after fzf to ensure atuin owns Ctrl+R)
eval "$(atuin init zsh)"

# zoxide - smart cd with z and zi (interactive)
eval "$(zoxide init zsh)"

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

# Bun
export PATH="$HOME/.bun/bin:$PATH"

# Homebrew curl (override system curl)
export PATH="/usr/local/opt/curl/bin:$PATH"

# Remove duplicate PATH entries
trim_path

# try - inlined from `try init ~/repos/tries` to avoid subprocess on every shell
# Hardcode path - command -v fails on re-source since the function shadows the binary
_try_bin="/opt/homebrew/bin/try"
if [[ -x "$_try_bin" ]]; then
  try() {
    local out
    out=$(/usr/bin/env ruby "$_try_bin" exec --path "$HOME/repos/tries" "$@" 2>/dev/tty)
    if [ $? -eq 0 ]; then
      eval "$out"
    else
      echo "$out"
    fi
  }
fi

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Lazy-load CLI completions (jj, pscale)
# Completions are cached to ~/.cache/zsh and regenerated daily
_lazy_completion_cache="$HOME/.cache/zsh"
[[ -d "$_lazy_completion_cache" ]] || mkdir -p "$_lazy_completion_cache"

_load_cached_completion() {
  local cmd=$1 cache="$_lazy_completion_cache/_$cmd" generator=$2
  # Regenerate if cache missing or older than 24h
  if [[ ! -f "$cache" || -n "$cache"(#qN.mh+24) ]]; then
    command -v "$cmd" &>/dev/null && eval "$generator" > "$cache" 2>/dev/null
  fi
  [[ -f "$cache" ]] && source "$cache"
}

_load_cached_completion jj "COMPLETE=zsh jj"
_load_cached_completion pscale "pscale completion zsh"
unset _lazy_completion_cache

# zerobrew
export PATH="$HOME/.local/bin:/opt/zerobrew/prefix/bin:$PATH"
