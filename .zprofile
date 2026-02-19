# Login shell only — runs once per session, not every new shell

# macOS specific
if [ "$(uname -s)" = "Darwin" ]; then
	# Load SSH key into macOS keychain agent
	ssh-add --apple-use-keychain ~/.ssh/id_ed25519 2>/dev/null

	# Screenshots -> clipboard
	defaults write com.apple.screencapture target clipboard 2>/dev/null
fi
