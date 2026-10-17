#!/usr/bin/env bash
# Run as the login user, never with sudo bash. Uses only macOS system tools.
set -euo pipefail
PATH=/usr/bin:/bin:/usr/sbin:/sbin
export PATH

die() { printf 'repos volume: %s\n' "$*" >&2; exit 1; }
uuid_valid() { [[ $1 =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]]; }
plist() { /usr/libexec/PlistBuddy -c "Print :$2" "$1"; }
info() { diskutil info -plist "$1" > "$tmp/info"; }
empty_mountpoint() {
    [[ ! -L $repos && -d $repos ]] || die "Unexpected mountpoint: $repos"
    # diskutil accepts a device or volume mountpoint, not an ordinary directory.
    # Resolve the containing device before inspecting a not-yet-mounted repos.
    filesystem=$(df -P "$repos" | awk 'NR == 2 { print $1 }') ||
        die 'Cannot identify the filesystem containing repos.'
    [[ $filesystem =~ ^/dev/disk[0-9]+(s[0-9]+)*$ ]] ||
        die 'Unexpected filesystem device for repos.'
    info "$filesystem"
    underlying_mount=$(plist "$tmp/info" MountPoint) || die 'Cannot identify the underlying mountpoint.'
    [[ -n $underlying_mount ]] || die 'Cannot identify the underlying mountpoint.'
    [[ $underlying_mount != "$repos" ]] || die 'An unexpected filesystem is already mounted at repos.'
    contents=$(sudo find "$repos" -mindepth 1 -maxdepth 1 -print -quit) || die 'Cannot inspect the underlying repos directory; refusing to mount.'
    [[ -z $contents ]] ||
        die "$repos contains files on the original filesystem. See README migration instructions; nothing was moved."
}
save_record() {
    printf '%s\n' 'dotfiles-repos-v1' "$uid" "$HOME" "$container_uuid" "$label" "$volume_uuid" "$phase" > "$tmp/record"
    sudo install -o root -g wheel -m 600 "$tmp/record" "$state/record.new"
    sudo mv "$state/record.new" "$state/record"
}
verify_volume() {
    info "$volume_uuid"
    [[ $(plist "$tmp/info" VolumeUUID) == "$volume_uuid" &&
       $(plist "$tmp/info" FilesystemType) == apfs &&
       $(plist "$tmp/info" APFSContainerReference) == "$container" &&
       $(plist "$tmp/info" VolumeName) == "$label" ]] || die 'Recorded volume identity/container does not match; refusing to adopt it.'
    device=$(plist "$tmp/info" DeviceIdentifier)
    [[ $device =~ ^disk[0-9]+s[0-9]+$ ]] || die 'Unexpected APFS device identifier.'
}
verify_mount() {
    verify_volume
    [[ $(plist "$tmp/info" MountPoint) == "$repos" ]] || die 'Volume is not mounted at the expected path.'
    info "$repos"
    [[ $(plist "$tmp/info" VolumeUUID) == "$volume_uuid" &&
       $(plist "$tmp/info" MountPoint) == "$repos" ]] || die 'Mountpoint resolves to a different volume.'
    mount | grep -F "/dev/$device on $repos (apfs, " | grep -Eq '[(,] nobrowse[,)]' ||
        die 'Mount does not have the required APFS/nobrowse options.'
    [[ $(plist "$tmp/info" GlobalPermissionsEnabled) == true &&
       $(plist "$tmp/info" WritableVolume) == true ]] || die 'Volume must be writable with ownership enabled.'
}
write_fstab() {
    # vifs locks and edits fstab in place. Keep the locked inode: never rename
    # it. Validate before writing, retain a backup, then verify the append.
    if sudo test -L /etc/fstab || { sudo test -e /etc/fstab && ! sudo test -f /etc/fstab; }; then
        die 'Unexpected fstab symlink or file type.'
    fi
    cat > "$tmp/editor" <<'EDITOR'
#!/bin/bash
set -euo pipefail
file=$1
entry="UUID=$REPOS_UUID $REPOS_PATH apfs rw,nobrowse,owners 0 0"
if ! awk -v uuid="UUID=$REPOS_UUID" -v label="LABEL=$REPOS_LABEL" -v device="$REPOS_DEVICE" -v path="$REPOS_PATH" -v entry="$entry" '
    function decode(s, n, oct) {
        while (match(s, /\\[0-7][0-7][0-7]/)) {
            oct=substr(s, RSTART+1, 3)
            n=64*substr(oct,1,1)+8*substr(oct,2,1)+substr(oct,3,1)
            s=substr(s,1,RSTART-1) sprintf("%c",n) substr(s,RSTART+4)
        }
        return s
    }
    function pathkey(s, parts, stack, count, i, depth, result) {
        count=split(tolower(decode(s)), parts, "/")
        depth=0
        for (i=1; i<=count; i++) {
            if (parts[i] == "" || parts[i] == ".") continue
            if (parts[i] == "..") { if (depth) depth--; continue }
            stack[++depth]=parts[i]
        }
        result=""
        for (i=1; i<=depth; i++) result=result "/" stack[i]
        return result
    }
    /^[[:space:]]*#/ || NF == 0 { next }
    {
        spec=decode($1)
        if (tolower(spec) == tolower(uuid) || tolower(spec) == tolower(label) ||
            spec == "/dev/" device || spec == device || pathkey($2) == pathkey(path)) {
            if ($0 != entry || found++) exit 1
        }
    }
' "$file"; then
    echo 'repos volume: conflicting fstab mapping; review with sudo vifs.' >&2
    exit 1
fi
if ! grep -Fxq "$entry" "$file"; then
    # Back up the locked snapshot, including comments and unrelated entries.
    backup=$(mktemp /etc/fstab.dotfiles-backup.XXXXXXXX)
    cp -p "$file" "$backup"
    printf '\n%s\n' "$entry" >> "$file"
fi
EDITOR
    chmod 700 "$tmp/editor"
    sudo env EDITOR="$tmp/editor" REPOS_UUID="$volume_uuid" REPOS_LABEL="$label" REPOS_DEVICE="$device" REPOS_PATH="$repos" /usr/sbin/vifs
    sudo grep -Fxq "UUID=$volume_uuid $repos apfs rw,nobrowse,owners 0 0" /etc/fstab || die 'fstab update was not committed.'
}

