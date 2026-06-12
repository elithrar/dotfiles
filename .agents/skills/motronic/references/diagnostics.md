# Diagnostics Reference

Use this reference for 1984-1989 Porsche 911 Carrera 3.2 Bosch Motronic DME fault isolation. Verify year-specific pin numbers and specifications against the Porsche workshop manual, Bentley manual, or wiring diagram before directing invasive probing.

## Diagnostic Discipline

- Diagnose from the symptom state. A car that fails only hot, only under load, or only after chip work needs a different first test than a cold no-start.
- Capture the exact condition for every measurement: key off, key on, cranking, idling, hot soak, or loaded road/dyno pull.
- Keep branches binary when possible: spark yes/no, injector pulse yes/no, fuel pressure in range/out of range, sensor signal present/absent.
- Prefer voltage drop, loaded circuits, and scope captures over unplugged resistance checks when chasing intermittent faults.
- After each test, state what result would move the diagnosis left or right.

## Evidence Hierarchy

Prefer evidence in this order:

| Strength | Evidence |
|---|---|
| Strongest | Factory wiring diagram, DME part number, oscilloscope capture at DME pins, measured fuel pressure, verified spark/injector pulse, ROM hash |
| Strong | Bentley/workshop test procedure, known-good substituted relay/sensor with matching part, continuity and voltage-drop tests |
| Medium | Resistance-only checks, scan of modified harness, owner symptom description |
| Weak | Forum memory, unlabeled chip claims, replacement-part history, "it was working before" |

## Fast Symptom Split

| Symptom | First checks |
|---|---|
| Cranks, no start, no fuel pump during crank | DME relay, DME power/grounds, speed/reference signal, pump circuit |
| Cranks, spark present, no injector pulse | DME power/grounds, speed/reference signal, injector power feed, DME injector driver path |
| Cranks, injector pulse present, no spark | Coil power, coil, ignition driver path, distributor/cap/rotor/wires, speed/reference input quality |
| Starts then dies | AFM signal, idle switch/ICV, CHT, fuel pressure, vacuum leaks, DME relay vibration/heat failure |
| Hot no-start | DME relay, speed/reference sensors, CHT sensor, coil, fuel pressure residual/leakdown |
| Rich running | CHT circuit, fuel pressure/regulator, leaking injectors, AFM signal, O2 feedback, chip/tune |
| Lean/WOT detonation | Fuel pressure/volume, clogged injectors, AFM/load signal, air leaks, chip calibration, octane, ignition timing |
| Idle hunt | Vacuum leaks, base idle setup, idle switch, ICV, CHT, AFM bypass, mixture setting, chip idle maps |
| Tach bounce/dropout during crank or cutout | Speed/reference signal, DME power, ignition primary signal, wiring/connector intermittency |
| Runs worse after chip install | Chip orientation, adapter/pin count, ROM family, checksum behavior, bent pins, baseline chip comparison |
| Stops at same RPM every time | Verify tach accuracy, identify ECU vs external rev limit, compare no-load/light-load/heavy-load behavior, check chip rev-limit byte if Motronic |

## No-Start Workflow

1. Confirm battery voltage while cranking. Low cranking voltage can mimic DME or sensor faults.
2. Verify DME relay operation under load. Do not rely only on relay clicking.
3. Verify DME grounds with voltage drop while cranking.
4. Confirm fuel pump runs when commanded and fuel pressure is in range for the car's regulator setup.
5. Check spark with a proper spark tester during cranking.
6. Check injector pulse with a noid light or scope during cranking.
7. If both spark and injector pulse are absent, prioritize speed/reference sensor signal, DME relay power, grounds, and DME internal failure.
8. If spark exists but injector pulse is absent, check injector power feed, DME injector driver path, harness continuity, and speed/reference signal quality.
9. If injector pulse exists but spark is absent, check coil power, coil primary/secondary, ignition output stage, distributor, cap, rotor, wires, and DME ignition command.

## No-Start Interpretation Matrix

| Spark | Injector pulse | Fuel pressure | Most useful next branch |
|---|---|---|---|
| No | No | Unknown or present | DME power/grounds, DME relay, speed/reference signal, alarm/immobilizer interruption, DME internal fault |
| Yes | No | Present | Injector power feed, injector harness, DME injector driver, speed/reference signal quality, chip/DME fault |
| No | Yes | Present | Coil power, ignition output path, coil, distributor, cap/rotor/wires, ignition command path |
| Yes | Yes | Low or absent | Pump, filter, regulator, fuel pump power, tank supply, pressure test setup |
| Yes | Yes | Present | Mixture, CHT, AFM, timing, vacuum leaks, compression/mechanical, flooded engine |

