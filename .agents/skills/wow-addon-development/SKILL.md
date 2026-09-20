---
name: wow-addon-development
description: Build, improve, debug, port, or review World of Warcraft Midnight/Retail and official Forever add-ons. Use for addon Lua/XML, packaging, settings, profiles, performance, and UI layout. Not for gameplay advice, addon recommendations, or WoW-themed websites.
---

# WoW Add-on Development

Develop the requested behavior within the add-on's supported clients and repository conventions. Preserve planning or review-only scope.

## Read what the task needs

| Work | Reference |
| --- | --- |
| Choose or change clients, APIs, events, or templates | [Clients and sources](references/clients-and-sources.md) |
| Create/change a manifest or release package | [Manifest and packaging](references/manifest-and-packaging.md) |
| Build or improve minimap launchers, menus, settings | [UI and settings](references/ui-and-settings.md) |
| Persist, migrate, switch, or share configuration | [Profiles and transfer](references/profiles-and-transfer.md) |
| Diagnose CPU/memory growth, scheduling, or caching | [Performance and ownership](references/performance-and-ownership.md) |
| Change anchors, scaling, resizing, or scrolling | [Layout](references/layout.md) |
| Diagnose errors, check changed behavior, or investigate a regression | [Debugging and validation](references/validation.md) |

Read the matching references before changing those areas. Load only the guidance needed for the task.

## Choose the starting point

- **Existing feature or fix:** Read the TOC, affected module, and nearest working example. Identify the state owner and actual user/event entry point. Preserve working conventions; establish the expected result or reported failure before editing.
- **New add-on:** Start with clients and packaging. Define the first complete interaction and persistence needs; separate model logic, client adapters, and UI construction as those responsibilities arise.
- **Client port:** Start with clients. Compare the affected APIs, events, templates, and saved-data meaning across targets. Isolate semantic differences in adapters; update packaging where needed.
- **Review:** Read the changed paths and relevant references. Check requested behavior and repository conventions separately; report defects with evidence instead of applying unrequested edits.

## Implement and verify

Verify unfamiliar or changed client contracts from matching documentation, reusing evidence checked for the same build. For implementation work, complete one behavior through its entry point, state change, and visible result before expanding it. Include persistence and recovery where the feature requires them.

Use the relevant validation checks to establish the requested outcome. Re-run the original scenario after a fix and check nearby behavior. For a port, account for each affected contract on each supported client. A review finding should identify its location, trigger, and consequence.

Finish with the result, checks actually performed, and specific unresolved client checks. Distinguish inspected source, offline execution, and observed in-game behavior; identify any requested behavior still incomplete.

## Shared constraints

- Keep functions local or in the add-on namespace. Load prerequisites explicitly; do not depend accidentally on another installed add-on.
- Initialize SavedVariables after restoration, in the matching `ADDON_LOADED` handler or the framework's documented initialization hook. Avoid capturing a file-scope defaults table that restoration later replaces.
- Give frames, callbacks, recurring work, and cached data clear owners and lifetimes. Reuse UI objects and reconcile obsolete state when configuration changes.
- Treat saved and imported configuration as versioned data. Validate before use, preserve valid user settings, and never evaluate an import string as Lua.
- Separate secret-value restrictions from protected actions and combat lockdown. Check the target contract before consuming restricted values or changing protected UI; Blizzard implementation code may have privileges add-ons lack.

This skill supplies documentation only. Keep task-specific tests in the add-on's development environment.
