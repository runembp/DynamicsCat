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

## Documentation

- [Architecture](docs/architecture.md) — system architecture and component diagram
- [Glossary](docs/glossary.md) — domain terminology
- [Project Structure](docs/project-structure.md) — folder layout and module responsibilities

---

## Adding a New Tool

All tools are registered in `src/actions.ts`. The popup and ribbon toolbar both consume the `ACTIONS` array as their single source of truth, so adding a new action there automatically wires it into both surfaces.

| File | What to do |
|------|-----------|
| `src/actions.ts` | Add an entry to the `ACTIONS` array with action name, script file, label, icon, and `popupBtnId` |
| `src/popup/popup.html` | Add a `<button id="btn-<action>">` in the correct section (popup.ts binds it automatically via `popupBtnId`) |
| `src/content/<tool>/` | Implement the content script (follow toggle + guard patterns from existing tools) |
| `build.js` | Add the entry point to `entryPoints` + any CSS copy in `copyStatics()` |

> **Rule:** A tool that appears in the popup must also appear in the ribbon dropdown, and vice versa. Both are driven by `ACTIONS` — keep them in sync by adding the action there.

