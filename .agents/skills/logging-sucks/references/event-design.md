# Event and sampling design

Use this reference when choosing fields or sampling behavior. This example is illustrative, not a required schema:

```json
{
  "event": "checkout_completed",
  "level": "error",
  "request_id": "req_example",
  "service": "checkout",
  "status_code": 503,
  "duration_ms": 1247,
  "error": { "type": "UpstreamUnavailable", "code": "payment_timeout" }
}
```

Supply timestamps and deployment metadata through the logger or platform when possible. This event can answer which checkout failures were payment timeouts and how long they took without storing a customer's raw payment details. Add domain identifiers only when permitted and useful for a specific query.

Use the logger already present: context objects in Node loggers, structured attributes in Go, structured formatters or `extra` in Python, and bounded redacted structured events in Workers. Check the runtime's current logging API before choosing an encoding or adding a library.

For outcome-based sampling, make the retention decision after the outcome is known. Select policies for failures, slow requests, and normal traffic based on diagnostic value and volume. Check whether the platform already samples, whether sampling is consistent across related events, and whether cancellation loses the only record of a request. Keep mandatory audit events under their own retention requirements.

High-cardinality fields can be useful in event stores but have indexing, storage, privacy, and billing costs. Verify the actual backend before adding them; do not copy event identifiers into metric labels by default.
