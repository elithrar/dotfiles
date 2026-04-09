/**
 * Data Visualization Plugin for OpenCode
 *
 * Registers `visualize` and `dashboard` tools that the LLM can call after
 * running internal-data-mcp queries. Generates interactive Chart.js HTML
 * pages and opens them in the default browser.
 *
 * - visualize: single chart + data table
 * - dashboard: multiple chart panels in a responsive grid
 *
 * Supported chart types: bar, line, pie, doughnut, scatter, hbar, table.
 */

import { type Plugin, tool } from "@opencode-ai/plugin"
import { tmpdir } from "os"
import { join } from "path"
import { randomUUID } from "crypto"
import { mkdirSync, writeFileSync, chmodSync } from "fs"

const PLUGIN_NAME = "data-viz"
const MAX_CHART_ROWS = 500
const MAX_TABLE_ROWS = 2000

const PALETTE = [
  "#f6821f", // CF orange
  "#4097ec", // blue
  "#6cc89a", // green
  "#ee6464", // red
  "#a882e6", // purple
  "#ffc658", // yellow
  "#64d2d2", // teal
  "#dc82ab", // pink
  "#8bc34a", // lime
  "#ff7043", // deep orange
]

type ChartType = "bar" | "line" | "pie" | "doughnut" | "scatter" | "hbar" | "table"

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Escape JSON for safe embedding inside <script> tags — prevents </script> and <!-- injection. */
function safeJsonEmbed(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
}

