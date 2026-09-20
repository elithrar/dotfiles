# UI and settings

## Minimap launcher and menus

Use existing launcher infrastructure when available: a LibDataBroker launcher object with icon, click, and tooltip callbacks, registered once with [LibDBIcon](https://www.wowace.com/projects/libdbicon-1-0). Bundle its dependencies in load order. Persist visibility, position, and lock state; keep the library's current DB binding synchronized when profiles replace configuration tables. Verify whether library show/hide calls update persistence or only runtime visibility.

For a custom launcher, keep placement minimap-relative and convert cursor coordinates using the minimap's effective scale. Distinguish a click from a drag through the full release sequence. Run drag updates only during dragging and stop them on release or hide. Keep window and launcher placement separate, and provide a slash-command recovery path if the button can be hidden.

Implement the requested left/right-click actions. Use state-backed menu choices and associate popup lifetime with the invoking control. Consult the [Blizzard Menu guide](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_Menu/11_0_0_MenuImplementationGuide.lua) for current construction and ownership APIs, switching branches for the target client.

## Settings structure

Preserve the existing settings framework. For a new small panel, prefer native Settings or an already-used library. Use a sidebar/content shell for a larger custom settings experience. Consult the [Settings guide](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_Settings_Shared/Blizzard_ImplementationReadme.lua) for registration and opening APIs; retain returned category identifiers rather than inventing replacements.

Separate three responsibilities:

- Navigation owns stable page IDs, selected state, and page visibility.
- Pages construct controls once, refresh bindings, and relayout within available content space.
- The configuration model owns validation, persistence, profile selection, and runtime application.

This structure supports Danders/Ellesmere-style settings without depending on their internal frameworks. Reuse the project's widget constructors for spacing, labels, disabled states, and focus behavior. Add search or load-on-demand options only when the settings volume warrants them.

## Bindings and lifecycle

Resolve the active configuration when refreshing or applying edits; avoid callbacks capturing a replaced profile table. Initialize all controls from state. Guard programmatic refresh from change callbacks that would write settings or recursively rebuild UI. Refresh when reopening after changes made while hidden.

Parent page content under its page, and close transient popups when navigating away. Make close, Escape, cancel, and profile changes consistently release focus and temporary preview state. Preserve unsaved edits according to the chosen save/cancel behavior.

Keep ordinary configuration editing available in combat where permitted. Defer protected application and resolve the latest configuration when applying it afterward. For scrollable panels and editors, follow [layout](layout.md); for reusable objects and callbacks, follow [ownership](performance-and-ownership.md).
