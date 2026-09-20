# Clients and sources

## Establish the target

Identify the requested client and build before changing compatibility code. For a latest-client request, check current sources; for an explicitly supported older build, use matching sources. Obtain TOC interface numbers from the fourth `GetBuildInfo()` return or corroborated documentation for that client. Never derive them from marketing names or copy numbers from an unrelated add-on.

Infer targets from the request and repository manifests first. If an unknown target would change the implementation, ask for the client/build rather than silently adding support. When online sources are unavailable, use local client exports or previously verified sources for that build. If a consequential contract remains unresolved, isolate that dependency and identify the specific source or runtime observation needed.

Use the [generated Blizzard API documentation](https://github.com/Gethe/wow-ui-source/tree/live/Interface/AddOns/Blizzard_APIDocumentationGenerated) as the source index. This is a community mirror. Select the branch matching the installed flavor and check its `version.txt`; a branch name alone does not establish the build. Inspect the corresponding loaded implementation or XML when the generated contract omits behavior. Check TOCs and flavor overrides before assuming a file is used.

Search by the needed subsystem: build, specialization, unit, frame, encoding, or profiler documentation. For templates and widgets, inspect the selected branch's owning UI module. Prefer client exports and Blizzard-authored contracts over library assumptions; use maintained library docs for library behavior. Forum posts and other add-ons can supply leads, not proof of another client's contract.

## Retail and Forever

Treat Forever as a distinct client using modern Mainline infrastructure, not a Classic Era API surface inferred from its gameplay. Share common code and isolate verified differences in a small adapter.

| Concern | Development rule |
| --- | --- |
| Client identification | Verify the discriminator for the intended clients. Mainline-family identity or the presence of one function is insufficient. Avoid guessed helper names and permanent interface-range heuristics. |
| Profile context | Distinguish Retail specialization identity from Forever talent-group identity. Verify current accessors and change events before wiring the resolver. API presence does not establish equivalent semantics. |
| UI infrastructure | Check current Settings, menu, frame, and template contracts before introducing legacy wrappers. |
| Game data | Compare return shapes, event payloads, supported classes, and instance information. Keep instance type, difficulty, and group size distinct. |
| Restrictions | Check secret-value annotations and protected-action rules on each target. Neither API presence nor `pcall` makes a prohibited operation valid. |

If context identity is temporarily unavailable, preserve the user's current selection and resolve it later. Recheck affected contracts when the build changes, including namespace migrations and removed frame methods. Record consequential uncertainty with the source/build, symbol, and remaining runtime check; stop browsing once the needed decision is supported.