setup_repos_volume() (
    [[ $(uname -s) == Darwin ]] || die 'This helper requires macOS.'
    uid=$(id -u)
    [[ $uid != 0 ]] || die 'Run as your login user, not root.'
    # Conservative fstab grammar: refuse ambiguous paths rather than escaping
    # them differently for diskutil, mount output and fstab.
    [[ $HOME =~ ^/[a-zA-Z0-9_./-]+$ && $(cd "$HOME" && pwd -P) == "$HOME" ]] ||
        die 'HOME must be an absolute physical path without whitespace or symlinks.'
    repos=$HOME/repos
    state=/var/db/dotfiles-repos-$uid
    [[ ! -L $repos ]] || die "$repos is a symlink; refusing to mount over it."
    [[ ! -e $repos || -d $repos ]] || die "$repos is not a directory."
    tmp=$(mktemp -d)
    locked=false
    # shellcheck disable=SC2329,SC2317 # Called by the EXIT trap (including older ShellCheck).
    cleanup() {
        status=$?
        if [[ $locked == true ]]; then sudo rmdir "$state/lock" || true; fi
        rm -rf "$tmp"
        exit "$status"
    }
    trap cleanup EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM HUP
    sudo -v
    [[ ! -L $state ]] || die "Unexpected state symlink: $state"
    if ! sudo test -e "$state"; then sudo install -d -o root -g wheel -m 700 "$state"; fi
    if [[ $(sudo stat -f '%u:%Lp' "$state") != 0:700 ]] || ! sudo test -d "$state"; then die 'Unsafe state directory.'; fi
    sudo mkdir "$state/lock" || die "Another setup may be running. If interrupted, inspect $state/lock before removing the empty lock."
    locked=true

    # Discover the running startup Data volume, not a guessed disk number or
    # the possibly external filesystem holding HOME.
    info /System/Volumes/Data
    [[ $(plist "$tmp/info" FilesystemType) == apfs &&
       $(plist "$tmp/info" MountPoint) == /System/Volumes/Data ]] || die 'Cannot identify the startup APFS Data volume.'
    container=$(plist "$tmp/info" APFSContainerReference)
    [[ $container =~ ^disk[0-9]+$ ]] || die 'Unexpected startup container reference.'
    diskutil apfs list -plist "$container" > "$tmp/container"
    [[ $(plist "$tmp/container" Containers:0:ContainerReference) == "$container" ]] || die 'Startup container lookup disagrees.'
    container_uuid=$(plist "$tmp/container" Containers:0:APFSContainerUUID)
    uuid_valid "$container_uuid" || die 'Cannot identify the startup container UUID.'

    volume_uuid=-
    phase=creating
    if sudo test -e "$state/record" || sudo test -L "$state/record"; then
        if sudo test -L "$state/record" || ! sudo test -f "$state/record" ||
            [[ $(sudo stat -f '%u:%Lp' "$state/record") != 0:600 ]]; then die 'Unsafe ownership record.'; fi
        # shellcheck disable=SC2024 # Deliberately read root state into a user-owned private temporary file.
        sudo cat "$state/record" > "$tmp/record"
        {
            read -r version; read -r owner; read -r home; read -r recorded_container
            read -r label; read -r volume_uuid; read -r phase
            ! IFS= read -r || die 'Unexpected record fields.'
        } < "$tmp/record"
        [[ $version == dotfiles-repos-v1 && $owner == "$uid" && $home == "$HOME" &&
           $recorded_container == "$container_uuid" && $label =~ ^repos-$uid-[[:xdigit:]-]+$ &&
           ( $phase == created || $phase == ready ) ]] ||
            die "Incomplete or mismatched record at $state/record. See README recovery; no volume was adopted."
        uuid_valid "$volume_uuid" || die 'Invalid recorded volume UUID.'
        verify_volume
    else
        if [[ -e $repos ]]; then
            empty_mountpoint
        fi
        # Record intent first. A crash during addVolume is deliberately a manual
        # recovery case: never discover/adopt an arbitrary pre-existing volume.
        label="repos-$uid-$(uuidgen)"
        save_record
        printf '%s\n' 'Creating an UNENCRYPTED APFS repos volume. Startup FileVault does not establish encryption for this volume.'
        sudo diskutil apfs addVolume "$container" APFS "$label" -nomount
        # The unpredictable label belongs to this invocation. Once recorded,
        # every subsequent operation uses the persistent UUID.
        diskutil apfs list -plist "$container" > "$tmp/container"
        index=0
        matches=0
        while name=$(plist "$tmp/container" "Containers:0:Volumes:$index:Name" 2>/dev/null); do
            if [[ $name == "$label" ]]; then
                volume_uuid=$(plist "$tmp/container" "Containers:0:Volumes:$index:APFSVolumeUUID")
                matches=$((matches + 1))
            fi
            index=$((index + 1))
        done
        [[ $matches == 1 ]] || die 'Cannot uniquely identify the created volume; see README recovery.'
        uuid_valid "$volume_uuid" || die 'Creation returned no volume UUID; see README recovery.'
        verify_volume
        phase=created
        save_record
    fi

    verify_volume
    mounted_at=$(plist "$tmp/info" MountPoint 2>/dev/null || true)
    if [[ -n $mounted_at && $mounted_at != "$repos" ]]; then
        die "Recorded volume is mounted at $mounted_at. Unmount it manually after closing users; no force-unmount is attempted."
    fi
    if [[ -z $mounted_at ]]; then
        if [[ ! -e $repos ]]; then mkdir "$repos"; fi
        empty_mountpoint
        # Protect the underlying directory while the volume is absent. This is
        # an accidental-write guard, not isolation from this user or an admin.
        sudo chown root:wheel "$repos"
        sudo chmod 000 "$repos"
        # Catch writes made between the first inspection and protection.
        empty_mountpoint
        write_fstab
        sudo diskutil mount nobrowse -mountOptions owners -mountPoint "$repos" "$volume_uuid"
    else
        write_fstab
    fi
    verify_mount
    marker=$repos/.dotfiles-repos-volume
    if [[ $phase == ready ]]; then
        if ! { ! sudo test -L "$marker" && sudo test -f "$marker" &&
            [[ $(sudo stat -f '%u:%Lp' "$marker") == 0:600 ]] &&
            sudo cmp -s "$state/record" "$marker"; }; then die 'Volume ownership marker is missing or mismatched.'; fi
        [[ $(stat -f '%u' "$repos") == "$uid" ]] || die 'Volume root ownership changed; inspect manually.'
    else
        # Only the freshly created, recorded volume gets initialized. No
        # recursive chown, deletion, or chmod of existing user folders.
        [[ ! -e $marker && ! -L $marker ]] || die 'Unexpected marker on a volume awaiting initialization.'
        sudo chown "$uid:$(id -g)" "$repos"
        sudo chmod 700 "$repos"
    fi
    path=$repos/.fseventsd
    if sudo test -L "$path" || { sudo test -e "$path" && ! sudo test -d "$path"; }; then die "Unexpected path: $path"; fi
    sudo mkdir -p "$repos/.fseventsd"
    log=$repos/.fseventsd/no_log
    if sudo test -L "$log" || { sudo test -e "$log" && ! sudo test -f "$log"; }; then die 'Unexpected no_log path.'; fi
    # Do not truncate an existing file or follow a link.
    if ! sudo test -e "$log"; then sudo touch "$log"; fi
    [[ $(sudo stat -f '%z' "$log") == 0 ]] || die 'Existing no_log is not empty; inspect manually.'
    sudo mdutil -i off "$repos"
    if [[ $phase == created ]]; then
        phase=ready
        save_record
        sudo install -o root -g wheel -m 600 "$tmp/record" "$marker"
    fi
    printf 'Repos APFS volume ready at %s (UUID %s).\n' "$repos" "$volume_uuid"
)

setup_repos_volume
