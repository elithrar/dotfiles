---
name: web-perf
description: Audits page-load performance with Chrome DevTools MCP. Use when asked to profile a URL, investigate Lighthouse/Core Web Vitals symptoms, diagnose LCP, CLS, TBT/main-thread work, render-blocking resources, network dependency chains, caching, large assets, or site speed regressions. Produces evidence-backed recommendations with trace conditions and impact estimates; includes only lightweight accessibility observations visible from DevTools.
---

# Web Performance Audit

Audit web page performance using Chrome DevTools MCP tools. This skill focuses on Core Web Vitals, network optimization, and high-level accessibility gaps.

## Prerequisite: Chrome DevTools MCP

Verify Chrome DevTools MCP tools are available in the current tool list before starting. If unavailable, stop and provide setup guidance; do not hallucinate trace results.

Ask the user to add this to their MCP config:

```json
"chrome-devtools": {
  "type": "local",
  "command": ["npx", "-y", "chrome-devtools-mcp@latest"]
}
```

## Key Guidelines

- **Calibrate claims to evidence**: Say "observed in this trace" for lab-only findings.
- **Verify before recommending**: Confirm something is unused before suggesting removal.
- **Quantify impact**: Use estimated savings from insights. Don't prioritize changes with 0ms impact.
- **Skip non-issues**: If render-blocking resources have 0ms estimated impact, note but don't recommend action.
- **Be specific**: Say "compress hero.png (450KB) to WebP" not "optimize images".
- **Prioritize ruthlessly**: A site with 200ms LCP and 0 CLS is already excellent—say so.

## Audit Inputs And Measurement Rules

- Capture URL/route, device or viewport, network/CPU throttling, cache state, auth state, timestamp, and run count.
- Prefer mobile cold-load unless the user specifies otherwise.
- Run 2-3 traces for noisy or surprising metrics when making priority calls.
- Chrome traces are lab diagnostics. For real-user Core Web Vitals, request or propose RUM, CrUX, or PageSpeed Insights field data.
- Report INP only when interaction data is measured; otherwise use TBT/main-thread work as a load responsiveness proxy.

## Quick Reference

| Task | Tool Call |
|------|-----------|
| Load page | `navigate_page(url: "...")` |
| Start trace | `performance_start_trace(autoStop: true, reload: true)` |
| Analyze insight | `performance_analyze_insight(insightSetId: "...", insightName: "...")` |
| List requests | `list_network_requests(resourceTypes: ["Script", "Stylesheet", ...])` |
| Request details | `get_network_request(reqid: <id>)` |
| A11y snapshot | `take_snapshot(verbose: true)` |

## Workflow

Copy this checklist to track progress:

```
Audit Progress:
- [ ] Phase 1: Performance trace (navigate + record)
- [ ] Phase 2: Core Web Vitals analysis (includes CLS culprits)
- [ ] Phase 3: Network analysis
- [ ] Phase 4: Accessibility snapshot
- [ ] Phase 5: Codebase analysis (skip if third-party site)
```

### Phase 1: Performance Trace

1. Navigate to the target URL:
   ```
   navigate_page(url: "<target-url>")
   ```

2. Start a performance trace with reload to capture cold-load metrics:
   ```
   performance_start_trace(autoStop: true, reload: true)
   ```

3. Wait for trace completion, then retrieve results.

**Troubleshooting:**
- If trace returns empty or fails, verify the page loaded correctly with `navigate_page` first
- If insight names don't match, inspect the trace response to list available insights

### Phase 2: Core Web Vitals Analysis

Use `performance_analyze_insight` to extract key metrics.

**Note:** Insight names may vary across Chrome DevTools versions. If an insight name doesn't work, check the `insightSetId` from the trace response to discover available insights.

Common insight names:

| Metric | Insight Name | What to Look For |
|--------|--------------|------------------|
| LCP | `LCPBreakdown` | Time to largest contentful paint; breakdown of TTFB, resource load, render delay |
| CLS | `CLSCulprits` | Elements causing layout shifts (images without dimensions, injected content, font swaps) |
| Render Blocking | `RenderBlocking` | CSS/JS blocking first paint |
| Document Latency | `DocumentLatency` | Server response time issues |
| Network Dependencies | `NetworkRequestsDepGraph` | Request chains delaying critical resources |

