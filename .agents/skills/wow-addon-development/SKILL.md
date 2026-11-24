---
name: wow-addon-development
description: Build, improve, debug, port, or review World of Warcraft Retail and official Forever add-ons. Use for add-on Lua/XML, embedded libraries, game data and estimates, packaging, settings, persistence, performance, and in-game UI. Not for gameplay advice, addon recommendations, or WoW-themed websites.
---

# WoW Add-on Development

Develop the requested behavior within the add-on's supported clients and repository conventions. Use the current checkout and latest accepted requirements as the baseline; older plans and screenshots may be superseded. Preserve planning or review-only scope; for implementation, continue from accepted decisions through verification.

## Read what the task needs

| Work | Reference |
| --- | --- |
| Choose or change clients, APIs, events, or templates | [Clients and sources](references/clients-and-sources.md) |
| Update a catalog, reconcile game events with delayed reads, or calculate a displayed stat | [Game data and estimates](references/game-data.md) |
| Create/change a manifest or release package | [Manifest and packaging](references/manifest-and-packaging.md) |
| Build or improve visual design, copy, controls, menus | [UI and settings](references/ui-and-settings.md) |
| Persist or migrate settings/session state; switch or share profiles | [Profiles and transfer](references/profiles-and-transfer.md) |
| Change animation, scheduling, caching, or CPU/memory use | [Performance and ownership](references/performance-and-ownership.md) |
| Change anchors, scaling, resizing, or scrolling | [Layout](references/layout.md) |
| Diagnose errors, check changed behavior, or investigate a regression | [Debugging and validation](references/validation.md) |

Read the matching references before changing those areas. Load only the guidance needed for the task.

## Choose the starting point

- **Existing feature or fix:** Read the TOC, affected module, and nearest working example. Identify the state owner and actual user/event entry point. For embedded frameworks, follow the consumer call into the version loaded by its TOC or XML. Identify which contract failed, who maintains that code, and how the consumer picks up a fix. Exercise a shared fix through the affected consumer using its shipped dependency.
- **New add-on:** Establish the supported client, packaging needs, and the user's named reference or nearest working project convention. Reuse its applicable construction patterns for the first complete interaction; separate model logic, client adapters, and UI construction as those responsibilities arise.
- **Client port:** Start with clients. Compare the affected APIs, events, templates, and saved-data meaning across targets. Isolate semantic differences in adapters; update packaging where needed.
- **Review:** Read the changed paths and relevant references. Check requested behavior and repository conventions separately; report defects with evidence instead of applying unrequested edits.

## Implement and verify

Verify unfamiliar or changed client contracts from matching documentation, reusing evidence checked for the same build. For implementation work, complete one behavior through its entry point, state change, and visible result before expanding it. Include persistence and recovery where the feature requires them.

Re-run the reported scenario and check nearby behavior. Review the complete affected interaction against current requirements, including transitions and the settled result. For a port, account for each affected contract on each supported client. For a review finding, identify the location, trigger, and consequence.

Report the result, checks performed, and any specific client observation still needed. Use the [validation guide](references/validation.md) to choose evidence for the claim.

## Shared constraints

- Keep functions local or in the add-on namespace. Load prerequisites explicitly; do not depend accidentally on another installed add-on.
- Initialize SavedVariables after restoration, in the matching `ADDON_LOADED` handler or the framework's documented initialization hook. Avoid capturing a file-scope defaults table that restoration later replaces.
- Give frames, callbacks, recurring work, and cached data clear owners and lifetimes. Reuse UI objects and reconcile obsolete state when configuration changes.
- Treat saved and imported configuration as versioned data. Validate before use, preserve valid user settings, and never evaluate an import string as Lua.
- Separate secret-value restrictions from protected actions and combat lockdown. Check the target contract before consuming restricted values or changing protected UI; Blizzard implementation code may have privileges add-ons lack.

This skill supplies documentation only. Keep task-specific tests in the add-on's development environment.