## Motronic Power Logic

- Treat the DME relay as two loaded power paths, not a single click/no-click part.
- Verify relay socket tension and voltage under cranking load.
- Confirm DME grounds with voltage drop. A clean ohms reading with no load is weak evidence.
- Fuel pump behavior depends on DME control and engine-speed evidence. A pump that runs when jumpered does not prove the DME sees engine speed.
- On 3.2 Motronic cars, do not expect a long fuel-pump prime before cranking. Lack of audible pump noise with key on is not by itself a failed pump or relay.
- Alarm, immobilizer, stereo, or aftermarket wiring can interrupt DME power or fuel pump control. Inspect modifications early when symptoms appeared after electrical work.

## Harness And Electrical Checks

- Use voltage-drop tests under load for power and ground faults. Continuity alone can miss high-resistance connections.
- Back-probe only when it will not spread terminals. Prefer breakout leads where available.
- Inspect engine/transmission grounds, battery grounds, DME ground points, relay socket tension, and alarm/immobilizer splices.
- Treat swapped speed/reference connectors as a common post-service fault.
- Treat brittle CHT, reference sensor, injector, AFM, and ICV connectors as likely intermittent points on original harnesses.
- Confirm DME pin numbers against the correct year wiring diagram before probing. Early and late details can differ.

## Connector And Harness Failure Modes

| Area | Failure pattern |
|---|---|
| Speed/reference connectors | Swapped connectors, brittle plugs, heat-related opens, incorrect gap, damaged bracket, weak cranking waveform |
| CHT connector | Open circuit or high resistance causing rich running, hard start, plug fouling, fuel smell |
| AFM connector | Intermittent signal dropout, poor sweep, tampered spring/bypass, intake boot leaks misread as AFM faults |
| Injector harness | Broken strain relief, poor shared power feed, driver-side wiring damage, intermittent batch loss |
| DME connector | Spread terminals, corrosion, water intrusion, pushed-back pins, poor ground pins |
| Engine grounds | Random cutout, weak spark, sensor noise, relay chatter, voltage-dependent behavior |

## Sensor Connector Tips From Field Threads

- Treat speed/reference sensor connector order as a high-probability fault after engine removal, clutch work, or harness repair.
- Mark connector bodies and harness-side plugs before disassembly. Use photos plus durable tape/number tags; marker ink can rub off.
- John Walker's Pelican guidance reports the factory position as the top sensor plug going to the bottom bracket hole, but verify against the correct year wiring and actual harness before relying on memory.
- If the car will not fire after sensor connector work, swapped speed/reference plugs are a quick branch to test. Prefer scope confirmation when possible.
- Exposed shield braid, crumbling insulation, or missing outer sleeve on speed/reference leads is enough reason to suspect intermittent signal even if a static resistance check passes.

## Sensor Notes

| Component | Diagnostic approach |
|---|---|
| Speed/reference sensors | Resistance checks are useful but incomplete. A scope during cranking gives stronger evidence. Verify connector order, sensor gap, bracket integrity, and flywheel/reference pin condition. |
| Cylinder head temperature sensor | An open or high-resistance CHT circuit can cause very rich running. Verify resistance against temperature and inspect single-wire vs two-wire update status. |
| AFM | Check flap movement, supply/reference, signal sweep smoothness, connector condition, and intake leaks before adjusting spring tension. |
| Idle/WOT switches | Verify actual closed/open states at the throttle body and DME input. Mechanical adjustment matters. |
| O2 sensor | For closed-loop cars, distinguish sensor fault from mixture, exhaust leak, heater, or control issue. Do not use narrowband data as WOT AFR evidence. |
| ICV | Confirm power/control, valve movement, hoses, idle switch, and base idle setup before blaming maps. |

## Sensor Result Interpretation

- A speed/reference resistance reading in range does not prove a usable cranking waveform.
- A CHT value must be interpreted against actual head temperature. Cold, warm, and hot values should move plausibly.
- An AFM sweep should be smooth. Dropouts matter more than a single static value.
- An idle switch must be mechanically true at closed throttle. A correct switch can still be misadjusted.
- A WOT switch/input fault can cause high-load enrichment or ignition strategy complaints that look like a bad chip.

