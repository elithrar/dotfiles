---
name: web-perf
description: Diagnose page-load and interaction performance using browser traces, network evidence, and source code. Use for site-speed, Lighthouse, Core Web Vitals, or layout-shift investigations; a general accessibility audit is separate.
---

# Web performance investigation

Identify the target page, reported symptom, and relevant device conditions. For audit requests, report findings. For optimization or fix requests, implement the supported changes and validate their effect within the requested scope.

## Choose the evidence path

Inspect the available browser and profiling tools before calling them. Prefer Chrome DevTools traces when available; read [references/devtools.md](references/devtools.md) for trace and network investigation. Use the installed tool schemas rather than assuming example parameters match the current version.

If that MCP server is unavailable, use existing trace or Lighthouse artifacts, another available profiler, or relevant source code. Complete the analysis those sources support and state what could not be measured. Missing profiling tools do not justify stopping source inspection or forcing an MCP installation.

## Diagnose

Record the page/build, viewport, device or emulation, network/CPU throttling, cache state, and interactions relevant to the result. Reloading alone does not establish a cold cache. Keep mobile and desktop observations distinct.

Separate field Core Web Vitals from laboratory measurements. A load-only trace does not establish INP; TBT is a diagnostic lab metric, not a substitute INP measurement. Use the current metric definitions when assigning ratings, and label missing measurements as unavailable.

Follow the bottleneck from trace insight to request, element, or source path. Inspect the relevant LCP phases, layout-shift participants, long tasks, late resource discovery, or cache headers. Confirm ownership and use before recommending removal, especially for third-party scripts or resources used only in later interactions. Zero estimated savings is not evidence of a material problem, but one trace cannot prove a resource is never useful.

## Validate and report

Prioritize findings by observed user impact and confidence. Distinguish measured values, tool estimates, and unmeasured hypotheses; avoid promising additive savings from overlapping insights.

For a fix, compare the affected behavior under equivalent conditions. Repeat measurements when variance or the size of the claimed improvement warrants it. Broaden testing only for an unresolved regression risk or a project gate, then finish.

Report the measured symptom, its supported cause, the concrete fix or recommendation, and the relevant verification limit. Add a metric table when several measurements help comparison. Do not expand a performance request into a mandatory accessibility or whole-codebase audit.