function formatNumber(v: unknown): string {
  if (typeof v !== "number") return String(v ?? "")
  if (Number.isInteger(v)) {
    return v.toLocaleString("en-US")
  }
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function buildChartConfig(
  chartType: ChartType,
  labels: string[],
  yColumns: string[],
  datasets: number[][],
  stacked: boolean,
): object {
  const type = chartType === "hbar" ? "bar" : chartType

  const chartDatasets = datasets.map((values, i) => {
    const color = PALETTE[i % PALETTE.length]
    const bgColor = chartType === "line"
      ? `${color}33` // transparent fill for line
      : `${color}cc`

    return {
      label: yColumns[i],
      data: chartType === "scatter"
        ? values.map((y, idx) => ({ x: Number(labels[idx]) || idx, y }))
        : values,
      backgroundColor: (chartType === "pie" || chartType === "doughnut")
        ? labels.map((_, idx) => `${PALETTE[idx % PALETTE.length]}cc`)
        : bgColor,
      borderColor: (chartType === "pie" || chartType === "doughnut")
        ? labels.map((_, idx) => PALETTE[idx % PALETTE.length])
        : color,
      borderWidth: chartType === "line" ? 2 : 1,
      fill: chartType === "line" ? stacked : undefined,
      tension: chartType === "line" ? 0.3 : undefined,
      pointRadius: chartType === "scatter" ? 4 : chartType === "line" ? 3 : undefined,
    }
  })

  return {
    type,
    data: {
      labels: (chartType === "scatter") ? undefined : labels,
      datasets: chartDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: chartType === "hbar" ? "y" : "x",
      plugins: {
        legend: {
          display: yColumns.length > 1 || chartType === "pie" || chartType === "doughnut",
          labels: { color: "#ccc", font: { family: "'Inter', sans-serif" } },
        },
        tooltip: {
          callbacks: {
            label: "__TOOLTIP_FN__",
          },
        },
      },
      scales: (chartType === "pie" || chartType === "doughnut" || chartType === "scatter") ? undefined : {
        x: {
          stacked,
          ticks: { color: "#999", maxRotation: 45 },
          grid: { color: "#333" },
        },
        y: {
          stacked,
          ticks: { color: "#999" },
          grid: { color: "#333" },
        },
      },
    },
  }
}

function buildDataTable(
  rows: Record<string, unknown>[],
  columns: string[],
): string {
  const limited = rows.slice(0, MAX_TABLE_ROWS)
  const truncated = rows.length > MAX_TABLE_ROWS

  let html = `<table><thead><tr>`
  for (const col of columns) {
    html += `<th>${escapeHtml(col)}</th>`
  }
  html += `</tr></thead><tbody>`

  for (const row of limited) {
    html += `<tr>`
    for (const col of columns) {
      const val = row[col]
      const display = typeof val === "number" ? formatNumber(val) : escapeHtml(String(val ?? ""))
      html += `<td>${display}</td>`
    }
    html += `</tr>`
  }
  html += `</tbody></table>`

  if (truncated) {
    html += `<p class="note">Showing ${MAX_TABLE_ROWS.toLocaleString()} of ${rows.length.toLocaleString()} rows</p>`
  }

  return html
}

function generateHTML(
  rows: Record<string, unknown>[],
  chartType: ChartType,
  title: string,
  xColumn: string,
  yColumns: string[],
  stacked: boolean,
): string {
  const allColumns = Object.keys(rows[0])
  const chartRows = rows.slice(0, MAX_CHART_ROWS)
  const labels = chartRows.map(r => String(r[xColumn] ?? ""))
  const datasets = yColumns.map(col =>
    chartRows.map(r => {
      const v = r[col]
      return typeof v === "number" ? v : Number(v) || 0
    })
  )

  const isTableOnly = chartType === "table"
  const dataTable = buildDataTable(rows, allColumns)

  // Build chart config — tooltip callback is set directly after parsing to avoid fragile string replacement
  let chartConfigJson = ""
  if (!isTableOnly) {
    const config = buildChartConfig(chartType, labels, yColumns, datasets, stacked)
    chartConfigJson = safeJsonEmbed(config)
  }

  const truncatedNote = rows.length > MAX_CHART_ROWS
    ? `<p class="note">Chart shows first ${MAX_CHART_ROWS} of ${rows.length.toLocaleString()} rows. Full data in table below.</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${isTableOnly ? "" : '<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>'}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #121218;
    color: #e0e0e0;
    padding: 24px;
    min-height: 100vh;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }
  .meta {
    font-size: 13px;
    color: #888;
  }
  .actions { display: flex; gap: 8px; }
  button {
    background: #2a2a36;
    color: #ccc;
    border: 1px solid #3a3a48;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    transition: background 0.15s;
  }
  button:hover { background: #3a3a48; color: #fff; }
  .card {
    background: #1a1a24;
    border: 1px solid #2a2a36;
    border-radius: 10px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .chart-wrap { position: relative; height: 420px; }
  .note {
    font-size: 12px;
    color: #888;
    margin-top: 12px;
    font-style: italic;
  }
  /* data table */
  .table-card { overflow-x: auto; }
  .table-card h2 {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #aaa;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  th {
    text-align: left;
    padding: 8px 12px;
    background: #22222e;
    color: #f6821f;
    font-weight: 500;
    border-bottom: 2px solid #333;
    position: sticky;
    top: 0;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  th:hover { color: #ff9d4d; }
  th::after { content: ' \\2195'; color: #555; font-size: 11px; }
  td {
    padding: 6px 12px;
    border-bottom: 1px solid #2a2a36;
    white-space: nowrap;
  }
  tr:hover td { background: #1e1e2a; }
  .table-scroll { max-height: 500px; overflow-y: auto; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <span class="meta">${rows.length.toLocaleString()} rows &middot; ${chartType} &middot; ${new Date().toLocaleString()}</span>
    </div>
    <div class="actions">
      ${isTableOnly ? "" : '<button onclick="downloadPng()">Download PNG</button>'}
      <button onclick="downloadCsv()">Download CSV</button>
    </div>
  </div>

  ${isTableOnly ? "" : `
  <div class="card">
    <div class="chart-wrap">
      <canvas id="chart"></canvas>
    </div>
    ${truncatedNote}
  </div>
  `}

  <div class="card table-card">
    <h2>Data</h2>
    <div class="table-scroll">
      ${dataTable}
    </div>
  </div>

<script>
  // Raw data for CSV export (capped to table limit)
  const RAW_DATA = ${safeJsonEmbed(rows.slice(0, MAX_TABLE_ROWS))};
  const ALL_COLUMNS = ${safeJsonEmbed(allColumns)};

  ${isTableOnly ? "" : `
  // Chart — config is already safe JSON from safeJsonEmbed(); attach tooltip callback at runtime
  const chartConfig = ${chartConfigJson};
  if (chartConfig.options?.plugins?.tooltip?.callbacks) {
    chartConfig.options.plugins.tooltip.callbacks.label = function(ctx) {
      const v = ctx.parsed?.y ?? ctx.parsed ?? ctx.raw?.y ?? ctx.raw;
      return ctx.dataset.label + ': ' + (typeof v === 'number' ? v.toLocaleString('en-US', {maximumFractionDigits: 2}) : v);
    };
  }
  const ctx = document.getElementById('chart').getContext('2d');
  const chart = new Chart(ctx, chartConfig);

  function downloadPng() {
    const link = document.createElement('a');
    link.download = ${safeJsonEmbed(title.replace(/[^a-zA-Z0-9]/g, "_") + ".png")};
    link.href = chart.toBase64Image('image/png', 1);
    link.click();
  }
  `}

  // CSV export
  function downloadCsv() {
    const escape = v => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\\n')
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    let csv = ALL_COLUMNS.map(escape).join(',') + '\\n';
    for (const row of RAW_DATA) {
      csv += ALL_COLUMNS.map(c => escape(row[c])).join(',') + '\\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = ${safeJsonEmbed(title.replace(/[^a-zA-Z0-9]/g, "_") + ".csv")};
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  // Table sorting
  document.querySelectorAll('th').forEach((th, colIdx) => {
    let asc = true;
    th.addEventListener('click', () => {
      const tbody = th.closest('table').querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aVal = a.children[colIdx]?.textContent ?? '';
        const bVal = b.children[colIdx]?.textContent ?? '';
        const aNum = Number(aVal.replace(/,/g, ''));
        const bNum = Number(bVal.replace(/,/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) return asc ? aNum - bNum : bNum - aNum;
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r));
      tbody.appendChild(frag);
      asc = !asc;
    });
  });
</script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Dashboard HTML generation
// ---------------------------------------------------------------------------

interface PanelDef {
  data: Record<string, unknown>[]
  chartType: ChartType
  title: string
  xColumn: string
  yColumns: string[]
  stacked: boolean
}

function generateDashboardHTML(title: string, panels: PanelDef[]): string {
  const panelBlocks: string[] = []
  const panelScripts: string[] = []

  for (let i = 0; i < panels.length; i++) {
    const p = panels[i]
    const chartRows = p.data.slice(0, MAX_CHART_ROWS)
    const labels = chartRows.map(r => String(r[p.xColumn] ?? ""))
    const datasets = p.yColumns.map(col =>
      chartRows.map(r => {
        const v = r[col]
        return typeof v === "number" ? v : Number(v) || 0
      })
    )

    const isTableOnly = p.chartType === "table"

    if (isTableOnly) {
      const allColumns = Object.keys(p.data[0])
      const dataTable = buildDataTable(p.data, allColumns)
      panelBlocks.push(`
      <div class="panel">
        <h2>${escapeHtml(p.title)}</h2>
        <span class="panel-meta">${p.data.length.toLocaleString()} rows &middot; table</span>
        <div class="table-scroll" style="margin-top:12px">${dataTable}</div>
      </div>`)
    } else {
      const config = buildChartConfig(p.chartType, labels, p.yColumns, datasets, p.stacked)
      const configJson = safeJsonEmbed(config)

      panelBlocks.push(`
      <div class="panel">
        <h2>${escapeHtml(p.title)}</h2>
        <span class="panel-meta">${p.data.length.toLocaleString()} rows &middot; ${p.chartType}</span>
        <div class="chart-wrap"><canvas id="chart${i}"></canvas></div>
      </div>`)

      panelScripts.push(`
      {
        const cfg = ${configJson};
        if (cfg.options?.plugins?.tooltip?.callbacks) {
          cfg.options.plugins.tooltip.callbacks.label = function(ctx) {
            const v = ctx.parsed?.y ?? ctx.parsed ?? ctx.raw?.y ?? ctx.raw;
            return ctx.dataset.label + ': ' + (typeof v === 'number' ? v.toLocaleString('en-US', {maximumFractionDigits: 2}) : v);
          };
        }
        new Chart(document.getElementById('chart${i}').getContext('2d'), cfg);
      }`)
    }
  }

  // Responsive column count: 1 panel = 1 col, 2+ = 2 cols, 5+ = 3 cols
  const colCount = panels.length === 1 ? 1 : panels.length >= 5 ? 3 : 2

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #121218;
    color: #e0e0e0;
    padding: 24px;
    min-height: 100vh;
  }
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .dash-header h1 { font-size: 22px; font-weight: 600; color: #fff; }
  .dash-header .meta { font-size: 13px; color: #888; }
  .grid {
    display: grid;
    grid-template-columns: repeat(${colCount}, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  .panel {
    background: #1a1a24;
    border: 1px solid #2a2a36;
    border-radius: 10px;
    padding: 20px;
  }
  .panel h2 {
    font-size: 14px;
    font-weight: 600;
    color: #ccc;
    margin-bottom: 4px;
  }
  .panel-meta { font-size: 12px; color: #666; }
  .chart-wrap { position: relative; height: 320px; margin-top: 12px; }
  .note { font-size: 12px; color: #888; margin-top: 8px; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; }
  th { text-align: left; padding: 6px 10px; background: #22222e; color: #f6821f; font-weight: 500; border-bottom: 2px solid #333; position: sticky; top: 0; cursor: pointer; user-select: none; white-space: nowrap; }
  th:hover { color: #ff9d4d; }
  th::after { content: ' \\2195'; color: #555; font-size: 10px; }
  td { padding: 4px 10px; border-bottom: 1px solid #2a2a36; white-space: nowrap; }
  tr:hover td { background: #1e1e2a; }
  .table-scroll { max-height: 400px; overflow-y: auto; }
</style>
</head>
<body>
  <div class="dash-header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <span class="meta">${panels.length} panels &middot; ${new Date().toLocaleString()}</span>
    </div>
  </div>
  <div class="grid">
    ${panelBlocks.join("\n")}
  </div>
<script>
${panelScripts.join("\n")}

  // Table sorting (for any table panels)
  document.querySelectorAll('th').forEach((th, colIdx) => {
    let asc = true;
    th.addEventListener('click', () => {
      const tbody = th.closest('table').querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aVal = a.children[colIdx]?.textContent ?? '';
        const bVal = b.children[colIdx]?.textContent ?? '';
        const aNum = Number(aVal.replace(/,/g, ''));
        const bNum = Number(bVal.replace(/,/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) return asc ? aNum - bNum : bNum - aNum;
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
      const frag = document.createDocumentFragment();
      rows.forEach(r => frag.appendChild(r));
      tbody.appendChild(frag);
      asc = !asc;
    });
  });
</script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const DataVizPlugin: Plugin = async ({ client, $ }) => {
  const log = (level: "info" | "error" | "warn", message: string) =>
    client.app.log({ body: { service: PLUGIN_NAME, level, message } }).catch(() => {})

  return {
    tool: {
      visualize: tool({
        description: `Render query results as an interactive chart in the browser.

Call this after running an internal-data-mcp query to visualize the results.
Generates a self-contained HTML page with Chart.js and opens it in the default browser.

Chart types:
- bar: vertical bar chart (supports multiple y columns, stacked)
- hbar: horizontal bar chart
- line: line chart (supports fill/stack for area charts)
- pie: pie chart (single y column)
- doughnut: doughnut chart (single y column)
- scatter: scatter plot (x and y must be numeric)
- table: data table only (no chart)

IMPORTANT — labeling:
- When charting data about customers, accounts, or users, ALWAYS resolve and display
  human-readable names (customer_account_name, user name, etc.) instead of raw IDs.
  Look up names via entities.mega_account_base, entities.mega_customer_base, or
  entities.mega_user_base before calling this tool.
- Use the resolved names as series labels (yColumn headers) or axis labels (xColumn values).

Tips:
- For time series, use the date column as xColumn
- For comparisons across categories, use bar or hbar
- For distributions, use pie or doughnut
- For correlations, use scatter
- Pass multiple comma-separated column names in yColumns for multi-series charts
- Set stacked=true for stacked bar/area charts`,

        args: {
          data: tool.schema
            .string()
            .describe("JSON array of row objects from query results, e.g. [{\"date\": \"2025-01\", \"count\": 42}, ...]"),
          chartType: tool.schema
            .enum(["bar", "line", "pie", "doughnut", "scatter", "hbar", "table"])
            .describe("Chart type to render"),
          title: tool.schema
            .string()
            .describe("Chart title"),
          xColumn: tool.schema
            .string()
            .describe("Column name for x-axis labels (or pie/doughnut slice labels)"),
          yColumns: tool.schema
            .string()
            .describe("Comma-separated column name(s) for y-axis values"),
          stacked: tool.schema
            .boolean()
            .optional()
            .describe("Stack bars or fill areas (default: false)"),
        },

        async execute(args) {
          const chartType: ChartType = args.chartType

          let rows: Record<string, unknown>[]
          try {
            rows = JSON.parse(args.data)
            if (!Array.isArray(rows) || rows.length === 0) {
              return "Error: data must be a non-empty JSON array of objects"
            }
          } catch (e) {
            await log("error", `Failed to parse viz data: ${e instanceof Error ? e.message : e}`)
            return `Error: invalid JSON — ${e instanceof Error ? e.message : e}`
          }

          const yColumns = args.yColumns.split(",").map(c => c.trim()).filter(Boolean)
          if (yColumns.length === 0) {
            return "Error: at least one yColumn is required"
          }

          // Validate columns exist in the data (xColumn only required for chart types that use it)
          const sample = rows[0]
          const available = Object.keys(sample)
          if (chartType !== "table" && !(args.xColumn in sample)) {
            return `Error: xColumn "${args.xColumn}" not found. Available columns: ${available.join(", ")}`
          }
          if (chartType !== "table") {
            for (const col of yColumns) {
              if (!(col in sample)) {
                return `Error: yColumn "${col}" not found. Available columns: ${available.join(", ")}`
              }
            }
          }

          // Pie/doughnut only supports a single value column
          if ((chartType === "pie" || chartType === "doughnut") && yColumns.length > 1) {
            return `Error: ${chartType} charts only support a single yColumn. Got: ${yColumns.join(", ")}`
          }

          const html = generateHTML(
            rows,
            chartType,
            args.title,
            args.xColumn,
            yColumns,
            args.stacked ?? false,
          )

          // Write to a user-private subdirectory with restrictive permissions
          const vizDir = join(tmpdir(), "opencode-viz")
          mkdirSync(vizDir, { recursive: true, mode: 0o700 })
          const filename = `viz-${randomUUID().slice(0, 8)}.html`
          const filepath = join(vizDir, filename)
          writeFileSync(filepath, html, { mode: 0o600 })
          chmodSync(filepath, 0o644) // browser needs read access, but scoped to private dir

          // Open in browser
          if (process.platform === "darwin") {
            await $`open ${filepath}`.quiet().nothrow()
          } else {
            await $`xdg-open ${filepath}`.quiet().nothrow()
          }

          await log("info", `Opened ${args.chartType} chart: ${args.title} (${rows.length} rows)`)

          return [
            `Chart opened in browser.`,
            `Type: ${args.chartType} | Rows: ${rows.length} | X: ${args.xColumn} | Y: ${yColumns.join(", ")}`,
            `File: ${filepath}`,
          ].join("\n")
        },
      }),

      dashboard: tool({
        description: `Render multiple charts in a single dashboard page.

Call this when the user asks to combine, compare, or view multiple charts together.
Each panel is an independent chart with its own data, type, and axis configuration.
Panels are laid out in a responsive grid (2 columns for 2-4 panels, 3 for 5+).

Each panel in the panels array requires:
- data: JSON string of row objects (same format as the visualize tool)
- chartType: bar, line, pie, doughnut, scatter, hbar, or table
- title: panel title
- xColumn: column name for x-axis
- yColumns: comma-separated column name(s) for y-axis
- stacked (optional): stack bars or fill areas

IMPORTANT — labeling:
- When charting data about customers, accounts, or users, ALWAYS resolve and display
  human-readable names (customer_account_name, user name, etc.) instead of raw IDs.
- Use the resolved names as series labels (yColumn headers) or axis labels (xColumn values).`,

        args: {
          title: tool.schema
            .string()
            .describe("Dashboard title"),
          panels: tool.schema
            .string()
            .describe("JSON array of panel definitions. Each panel: {data: string (JSON array), chartType, title, xColumn, yColumns, stacked?}"),
        },

        async execute(args) {
          let panelDefs: Array<{
            data: string
            chartType: ChartType
            title: string
            xColumn: string
            yColumns: string
            stacked?: boolean
          }>

          try {
            panelDefs = JSON.parse(args.panels)
            if (!Array.isArray(panelDefs) || panelDefs.length === 0) {
              return "Error: panels must be a non-empty JSON array"
            }
          } catch (e) {
            await log("error", `Failed to parse dashboard panels: ${e instanceof Error ? e.message : e}`)
            return `Error: invalid panels JSON — ${e instanceof Error ? e.message : e}`
          }

          // Parse and validate each panel
          const parsed: PanelDef[] = []
          for (let i = 0; i < panelDefs.length; i++) {
            const p = panelDefs[i]
            if (!p.data || !p.chartType || !p.title || !p.xColumn || !p.yColumns) {
              return `Error: panel ${i} missing required fields (data, chartType, title, xColumn, yColumns)`
            }

            let rows: Record<string, unknown>[]
            try {
              rows = typeof p.data === "string" ? JSON.parse(p.data) : p.data
              if (!Array.isArray(rows) || rows.length === 0) {
                return `Error: panel ${i} ("${p.title}") data must be a non-empty JSON array`
              }
            } catch (e) {
              return `Error: panel ${i} ("${p.title}") has invalid data JSON — ${e instanceof Error ? e.message : e}`
            }

            const yColumns = p.yColumns.split(",").map(c => c.trim()).filter(Boolean)
            if (yColumns.length === 0) {
              return `Error: panel ${i} ("${p.title}") needs at least one yColumn`
            }

            const sample = rows[0]
            const available = Object.keys(sample)
            if (p.chartType !== "table" && !(p.xColumn in sample)) {
              return `Error: panel ${i} ("${p.title}") xColumn "${p.xColumn}" not found. Available: ${available.join(", ")}`
            }
            if (p.chartType !== "table") {
              for (const col of yColumns) {
                if (!(col in sample)) {
                  return `Error: panel ${i} ("${p.title}") yColumn "${col}" not found. Available: ${available.join(", ")}`
                }
              }
            }

            if ((p.chartType === "pie" || p.chartType === "doughnut") && yColumns.length > 1) {
              return `Error: panel ${i} ("${p.title}") ${p.chartType} charts only support a single yColumn`
            }

            parsed.push({
              data: rows,
              chartType: p.chartType,
              title: p.title,
              xColumn: p.xColumn,
              yColumns,
              stacked: p.stacked ?? false,
            })
          }

          const html = generateDashboardHTML(args.title, parsed)

          const vizDir = join(tmpdir(), "opencode-viz")
          mkdirSync(vizDir, { recursive: true, mode: 0o700 })
          const filename = `dash-${randomUUID().slice(0, 8)}.html`
          const filepath = join(vizDir, filename)
          writeFileSync(filepath, html, { mode: 0o600 })
          chmodSync(filepath, 0o644)

          if (process.platform === "darwin") {
            await $`open ${filepath}`.quiet().nothrow()
          } else {
            await $`xdg-open ${filepath}`.quiet().nothrow()
          }

          await log("info", `Opened dashboard: ${args.title} (${parsed.length} panels)`)

          const panelSummary = parsed.map((p, i) => `  ${i + 1}. ${p.title} (${p.chartType}, ${p.data.length} rows)`).join("\n")
          return [
            `Dashboard opened in browser.`,
            `Title: ${args.title} | Panels: ${parsed.length}`,
            panelSummary,
            `File: ${filepath}`,
          ].join("\n")
        },
      }),
    },
  }
}

export default DataVizPlugin
