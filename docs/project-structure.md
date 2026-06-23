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
│   ├── user-languages.ts                ← English/Danish LCID helpers and Switch language label builder
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
│       ├── field-click/
│       │   └── field-click.ts            ← Modifier+click a lookup to open it, or a label to copy its logical name
│       ├── open-on-api/
│       │   └── open-on-api.ts           ← Open current record as Web API JSON
│       ├── jump-to-latest/
│       │   ├── jump-to-latest.ts        ← Entity picker dialog, opens newest record
│       │   ├── jump-to-latest-quick.ts  ← Headless quick-open via keyboard shortcut
│       │   └── jump-to-latest.css       ← Dialog-scoped styles
│       ├── activate-activity/
│       │   └── activate-activity.ts     ← PATCH statecode to reactivate closed activities
│       ├── change-user-language/
│       │   └── change-user-language.ts  ← Switch current user language between Danish and English
│       ├── unlock-all-fields/
│       │   └── unlock-all-fields.ts     ← Toggle: unlock/re-lock all disabled controls
│       ├── shortcuts-help/
│       │   └── shortcuts-help.ts        ← Dialog panel listing DynamicsCat shortcuts
│       └── prefetch-entities/
│           └── prefetch-entities.ts     ← Background entity metadata cache warmer
└── dist/                                ← Build output (loaded as unpacked extension)
```

## Modules

### `src/actions.ts`
- **Responsibility:** Defines the `ACTIONS` array and `ACTION_MAP` lookup. Every tool in the extension is registered here.
- **Key files:** Single file. Exports `ActionDef` interface, `ACTIONS` array, `ACTION_MAP` record.
- **Internal structure:** Flat — one array, one derived map.

### `src/user-languages.ts`
- **Responsibility:** Defines supported user language LCIDs and builds the Switch language direction label.
- **Key files:** Single file. Exports English/Danish LCIDs, LCID parsing, opposite-language lookup, and label text.
- **Internal structure:** Flat helper module used by popup, ribbon, background, and the Switch language content script.

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

### `src/content/field-click/`
- **Responsibility:** Toggle script that registers a configurable modifier+click handler. Clicking a populated lookup field's value opens the referenced record in a background tab (via `postMessage` relayed to the background worker by the ribbon toolbar's message listener). Clicking a field's label copies that field's logical name to the clipboard and shows a toast.
- **Key files:** `field-click.ts`.

### `src/content/open-on-api/`
- **Responsibility:** Opens the current record as raw JSON in a new browser tab using the Dynamics Web API.
- **Key files:** `open-on-api.ts`.

### `src/content/jump-to-latest/`
- **Responsibility:** Dialog panel with entity picker and sort options. Queries OData for the most recently modified/created record and opens it. Persists sort field and days filter to localStorage.
- **Key files:** `jump-to-latest.ts` (entity search with datalist, localStorage cache, OData query), `jump-to-latest-quick.ts` (headless quick-open via keyboard shortcut), `jump-to-latest.css`.

### `src/content/activate-activity/`
- **Responsibility:** Reactivates a closed CRM activity by PATCHing statecode and statuscode via the Web API.
- **Key files:** `activate-activity.ts`.

### `src/content/change-user-language/`
- **Responsibility:** Switches the current CRM user's UI language between Danish and English by updating `usersettings.uilanguageid`, then reloads the page.
- **Key files:** `change-user-language.ts`.

### `src/content/unlock-all-fields/`
- **Responsibility:** Toggle script that unlocks all disabled controls on the form via `setDisabled(false)` and re-locks them on the next toggle. Tracks affected field names in cross-frame state.
- **Key files:** `unlock-all-fields.ts`.

### `src/content/shortcuts-help/`
- **Responsibility:** Renders a dialog panel listing the keyboard/mouse shortcuts DynamicsCat adds. Reflects the user's configured click-shortcuts read from cross-frame state.
- **Key files:** `shortcuts-help.ts`.

### `src/content/prefetch-entities/`- **Responsibility:** Registered as a manifest content script. Silently fetches and caches entity metadata on every CRM page load so Jump to Latest opens instantly.
- **Key files:** `prefetch-entities.ts`.
