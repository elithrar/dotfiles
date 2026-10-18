#!/bin/sh
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

# Sourcing sets paths; --setup moves the existing default directories.
if [ "${1:-}" = --setup ]; then (
    set -eu
    repos=$HOME/repos
    fail() { printf 'tool storage: %s\n' "$*" >&2; exit 1; }
    [ -d "$repos" ] && [ -w "$repos" ] || fail "Prepare $repos first."
    for directory in "$repos" "$repos/.cache" "$PNPM_HOME" "$npm_config_prefix" "$repos/.cache/xcode"; do
        [ ! -L "$directory" ] || fail "Unexpected link: $directory"
    done
    if [ "$(uname -s)" = Darwin ]; then
        [ "$(df -P "$repos" | awk 'NR == 2 { print $NF }')" = "$repos" ] || fail "$repos is not mounted."
        data=$HOME/Library/pnpm
        cache=$HOME/Library/Caches
        state=$HOME/.pnpm-state
        pip_cache=${XDG_CACHE_HOME:-$cache}/pip
        swiftpm=$cache/org.swift.swiftpm
        xcode=$HOME/Library/Developer/Xcode/DerivedData
    else
        data=${XDG_DATA_HOME:-$HOME/.local/share}/pnpm
        cache=${XDG_CACHE_HOME:-$HOME/.cache}
        state=${XDG_STATE_HOME:-$HOME/.local/state}/pnpm
        pip_cache=$cache/pip
        swiftpm=- xcode=-
    fi
    while IFS='	' read -r original target; do
        [ "$original" != - ] || continue
        [ ! -L "$target" ] || fail "Unexpected link: $target"
        if [ -L "$original" ]; then
            [ "$(readlink "$original")" = "$target" ] && [ -d "$target" ] || fail "Unexpected link: $original"
            continue
        fi
        if [ -e "$original" ]; then
            [ -d "$original" ] && [ ! -e "$target" ] || fail "Conflicting paths: $original and $target"
            mkdir -p "$(dirname "$target")"
            mv "$original" "$target"
        else
            mkdir -p "$target"
        fi
        mkdir -p "$(dirname "$original")"
        ln -s "$target" "$original"
    done <<EOF
$HOME/.cargo	$CARGO_HOME
$HOME/.rustup	$RUSTUP_HOME
$HOME/.npm	$npm_config_cache
$data	$PNPM_HOME
$cache/pnpm	$PNPM_CONFIG_CACHE_DIR
$state	$PNPM_CONFIG_STATE_DIR
${XDG_CACHE_HOME:-$HOME/.cache}/uv	$UV_CACHE_DIR
$pip_cache	$PIP_CACHE_DIR
$cache/go-build	$GOCACHE
$HOME/.bun/install/cache	$BUN_INSTALL_CACHE_DIR
$swiftpm	$repos/.cache/swiftpm
$xcode	$repos/.cache/xcode/DerivedData
EOF
    mkdir -p "$npm_config_prefix/bin" "$PNPM_CONFIG_GLOBAL_BIN_DIR" "$BUN_RUNTIME_TRANSPILER_CACHE_PATH"
); fi
