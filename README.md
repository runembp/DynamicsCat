# DynamicsCat

A Chrome Extension for Dynamics CRM 2016 — developer tools for form field inspection, option set browsing, record manipulation, and a ribbon toolbar that auto-injects on CRM pages.

As a bonus, brings a bit (a lot) of cuteness.

<img width="496" height="105" alt="image" src="https://github.com/user-attachments/assets/815b67ba-d275-45bc-b7a6-529393afce4e" />


## Quickstart (no build required)

The `dist/` folder is included in the repo — no Node.js needed.

1. [Download or clone this repository](https://github.com/runembp/DynamicsCat)
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `dist/` folder

Tools are accessible from the Chrome toolbar icon and from a ribbon toolbar that auto-injects on CRM pages.

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

### Chrome Extension Shortcuts

Registered via the Chrome `commands` API. Customizable at `chrome://extensions/shortcuts`.

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Alt+O** | Jump to Latest | Toggle the Jump to Latest panel |
| **Alt+Shift+O** | Jump to Latest (Quick) | Repeat last search — opens the most recent record of the last-used entity directly, without showing the panel |

> **Note:** Jump to Latest (Quick) requires a previous panel search to know which entity and settings to use. If no previous search exists, a toast will prompt you to use Alt+O first.

### In-Page Modifier Shortcuts

These shortcuts are active after enabling the tool via the popup or ribbon toolbar.

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Alt+Click** | Override Readonly | Click a readonly field while holding Alt to unlock it (configurable in popup settings) |
| **Ctrl+Click** | Lookups Opener | Click a populated lookup field while holding Ctrl to open the referenced record in a background tab (configurable in popup settings) |

> Both modifier shortcuts are configurable — click the ⚙️ gear icon next to the tool in the popup to choose between Alt, Ctrl, Shift, or combinations.

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

