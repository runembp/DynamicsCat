# Project Structure

## Overview

Feature-per-folder organization. Each tool is a self-contained content script with co-located TypeScript and CSS. Shared infrastructure (panel shell, utilities, state) lives at the `src/content/` level. Two user-facing surfaces (popup and ribbon toolbar) consume a shared action registry.

## Directory Layout

```
DynamicsCat/
├── manifest.json                        ← Chrome Extension manifest (MV3)
├── build.js                             ← esbuild build script with static asset copying
├── package.json                         ← npm scripts and devDependencies
├── tsconfig.json                        ← TypeScript config (strict, noEmit)
├── eslint.config.js                     ← ESLint 9 flat config
├── icons/                               ← Extension icons (16/32/48/128 px)
├── src/
│   ├── actions.ts                       ← Action registry (single source of truth for all tools)
│   ├── background.ts                    ← Service worker: message listener, script dispatcher
│   ├── popup/
│   │   ├── popup.html                   ← Popup markup with button IDs
│   │   ├── popup.css                    ← Popup styles
│   │   └── popup.ts                     ← Popup logic: binds buttons, probes conditional actions
│   ├── ribbon/
│   │   └── ribbon-toolbar/
│   │       └── ribbon-toolbar.ts        ← Auto-injected CRM nav bar toolbar (ISOLATED world)
│   └── content/
│       ├── panel.ts                     ← Panel shell factory (header, drag, close, CSS, search)
│       ├── shared.ts                    ← Shared utilities (debounce, labelMap, toast, clipboard)
│       ├── state.ts                     ← Cross-frame state via top-frame dataset
│       ├── all-fields/
│       │   ├── all-fields.ts            ← Sortable table of all form attributes
│       │   └── all-fields.css           ← Panel-scoped styles
│       ├── option-sets/
│       │   ├── option-sets.ts           ← Option set browser with click-to-copy values
│       │   └── option-sets.css          ← Panel-scoped styles
│       ├── show-hidden-fields/
│       │   ├── show-hidden-fields.ts    ← Toggle visibility of hidden controls
│       │   └── show-hidden-fields.css   ← (unused — styles are inline)
│       ├── dirty-fields/
│       │   ├── dirty-fields.ts          ← Live onChange tracking with highlight injection
│       │   └── dirty-fields.css         ← (unused — styles are inline via dynamic <style>)
│       ├── override-readonly/
│       │   └── override-readonly.ts     ← Modifier+click to unlock readonly fields
│       ├── lookups-opener/
│       │   └── lookups-opener.ts        ← Modifier+click to open lookup records in background tab
│       ├── open-on-api/
│       │   └── open-on-api.ts           ← Open current record as Web API JSON
│       ├── jump-to-latest/
│       │   ├── jump-to-latest.ts        ← Entity picker dialog, opens newest record
│       │   ├── jump-to-latest-quick.ts  ← Headless quick-open via keyboard shortcut
│       │   └── jump-to-latest.css       ← Dialog-scoped styles
│       ├── activate-activity/
│       │   └── activate-activity.ts     ← PATCH statecode to reactivate closed activities
│       └── prefetch-entities/
│           └── prefetch-entities.ts     ← Background entity metadata cache warmer
└── dist/                                ← Build output (loaded as unpacked extension)
```

## Modules

### `src/actions.ts`
- **Responsibility:** Defines the `ACTIONS` array and `ACTION_MAP` lookup. Every tool in the extension is registered here.
- **Key files:** Single file. Exports `ActionDef` interface, `ACTIONS` array, `ACTION_MAP` record.
- **Internal structure:** Flat — one array, one derived map.

### `src/popup/`
- **Responsibility:** Browser-action popup. Renders tool buttons and dispatches actions to the background worker.
- **Key files:** `popup.html` (button layout), `popup.ts` (event binding, activatable probe), `popup.css` (two-column grid layout).

### `src/ribbon/ribbon-toolbar/`
- **Responsibility:** Auto-injected toolbar in the CRM `#navBar`. Mirrors the popup's tool set via the action registry. Runs in ISOLATED world.
- **Key files:** `ribbon-toolbar.ts` — builds the toolbar DOM, handles dropdown toggle, click-outside dismiss, SPA re-injection via MutationObserver, and conditional action probing.

### `src/content/`
- **Responsibility:** All content scripts injected into CRM pages. Each subfolder is one tool.
- **Key files at root level:**
  - `panel.ts` — `createPanelShell()`, `createSearchBar()`, `createCopySpan()`, `isolateKeyboard()`, `injectStylesheet()`
  - `shared.ts` — `debounce()`, `buildLabelMap()`, `makeDraggable()`, `copyToClipboard()`, `showToast()`
  - `state.ts` — `readFlag()`, `writeFlag()`, `clearFlag()`, `acquireToggleLock()`, `readJsonArray()`, `writeJsonArray()`

### `src/content/all-fields/`
- **Responsibility:** Renders a searchable, sortable side panel listing every attribute on the active form.
- **Key files:** `all-fields.ts` (reads `Xrm.Page.data.entity.attributes`, builds table, supports refresh).

### `src/content/option-sets/`
- **Responsibility:** Displays all optionset/multiselectoptionset fields with their available options and current value.
- **Key files:** `option-sets.ts` (filters attributes by type, renders option list with click-to-copy values).

### `src/content/show-hidden-fields/`
- **Responsibility:** Toggles visibility of all controls where `getVisible() === false`. Uses cross-frame state to track revealed fields across toggle cycles.
- **Key files:** `show-hidden-fields.ts`.

### `src/content/dirty-fields/`
- **Responsibility:** Live tracking of modified attributes via `onChange` subscription. Injects highlight CSS targeting CRM's `{name}_d` row wrappers.
- **Key files:** `dirty-fields.ts`.

### `src/content/override-readonly/`
- **Responsibility:** Toggle script that registers a configurable modifier+click handler to unlock readonly fields via `setDisabled(false)`. Reads shortcut config from cross-frame state.
- **Key files:** `override-readonly.ts`.

### `src/content/lookups-opener/`
- **Responsibility:** Toggle script that registers a configurable modifier+click handler to open populated lookup field references in a background tab. Uses `postMessage` to relay the open request to the background worker via the ribbon toolbar's message listener.
- **Key files:** `lookups-opener.ts`.

### `src/content/open-on-api/`
- **Responsibility:** Opens the current record as raw JSON in a new browser tab using the Dynamics Web API.
- **Key files:** `open-on-api.ts`.

### `src/content/jump-to-latest/`
- **Responsibility:** Dialog panel with entity picker and sort options. Queries OData for the most recently modified/created record and opens it. Persists sort field and days filter to localStorage.
- **Key files:** `jump-to-latest.ts` (entity search with datalist, localStorage cache, OData query), `jump-to-latest-quick.ts` (headless quick-open via keyboard shortcut), `jump-to-latest.css`.

### `src/content/activate-activity/`
- **Responsibility:** Reactivates a closed CRM activity by PATCHing statecode and statuscode via the Web API.
- **Key files:** `activate-activity.ts`.

### `src/content/prefetch-entities/`
- **Responsibility:** Registered as a manifest content script. Silently fetches and caches entity metadata on every CRM page load so Jump to Latest opens instantly.
- **Key files:** `prefetch-entities.ts`.