## Fueling Checks

- Measure fuel pressure with the correct vacuum reference state and during load if possible.
- Confirm pump volume, filter condition, regulator behavior, and residual pressure for hot-start complaints.
- Flow-test and clean injectors when diagnosing cylinder imbalance, lean WOT, or unknown storage history.
- Do not tune around low fuel pressure, weak pump volume, clogged injectors, or vacuum leaks.

## Fueling Fault Patterns

| Pattern | Likely branches |
|---|---|
| Strong fuel smell, wet plugs, hard start | CHT open/high resistance, leaking injectors, excessive fuel pressure, repeated cranking flood |
| Lean under load, normal idle | Pump volume, filter, regulator, injector flow, voltage supply, AFM/load signal, WOT map only after hardware checks |
| One or two cylinders different | Injector flow, plug/wire/cap issue, intake leak near runner, compression/leakdown |
| Hot restart long crank | Residual pressure, check valve, leaking injector, CHT hot value, speed/reference sensor heat failure |

## Ignition Checks

- Confirm base/measured timing with a timing light after any chip or DME work.
- Inspect cap, rotor, plug wires, plug heat range/gap, coil, grounds, and distributor condition before changing maps.
- Misfire under load can appear as false lean on a wideband. Correlate AFR with RPM, ignition scope, and plug reads.
- Excessive timing on an air-cooled 911 can cause detonation without obvious audible knock.

## Ignition Fault Patterns

| Pattern | Likely branches |
|---|---|
| No spark and no injector pulse | Upstream DME enable issue: power/grounds, speed/reference signal, relay, DME |
| Misfire only under load | Coil, cap/rotor, plug wires, plug gap/heat range, fuel pressure, lean mixture |
| Tach drops during cutout | Primary ignition/speed signal/power interruption, not simple fuel mixture first |
| Timing differs from decoded map | Distributor/indexing, DME hardware, conversion assumptions, timing-light setup |

## High-RPM Cutout And False Rev-Limit Checks

- First prove the tach reading with an independent tach, timing light tach mode, scope, or data log. A bad tach can make a normal cutout look low.
- A true programmed rev limit should be repeatable at the same RPM in neutral, light load, and heavy load. Load-sensitive breakup points to fuel delivery, ignition energy, AFM/load signal, or sensor waveform quality.
- For Motronic chips, the rev limit is software-coded; inspect the ROM byte or compare with a known-good chip before assuming a mechanical fault.
- Reference sensor air gap or waveform issues can mimic an RPM wall or rough breakup. A static ohms check is weaker than checking gap and signal quality.
- If an MSD or other aftermarket ignition box is installed, check its rev-limit module/dial before chasing the DME.
- If the symptom appeared after distributor, engine, clutch, or harness work, inspect ignition installation, sensor gap, sensor connector order, and disturbed grounds before tuning around it.

## DME And Relay Notes

- A known-good DME relay is a valid quick substitution, but still verify power outputs under crank/run conditions.
- Intermittent solder joints, water intrusion, connector tension, or alarm splices can mimic sensor faults.
- Before condemning a DME, prove power, grounds, inputs, output loads, and harness continuity.
- Before installing a modified chip, verify orientation, pin count, adapter use, checksum behavior, and ROM family.

## Chip-Swap Debugging

1. Confirm the car runs on the original known-good chip before blaming the harness or sensors.
2. Confirm EPROM size, 24-pin vs 28-pin compatibility, adapter orientation, notch direction, and pin condition.
3. Hash and archive the binary before editing.
4. Verify map family and checksum behavior before changing tables.
5. If a symptom appears only with one chip, compare fuel, ignition, rev limit, idle, and WOT transition behavior against the baseline.

## Harness Repair Practice

- Photograph every connector before depinning.
- Tag wires with numbered tape and keep a written pin map. Do not rely on color memory alone.
- If the harness has non-original tape, splices, or previous repairs, assume the current pin order may be wrong until verified.
- Use wire bend memory only as supporting evidence. Confirm with the wiring diagram or a known connector map.
- Inspect and resolder or replace fatigued terminal pins when strands are cracked, green, loose, or vibration-damaged.

## Report Template

```markdown
## Symptom
## Car/DME Identity
## Measurements Already Taken
## Most Likely Fault Path
## Next Three Tests
## Risks
```