Example:
```
performance_analyze_insight(insightSetId: "<id-from-trace>", insightName: "LCPBreakdown")
```

**Key thresholds (good/needs-improvement/poor):** These are field-oriented CWV thresholds; lab traces help diagnose causes but do not prove real-user population health.
- TTFB: < 800ms / < 1.8s / > 1.8s
- FCP: < 1.8s / < 3s / > 3s
- LCP: < 2.5s / < 4s / > 4s
- INP: < 200ms / < 500ms / > 500ms
- TBT: < 200ms / < 600ms / > 600ms
- CLS: < 0.1 / < 0.25 / > 0.25
- Speed Index: < 3.4s / < 5.8s / > 5.8s

### Phase 3: Network Analysis

List all network requests to identify optimization opportunities:
```
list_network_requests(resourceTypes: ["Script", "Stylesheet", "Document", "Font", "Image"])
```

**Look for:**

1. **Render-blocking resources**: JS/CSS in `<head>` without `async`/`defer`/`media` attributes
2. **Network chains**: Resources discovered late because they depend on other resources loading first (e.g., CSS imports, JS-loaded fonts)
3. **Missing preloads**: Critical resources (fonts, hero images, key scripts) not preloaded
4. **Caching issues**: Missing or weak `Cache-Control`, `ETag`, or `Last-Modified` headers
5. **Large payloads**: Uncompressed or oversized JS/CSS bundles
6. **Unused preconnects**: If flagged, verify by checking if ANY requests went to that origin. If zero requests, it's definitively unused—recommend removal. If requests exist but loaded late, the preconnect may still be valuable.

For detailed request info:
```
get_network_request(reqid: <id>)
```

### Phase 4: Accessibility Snapshot

Take an accessibility tree snapshot:
```
take_snapshot(verbose: true)
```

**Flag high-level gaps:**
- Missing or duplicate ARIA IDs
- Interactive elements without accessible names

Do not claim contrast, focus order, or keyboard-trap compliance unless those properties were directly verified.

## Phase 5: Codebase Analysis

**Skip if auditing a third-party site without codebase access.**

Analyze code only to explain observed bottlenecks or implement likely fixes.

### Detect Framework & Bundler

Search for configuration files to identify the stack:

| Tool | Config Files |
|------|--------------|
| Webpack | `webpack.config.js`, `webpack.*.js` |
| Vite | `vite.config.js`, `vite.config.ts` |
| Rollup | `rollup.config.js`, `rollup.config.mjs` |
| esbuild | `esbuild.config.js`, build scripts with `esbuild` |
| Parcel | `.parcelrc`, `package.json` (parcel field) |
| Next.js | `next.config.js`, `next.config.mjs` |
| Nuxt | `nuxt.config.js`, `nuxt.config.ts` |
| SvelteKit | `svelte.config.js` |
| Astro | `astro.config.mjs` |

Also check `package.json` for framework dependencies and build scripts.

### Tree-Shaking & Dead Code

- **Webpack**: Check for `mode: 'production'`, `sideEffects` in package.json, `usedExports` optimization
- **Vite/Rollup**: Tree-shaking enabled by default; check for `treeshake` options
- **Look for**: Barrel files (`index.js` re-exports), large utility libraries imported wholesale (lodash, moment)

### Unused JS/CSS

- Check for CSS-in-JS vs. static CSS extraction
- Look for PurgeCSS/UnCSS configuration (Tailwind's `content` config)
- Identify dynamic imports vs. eager loading

### Polyfills

- Check for `@babel/preset-env` targets and `useBuiltIns` setting
- Look for `core-js` imports (often oversized)
- Check `browserslist` config for overly broad targeting

### Compression & Minification

- Check for `terser`, `esbuild`, or `swc` minification
- Look for gzip/brotli compression in build output or server config
- Check for source maps in production builds (should be external or disabled)

## Output Format

Present findings as:

1. **Repro Context** - URL, device/viewport, throttling, cache state, run count, auth state, timestamp.
2. **Metrics Summary** - Table with metric, value, rating, and lab/field source.
3. **Top Issues** - Prioritized list with evidence and estimated impact.
4. **Recommendations** - Specific, actionable fixes with code snippets or config changes.
5. **Codebase Findings** - Only findings tied to observed bottlenecks.
6. **Not Measured / Caveats** - Missing MCP tools, auth walls, no interaction trace for INP, unstable page, or field-data gaps.
