# Electrical termination and wiring drawings

## Define physical connections

Select exact devices, housings, mating halves, contacts, seals, locks, wire, and termination methods before finalizing the layout. Build the BOM first when requested; iterate it as interfaces are resolved. Do not infer socket cavities from relay function numbers or a kit SKU. For existing or purchased hardware, verify every claimed external lead, terminal, and casing bond against the exact component/assembly documentation or clear physical evidence. Distinguish proposed added wiring from existing interfaces. Distinguish visible construction from proved electrical function: a photo alone may not establish polarity, continuity, or a casing return. A generic functional symbol or intended netlist cannot establish physical interfaces; flag unsupported connections before drawing them as build facts.

Show assembly/enclosure boundaries, external interfaces, every internal lead, actual entry/exit point, connectors, splices, and return paths. Show cable breaks and lengths where needed; distinguish routing intent from a dimensioned installation. Include unused terminals/cavities and their disposition. Do not replace an unmodeled wire with an unexplained ground symbol.

For each connection establish:
- Physical wire/segment or cable/core identity and from/to device and terminal; keep shared net names distinct. Include conductor size and required color/length specification.
- Exact terminal/cavity identity, contact gender, and mating pair. Label mating-face, wire-entry, or solder-side view and orientation/key/latch. Verify handedness from applicable manufacturer data. Label a terminal-callout arrangement explicitly when no physical footprint is established.
- Manufacturer markings versus applied build identifiers. State commoned ports and isolated groups; allocate each conductor to a supported port.
- Every pigtail, gauge transition, branch and splice, including integral fuseholder leads. Reconcile actual conductor count and individual barrel ranges; do not assume two wires may share a contact.
- Independent compatibility of conductor size/material, insulation OD, seal range, housing/contact retention, strip length, applicable crimp, solder, screw/clamp/ferrule method, tooling, and manufacturer torque where specified. Confirm terminal insertion and retention. Never trim strands or invent a universal crimp recipe.

## Check the installed interfaces

- On a prewired relay bank or module, show only documented external leads and terminals. Do not add a field-installed terminal to a preterminated socket or infer its pinout. Same-color wires can have different jobs: label the module, location, jacket marking and function. Explicitly identify a switched positive lead even when it is black.
- Show the physical wire exits and returns separately from the mounting hardware. Never use a fastener or shell as a return without verifying its bond. Trace the ring and conductor to the specified factory ground, bonded stud or return block. Respect no-cut and no-drill requirements; depict the mating adapter or existing attachment. Label each unused lead and its disposition.
- Verify both halves of the mating interface. AWG does not identify bullet diameter; a threaded hole is not a diameter gauge. Use measured dimensions or the component drawing and check full seating and retention. Insulating a crimp is not sealing the mating joint. Identify the seal at each interface and verify sleeve pass-over and recovery.
- Trace the fuse path from the supply to the first split and through each branch. Draw the holders, their integral leads and the splices separately. Branch fuses do not protect the upstream shared feed. If that protection or the lead gauge is unknown, leave an explicit fit-up hold before energizing.
- Reconcile the **actual** BOM to the final order, not the cart. Mark existing parts and conditional choices separately. Count mating halves, contacts and locks without double-counting kit contents. State fitted and spare quantities separately and do not treat an ordered part as fit-qualified.

## Prove electrical meaning

Use established symbols consistently; distinguish protective earth, chassis/bond, signal reference, and the actual return conductor. State the drawn switch/relay condition. Show polarity and suppression when consequential. A functional internal symbol must not imply verified physical terminal positions.

Trace power and return through normal and commanded states with a small truth table, including key-off or loss of the enable signal where relevant. Show mutually exclusive modes as separate views or alternative terminations, not as tied feeds. Reuse the physical device IDs in each view and show what stays connected or gets capped. Check applicable off/lost-supply, stuck/welded contact, lost-return, short-circuit, and fuse-open behavior. Distinguish intended shutdown from credible failure recovery. Reassess these after simplification; do not silently expand the requested functionality.

Support load/inrush, voltage drop, switching duty, and protection with source data and calculations. Check the weakest wire, contact, pigtail, splice, and upstream unfused segment against the protective device's behavior. A fuse's printed value or connector catalogue current alone does not validate coordination, temperature, or the assembly rating. Keep unresolved operating limits explicit and restrict commissioning accordingly.

## Audit the artwork independently

First challenge the schedule's physical interfaces against the assembly evidence; agreement between an invented schedule and its artwork proves nothing. Then compare the intended terminal schedule with connectivity visible in the actual exported geometry, not just net names in the source. Inspect:
- Correct terminal attachment and end-to-end continuity, including hidden or masked endpoints.
- All unlike-net collinear overlaps, endpoint touches, T-junctions, crossings at any angle, and near-coincident paths.
- Junction dots versus deliberate nonconnection gaps/bridges under one consistent convention.
- Wires passing through device bodies, text, or borders; spare ports accidentally connected. Wires enter a housing only at intended interfaces. Pair molded cavity IDs across the two halves; label a key as a key, not a pin view.
- Export-only false strokes. Compare the final PDF at high zoom with the editable source, especially open contacts, connector gaps, rings, and close labels. A renderer carrying over a current point can draw a false lead from text to a ring (e.g. a Cairo arc without a new subpath). Fix the generator, not the visual symptom, and reopen the revised export before release.

A no-crossing check misses collinear shorts. A correct netlist does not prove a correct drawing, and a correct drawing does not prove a built harness. Reconcile every depicted item and termination accessory with the BOM. Plan continuity/isolation, retention, loaded current/voltage-drop, temperature, and safe-state tests for the actual assembly without claiming they have been performed.
