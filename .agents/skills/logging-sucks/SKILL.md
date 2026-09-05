---
name: logging-sucks
description: Design or review structured application logging, canonical request events, correlation, redaction, and sampling. Use when changing logging instrumentation or auditing log quality, not for every debugging task.
license: MIT
metadata:
  source: https://loggingsucks.com/
  author: Boris Tane
---

# Structured request logging

Adapted from [Boris Tane's logging guide](https://loggingsucks.com/). Preserve the existing logger, transport, field schema, and runtime constraints unless changing them is part of the request.

## Event design

Start with the incident question the logs must answer. Prefer a canonical completion event for each request or job when the runtime can emit it reliably. Accumulate outcome, duration, correlation, and relevant domain context during execution. Retain separate events for independently actionable failures, long-running progress, or required audit records; do not force every event into a single request summary.

Use the logger's structured fields and established naming conventions. Include a stable event name, severity, timestamp, service, and outcome where applicable, reusing metadata the platform already supplies. Attach request, trace, or job identifiers when available and appropriate. Use only fields that answer a concrete query; there is no field-count target.

Propagate correlation through HTTP, queues, and asynchronous jobs using the runtime's supported mechanism. Avoid mutable global context that can leak identifiers between concurrent requests.

## Privacy and cost

Allowlist useful context and redact before emission. Do not serialize full request objects, credentials, cookies, raw bodies, private URLs, or personal data merely because they are available. Include permitted identifiers according to the product's data policy and retention needs. Bound event sizes and avoid logs in tight loops.

Choose retention and sampling from the actual traffic, budget, and incident needs. Favor retaining errors and diagnostically useful slow requests, but do not mandate 100% retention, VIP tracking, or a fixed success-sampling rate. Account for crashes or cancellations that can prevent completion events from being emitted.

For a concrete event schema or sampling design, read [references/event-design.md](references/event-design.md).

## Review and validation

For an audit, report evidence-backed findings without editing. For requested instrumentation changes, implement them and check the affected success, failure, or concurrency path. Verify correlation isolation, redaction, and emission behavior where the change puts them at risk. Once those checks pass, stop optional validation.

Report the incident query enabled by the change and any remaining visibility gap. Do not replace the logging stack or rewrite unrelated call sites solely to enforce this skill's preferred pattern.
