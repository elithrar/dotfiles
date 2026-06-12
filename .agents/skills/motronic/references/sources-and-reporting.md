# Sources And Reporting Reference

Use this reference to keep Motronic answers grounded and readable.

## Source Quality

Prefer primary or measurable evidence:

| Topic | Strong sources |
|---|---|
| Wiring and pinouts | Porsche factory wiring diagrams, Bentley manual, correct-year workshop manual, verified harness continuity |
| Component tests | Factory test procedures, Bentley manual procedures, measured voltage/resistance/scope captures, known-good substitutions with matching parts |
| ROM maps | Binary hashes, local decoder output, XDF with verified offset alignment, disassembly, map directory pointers |
| Tuning | Wideband logs, dyno data, timing-light checks, fuel pressure data, injector flow data, engine build sheet |
| Strategy | Bosch technical training/manuals, Porsche service literature, measured behavior |
| Practical repair context | Wayne Dempsey/Pelican technical articles or books as secondary practical context, verified against diagrams and measurements |
| Pelican forum field advice | Threads with expert posters, high post counts, professional signatures, photos/logs, and a confirmed outcome |

Avoid leaning on forum claims unless they are used as hypotheses and verified with measurements.

Treat named books and articles as references, not authority to invent values. If quoting Bentley, Wayne Dempsey/Pelican, Bosch, Porsche, or XDF-derived data, name the specific source when available and distinguish it from current measurements.

## Pelican Forum Weighting

Weight Pelican Parts forum advice higher when:

| Signal | Why it matters |
|---|---|
| Expert poster with long history | Examples seen in relevant threads include John Walker's Workshop, Henry Schmidt/Supertec, Jeff Alton/Turn3, Bill Verburg, Flat6pac, Matt Monson, stownsen914, PeteKz, mepstein, and other high-post technical contributors. |
| Professional shop or race-prep signature | Suggests repeated real-world exposure, but still verify against measurements. |
| Thread has photos, part numbers, measurements, or final fix | Stronger than speculative diagnosis. |
| Advice matches factory/Bentley procedure | Use as practical confirmation. |
| Multiple independent experts converge | Stronger than a single confident post. |

Weight advice lower when:

| Signal | Risk |
|---|---|
| Single anecdote without final outcome | May be a plausible but wrong branch. |
| Poster says they are guessing | Treat as hypothesis only. |
| Performance recipe without measured compression, AFR, dyno, or fuel details | Not enough for safe tuning. |
| Generic 911 advice applied to 3.2 Motronic | CIS, MFI, carbs, 964/993, and aftermarket EFI differ. |
| Exact pinout or spec from memory | Verify with year-correct diagram or manual before use. |

## Retrieval Bias

- Start with the user's concrete artifact: symptom, measurement, ROM, photo, log, part number, or wiring diagram.
- Pull the matching reference file only when it adds decision-making value.
- Quote exact addresses, formulas, hashes, measured values, and test states when available.
- If evidence conflicts, report the conflict and propose the next measurement that resolves it.
- If year-specific details matter, ask for model year and DME number before giving pin-level instructions.
- When giving a test, include the pass/fail interpretation so the user knows what to do with the result.
- For forum-derived advice, include the thread title or URL when available and state whether the thread had a confirmed resolution.

## Uncertainty Labels

Use these labels consistently:

| Label | Meaning |
|---|---|
| Verified | Proven by current file, measurement, manual, disassembly, or command output |
| Likely | Strongly suggested by symptom pattern and known Motronic behavior, but not yet measured |
| Assumption | Needed to reason, but not provided or proven |
| Unknown | Cannot be concluded from available evidence |

## Diagnostic Answer Format

```markdown
## Summary
## Evidence
## Missing Data
## Analysis
## Risks
## Next Checks
```

Keep `Next Checks` short and ordered. Prefer three high-yield tests over a long checklist.

## ROM Decode Report Format

```markdown
## Summary
## File Identity
## Constants And Assumptions
## Map Offsets
## Fuel Maps
## Ignition Maps
## Verification Notes
## Safety Notes
```

For ignition tables, state the exact conversion formula. For fuel tables, show raw values and `raw / 128` multipliers when applicable.

## Calibration Answer Format

```markdown
## Recommendation
## Known Data
## Assumptions
## Calibration Impact
## Validation Plan
## Safety Risks
```

Do not present a calibration as safe without validation evidence.

## Good Answer Boundaries

Good:

```text
Verified: this 8 KB ROM hashes to the known 1989 image, and the WOT ignition structure at 0x1336 parses as 1x16. Using raw * (360 / (129 * 4)) - 13.945, the terminal WOT cells decode to 27.2 degrees BTDC. This is map math, not proof of actual engine timing; verify with a timing light.
```

Bad:

```text
That chip has 27 degrees and is safe for your build.
```

Good:

```text
Likely fault path: no injector pulse and no spark during cranking points upstream of both outputs, so test DME relay power/grounds and speed/reference signal at the DME before replacing injectors or the coil.
```

Bad:

```text
Replace the DME relay and reference sensors.
```

## Safety Notes

- Air-cooled 911 engines can be damaged quickly by detonation, lean WOT mixtures, overheating, or bad fuel delivery.
- Road-use emissions legality varies by jurisdiction. Flag changes that disable or alter emissions-related behavior.
- Modified chips require correct EPROM orientation, compatible DME hardware, verified checksum behavior, and baseline recovery path.
