# Game data and estimates

## Updating a catalog

Identify the target client, build, source revision or native observation, and the fields it actually establishes. Match records by stable IDs and preserve distinct variants with the same name. For quest rewards, keep guaranteed items, choice groups and quantities separate. An empty group in a partial export leaves that group unknown. A recorded quest can outlive its current availability.

Follow the repository's data pipeline from source records through generation to the shipped lookup. Merge observations at field level, preserving unrelated records and existing evidence. If sources disagree, check their builds, scope and meaning before replacing a value. Run the generator twice, inspect the intended changes, and query representative IDs through the add-on's lookup path.

## Reconciling delayed reads

An event can announce a change before the authoritative getter reflects it. Keep the observation pending while it can still match a later read. Define the matching key, expiry, and the event or owned timer that triggers another sample. Consume a match once and clear it on expiry or an incompatible context change. Exercise a stale first read, a later matching read, duplicate delivery, and expiry without a match.

## Calculated values

Define the quantity, units, denominator, and time window before choosing an API. For example, 930 healing delivered over 15 seconds gives 62 healing per second under a full-duration estimate. Decide how instant casts, channels and periodic effects contribute to the requested metric. Test an ordinary case with a hand calculation and an unavailable or zero denominator. Preserve the distinction between a measured zero and an unavailable estimate in the UI.

For restricted combat reads, consult the matching client contract. When the product permits an estimate from a previously readable value, cache only permitted ordinary data, associate it with the relevant player or spell context, and refresh it when a valid read becomes available. Define what the player sees on a cold start or context change with no usable sample.
