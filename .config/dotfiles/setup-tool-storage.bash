#!/usr/bin/env bash
# Run with package managers, builds, rustup and agents stopped. No sudo needed.
set -euo pipefail
fail() { printf 'tool storage: %s\n' "$*" >&2; exit 1; }
[[ $# == 0 ]] || fail 'This helper takes no arguments.'
repos=$HOME/repos
[[ -d $repos && -w $repos && ! -L $repos ]] || fail 'Prepare a writable ~/repos first with the repos-volume helper on macOS.'

os=$(uname -s)
if [[ $os == Darwin ]]; then
    [[ $HOME != *[[:space:]]* ]] || fail 'The macOS repos mount requires HOME without whitespace.'
    mounted_at=$(df -P "$repos" | awk 'NR == 2 { print $NF }')
    [[ $mounted_at == "$repos" ]] || fail "$repos must be mounted before relocating tools."
    pnpm_data=$HOME/Library/pnpm
    pnpm_cache=$HOME/Library/Caches/pnpm
    pnpm_state=$HOME/.pnpm-state
else
    pnpm_data=${XDG_DATA_HOME:-$HOME/.local/share}/pnpm
    pnpm_cache=${XDG_CACHE_HOME:-$HOME/.cache}/pnpm
    pnpm_state=${XDG_STATE_HOME:-$HOME/.local/state}/pnpm
fi

# Serialize this helper's directory moves. A stale lock after SIGKILL/power loss
# must be inspected and removed with rmdir, never cleared by a competing run.
lock=$repos/.tool-storage.lock
mkdir "$lock" || fail "Another setup may be running. Inspect $lock before removing an abandoned lock."
trap 'rmdir "$lock"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP

check_directory() {
    [[ ! -L $1 && ( ! -e $1 || -d $1 ) ]] || fail "Unexpected destination: $1"
}
for directory in "$repos/.npm-global" "$repos/.npm-global/bin" "$repos/.pnpm/bin"; do
    check_directory "$directory"
done

sources=("$HOME/.cargo" "$HOME/.rustup" "$HOME/.npm" "$pnpm_data" "$pnpm_cache" "$pnpm_state")
targets=("$repos/.cargo" "$repos/.rustup" "$repos/.npm" "$repos/.pnpm" "$repos/.pnpm/cache" "$repos/.pnpm/state")

check_pair() {
    local original=$1 target=$2
    [[ ! -L $target ]] || fail "Destination is a symlink: $target"
    [[ ! -e $target || -d $target ]] || fail "Destination is not a directory: $target"
    if [[ -L $original ]]; then
        [[ $(readlink "$original") == "$target" && -d $target ]] || fail "Unexpected or broken source symlink: $original"
    elif [[ -e $original ]]; then
        [[ -d $original ]] || fail "Source is not a directory: $original"
        [[ ! -e $target ]] || fail "Both $original and $target exist; reconcile them manually. Nothing will be merged or overwritten."
    fi
}

# Catch conflicts before the first move, then recheck each pair because moving
# a pnpm home can expose a preexisting cache/state directory at its destination.
for i in "${!sources[@]}"; do check_pair "${sources[$i]}" "${targets[$i]}"; done
for i in "${!sources[@]}"; do
    original=${sources[$i]}
    target=${targets[$i]}
    check_pair "$original" "$target"
    if [[ -L $original ]]; then continue; fi
    mkdir -p "$(dirname "$target")" "$(dirname "$original")"
    if [[ -d $original ]]; then
        # mv handles the cross-volume copy and removes the original only on
        # success. A failed/interrupted move may leave both paths: reruns stop
        # on that conflict instead of merging a partial copy.
        mv "$original" "$target"
    else
        mkdir -p "$target"
    fi
    # An interruption after mv can resume here: target exists, original does not.
    ln -s "$target" "$original"
done
for directory in "$repos/.npm-global" "$repos/.npm-global/bin" "$repos/.pnpm/bin"; do
    check_directory "$directory"
done
mkdir -p "$repos/.npm-global/bin" "$repos/.pnpm/bin"
printf '%s\n' 'Tool storage prepared under ~/repos. Source tool-storage.sh or start a new shell.'
