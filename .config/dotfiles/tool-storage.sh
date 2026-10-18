# shellcheck shell=sh
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
export UV_CACHE_DIR="$HOME/repos/.cache/uv"
export PIP_CACHE_DIR="$HOME/repos/.cache/pip"
export GOPATH="$HOME/repos/go"
export GOBIN="$GOPATH/bin"
export GOMODCACHE="$GOPATH/pkg/mod"
export GOCACHE="$HOME/repos/.cache/go-build"
export BUN_INSTALL_CACHE_DIR="$HOME/repos/.cache/bun"
export BUN_RUNTIME_TRANSPILER_CACHE_PATH="$HOME/repos/.cache/bun-transpiler"
for _dotfiles_bin in "$PNPM_HOME/bin" "$npm_config_prefix/bin" "$CARGO_HOME/bin" "$GOBIN"; do
    case ":$PATH:" in
        *:"$_dotfiles_bin":*) ;;
        *) PATH="$_dotfiles_bin:$PATH" ;;
    esac
done
export PATH
unset _dotfiles_bin
