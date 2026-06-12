# Tuning Reference

Use this reference for Porsche 911 Carrera 3.2 Motronic calibration advice. Treat all advice as provisional until validated on the specific engine.

## Minimum Data Before Tune Advice

Ask for the smallest missing set that changes the recommendation:

| Area | Data to request |
|---|---|
| Engine | Displacement, compression ratio, cams, heads, exhaust, intake, AFM, throttle body, injectors |
| Fuel | Octane, ethanol content, fuel pressure, pump/regulator status, injector flow/cleaning data |
| Calibration | ROM file, chip source, DME part number, 24/28-pin, baseline maps, checksum/tooling |
| Measurements | Wideband AFR under load, timing-light confirmation, CHT/oil temperature, dyno or road-load logs |
| Use case | Street, track, emissions requirement, altitude, climate, rev limit target |

## Build-Advice Discipline

- Start by asking what problem the build is solving: power target, RPM range, drivability, budget, emissions, track/street use, and tolerance for shorter service life.
- Do not recommend tearing down a healthy 3.2 solely for a small power bump without compression, leakdown, oil pressure, oil consumption, head-stud, and use-case evidence.
- Treat forum build recipes as combinations, not isolated parts. Pistons, cams, exhaust, head flow, intake, AFM/MAF/ITB, gearing, compression, fuel, and chip strategy must match.
- Consider gearing and vehicle weight before assuming the engine needs more peak horsepower.

## Conservative Calibration Principles

- Do not make blanket ignition changes. Change only the load/RPM cells supported by evidence.
- Do not tune fuel maps to compensate for mechanical faults, low fuel pressure, clogged injectors, vacuum leaks, or bad sensors.
- Keep WOT richer and timing more conservative when knock detection is weak, fuel quality is uncertain, CHT is high, or compression is elevated.
- Compare against a verified stock or known baseline before evaluating a modified chip.
- Preserve drivability transitions: idle to part-throttle, part-throttle to WOT, overrun, and high-load enrichment.
- Validate changes in small increments and keep reversible binary versions with hashes.
- If the car already has chip, cat delete, and freer exhaust, warn that a stock-displacement single-plug Motronic 3.2 has limited easy gains left without displacement, cam/compression changes, forced induction, or induction changes.

## Fuel Guidance

- Fuel map bytes decoded as `raw / 128` are correction multipliers, not AFR targets.
- Use wideband AFR for tuning. Narrowband O2 feedback is not WOT evidence.
- Lean WOT on an air-cooled engine is high risk, especially with high compression, hot heads, or poor fuel.
- Rich misfire can appear lean on a wideband. Correlate with ignition quality, plugs, and logs.
- Sudden high-RPM lean-out often points to fuel delivery, injector, AFM/load, or voltage problems before map shape.

## Ignition Guidance

- Use the ROM's stated ignition conversion and report it. For the known 1989 28-pin decode: `degrees_btdc = raw * (360 / (129 * 4)) - 13.945`.
- Verify actual timing with a timing light. Decoder math does not prove distributor/indexing or DME output timing on the engine.
- More VE does not automatically justify more timing. Better cylinder filling can require less timing at the same RPM.
- High-compression, hot air-cooled heads, marginal octane, carbon buildup, and sustained load reduce knock margin.
- Part-throttle advance can be high under low load. Do not compare low-load cruise timing to WOT timing as if they share knock risk.

## Engine Build Risk Notes

- 3.2 performance builds should explicitly discuss rod-bolt condition and intended RPM. Several experienced Pelican engine builders flag 3.2/3.3 rod bolts as a weak point for high-RPM or money-shift history.
- For street pump gas, be conservative with compression ratio assumptions. Measure chamber volume, piston dome/dish volume, deck height, and piston-to-valve clearance instead of relying only on catalog specs.
- Do not lower compression by blindly adding deck height without discussing squish, detonation margin, measured CR, fuel, and builder risk tolerance.
- Non-stock cams require checking piston-to-valve clearance through overlap and validating idle/transition quality with Motronic or EFI.
- Wider lobe centers are commonly used to keep CIS/Motronic/EFI idle and transitions manageable. Treat any specific cam/LSA recommendation as build-specific and verify with the cam grinder or tuner.
- Exhaust/header changes can improve seat-of-pants response, but evaluate AFR and chip match after hardware changes.

## Common Build Considerations

| Build change | Calibration implication |
|---|---|
| 993SS or larger cams | Changes VE curve and idle quality. Validate low-RPM drivability and mid/high-RPM fueling. |
| Headers/SSI/exhaust | Can improve scavenging and VE. Watch WOT AFR and transition fueling. |
| Big-port heads | Can shift airflow demand. Validate load scaling and upper-RPM fuel. |
| Higher compression | Reduces ignition safety margin. Be conservative with WOT timing and fuel quality. |
| Lightweight flywheel | Affects idle stability and transient behavior more than steady-state maps. |
| Stock barn-door AFM | May become a load-measurement restriction or scaling limit on modified engines. |
| Larger injectors | Require injector constant/dead-time strategy, not just fuel-map percentage edits. |

## Validation Plan

1. Verify mechanical health: compression/leakdown, valve adjustment, plugs, ignition, fuel pressure, injector condition, no intake leaks.
2. Verify sensor data: CHT, AFM sweep, idle/WOT switch, speed/reference quality, O2 behavior if used.
3. Establish baseline logs with the current chip.
4. Decode and hash the baseline ROM.
5. Make one small calibration change at a time.
6. Validate with wideband AFR, timing light, temperature monitoring, and controlled load.
7. Keep notes tying each change to a symptom, log, or dyno result.

## Safety Language

Use direct wording when needed:

```text
This is not a finished safe tune. It still needs wideband AFR, timing-light confirmation, temperature monitoring, fuel-octane validation, and controlled load or dyno testing before hard use.
```

## Refuse Or Redirect

Do not provide a finished aggressive ignition or lean WOT table from engine specs alone. Provide a conservative validation workflow and identify the missing measurements.
