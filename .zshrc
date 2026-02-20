# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Path to your Oh My Zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME="powerlevel10k/powerlevel10k"

# Plugins
plugins=(
  colored-man-pages
  command-not-found
  git
  uv
  zsh-autosuggestions
  zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

# --- Homebrew ---
if [[ -x "/opt/homebrew/bin/brew" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -x "/usr/local/bin/brew" ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

if command -v brew &>/dev/null; then
  FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
fi

# --- Editor ---
if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='nano'
else
  export EDITOR='code --wait'
fi

# --- SSH ---
ssh-add -A 2>/dev/null

# --- Aliases ---
alias cat='bat'
alias ping='prettyping --nolegend'
alias top='sudo htop'

# rclone mount aliases (conditional)
if command -v rclone &>/dev/null; then
  alias mount-general="mount-encrypted-storage general"
  alias mount-brightly="mount-encrypted-storage brightly"
  alias mount-titan="mount-encrypted-storage titan"
fi

# --- fzf (fuzzy finder) ---
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_DEFAULT_OPTS='--height 40% --reverse --border --preview "bat --style=numbers --color=always --line-range :500 {} 2>/dev/null || ls -la {}" --bind="ctrl-o:execute(code {})+abort"'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
export FZF_ALT_C_OPTS='--preview "ls -la {}"'
source <(fzf --zsh 2>/dev/null) || { [[ -f ~/.fzf.zsh ]] && source ~/.fzf.zsh; }
alias pv="fzf --preview 'bat --color always {}'"
bindkey "ç" fzf-cd-widget

_fzf_comprun() {
  local command=$1
  shift
  case "$command" in
    cd) fzf "$@" --preview 'tree -C {} | head -200' ;;
    *)  fzf "$@" ;;
  esac
}

# --- zoxide (smart cd) ---
if command -v zoxide &>/dev/null; then
  eval "$(zoxide init zsh)"
fi

# --- mise (runtime version manager) ---
if [[ -x "$HOME/.local/bin/mise" ]]; then
  eval "$("$HOME/.local/bin/mise" activate zsh)"
elif command -v mise &>/dev/null; then
  eval "$(mise activate zsh)"
fi

# --- ripgrep ---
export RIPGREP_CONFIG_PATH="$HOME/.ripgreprc"

# --- PATH ---
export PATH="$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH"

# Sparkle / Pika (conditional)
[[ -d "$HOME/Development/sparkle/bin" ]] && export PATH="$HOME/Development/sparkle/bin:$PATH"

# LM Studio (conditional)
[[ -d "$HOME/.lmstudio/bin" ]] && export PATH="$PATH:$HOME/.lmstudio/bin"

# --- OrbStack (conditional) ---
[[ -f ~/.orbstack/shell/init.zsh ]] && source ~/.orbstack/shell/init.zsh 2>/dev/null

# --- Secrets (conditional) ---
[[ -f "$HOME/.secrets" ]] && source "$HOME/.secrets"

# --- Powerlevel10k ---
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
