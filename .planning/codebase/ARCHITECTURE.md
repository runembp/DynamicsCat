# Architecture

**Analysis Date:** 2025-01-31

## Pattern Overview

**Overall:** Chrome Extension (Manifest V3) — Event-driven, multi-context architecture

**Key Characteristics:**
- Three isolated execution contexts: service worker, popup page, and content scripts
- Popup acts as the sole dispatcher — it owns all user interaction and triggers all content script injection
- Content scripts run in `world: 'MAIN'` to share the page's JavaScript heap and access the `Xrm` global (Dynamics CRM 2016 API)
- No persistent background logic — `background.ts` is a placeholder; the service worker has no active duties
- No message passing between contexts (popup → content scripts via `chrome.scripting.executeScript` only, no `chrome.runtime.sendMessage`)

## Contexts & Layers

**Service Worker (`background.js`):**
- Purpose: Required by MV3 manifest; currently a no-op placeholder
- Location: `src/background.ts` → `dist/background.js`
- Registered as: `"background": { "service_worker": "background.js" }` in `manifest.json`
- Contains: Single comment line — no logic
- Depends on: Nothing

**Popup Page (`popup/popup.js` + `popup/popup.html`):**
- Purpose: Extension action UI — renders tool buttons; dispatches content scripts on click
- Location: `src/popup/popup.ts` → `dist/popup/popup.js`
- HTML shell: `src/popup/popup.html` → `dist/popup/popup.html`
- Stylesheet: `src/popup/popup.css` → `dist/popup/popup.css`
- Triggered by: User clicking the extension icon in the Chrome toolbar
- Responsibilities:
  - Queries the active tab (`chrome.tabs.query`)
  - Calls `chrome.scripting.executeScript` to inject content scripts into the active tab
- Does NOT receive any response from injected scripts (fire-and-forget)

**Content Scripts:**
- Purpose: Run inside the target web page's frame(s) to perform CRM inspection/manipulation
- Location: `src/content/` → `dist/content/`
- Injected programmatically by `popup.ts` via `chrome.scripting.executeScript` (NOT declared in manifest)
- Run in `world: 'MAIN'` (shares page JS heap, can access `window.Xrm`)
- NOT pre-loaded on page — injected on demand when user clicks a tool button

## Content Scripts Detail

**`content/hello-world.js`:**
- Source: `src/content/hello-world.ts`
- Behaviour: Calls `alert('Hello world')` — smoke-test/demo tool
- Injection: `target: { tabId }` — top frame only, isolated world (default)
- No CSS dependency

**`content/all-fields.js`:**
- Source: `src/content/all-fields.ts`
- Behaviour: Reads all `Xrm.Page` attributes and renders a fixed-position side-panel overlay in the CRM form frame
- Injection: `target: { tabId, allFrames: true }`, `world: 'MAIN'`
- `allFrames: true` — required because Dynamics CRM 2016 renders the form inside a nested `<iframe>`; the script runs in every frame and silently skips frames where `Xrm` is absent
- CSS: Styles are injected inline via `<style>` tag by `injectStyles()` function at runtime; `src/content/all-fields.css` is a companion file for design reference but is NOT loaded separately at runtime
- Toggle behaviour: If the panel (`#crm-tools-fields-panel`) already exists in the frame, the script removes it (close) rather than adding a second instance

## Data Flow

**All Fields Tool — Happy Path:**

1. User opens popup → `popup.html` loads, `popup.js` attaches button listeners
2. User clicks "📋 All Fields" button
3. `popup.ts` calls `chrome.tabs.query({ active: true, currentWindow: true })`
4. Chrome returns the active tab's `tabId`
5. `popup.ts` calls `chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content/all-fields.js'], world: 'MAIN' })`
6. Chrome injects `all-fields.js` into **every frame** of the active tab
7. In each frame, `main()` runs:
   - Checks if panel already open → removes it (toggle) if so
   - Checks `typeof Xrm !== 'undefined' && Xrm.Page` → skips silently if not a CRM form frame
   - Reads `Xrm.Page.data.entity.attributes.get()` — all entity attributes
   - Builds `labelMap` from `Xrm.Page.ui.controls` — maps schema name → display label
   - Calls `injectStyles()` — adds `<style>` tag to `<head>`
   - Calls `buildPanel()` — creates sortable, searchable table DOM and appends to `<body>`
