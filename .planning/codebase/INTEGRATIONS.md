# External Integrations

**Analysis Date:** 2025-01-31

## Chrome Extension APIs

**`chrome.tabs` (Manifest V3):**
- Used in: `src/popup/popup.ts`
- Purpose: Query the active tab to obtain `tabId` before injecting scripts
- Method: `chrome.tabs.query({ active: true, currentWindow: true }, callback)`
- Permission: `activeTab` (declared in `manifest.json`)

**`chrome.scripting` (Manifest V3):**
- Used in: `src/popup/popup.ts`
- Purpose: Programmatically inject compiled content scripts into the active tab
- Methods:
  - `chrome.scripting.executeScript({ target: { tabId }, files: ['content/hello-world.js'] })` — injects into top frame only
  - `chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content/all-fields.js'], world: 'MAIN' })` — injects into all frames in the `MAIN` world (required to access `Xrm` global)
- Permission: `scripting` (declared in `manifest.json`)
- Host permission: `*://*/*` — allows injection on any URL

## Browser / DOM APIs

**Standard DOM APIs used in `src/content/all-fields.ts`:**
- `document.getElementById`, `document.createElement`, `document.head.appendChild`, `document.body.appendChild`
- `element.addEventListener` — keyboard events (`keydown`, `keyup` — `stopPropagation()` to prevent CRM page from swallowing input), `input` events on search, `click` on close button
- `element.remove()` — closes panel (toggle behaviour)
- `window.location.href` — logged for diagnostics
- `window.innerWidth` — used to clamp panel width to 90vw
- `requestAnimationFrame` — deferred panel width sizing after DOM paint
- `HTMLTableRowElement.dataset` — stores search index values on `<tr>` elements

**Standard DOM APIs used in `src/popup/popup.ts`:**
- `document.addEventListener('DOMContentLoaded', …)`
- `document.getElementById` — looks up `#btn-hello-world`, `#btn-all-fields`

## Target Application Integration — Microsoft Dynamics CRM 2016 (XRM)

**XRM JavaScript API (`Xrm.Page`):**
- Used in: `src/content/all-fields.ts`
- Purpose: Read all entity attributes and control labels from an open CRM form
- Access method: Injected via `world: 'MAIN'` so the content script shares the host page's JS context where `Xrm` is a global
- Key API calls:
  - `Xrm.Page.data.entity.attributes.get()` — returns all `Xrm.Attributes.Attribute[]`
  - `Xrm.Page.data.entity.getEntityName()` — entity logical name (e.g. `account`)
  - `Xrm.Page.data.entity.getId()` — record GUID
  - `Xrm.Page.ui.controls.forEach(ctrl => ctrl.getName(), ctrl.getLabel())` — builds label map
  - `attr.getValue()`, `attr.getAttributeType()` — per-attribute value reading
  - `(attr as Xrm.Attributes.OptionSetAttribute).getText()` — display text for option set attributes
- Type definitions: `@types/xrm` ^9.0.85 (dev dependency)
- Guard: `typeof Xrm === 'undefined' || !Xrm.Page` check silently skips non-CRM frames
- Target CRM version: Dynamics CRM 2016 (legacy `Xrm.Page` API; not the newer `Xrm.WebApi`)

## Data Storage

**Databases:**
- None — no external database

**File Storage:**
- None — no file uploads or remote storage

**Local Browser Storage:**
- None detected — no `chrome.storage`, `localStorage`, or `sessionStorage` usage

**Caching:**
- None

## Authentication & Identity

- None — the extension has no login/auth flow
- CRM authentication is handled entirely by the host browser session; the extension reads data already loaded in the page

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar

**Logs:**
- `console.log('[CRM Tools]', msg)` via `LOG()` helper in `src/content/all-fields.ts`
- All logging is to browser DevTools console only; no remote logging

## CI/CD & Deployment

**Hosting:**
- No server; distributed as a Chrome extension (load unpacked from `dist/` or publish to Chrome Web Store)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no CI config files)

## Environment Configuration

**Required env vars:**
- None — no environment variables; the extension is purely client-side

**Secrets:**
- None — no API keys, tokens, or credentials of any kind

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None — the extension makes no HTTP requests; it only reads data from the already-loaded CRM page DOM and XRM API

## Manifest V3 Declarations (`manifest.json`)

```json
"permissions":       ["activeTab", "scripting"]
"host_permissions":  ["*://*/*"]
"background":        { "service_worker": "background.js" }
"action":            { "default_popup": "popup/popup.html" }
```

- `background.js` is currently a placeholder (empty service worker)
- Popup entry: `dist/popup/popup.html` → loads `popup.js`
- Content scripts are injected on-demand (not declared statically in manifest); they are injected programmatically via `chrome.scripting.executeScript`

---

*Integration audit: 2025-01-31*
