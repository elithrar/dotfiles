# Manifest and packaging

## Client manifest: `.toc`

For a simple package, match the installed folder and manifest: `TrailNotes/TrailNotes.toc` under `Interface/AddOns/`. Use `## Key: value` metadata, `#` comments, and one relative Lua/XML path per load entry. Files load in order; directories are not loaded recursively. Match path case and load libraries, namespace/bootstrap code, and templates before their consumers.

This example shows structure. Supply the interface and release metadata before packaging:

```toc
# Add ## Interface: with the current interface number for each target client.
# Look up the fourth GetBuildInfo() return or matching client documentation.
# Add ## Version: with this add-on's release version.
## Title: Trail Notes
## Notes: Personal travel notes.
## SavedVariables: TrailNotesDB

Core.lua
UI.lua
```

| Field | Meaning |
| --- | --- |
| `Interface` | Supported client interface numbers; verify multi-version syntax for the targets. This declares compatibility, not API emulation. |
| `Title`, `Notes`, `Author`, `Version` | Display/release metadata. Title is not the folder or dependency identifier. |
| `SavedVariables` | Comma-separated account-wide global names; use `SavedVariablesPerCharacter` for character-scoped globals. Neither automatically selects profiles. |
| `Dependencies` | Required add-on folder identifiers; load before this add-on. |
| `OptionalDeps` | Optional dependencies and load ordering; handle their absence. |
| `LoadOnDemand: 1` | Load only when requested. Provide a resident entry point or dependency that loads it; hiding UI does not unload it. |

Consult the [TOC format reference](https://warcraft.wiki.gg/wiki/TOC_format) for current flavor suffixes and selection rules. Use matching client TOCs if documentation is inaccessible. Prefer one shared manifest when file lists agree; verify suffixes before splitting it. Do not infer Forever packaging from Classic labels or copy Blizzard-only metadata.

## Optional XML

Lua-only UI needs no XML. XML uses the `Ui` root and `http://www.blizzard.com/wow/ui/` namespace. Load XML with `Include`, Lua with `Script file`, and templates before their consumers. Avoid loading an implementation twice through XML and the TOC. Check `UI.xsd` and the relevant template in the matching client source for supported attributes.

## Release artifact

Put `TrailNotes/TrailNotes.toc` directly inside the ZIP, with implementation and assets under that folder. Give separately loadable modules sibling folders and their own TOCs. Include embedded libraries and licenses; dependency declarations do not download files. Exclude development artifacts and repository wrappers.

Use `.pkgmeta` only with a release tool that supports it. It is build configuration, not a client manifest. The [BigWigs Packager documentation](https://github.com/BigWigsMods/packager#readme) covers `package-as`, `ignore`, `externals`, module moves, and multi-client packaging. Pin fetched dependencies and load them explicitly; distribution-site dependency slugs do not replace TOC dependencies.

Inspect the produced ZIP: folder identity, resolved interface/release metadata, all TOC/XML paths, dependency order, and required assets. Extract it into a clean directory for load checks.
