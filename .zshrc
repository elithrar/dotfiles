typeset -U path fpath

ZSH=$HOME/.oh-my-zsh
ZSH_THEME="robbyrussell"

# async git prompt — auto-detection finds $(git_prompt_info) in PROMPT
zstyle ':omz:alpha:lib:git' async-prompt yes

# Completion options
CASE_SENSITIVE="false"
HYPHEN_INSENSITIVE="true"

umask 027

# Cache uname to avoid repeated subprocess calls
_uname_s="$(uname -s)"

autoload -Uz bracketed-paste-magic
zle -N bracketed-paste bracketed-paste-magic

# Plugins: can be found in ~/.oh-my-zsh/plugins/*
plugins=(
	colored-man-pages
	command-not-found
	gem
	git
	github
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
alias ocs="opencode ~/repos/scratch"
alias codexr="codex resume"
alias codexa="codex resume --last"
unalias gb 2>/dev/null

# Go
export GOPATH=$HOME/repos/go
export GOBIN=$GOPATH/bin
alias todo='godoc -notes="TODO" .'
alias gtvc="go test -v -race -cover ."
alias godoc-this="godoc -http=:6060; open http://localhost:6060/pkg"
alias coverhtml="go test -coverprofile=coverage.out; go tool cover -html=coverage.out -o coverage.html"

# macOS specific
if [ "$_uname_s" = "Darwin" ]; then
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
if [ "$_uname_s" = "Linux" ]; then
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
if [[ -o interactive && -z $TMUX && $TERM_PROGRAM == ghostty ]] && command -v tmux &>/dev/null; then
  exec tmux new-session -A -s main
fi

# PATH related settings
# Restart the shell after installing tools so startup state is rebuilt once.
env-update() { exec zsh; }

# prompt
# Git prompt colors and symbols
ZSH_THEME_GIT_PROMPT_PREFIX=" %F{208}("
ZSH_THEME_GIT_PROMPT_SUFFIX=")%f"
ZSH_THEME_GIT_PROMPT_DIRTY=" ✗"
ZSH_THEME_GIT_PROMPT_CLEAN=" ✓"

NEWLINE=$'\n'
export PROMPT='%{$fg_bold[green]%}%p%{$fg_bold[blue]%}%~$(git_prompt_info)% %{$reset_color%}${NEWLINE}${ret_status}%{$reset_color%}${VI_MODE} ➜ '

# editor
unalias zed 2>/dev/null || true
zed() {
  command "/Applications/Zed Preview.app/Contents/MacOS/cli" "$@"
}
export EDITOR='"/Applications/Zed Preview.app/Contents/MacOS/cli" --wait'


# ripgrep
export RIPGREP_CONFIG_PATH=$HOME/.ripgreprc

export NO_D1_WARNING=1

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
path=("$HOME/.local/bin" $path)
path=("$HOME/.sst/bin" $path)
path=("$HOME/.codeium/windsurf/bin" $path)

# Ruby (rbenv)
path=("$HOME/.rbenv/shims" $path)

# Rust
path=("$HOME/.cargo/bin" $path)

# Go
path=("$GOBIN" $path)

# Bun
path=("$HOME/.bun/bin" $path)

# Homebrew curl (override system curl)
path=(/opt/homebrew/opt/curl/bin $path)

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

# zerobrew
path=("$HOME/.local/bin" /opt/zerobrew/prefix/bin $path)
