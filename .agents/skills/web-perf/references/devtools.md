# Chrome DevTools evidence

Use when Chrome DevTools profiling tools are available. Read the exposed schemas for the installed version. Consult the [official tool reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md) when needed; examples are not a fixed API contract.

| Investigation | Tools to inspect |
|---|---|
| Load and inspect the target | `navigate_page`, `take_snapshot`, `take_screenshot` |
| Capture load or interaction timing | `performance_start_trace`, `performance_stop_trace` |
| Explain a returned trace insight | `performance_analyze_insight` with the returned insight-set identifier and insight name |
| Inspect resource timing and headers | `list_network_requests`, `get_network_request` |

For a page-load investigation, navigate to the target and capture a reload trace under the stated conditions. For interaction latency or post-load shifts, keep the trace running through the relevant interaction before stopping it. Follow the tool's returned identifiers and available insights instead of retrying guessed names.

Useful insight categories include LCP breakdown, layout-shift culprits, render blocking, document latency, and network dependencies. Inspect the actual element and request implicated by an insight. Use screenshots or computed styles for visual evidence; an accessibility-tree snapshot alone cannot prove color contrast or focus visibility.

For network findings, check resource discovery, transfer size and encoding, cache headers, initiators, and dependency timing. A missing `preload` or a large bundle is a candidate only when it affects the investigated path. Avoid adding priority hints, preloads, or preconnects without checking competing critical resources.

For code access, trace the measured problem to the relevant asset, component, route, build setting, or response header. Use the project's configured build and profiling commands. Do not perform a generic bundler checklist or remove a source map solely because it exists in a production build.

Use [web.dev's metric definitions](https://web.dev/articles/vitals) when current thresholds or the distinction between lab and field data affects a conclusion.
