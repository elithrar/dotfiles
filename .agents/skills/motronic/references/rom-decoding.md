# ROM Decoding Reference

Use this reference for Porsche 911 Carrera 3.2 28-pin Bosch Motronic EPROM decoding. Treat offsets as ROM-image offsets unless disassembly proves processor address-space remapping.

## Preferred Tooling

For the local Motronic repository, use:

```bash
uv run scripts/decode-motronic.py "911 chip 89 911 28pin 3.bin"
uv run scripts/decode-motronic.py --format=csv "911 chip 89 911 28pin 3.bin"
uv run scripts/decode-motronic.py --variant=all --maps=ign_wot,fuel_wot "911 chip 89 911 28pin 3.bin"
```

Useful flags:

| Need | Flag |
|---|---|
| Alternate map families | `--variant primary|alt1|alt2|all` |
| Narrow map output | `--maps fuel_wot,ign_wot` |
| CSV spreadsheet output | `--format=csv` |
| Explicit offset override | `--map-address NAME=0xADDR` |
| Calibration-family constants | `--rpm-scale`, `--fuel-divisor`, `--teeth`, `--subdivisions`, `--ignition-offset` |

## Verified 1989 28-Pin ROM Identity

Known source file: `911 chip 89 911 28pin 3.bin`

| Item | Value |
|---|---|
| Size | `8192` bytes |
| SHA1 | `d7236c260d4cdb0c5818a209d3a1ac2c10f2e75d` |
| SHA256 | `8cfd26f7ef2bdef756e2a100e756dcfd5d7ccaf633aea3d068ccf0650314526b` |

## Bosch Map Structure Pattern

1D maps:

```text
parameter_byte
axis_count
axis_delta_bytes[axis_count]
data_bytes[axis_count]
```

2D maps:

```text
x_parameter_byte
x_axis_count
x_axis_delta_bytes[x_axis_count]
y_parameter_byte
y_axis_count
y_axis_delta_bytes[y_axis_count]
data_bytes[x_axis_count * y_axis_count]
```

Known parameter bytes in this ROM family:

| Byte | Meaning used here |
|---:|---|
| `0x3E` | RPM axis |
| `0x4F` | Load axis |

## Axis Decoding

Axes are delta-coded from the end of the byte sequence:

```python
def decode_axis(axis_bytes, scale=1):
    value = 256 - axis_bytes[-1]
    out = [value]
    for delta in reversed(axis_bytes[:-1]):
        value -= delta
        out.append(value)
    out.reverse()
    return [v * scale for v in out]
```

Use `scale=40` for RPM axes in this Porsche ROM family.

## Primary Map Offsets

| Map | Structure offset | Data offset | Shape | Units |
|---|---:|---:|---:|---|
| Fuel idle | `0x14ED` | `0x14F9` | 1x10 | raw byte; `raw / 128` multiplier |
| Fuel part-throttle | `0x1441` | `0x145D` | 12x12 | raw byte; `raw / 128` multiplier |
| Fuel WOT | `0x1503` | `0x1519` | 1x20 | raw byte; `raw / 128` multiplier |
| Ignition idle | `0x1360` | `0x136C` | 1x10 | degrees BTDC after conversion |
| Ignition part-throttle | `0x128A` | `0x12A6` | 12x12 | degrees BTDC after conversion |
| Ignition WOT | `0x1336` | `0x1348` | 1x16 | degrees BTDC after conversion |

## Alternate Map Offsets

| Map family | Alternate structure offsets | Notes |
|---|---|---|
| Ignition part-throttle | `0x16D6`, `0x1864` | Same axes, different values from `0x128A` |
| Ignition WOT | `0x1782`, `0x1910` | Same axes, more advanced than `0x1336` |
| Ignition idle | `0x17A4`, `0x1932` | Same axes and values as `0x1360` |
| Fuel WOT | `0x1802`, `0x1990` | Same axes, slightly different values from `0x1503` |

## Conversions

Fuel:

```python
fuel_multiplier = raw / 128
```

Fuel maps are correction multipliers on calculated base pulse width. They are not direct AFR targets.

Ignition:

```python
degree_per_count = 360 / (129 * 4)  # 0.697674...
degrees_btdc = raw * degree_per_count - 13.945
```

Use this conversion to match the known-correct 1989 911 3.2 WOT ignition decode. Reverify absolute timing with a timing light when engine safety matters.

## Rev Limiter Evidence

For the known 1989 8 KB image:

| Scalar | Offset | Raw | Conversion | Decoded value | Evidence |
|---|---:|---:|---|---:|---|
| Rev limiter | `0x1130` | `0xAF` | `raw * 40 rpm` | `7000 rpm` | Code sets `DPTR = 0x1120`, reads offset `0x10`, and compares against RAM variable `0x3E`, the RPM map parameter. |

Distinguish the validated limiter scalar at `7000 rpm` from the highest WOT map axis point at `6840 rpm`.

## Verification Checklist

- Verify ROM size is exactly `8192` bytes for a 28-pin image.
- Record SHA1 and SHA256.
- Parse candidate structures from known offsets or directory pointers.
- Confirm expected shapes: 12x12 part-throttle fuel/ignition, 1x20 WOT fuel, 1x16 WOT ignition, 1x10 idle fuel/ignition.
- Confirm RPM axes are plausible using `* 40 rpm`.
- Confirm fuel values cluster around 128.
- Confirm ignition raw values cluster in expected Porsche range.
- Cross-check WOT terminal axes and report rev-limit scalar separately.
- State formulas and confidence levels in the final report.

## Hard Rules

- Do not invent checksum behavior. Identify it from ROM family, XDF, disassembly, or tool output.
- Do not assume public 2 KB/4 KB XDF offsets apply directly to an 8 KB ROM without proving alignment.
- Show raw values when engineering-unit conversion is uncertain.
- Keep alternate maps separate from primary maps unless code or directory evidence proves selection logic.