8. Panel is visible in the CRM form iframe; user can search/close

**Hello World Tool:**

1. User clicks "👋 Hello World"
2. `popup.ts` injects `content/hello-world.js` into top frame of active tab
3. `alert('Hello world')` fires in page context

## Key Abstractions

**`main()` function (all-fields.ts):**
- Purpose: Orchestrates the all-fields feature — guard checks, data read, render
- Location: `src/content/all-fields.ts` (line 8)
- Pattern: Self-contained IIFE-style entry — called at module bottom (`main()` at line 290)

**`buildPanel()` function (all-fields.ts):**
- Purpose: Constructs the entire side-panel DOM imperatively (no framework)
- Location: `src/content/all-fields.ts` (line 156)
- Pattern: Vanilla DOM manipulation with `document.createElement`; inline search filter via `dataset` attributes

**`formatValue()` function (all-fields.ts):**
- Purpose: Formats `Xrm.Attributes.Attribute` values for display, handling all CRM attribute types
- Location: `src/content/all-fields.ts` (line 125)
- Pattern: `switch` on `attr.getAttributeType()` — handles `lookup`, `optionset`, `multiselectoptionset`, `datetime`, `boolean`, and default string conversion

**`injectStyles()` function (all-fields.ts):**
- Purpose: Injects panel CSS as an inline `<style>` tag into the frame's `<head>`; idempotent via `STYLE_ID` guard
- Location: `src/content/all-fields.ts` (line 57)

## Entry Points

**Manifest Entry Points (MV3):**
- Service worker: `dist/background.js` — registered via `"background": { "service_worker": "background.js" }`
- Popup: `dist/popup/popup.html` — registered via `"action": { "default_popup": "popup/popup.html" }`

**Build Entry Points (`build.js`):**
- `src/background.ts` → `dist/background.js`
- `src/popup/popup.ts` → `dist/popup/popup.js`
- `src/content/hello-world.ts` → `dist/content/hello-world.js`
- `src/content/all-fields.ts` → `dist/content/all-fields.js`

**Required Permissions (`manifest.json`):**
- `activeTab` — access to the active tab's `tabId`
- `scripting` — required to call `chrome.scripting.executeScript`
- `host_permissions: ["*://*/*"]` — allows injection into any URL

## Error Handling

**Strategy:** Silent failure with console logging in content scripts; no user-facing error states

**Patterns:**
- `all-fields.ts`: `try/catch` around `attr.getValue()` and `ctrl.getLabel()` — returns `'(error)'` or falls back to schema name
- `all-fields.ts`: `typeof Xrm === 'undefined'` guard — skips non-CRM frames silently, logs via `LOG()`
- `formatValue()`: Wraps entire body in `try/catch` → returns `'(error reading value)'` on any failure
- No error handling in `popup.ts` — `chrome.scripting.executeScript` rejections are unhandled

## Cross-Cutting Concerns

**Logging:** `LOG()` helper in `all-fields.ts` — prefixes all messages with `[CRM Tools]`; uses `console.log` directly
**Validation:** Guard pattern — `Xrm` existence check before any CRM API access
**Authentication:** None — extension relies on the user already being authenticated to the CRM site
**Styling isolation:** Panel uses highly-specific CSS selectors (`#crm-tools-fields-panel .cfp-*`) to avoid conflicts with host page styles; styles injected inline (not as a separate file) at content script runtime

---

*Architecture analysis: 2025-01-31*
