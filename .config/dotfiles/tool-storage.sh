# shellcheck shell=sh
# Shared by zsh login/interactive shells and install.sh. Sourcing has no I/O.
# Run setup-tool-storage.bash before enabling this on an existing machine.
export PNPM_HOME="$HOME/repos/.pnpm"
export PNPM_CONFIG_STORE_DIR="$PNPM_HOME/store"
export PNPM_CONFIG_CACHE_DIR="$PNPM_HOME/cache"
export PNPM_CONFIG_STATE_DIR="$PNPM_HOME/state"
export PNPM_CONFIG_GLOBAL_DIR="$PNPM_HOME/global"
export PNPM_CONFIG_GLOBAL_BIN_DIR="$PNPM_HOME/bin"
export npm_config_cache="$HOME/repos/.npm"
export npm_config_prefix="$HOME/repos/.npm-global"
export CARGO_HOME="$HOME/repos/.cargo"
export RUSTUP_HOME="$HOME/repos/.rustup"

# pnpm 11+ puts global executables in PNPM_HOME/bin. Keep this idempotent in
# shells that read both .zprofile and .zshrc, and when sourced by a task runner.
for _dotfiles_bin in "$PNPM_HOME/bin" "$npm_config_prefix/bin" "$CARGO_HOME/bin"; do
    case ":$PATH:" in
        *:"$_dotfiles_bin":*) ;;
        *) PATH="$_dotfiles_bin:$PATH" ;;
    esac
done
export PATH
unset _dotfiles_bin
