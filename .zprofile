eval "$(/opt/homebrew/bin/brew shellenv)"

export CODEX_HOME="/Users/matt/repos/dotfiles/.codex"

# macOS login-only operations (run once per session, not every shell)
if [ "$(uname -s)" = "Darwin" ]; then
	ssh-add --apple-use-keychain ~/.ssh/id_ed25519 2>/dev/null
	defaults write com.apple.screencapture target clipboard 2>/dev/null
fi
