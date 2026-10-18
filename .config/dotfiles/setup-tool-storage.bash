#!/usr/bin/env bash
# Run with tools stopped; moves defaults and keeps their old paths working.
set -euo pipefail
repos=$HOME/repos
fail() { printf 'tool storage: %s\n' "$*" >&2; exit 1; }
[[ -d $repos && -w $repos && ! -L $repos ]] || fail "Prepare $repos first."
os=$(uname -s)
if [[ $os == Darwin ]]; then
    [[ $(df -P "$repos" | awk 'NR == 2 { print $NF }') == "$repos" ]] || fail "$repos is not mounted."
fi

check_target() {
    local directory=$1
    while [[ $directory != "$repos" ]]; do
        [[ $directory == "$repos/"* && ! -L $directory && ( ! -e $directory || -d $directory ) ]] || fail "Unexpected destination: $directory"
        directory=${directory%/*}
    done
}
relocate() {
    local original=$1 target=$2
    check_target "$target"
    if [[ -L $original ]]; then
        [[ $(readlink "$original") == "$target" && -d $target ]] || fail "Unexpected link: $original"
        return
    fi
    if [[ -e $original ]]; then
        [[ -d $original && ! -e $target ]] || fail "Conflicting paths: $original and $target"
        mkdir -p "$(dirname "$target")"
        mv "$original" "$target"
    else
        mkdir -p "$target"
    fi
    mkdir -p "$(dirname "$original")"
    ln -s "$target" "$original"
}

if [[ $os == Darwin ]]; then
    data=$HOME/Library/pnpm
    cache=$HOME/Library/Caches
    state=$HOME/.pnpm-state
    go_cache=$cache/go-build
    pip_cache=${XDG_CACHE_HOME:-$cache}/pip
    relocate "$cache/org.swift.swiftpm" "$repos/.cache/swiftpm"
    relocate "$HOME/Library/Developer/Xcode/DerivedData" "$repos/.cache/xcode/DerivedData"
else
    data=${XDG_DATA_HOME:-$HOME/.local/share}/pnpm
    cache=${XDG_CACHE_HOME:-$HOME/.cache}
    state=${XDG_STATE_HOME:-$HOME/.local/state}/pnpm
    go_cache=$cache/go-build
    pip_cache=$cache/pip
fi
relocate "$HOME/.cargo" "$repos/.cargo"
relocate "$HOME/.rustup" "$repos/.rustup"
relocate "$HOME/.npm" "$repos/.npm"
relocate "$data" "$repos/.pnpm"
relocate "$cache/pnpm" "$repos/.pnpm/cache"
relocate "$state" "$repos/.pnpm/state"
relocate "${XDG_CACHE_HOME:-$HOME/.cache}/uv" "$repos/.cache/uv"
relocate "$pip_cache" "$repos/.cache/pip"
relocate "$go_cache" "$repos/.cache/go-build"
relocate "$HOME/.bun/install/cache" "$repos/.cache/bun"
for directory in "$repos/.npm-global/bin" "$repos/.pnpm/bin" "$repos/.cache/bun-transpiler"; do
    check_target "$directory"
    mkdir -p "$directory"
done
