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

if [[ $os == Darwin ]]; then
    data=$HOME/Library/pnpm
    cache=$HOME/Library/Caches
    state=$HOME/.pnpm-state
    go_cache=$cache/go-build
    pip_cache=${XDG_CACHE_HOME:-$cache}/pip
else
    data=${XDG_DATA_HOME:-$HOME/.local/share}/pnpm
    cache=${XDG_CACHE_HOME:-$HOME/.cache}
    state=${XDG_STATE_HOME:-$HOME/.local/state}/pnpm
    go_cache=$cache/go-build
    pip_cache=$cache/pip
fi
directories=(
    "$HOME/.cargo" "$repos/.cargo"
    "$HOME/.rustup" "$repos/.rustup"
    "$HOME/.npm" "$repos/.npm"
    "$data" "$repos/.pnpm"
    "$cache/pnpm" "$repos/.pnpm/cache"
    "$state" "$repos/.pnpm/state"
    "${XDG_CACHE_HOME:-$HOME/.cache}/uv" "$repos/.cache/uv"
    "$pip_cache" "$repos/.cache/pip"
    "$go_cache" "$repos/.cache/go-build"
    "$HOME/.bun/install/cache" "$repos/.cache/bun"
)
if [[ $os == Darwin ]]; then
    directories+=(
        "$cache/org.swift.swiftpm" "$repos/.cache/swiftpm"
        "$HOME/Library/Developer/Xcode/DerivedData" "$repos/.cache/xcode/DerivedData"
    )
fi
for ((i=0; i<${#directories[@]}; i+=2)); do
    original=${directories[i]}
    target=${directories[i+1]}
    check_target "$target"
    if [[ -L $original ]]; then
        [[ $(readlink "$original") == "$target" && -d $target ]] || fail "Unexpected link: $original"
        continue
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
done
for directory in "$repos/.npm-global/bin" "$repos/.pnpm/bin" "$repos/.cache/bun-transpiler"; do
    check_target "$directory"
    mkdir -p "$directory"
done
