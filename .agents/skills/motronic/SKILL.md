---
name: motronic
description: Diagnose Porsche Carrera 3.2 Bosch Motronic faults and interpret DME ROMs or calibration changes. Use for 1984-1989 3.2 DME systems, including swaps into earlier cars; not generic 911, CIS, or other ECU advice.
---

# Porsche 3.2 Motronic

Identify the actual engine, harness, DME, and chip family from available evidence; chassis year alone is insufficient on a conversion. Preserve measured facts and distinguish them from hypotheses. Ask only for the smallest missing detail that changes the next diagnostic branch or makes a specific instruction safe.

## Read the relevant reference

| Task | Read when needed |
|---|---|
| Fault isolation, no-start, hot-start, sensors, injector/spark, wiring | [Diagnostics](references/diagnostics.md) |
| ROM identity, offsets, conversions, XDF alignment | [ROM decoding](references/rom-decoding.md) |
| AFR, timing, engine-build or calibration changes | [Tuning](references/tuning.md) |
| Pelican forum research or field-repair context | [Pelican research](references/pelican-research.md) |
| Conflicting evidence, source selection, or a detailed decode report | [Sources and reporting](references/sources-and-reporting.md) |

Read only references needed for the current question. Fetch current primary evidence when exact technical claims need verification; these notes do not replace the correct wiring diagram or a ROM-specific decode. Use forum accounts as hypotheses and cite them when they materially support the answer.

## Diagnostic constraints

Do not invent pinouts, component specifications, map addresses, checksums, or safe timing/AFR targets. Before pin-level probing, establish the DME/harness version and verify the pin against its wiring source. State connector location, key or engine state, instrument mode, and what each result would establish.

Use measurements to isolate the fault instead of prescribing parts replacement or restarting a completed diagnostic checklist. Provide the next useful test and its possible branches; request the result before drawing a conclusion that depends on it. Investigate hardware faults before tuning around them.

For ROM work, preserve the original binary and record its hash. Treat bundled offsets and formulas as specific to their documented image until alignment is proven. Do not claim a tune is safe from map math or engine specifications alone; relate risk to actual AFR, timing, fuel, temperature, and controlled-load evidence.

For physical EPROM reads/writes, use an available programmer-specific workflow or verified programmer documentation. Do not assume a `minipro` skill is installed. Decoding a binary does not authorize programming a chip.

## Response

Lead with the supported conclusion or next check, then the decisive evidence and material uncertainty. Use a fuller report only when the user asks for one or the data requires it. Keep electrical and engine-risk cautions specific to the proposed action; do not attach a generic risk section to every answer.
