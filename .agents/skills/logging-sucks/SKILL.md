---
name: logging-sucks
description: Use when adding, refactoring, or reviewing application logging, structured log fields, request/job correlation, trace context propagation, log sampling, or incident-debugging observability. Guides agents to preserve existing logging conventions, prefer structured queryable events, add safe context, and avoid leaking secrets or sensitive data.
license: MIT
compatibility: opencode
metadata:
  source: https://loggingsucks.com/
  author: Boris Tane
---

> This skill is adapted from ["Logging sucks. And here's how to make it better."](https://loggingsucks.com/) by Boris Tane.

When helping with logging, observability, or debugging strategies, follow these principles:

## Agent Workflow

- Inspect existing logger APIs, field names, tracing, redaction helpers, middleware, and tests before changing code.
- Preserve compatible schema names and local conventions unless the task is a logging migration.
- Add context at boundaries such as request middleware, job runners, service clients, or error handlers when possible.
- Validate emitted shape with tests, snapshots, sample output, or review of the logger call signature.
- Do not introduce a new logging dependency unless requested or clearly justified.

## Core Philosophy

- Logs are optimized for querying, not writing — design with debugging in mind
- Context is everything — a log without correlation IDs is useless in distributed systems
- Logs are for humans during incidents, not just for compliance or "just in case"
- If you can't filter and search your logs effectively, they provide zero value
- **Mental model shift**: Log *what happened to this request*, not *what your code is doing*

## Wide Events / Canonical Log Lines

Instead of scattering 10-20 log lines throughout a request, prefer **one comprehensive event per request or job per service** when applicable. Supplemental logs are useful for meaningful state transitions, external calls, retries, audit/security events, or rare debugging points.

- Build the event object throughout the request lifecycle
- Enrich it with context as you process (user info, business data, feature flags)
- Emit once at the end with all context attached
- Include 30-50+ fields containing everything useful for debugging

Example wide event structure:
```json
{
  "timestamp": "2025-01-15T10:23:45.612Z",
  "request_id": "req_8bf7ec2d",
  "trace_id": "abc123",
  "service": "checkout-service",
  "method": "POST",
  "path": "/api/checkout",
  "status_code": 500,
  "duration_ms": 1247,
  "user": {
    "id": "user_456",
    "subscription": "premium",
    "account_age_days": 847
  },
  "cart": {
    "id": "cart_xyz",
    "item_count": 3,
    "total_cents": 15999
  },
  "error": {
    "type": "PaymentError",
    "code": "card_declined",
    "message": "Card declined by issuer"
  },
  "feature_flags": {
    "new_checkout_flow": true
  }
}
```

This enables queries like: "Show all checkout failures for premium users where new_checkout_flow was enabled, grouped by error code."

## Structured Logging Requirements

- Prefer key-value pairs or another structured format instead of string interpolation
- Bad: `"Payment failed for user 123"`
- Good: `{"event": "payment_failed", "user_id": "123", "reason": "insufficient_funds", "amount": 99.99}`
- Structured logs are machine-parseable, enabling aggregation, alerting, and dashboards

## Recommended Fields

- `timestamp` — RFC3339 with timezone when the logger does not add one
- `level` — debug, info, warn, error (be consistent, don't invent new levels)
- `event` — machine-readable event name, snake_case (e.g., `user_login_success`)
- `request_id`, `trace_id`, or `job_id` — whichever correlation scope applies
- `service` — which service/application emitted this log
- `environment` — prod, staging, dev

## Examples of High-Cardinality Fields (always include when available)

- `user_id`, `org_id`, `account_id` — opaque identifiers for who is affected
- `request_id`, `trace_id`, `span_id` — for distributed tracing
- `order_id`, `transaction_id`, `job_id` — domain-specific identifiers

These fields are what make logs actually queryable during incidents. Without them, you're grepping through millions of lines blindly.

Look for opportunities for high-cardinality fields that can help you identify the root cause of an issue quickly.

## Context Propagation

- Pass trace/request IDs through all service boundaries (HTTP headers, message queues, etc.)
- Downstream services must inherit correlation IDs from upstream
- Use middleware or interceptors to automatically inject context into every log
- For async jobs, store and restore the original request context

## Log Levels — Use Them Correctly

- `debug` — Verbose details for local development, usually disabled in production
- `info` — Normal operations worth recording (user actions, job completions, deploys)
- `warn` — Something unexpected happened but the system handled it (retries, fallbacks)
- `error` — Something failed and likely needs human attention (exceptions, failed requests)

Don't log errors for expected conditions (e.g., user enters wrong password)

## What to Log

- Request entry and exit points (with duration)
- State transitions (order created → paid → shipped)
- External service calls (with latency and response codes)
- Authentication and authorization events
- Background job starts, completions, and failures
- Retry attempts and circuit breaker state changes

## What NOT to Log

- Secrets, tokens, raw auth headers, passwords, payment data, unnecessary PII, full payloads, or unbounded user input
- Logs inside tight loops (will generate millions of useless entries)
- Success cases that provide no debugging value
- Redundant information already captured by infrastructure (load balancer logs, etc.)

Use existing redaction/sanitization APIs. Prefer opaque IDs over names, emails, or raw user content.

## Naming Conventions

- Be consistent across all services — agree on field names as a team
- Use the codebase's existing field convention. If none exists, prefer snake_case: `user_id`, not `userId` or `user-id`
- Use past-tense verbs for events: `payment_completed`, not `complete_payment`
- Prefix events by domain when helpful: `auth.login_failed`, `billing.invoice_created`

## Performance Considerations

- Avoid logging inside hot paths unless absolutely necessary
- Buffer and batch log writes to reduce I/O overhead
- Consider log levels that can be changed at runtime without redeploying

## Sampling Strategy (Tail Sampling)

Tail sampling is useful for high-volume request logs — make the sampling decision *after* the request completes based on its outcome:

1. **Always keep errors** — 100% of 5xx status codes, exceptions, and failures
2. **Always keep slow requests** — anything above your p99 latency threshold
3. **Always keep specific users** — VIP customers, internal testing accounts, flagged sessions
4. **Randomly sample the rest** — happy, fast requests get sampled at 1-5%

This ensures you never lose the events that matter during incidents while keeping costs manageable.

Never sample audit, security, or compliance logs unless policy explicitly permits it. Do not treat high-cardinality log fields as safe metric labels; metrics backends often have different cardinality costs.

## During Incidents

- Your logs should answer: Who was affected? What failed? When? Why?
- If you can't answer these within 5 minutes of querying, your logging strategy needs work
- Post-incident: add the logs you wished you had

## Common Misconceptions

- **Structured logging != wide events** — JSON logs with 5 fields scattered across 20 lines are still useless. Wide events are a philosophy: one comprehensive event per request.
- **OpenTelemetry won't save you** — OTel is a delivery mechanism, not a strategy. It doesn't decide what to log or add business context. You still need to deliberately instrument useful events.
- **Logs, metrics, and traces have different costs** — High-cardinality fields are often valuable in logs, but dangerous as metric labels or always-indexed dimensions.

## Review Checklist And Evals

- Does the log include correlation, outcome, duration/status, useful event name, and safe error details?
- Does it avoid secrets, PII, raw payloads, and duplicate error logging at every layer?
- Should activate: "replace these string logs with structured logs" or "add request IDs to logs."
- Should not activate: generic test debugging with no logging changes requested.
- Privacy eval: authorization headers and payment data are removed or redacted.
- Convention eval: existing camelCase log fields stay camelCase unless a migration is requested.
