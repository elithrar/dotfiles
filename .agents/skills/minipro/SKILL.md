---
name: minipro
description: Use for minipro CLI workflows with XGecu/TL866 programmers, including detecting a connected programmer, selecting chip/device names, reading/archive, erase/blank-check, write, verify, and readback comparison. Load before giving or running minipro commands for EEPROM/EPROM programming such as AT28C64B, 27C64, raw binary, Intel HEX, or Motronic 8 KB ROM images. Do not use for tune safety analysis unless chip programming is involved.
---

# minipro CLI

Use this skill for safe, evidence-led chip programming with `minipro` and XGecu programmers such as the T48, T56, TL866II+, and TL866A/CS.

## Retrieval Rules

Load `references/command-recipes.md` before giving detailed command sequences, especially for T48 USB connection, writes, verifies, readback checksums, or Motronic/AT28C64B EEPROM workflows.

## FIRST: Verify Installation And Programmer

Run hardware commands only when hardware access is intended. If the user only asks for explanation, provide commands for them to run instead of executing them.

Before write/erase operations, verify:

```bash
minipro --version
minipro -Q
minipro -k
```

Interpretation:

| Result | Meaning | Next action |
|---|---|---|
| `Supported programmers` includes `T48` | CLI supports the programmer | Continue |
| `minipro -k` reports a T48 | USB connection is working | Continue |
| `No programmer found` | Programmer not visible over USB | Check USB cable, power, hub, permissions, and that no other XGecu software has the device open |

## Core Rules

- Never erase or write unless the user explicitly asks to program hardware and confirms the exact chip, image file, image size, orientation/package, and that the target chip may be modified.
- Read and archive existing chip contents before overwrite unless the chip is known blank or disposable.
- Treat `-p` as the **chip/device name**, not the programmer model.
- Let `minipro` auto-detect the USB programmer; do not pass `T48` as the chip.
- Quote device names containing `@`, for example `-p 'AT28C64B@DIP28'`.
- Prefer raw `.bin` for EEPROM/EPROM images unless the user explicitly has Intel HEX or S-record input.
- Verify file size before writing. For Motronic 28-pin 8 KB images, require exactly `8192` bytes.
- Run erase and blank-check before writing EEPROMs unless the chip/device workflow says otherwise.
- Do not use lowercase `-e` when the intent is erase; lowercase `-e` means **skip erase**. Use uppercase `-E` for erase-only.
- Keep verification enabled. Do not use `-v` unless the user explicitly asks to skip verify.
- Confirm important writes by reading back the chip and comparing/checksumming the readback file.
- Warn that successful programming only proves bytes were written; it does not prove a tune is safe.

## Quick Reference

| Task | Command |
|---|---|
| Show version/support | `minipro --version` |
| List supported programmers | `minipro -Q` |
| Check connected programmer | `minipro -k` |
| Search devices for T48 | `minipro -q T48 -L AT28C64B` |
| Show chip info/pin placement | `minipro -d 'AT28C64B@DIP28'` |
| Read chip ID only | `minipro -p 'AT28C64B@DIP28' -D` |
| Pin/contact check | `minipro -p 'AT28C64B@DIP28' -z` |
| Erase chip | `minipro -p 'AT28C64B@DIP28' -E` |
| Blank check | `minipro -p 'AT28C64B@DIP28' -b` |
| Write binary | `minipro -p 'AT28C64B@DIP28' -w 'image.bin'` |
| Verify file against chip | `minipro -p 'AT28C64B@DIP28' -m 'image.bin'` |
| Read chip to binary | `minipro -p 'AT28C64B@DIP28' -r 'readback.bin'` |
| Compare files | `cmp 'image.bin' 'readback.bin'` |
| SHA-256 checksum | `shasum -a 256 'image.bin'` |

## Standard Write Workflow

Use this sequence for a normal binary write only after the destructive-operation confirmation above:

```bash
minipro -k
minipro -q T48 -L AT28C64B
minipro -d 'AT28C64B@DIP28'
stat -c%s 'image.bin'
shasum -a 256 'image.bin'
minipro -p 'AT28C64B@DIP28' -z
minipro -p 'AT28C64B@DIP28' -E
minipro -p 'AT28C64B@DIP28' -b
minipro -p 'AT28C64B@DIP28' -w 'image.bin'
minipro -p 'AT28C64B@DIP28' -m 'image.bin'
minipro -p 'AT28C64B@DIP28' -r 'readback.bin'
cmp 'image.bin' 'readback.bin'
shasum -a 256 'image.bin' 'readback.bin'
```

On macOS, replace `stat -c%s 'image.bin'` with `stat -f%z 'image.bin'`. Portable fallback: `wc -c < 'image.bin'`.

## File Formats

`minipro` auto-detects input format when writing. Raw binary is the default when reading without `-f`.

| File type | Write command |
|---|---|
| Raw binary | `minipro -p 'AT28C64B@DIP28' -w 'image.bin'` |
| Intel HEX | `minipro -p 'AT28C64B@DIP28' -w 'image.hex'` |
| S-record | `minipro -p 'AT28C64B@DIP28' -w 'image.srec'` |

## Troubleshooting

| Symptom | Likely cause | Check |
|---|---|---|
| `No programmer found` | USB/data cable, hub, permissions, device busy | `minipro -k`, System Information/USB, close XGecu app |
| Device name not found | Wrong chip spelling or package | `minipro -q T48 -L <part>` |
| ID mismatch | Wrong chip selected, unsupported ID, counterfeit/variant chip | Recheck markings and `minipro -d`; use `-y` only with evidence |
| Verify fails | Bad contact, wrong chip, wrong voltage/algorithm, bad EEPROM | Reseat chip, run `-z`, clean pins, lower SPI speed only for SPI parts |
| Size mismatch | File size differs from selected chip capacity | Verify intended chip capacity; use `-s` only when intentionally padding/truncating externally |

Stop after repeated verify/contact failures. Do not retry destructive operations until chip selection, placement, contacts, and image size are rechecked.

## Motronic Notes

- For Porsche 911 3.2 28-pin Motronic work, an 8 KB ROM image should be `8192` bytes.
- `AT28C64B-15P` usually maps to `AT28C64B@DIP28`; confirm with `minipro -q T48 -L AT28C64B`.
- Readback equality means the EEPROM contents match the binary. It does not validate fuel, ignition, checksum behavior, or engine safety.
- Before using a modified chip in an engine, validate AFR, timing, temperature, octane, and knock/head-temperature risk under controlled conditions.
