# DynamicsCat

A Chrome Extension for Dynamics CRM 2016 — helper tools for form field inspection, option set browsing, and ribbon toolbar automation.

## Quickstart (no build required)

The `dist/` folder is included in the repo — no Node.js needed.

1. [Download or clone this repository](https://github.com/runembp/CRMChromeTools)
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `dist/` folder

The extension icon will appear in the toolbar. Pin it for easy access.

> **Ribbon Toolbar** requires a local config file to target your CRM URL — see [Local deployment configuration](#local-deployment-configuration) below.

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm

```bash
npm install
```

### Build

```bash
npm run build       # Production build → dist/
npm run dev         # Dev build with inline sourcemaps (no minify)
npm run watch       # Watch mode — rebuilds + lints on file changes
npm run check       # TypeScript type-check + ESLint
```

### Load the extension in Chrome (after building)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked** and select the `dist/` folder

### Local deployment configuration

The extension includes a ribbon toolbar that auto-injects on CRM pages.
The target URL pattern is **not** hardcoded in the repository — you configure it locally:

```bash
cp crm.config.example.json crm.config.json
```

Edit `crm.config.json` and replace the placeholder match with your CRM deployment URL:

```json
{
  "content_scripts": [
    {
      "matches": ["*://YOUR_SUBDOMAIN.YOUR_DOMAIN.TLD/YOUR_PATH*"],
      "js": ["content/ribbon-toolbar.js"],
      "run_at": "document_idle"
    }
  ]
}
```

Then rebuild. `crm.config.json` is gitignored and never committed.

> Without `crm.config.json` the extension still works — the ribbon toolbar and other tools are accessible via the popup icon on any CRM page.

## Project Structure

```
DynamicsCat/
├── manifest.json              # Chrome Extension manifest (MV3) — no deployment URLs
├── crm.config.example.json    # Template for local deployment config (copy → crm.config.json)
├── build.js                   # esbuild build script; merges crm.config.json into dist/manifest.json
├── src/
│   ├── background.ts          # Service worker placeholder
│   ├── popup/                 # Popup UI — dispatches content scripts
│   └── content/               # Scripts injected into CRM pages
│       ├── all-fields.ts      # Show all form field names, values, and types
│       ├── option-sets.ts     # Browse option set values for all fields
│       ├── show-hidden-fields.ts  # Reveal hidden form fields
│       └── ribbon-toolbar.ts  # Auto-injected floating toolbar (requires crm.config.json)
└── icons/                     # Extension icons
```

## Features

- **All Fields** — Inspect every field on the active CRM form: name, value, type
- **Option Sets** — List option set values and labels for all fields
- **Show Hidden Fields** — Reveal fields hidden by form rules
- **Ribbon Toolbar** — Floating toolbar auto-injected on CRM pages (configure via `crm.config.json`)

