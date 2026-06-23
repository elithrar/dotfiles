# minipro Command Recipes

Use these recipes when answering practical `minipro` questions. Prefer exact commands over abstract advice, but ask for the chip marking if the device name is unknown.

## Connect To A T48 Over USB

`minipro` discovers the programmer over USB. There is no serial port or device path in normal use.

```bash
minipro --version
minipro -Q
minipro -k
```

Expected evidence:

```text
Supported programmers: TL866A/CS, TL866II+, T48, T56
```

`minipro -k` should report the connected programmer. If it says `No programmer found`, check the USB cable, hub, host permissions, and whether another XGecu process has claimed the device.

## Find The Correct Chip Name

Search against the T48 device database:

```bash
minipro -q T48 -L AT28C64B
minipro -q T48 -L 27C64
minipro -q T48 -L W27C512
```

Then inspect the selected chip entry:

```bash
minipro -d 'AT28C64B@DIP28'
```

Use the pin-placement diagram from `-d` before closing the ZIF socket.

## Write An AT28C64B EEPROM From Raw Binary

For an 8 KB binary:

```bash
stat -f%z 'motronic.bin'
shasum -a 256 'motronic.bin'
minipro -k
minipro -p 'AT28C64B@DIP28' -z
minipro -p 'AT28C64B@DIP28' -E
minipro -p 'AT28C64B@DIP28' -b
minipro -p 'AT28C64B@DIP28' -w 'motronic.bin'
```

Expected file size for a 64 kbit / 8 KB EEPROM is `8192` bytes.

On Linux, use:

```bash
stat -c%s 'motronic.bin'
```

## Verify A File Against The Chip

`minipro` verifies automatically after `-w` unless `-v` is used. Run explicit verification when documenting results:

```bash
minipro -p 'AT28C64B@DIP28' -m 'motronic.bin'
```

If verification fails, do not keep retrying blindly. Reseat the chip, clean pins, confirm the exact device name, rerun the pin check, and verify the source file size.

## Read Back And Confirm Checksums

Read the programmed EEPROM and compare it byte-for-byte:

```bash
minipro -p 'AT28C64B@DIP28' -r 'readback.bin'
cmp 'motronic.bin' 'readback.bin'
```

If `cmp` prints nothing and exits successfully, the files are identical.

Record checksums for both files:

```bash
shasum -a 1 'motronic.bin' 'readback.bin'
shasum -a 256 'motronic.bin' 'readback.bin'
```

The hashes should match line-for-line except for the filenames.

## Read And Archive An Existing Chip

Before overwriting an unknown chip, archive it:

```bash
minipro -p 'AT28C64B@DIP28' -r 'original-read.bin'
stat -f%z 'original-read.bin'
shasum -a 1 'original-read.bin'
shasum -a 256 'original-read.bin'
```

Use a filename that preserves source and date, for example `1987-911-dme-original-2026-06-23.bin`.

## Intel HEX Or S-record Input

`minipro` auto-detects these formats on write:

```bash
minipro -p 'AT28C64B@DIP28' -w 'image.hex'
minipro -p 'AT28C64B@DIP28' -w 'image.srec'
```

For Motronic EEPROM work, prefer raw binary unless the toolchain intentionally emits Intel HEX or S-record files.

## Dangerous Or Easy-To-Misread Flags

| Flag | Meaning | Caution |
|---|---|---|
| `-E` | Erase only | Use before blank-check/write when appropriate |
| `-e` | Skip erase | Do not use when you mean erase |
| `-v` | Skip verify | Avoid for calibration chips |
| `-s` | Ignore size mismatch as warning | Use only with a deliberate padding/truncation plan |
| `-y` | Do not error on ID mismatch | Use only after confirming the chip variant and risk |
| `-x` | Skip ID read in read mode | Use only when ID read is unsupported or misleading |

## Motronic AT28C64B Example

Use this for Porsche 911 3.2 28-pin Motronic 8 KB binaries on `AT28C64B-15P` EEPROMs:

```bash
minipro -k
minipro -q T48 -L AT28C64B
minipro -d 'AT28C64B@DIP28'
stat -f%z '911-3.2-chip.bin'
shasum -a 256 '911-3.2-chip.bin'
minipro -p 'AT28C64B@DIP28' -z
minipro -p 'AT28C64B@DIP28' -E
minipro -p 'AT28C64B@DIP28' -b
minipro -p 'AT28C64B@DIP28' -w '911-3.2-chip.bin'
minipro -p 'AT28C64B@DIP28' -m '911-3.2-chip.bin'
minipro -p 'AT28C64B@DIP28' -r '911-3.2-chip-readback.bin'
cmp '911-3.2-chip.bin' '911-3.2-chip-readback.bin'
shasum -a 256 '911-3.2-chip.bin' '911-3.2-chip-readback.bin'
```

Report the checksum, selected chip name, programmer model, and whether `cmp` was clean. Keep calibration safety separate from programming success.
