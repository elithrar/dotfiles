#!/usr/bin/env bash
# Runs the real helper against command mocks in an isolated temporary HOME.
# No native disk, mount, mdutil, sudo, or /etc operation is executed.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
suite=$(mktemp -d)
suite=$(cd "$suite" && pwd -P)
trap 'rm -rf "$suite"' EXIT
mkdir "$suite/bin"
cat > "$suite/bin/mock" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
command=${0##*/}
printf '%s' "$command" >> "$MOCK_ROOT/calls"
printf ' <%s>' "$@" >> "$MOCK_ROOT/calls"
printf '\n' >> "$MOCK_ROOT/calls"
volume=AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE
container=11111111-2222-3333-4444-555555555555
case $command in
    uname) echo Darwin ;;
    id) if [[ $1 == -u ]]; then echo 501; else echo 20; fi ;;
    uuidgen) echo 99999999-8888-7777-6666-555555555555 ;;
    sudo)
        if [[ $1 != -v ]]; then "$@"; fi ;;
    chown|mdutil) : ;;
    chmod)
        if [[ ${MOCK_CONCURRENT_WRITE:-false} == true && $1 == 000 ]]; then
            echo 'concurrent data' > "$HOME/repos/late-file"
        fi
        # Keep generated editors executable on POSIX runners. Mode 000 is
        # logged/simulated: fixture sudo deliberately has no extra privileges.
        if [[ $1 != 000 ]]; then /bin/chmod "$@"; fi ;;
    find)
        [[ ${MOCK_FIND_FAIL:-false} != true ]] || exit 1
        /usr/bin/find "$@" ;;
    install)
        args=()
        while [[ $# -gt 0 ]]; do
            case $1 in -o|-g) shift 2 ;; *) args+=("$1"); shift ;; esac
        done
        if [[ ${args[0]} == -d ]]; then mkdir -p "${args[3]}";
        else cp "${args[2]}" "${args[3]}"; fi ;;
    stat)
        case $2 in
            %u:%Lp)
                if [[ $3 == "$MOCK_ROOT/state" ]]; then echo 0:700; else echo 0:600; fi ;;
            %u) echo 501 ;;
            %z) wc -c < "$3" | tr -d ' ' ;;
            *) exit 1 ;;
        esac ;;
    mock_plistbuddy)
        key=${2#Print :}
        awk -F '\t' -v key="$key" '$1 == key {sub(/^[^\t]*\t/, ""); print; found=1} END {exit !found}' "$3" ;;
    mock_vifs)
        [[ ${MOCK_VIFS_BUSY:-false} != true ]] || exit 1
        [[ -e $MOCK_ROOT/fstab ]] || touch "$MOCK_ROOT/fstab"
        # Native vifs passes the actual fstab path to the editor and does not
        # roll back failed edits. Simulate that in-place behavior.
        "$EDITOR" "$MOCK_ROOT/fstab" ;;
    mount)
        if [[ -s $MOCK_ROOT/mounted ]]; then
            printf '/dev/disk7s9 on %s (apfs, local, journaled%s)\n' "$(cat "$MOCK_ROOT/mounted")" "${MOCK_OPTIONS:-, nobrowse}"
        fi ;;
    diskutil)
        if [[ $1 == info ]]; then
            target=$3
            if [[ $target == /System/Volumes/Data ]]; then
                printf 'FilesystemType\tapfs\nMountPoint\t/System/Volumes/Data\nAPFSContainerReference\tdisk7\n'
            elif [[ $target == "$HOME/repos" && ! -s $MOCK_ROOT/mounted ]]; then
                if [[ ${MOCK_MOUNTPOINT_MISSING:-false} != true ]]; then printf 'MountPoint\t%s\n' "${MOCK_OCCUPIED:-/System/Volumes/Data}"; fi
                printf 'VolumeUUID\t%s\n' "$container"
            elif [[ $target == "$volume" || $target == "$HOME/repos" ]]; then
                [[ -f $MOCK_ROOT/label ]] || exit 1
                printf 'VolumeUUID\t%s\nFilesystemType\tapfs\nAPFSContainerReference\t%s\nVolumeName\t%s\nDeviceIdentifier\tdisk7s9\nGlobalPermissionsEnabled\t%s\n' "${MOCK_UUID:-$volume}" "${MOCK_CONTAINER_REF:-disk7}" "$(cat "$MOCK_ROOT/label")" "${MOCK_OWNERS:-true}"
                if [[ ${MOCK_WRITABLE:-true} != missing ]]; then printf 'WritableVolume\t%s\n' "${MOCK_WRITABLE:-true}"; fi
                if [[ -s $MOCK_ROOT/mounted ]]; then printf 'MountPoint\t%s\n' "$(cat "$MOCK_ROOT/mounted")"; fi
            else exit 1
            fi
        elif [[ $1 == apfs && $2 == list ]]; then
            printf 'Containers:0:ContainerReference\tdisk7\nContainers:0:APFSContainerUUID\t%s\n' "${MOCK_CONTAINER_UUID:-$container}"
            if [[ -f $MOCK_ROOT/label ]]; then
                printf 'Containers:0:Volumes:0:Name\t%s\nContainers:0:Volumes:0:APFSVolumeUUID\t%s\n' "$(cat "$MOCK_ROOT/label")" "$volume"
            fi
        elif [[ $1 == apfs && $2 == addVolume ]]; then
            [[ $3 == disk7 && $4 == APFS && $6 == -nomount && $# == 6 ]] || exit 1
            printf '%s\n' "$5" > "$MOCK_ROOT/label"
            [[ ${MOCK_INTERRUPT:-false} != true ]] || exit 1
        elif [[ $1 == mount ]]; then
            [[ ${MOCK_BUSY:-false} != true ]] || { echo 'busy' >&2; exit 1; }
            [[ $2 == nobrowse && $3 == -mountOptions && $4 == owners && $5 == -mountPoint && $7 == "$volume" && $# == 7 ]] || exit 1
            printf '%s\n' "$6" > "$MOCK_ROOT/mounted"
        else exit 1
        fi ;;
    *) exit 1 ;;
esac
MOCK
chmod +x "$suite/bin/mock"
for name in uname id uuidgen sudo chown chmod mdutil find install stat mock_plistbuddy mock_vifs mount diskutil; do
    cp "$suite/bin/mock" "$suite/bin/$name"
done
export PATH="$suite/bin:$PATH"
# Rewrite only system paths in the test copy, never production configuration.
# shellcheck disable=SC2016 # Preserve literal variables in the copied script.
sed -e '/^PATH=\/usr\/bin:/d' \
    -e 's|/usr/libexec/PlistBuddy|mock_plistbuddy|g' \
    -e 's|/usr/sbin/vifs|mock_vifs|g' \
    -e 's|state=/var/db/dotfiles-repos-$uid|state=$MOCK_ROOT/state|' \
    -e 's|/etc/fstab|$MOCK_ROOT/fstab|g' \
    "$repo/.config/dotfiles/repos-volume.bash" > "$suite/helper"
count=0
fresh() {
    count=$((count + 1))
    export MOCK_ROOT=$suite/case-$count
    export HOME=$MOCK_ROOT/home
    mkdir -p "$HOME"
    unset MOCK_UUID MOCK_CONTAINER_REF MOCK_CONTAINER_UUID MOCK_INTERRUPT MOCK_BUSY MOCK_OPTIONS MOCK_VIFS_BUSY MOCK_FIND_FAIL MOCK_OCCUPIED MOCK_CONCURRENT_WRITE MOCK_WRITABLE MOCK_OWNERS MOCK_MOUNTPOINT_MISSING
}
run() { bash "$suite/helper" > "$MOCK_ROOT/output" 2>&1; }
pass() { run || { cat "$MOCK_ROOT/output" >&2; exit 1; }; }
fail() { if run; then echo "Expected failure: $1" >&2; exit 1; fi; grep -Fq "$1" "$MOCK_ROOT/output" || { cat "$MOCK_ROOT/output" >&2; exit 1; }; }
not_called() { ! grep -q "$1" "$MOCK_ROOT/calls"; }
directory_link() {
    # Git Bash needs explicit emulated links; default ln may copy a directory.
    MSYS=winsymlinks ln -s "$1" "$2"
    [[ -L $2 ]] || { echo 'Could not create a genuine link fixture' >&2; exit 1; }
}

fresh
printf '# keep this\nUUID=OTHER /other apfs rw 0 0\n' > "$MOCK_ROOT/fstab"
pass
grep -Fxq 'UUID=OTHER /other apfs rw 0 0' "$MOCK_ROOT/fstab"
cmp <(head -n 2 "$MOCK_ROOT/fstab") "$MOCK_ROOT"/fstab.dotfiles-backup.*
grep -Fq "chown <root:wheel> <$HOME/repos>" "$MOCK_ROOT/calls"
grep -Fq "chmod <000> <$HOME/repos>" "$MOCK_ROOT/calls"
mkdir -p "$HOME/repos/project/nested"
printf 'irreplaceable\n' > "$HOME/repos/project/nested/data"
cp "$MOCK_ROOT/fstab" "$MOCK_ROOT/fstab.before"
pass
[[ $(cat "$HOME/repos/project/nested/data") == irreplaceable ]]
[[ $(grep -c 'diskutil <apfs> <addVolume>' "$MOCK_ROOT/calls") == 1 ]]
cmp "$MOCK_ROOT/fstab.before" "$MOCK_ROOT/fstab"
echo 'ok: clean setup, locked fstab backup/preservation, repeat keeps nested data'

fresh
mkdir "$HOME/repos"
pass
echo 'ok: existing empty repos directory'

fresh
mkdir -p "$HOME/repos/dotfiles"
echo keep > "$HOME/repos/dotfiles/install.sh"
fail 'contains files on the original filesystem'
[[ $(cat "$HOME/repos/dotfiles/install.sh") == keep ]]
not_called '<addVolume>'
echo 'ok: existing checkout refused without hiding or migrating files'

fresh
mkdir "$HOME/elsewhere"
directory_link "$HOME/elsewhere" "$HOME/repos"
fail 'symlink'
echo 'ok: mountpoint symlink rejected'

fresh
pass
export MOCK_UUID=00000000-0000-0000-0000-000000000000
fail 'identity/container does not match'
unset MOCK_UUID
export MOCK_CONTAINER_REF=disk42
fail 'identity/container does not match'
unset MOCK_CONTAINER_REF
export MOCK_CONTAINER_UUID=22222222-2222-2222-2222-222222222222
fail 'mismatched record'
unset MOCK_CONTAINER_UUID
echo /Volumes/unexpected > "$MOCK_ROOT/mounted"
fail 'mounted at /Volumes/unexpected'
echo "$HOME/repos" > "$MOCK_ROOT/mounted"
export MOCK_OPTIONS=', noowners'
fail 'required APFS/nobrowse'
echo 'ok: UUID, container device/UUID, mount path and options mismatch rejected'

fresh
printf 'UUID=OTHER %s/repos apfs rw 0 0\n' "$HOME" > "$MOCK_ROOT/fstab"
cp "$MOCK_ROOT/fstab" "$MOCK_ROOT/before"
fail 'conflicting fstab mapping'
cmp "$MOCK_ROOT/before" "$MOCK_ROOT/fstab"
not_called 'diskutil <mount>'
echo 'ok: fstab conflict preserves original and prevents mount'

fresh
export MOCK_INTERRUPT=true
fail 'Creating an UNENCRYPTED'
unset MOCK_INTERRUPT
fail 'Incomplete or mismatched record'
[[ $(grep -c '^diskutil <apfs> <addVolume>' "$MOCK_ROOT/calls") == 1 ]]
echo 'ok: interruption preserves intent and refuses duplicate creation'

fresh
export MOCK_BUSY=true
fail 'busy'
unset MOCK_BUSY
pass
[[ $(grep -c '^diskutil <apfs> <addVolume>' "$MOCK_ROOT/calls") == 1 ]]
not_called '<unmount>'
echo 'ok: busy mount stops, later resume reuses recorded UUID without force'

fresh
pass
rm "$HOME/repos/.dotfiles-repos-volume"
fail 'ownership marker is missing'
echo 'ok: missing volume marker rejected'

fresh
pass
mkdir "$MOCK_ROOT/state/lock"
fail 'Another setup may be running'
[[ -d $MOCK_ROOT/state/lock ]]
echo 'ok: competing setup lock is preserved'

fresh
mkdir "$HOME/repos"
export MOCK_FIND_FAIL=true
fail 'Cannot inspect the underlying repos directory'
not_called '<addVolume>'
echo 'ok: failed directory enumeration cannot be treated as empty'

fresh
export MOCK_BUSY=true
fail 'busy'
unset MOCK_BUSY
export MOCK_OCCUPIED=$HOME/repos
cp "$MOCK_ROOT/calls" "$MOCK_ROOT/before-calls"
fail 'unexpected filesystem is already mounted'
[[ $(grep -c '^diskutil <mount>' "$MOCK_ROOT/calls") == 1 ]]
echo 'ok: resume refuses an unexpected empty mounted filesystem'

fresh
export MOCK_CONCURRENT_WRITE=true
fail 'contains files on the original filesystem'
[[ $(cat "$HOME/repos/late-file") == 'concurrent data' ]]
not_called 'diskutil <mount>'
echo 'ok: file created during mountpoint protection is preserved and not hidden'

fresh
pass
printf 'LABEL=%s /elsewhere apfs rw 0 0\n' "$(cat "$MOCK_ROOT/label")" >> "$MOCK_ROOT/fstab"
cp "$MOCK_ROOT/fstab" "$MOCK_ROOT/before"
fail 'conflicting fstab mapping'
cmp "$MOCK_ROOT/before" "$MOCK_ROOT/fstab"
echo 'ok: LABEL alias cannot override UUID mount on reboot'

fresh
printf '/dev/disk7s9 /elsewhere apfs rw 0 0\n' > "$MOCK_ROOT/fstab"
fail 'conflicting fstab mapping'
echo 'ok: device alias conflicting mapping rejected'

fresh
printf 'UUID=OTHER \\057%s/repos apfs rw 0 0\n' "${HOME#/}" > "$MOCK_ROOT/fstab"
fail 'conflicting fstab mapping'
echo 'ok: escaped mountpoint conflict rejected'

fresh
pass
rm "$HOME/repos/.fseventsd/no_log"
rmdir "$HOME/repos/.fseventsd"
mkdir "$MOCK_ROOT/elsewhere"
directory_link "$MOCK_ROOT/elsewhere" "$HOME/repos/.fseventsd"
fail 'Unexpected path:'
[[ -z $(ls -A "$MOCK_ROOT/elsewhere") ]]
echo 'ok: fseventsd symlink rejected without target writes'

fresh
pass
export MOCK_WRITABLE=false
fail 'must be writable with ownership enabled'
export MOCK_WRITABLE=missing
fail 'must be writable with ownership enabled'
unset MOCK_WRITABLE
export MOCK_OWNERS=false
fail 'must be writable with ownership enabled'
echo 'ok: native WritableVolume and ownership fields are required'

fresh
export MOCK_VIFS_BUSY=true
fail 'Creating an UNENCRYPTED'
not_called 'diskutil <mount>'
unset MOCK_VIFS_BUSY
pass
[[ $(grep -c '^diskutil <apfs> <addVolume>' "$MOCK_ROOT/calls") == 1 ]]
echo 'ok: fstab lock failure prevents mount and safely resumes'

fresh
mkdir "$HOME/repos"
echo keep > "$HOME/repos/.hidden"
fail 'contains files on the original filesystem'
[[ $(cat "$HOME/repos/.hidden") == keep ]]
not_called '<addVolume>'
echo 'ok: hidden existing files also block mounting'

fresh
printf 'UUID=OTHER %s/./Repos apfs rw 0 0\n' "$HOME" > "$MOCK_ROOT/fstab"
fail 'conflicting fstab mapping'
not_called 'diskutil <mount>'
echo 'ok: case and dot-component fstab path aliases rejected'

fresh
mkdir "$HOME/repos"
export MOCK_MOUNTPOINT_MISSING=true
fail 'Cannot identify the underlying mountpoint'
not_called '<addVolume>'
not_called 'chown <root:wheel>'
echo 'ok: missing underlying mountpoint metadata fails closed'

printf 'All repos volume mock scenarios passed. Native macOS runtime/reboot remains unverified.\n'
