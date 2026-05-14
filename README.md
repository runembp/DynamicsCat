# DynamicsCat

A Chrome Extension (Manifest V3) for Dynamics CRM 2016 — developer tools for form field inspection, option set browsing, record manipulation, and a ribbon toolbar that auto-injects on CRM pages.

## Quickstart (no build required)

The `dist/` folder is included in the repo — no Node.js needed.

1. [Download or clone this repository](https://github.com/runembp/DynamicsCat)
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `dist/` folder

The extension icon will appear in the toolbar. Pin it for easy access.

> The **Ribbon Toolbar** auto-injects on any page that looks like a Dynamics CRM page (detected via `body[scroll=no]` or `div[data-id=topBar]`). Tools are also accessible via the popup icon.

## Features

- **All Fields** — Inspect every field on the active CRM form: label, schema name, type, value
- **Option Sets** — Browse option set values and labels for all optionset fields, with click-to-copy
- **Show Hidden Fields** — Toggle visibility of fields hidden by form rules
- **Dirty Fields** — Live-track modified fields with visual highlights
- **Override Readonly** — Modifier+click to unlock readonly fields (configurable shortcut, default: Alt+Click)
- **Lookups Opener** — Modifier+click to open lookup references in a background tab (configurable shortcut, default: Ctrl+Click)
- **Open on API** — Open the current record as raw JSON in the Web API
- **Jump to Latest** — Pick any entity and open its most recently modified or created record
- **Activate Activity** — Reactivate a closed activity (conditionally shown when statecode ≠ 0)
- **Ribbon Toolbar** — Floating toolbar auto-injected in the CRM nav bar, mirroring all popup tools

## Keyboard Shortcuts

DynamicsCat registers Chrome extension keyboard shortcuts via the `commands` API. Shortcuts can be customized at `chrome://extensions/shortcuts`.

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Alt+O** | Jump to Latest | Toggle the Jump to Latest panel |
| **Alt+Shift+O** | Jump to Latest (Quick) | Repeat last search — opens the most recent record of the last-used entity directly, without showing the panel |

> **Note:** Jump to Latest (Quick) requires a previous panel search to know which entity and settings to use. If no previous search exists, a toast will prompt you to use Alt+O first.

## Documentation

- [Architecture](docs/architecture.md) — system architecture and component diagram
- [Glossary](docs/glossary.md) — domain terminology
- [Project Structure](docs/project-structure.md) — folder layout and module responsibilities

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
npm run watch       # Watch mode — rebuilds on every change
npm run typecheck   # tsc --noEmit (type-check only, no output)
npm run lint        # ESLint over src/
npm run check       # typecheck + lint together
```

### Load the extension in Chrome (after building)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked** and select the `dist/` folder

