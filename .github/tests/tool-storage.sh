#!/usr/bin/env bash
# Real filesystem migration in a disposable HOME; no host cache/toolchain moves.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
suite=$(mktemp -d)
trap 'rm -rf "$suite"' EXIT
mkdir -p "$suite/bin"
cat > "$suite/bin/uname" <<'MOCK'
#!/bin/sh
printf '%s\n' "${TEST_OS:-Linux}"
MOCK
cat > "$suite/bin/df" <<'MOCK'
#!/bin/sh
printf 'Filesystem 512-blocks Used Available Capacity Mounted on\n'
printf '/dev/mock 1 0 1 0%% %s\n' "${TEST_MOUNT:-/}"
MOCK
cat > "$suite/bin/mv" <<'MOCK'
#!/bin/sh
if [ "${TEST_MOVE_FAIL:-false}" = true ]; then exit 1; fi
exec /bin/mv "$@"
MOCK
chmod +x "$suite/bin/"*
run_setup() {
    env -u XDG_DATA_HOME -u XDG_CACHE_HOME -u XDG_STATE_HOME HOME="$fixture" PATH="$suite/bin:$PATH" \
        bash "$repo/.config/dotfiles/setup-tool-storage.bash" > "$suite/output" 2>&1
}
assert_failed() {
    if run_setup; then printf 'Expected failure: %s\n' "$1" >&2; exit 1; fi
}
fixture=$suite/migration
mkdir -p "$fixture/repos" "$fixture/.cargo/bin" "$fixture/.rustup/toolchains" "$fixture/.npm/_cacache" \
    "$fixture/.local/share/pnpm/store" "$fixture/.cache/pnpm" "$fixture/.local/state/pnpm"
printf 'cargo\n' > "$fixture/.cargo/bin/rustup"
chmod 700 "$fixture/.cargo/bin/rustup"
ln -s rustup "$fixture/.cargo/bin/cargo"
ln -s missing "$fixture/.cargo/broken-link"
printf 'toolchain\n' > "$fixture/.rustup/toolchains/version"
printf 'package\n' > "$fixture/.npm/_cacache/package"
printf 'store\n' > "$fixture/.local/share/pnpm/store/package"
printf 'metadata\n' > "$fixture/.cache/pnpm/metadata"
run_setup
[[ $(cat "$fixture/repos/.cargo/bin/cargo") == cargo ]]
[[ $(readlink "$fixture/repos/.cargo/broken-link") == missing ]]
[[ -x $fixture/repos/.cargo/bin/rustup ]]
[[ $(cat "$fixture/repos/.rustup/toolchains/version") == toolchain ]]
[[ $(cat "$fixture/repos/.npm/_cacache/package") == package ]]
[[ $(cat "$fixture/repos/.pnpm/store/package") == store ]]
[[ $(cat "$fixture/repos/.pnpm/cache/metadata") == metadata ]]
[[ $(readlink "$fixture/.cargo") == "$fixture/repos/.cargo" ]]
run_setup # Idempotence, including dangling links inside moved toolchains.

fixture=$suite/conflict
mkdir -p "$fixture/repos/.rustup" "$fixture/.rustup" "$fixture/.cargo"
printf 'preserve\n' > "$fixture/.cargo/original"
assert_failed 'both source and destination exist'
[[ ! -e $fixture/repos/.cargo && -f $fixture/.cargo/original ]]
fixture=$suite/source-link
mkdir -p "$fixture/repos" "$fixture/other"
ln -s "$fixture/other" "$fixture/.cargo"
assert_failed 'unexpected source symlink'
fixture=$suite/destination-link
mkdir -p "$fixture/repos" "$fixture/other"
ln -s "$fixture/other" "$fixture/repos/.cargo"
assert_failed 'destination symlink'
fixture=$suite/prefix-link
mkdir -p "$fixture/repos" "$fixture/other"
ln -s "$fixture/other" "$fixture/repos/.npm-global"
assert_failed 'npm global prefix symlink'
fixture=$suite/locked
mkdir -p "$fixture/repos/.tool-storage.lock" "$fixture/.cargo"
assert_failed 'competing migration'
[[ -d $fixture/repos/.tool-storage.lock && ! -e $fixture/repos/.cargo ]]
fixture=$suite/source-file
mkdir -p "$fixture/repos"
printf 'preserve\n' > "$fixture/.cargo"
assert_failed 'source is a file'
[[ $(cat "$fixture/.cargo") == preserve ]]
fixture=$suite/nested-conflict
mkdir -p "$fixture/repos" "$fixture/.local/share/pnpm/cache" "$fixture/.cache/pnpm"
printf 'home-cache\n' > "$fixture/.local/share/pnpm/cache/original"
printf 'external-cache\n' > "$fixture/.cache/pnpm/original"
assert_failed 'pnpm home exposes a conflicting cache'
[[ $(cat "$fixture/repos/.pnpm/cache/original") == home-cache ]]
[[ $(cat "$fixture/.cache/pnpm/original") == external-cache ]]
fixture=$suite/failed-move
mkdir -p "$fixture/repos" "$fixture/.cargo"
printf 'preserve\n' > "$fixture/.cargo/original"
export TEST_MOVE_FAIL=true
assert_failed 'failed move'
unset TEST_MOVE_FAIL
[[ -f $fixture/.cargo/original && ! -L $fixture/.cargo && ! -e $fixture/repos/.cargo ]]
fixture=$suite/interrupted
mkdir -p "$fixture/repos/.cargo"
printf 'preserve\n' > "$fixture/repos/.cargo/original"
run_setup # Resume after a completed move but before compatibility link creation.
[[ $(cat "$fixture/.cargo/original") == preserve ]]
fixture=$suite/unmounted
mkdir -p "$fixture/repos" "$fixture/.cargo"
export TEST_OS=Darwin TEST_MOUNT=/System/Volumes/Data
assert_failed 'unmounted macOS repos'
[[ ! -e $fixture/repos/.cargo ]]
fixture=$suite/mac
mkdir -p "$fixture/repos" "$fixture/Library/pnpm/store" "$fixture/Library/Caches/pnpm" "$fixture/.pnpm-state"
printf 'store\n' > "$fixture/Library/pnpm/store/package"
export TEST_MOUNT=$fixture/repos
run_setup
[[ $(cat "$fixture/repos/.pnpm/store/package") == store ]]
[[ $(readlink "$fixture/Library/Caches/pnpm") == "$fixture/repos/.pnpm/cache" ]]
unset TEST_OS TEST_MOUNT

# Actual npm/pnpm config parsing is exercised separately on a machine with the
# supported toolchain; this portion verifies POSIX and zsh environment behavior.
for shell in bash zsh; do
    command -v "$shell" >/dev/null || continue
    # shellcheck disable=SC2016 # Expand in the isolated child shell.
    env HOME="$fixture" PATH="$PATH" "$shell" -f -c '
        set -e
        . "$1/.config/dotfiles/tool-storage.sh"
        first_path=$PATH
        . "$1/.config/dotfiles/tool-storage.sh"
        [ "$first_path" = "$PATH" ]
        [ "$CARGO_HOME" = "$HOME/repos/.cargo" ]
        [ "$RUSTUP_HOME" = "$HOME/repos/.rustup" ]
        [ "$PNPM_CONFIG_GLOBAL_BIN_DIR" = "$HOME/repos/.pnpm/bin" ]
        [ "$npm_config_prefix" = "$HOME/repos/.npm-global" ]
    ' test "$repo"
done
printf '%s\n' 'Tool storage migration, conflict, failure, mount and shell tests passed.'
