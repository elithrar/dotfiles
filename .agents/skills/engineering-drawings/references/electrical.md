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

## Prove electrical meaning

Use established symbols consistently; distinguish protective earth, chassis/bond, signal reference, and the actual return conductor. State the drawn switch/relay condition. Show polarity and suppression when consequential. A functional internal symbol must not imply verified physical terminal positions.

Trace power and return through normal and commanded states. Check applicable off/lost-supply, stuck/welded contact, lost-return, short-circuit, and fuse-open behavior. Distinguish intended shutdown from credible failure recovery. Reassess these after simplification; do not silently expand the requested functionality.

Support load/inrush, voltage drop, switching duty, and protection with source data and calculations. Check the weakest wire, contact, pigtail, splice, and upstream unfused segment against the protective device's behavior. A fuse's printed value or connector catalogue current alone does not validate coordination, temperature, or the assembly rating. Keep unresolved operating limits explicit and restrict commissioning accordingly.

## Audit the artwork independently

First challenge the schedule's physical interfaces against the assembly evidence; agreement between an invented schedule and its artwork proves nothing. Then compare the intended terminal schedule with connectivity visible in the actual exported geometry, not just net names in the source. Inspect:
- Correct terminal attachment and end-to-end continuity, including hidden or masked endpoints.
- All unlike-net collinear overlaps, endpoint touches, T-junctions, crossings at any angle, and near-coincident paths.
- Junction dots versus deliberate nonconnection gaps/bridges under one consistent convention.
- Wires passing through device bodies, terminal symbols, text, or borders; spare ports accidentally connected.

A no-crossing check misses collinear shorts. A correct netlist does not prove a correct drawing, and a correct drawing does not prove a built harness. Reconcile every depicted item and termination accessory with the BOM. Plan continuity/isolation, retention, loaded current/voltage-drop, temperature, and safe-state tests for the actual assembly without claiming they have been performed.
