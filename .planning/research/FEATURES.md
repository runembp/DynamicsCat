# Feature Landscape

**Domain:** Chrome Extension — Developer tools for Dynamics CRM 2016 (Manifest V3)
**Researched:** 2025-01-31
**Confidence:** HIGH (based on direct codebase analysis + official Chrome extension docs via Context7)

---

## Context: What Already Exists

The extension has a working "All Fields" panel (sortable initial load by label, searchable, toggle close). This milestone
adds polish and correctness to that foundation:

| Existing Behaviour | Status |
|--------------------|--------|
| `allFrames: true` injection into CRM iframes | ✓ Working |
| `Xrm.Page` guard — silently skips non-CRM frames | ✓ Working (silent = UX gap) |
| Panel toggle (open/close) | ✓ Working |
| Search by label/schema/value | ✓ Working |
| Initial sort by label (ascending, one-time) | ✓ Working (static, not interactive) |

---

## Table Stakes

Features users expect from this tool. Missing = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **User-facing error when Xrm unavailable** | User clicks "All Fields" on a non-CRM page and sees nothing happen. Silent failure reads as broken extension. | Low | Two-layer: popup URL hint + content script error panel for top frame |
| **Interactive column sort on All Fields table** | Panel already appears sortable (sticky headers, styled). Users expect clicking headers to sort. Developers especially need to sort by schema name or type. | Low–Medium | Needs sort state tracking + DOM re-sort + search re-application; data attributes already present |
| **CRM URL restriction with settings UI** | `host_permissions: ["*://*/*"]` is both a security risk (Chrome Web Store flags it) and a UX gap — the extension fires in all tabs with no awareness of scope. | Medium | Requires `options_ui` page + `chrome.storage.sync` + popup URL warning |
| **CI pipeline (GitHub Actions)** | `npm run check` already exists (typecheck + lint). Without CI it's only run manually. Any PR can silently introduce TypeScript errors. | Low | Single workflow file, standard `ubuntu-latest` + Node LTS matrix |

---

## Feature Design Details

### 1. User-Facing Error States (`Xrm.Page` Unavailable)

**Problem:** `chrome.scripting.executeScript` with `allFrames: true` runs in _every_ frame. Non-CRM frames
(including the top-level frame when the tab is not a CRM page at all) currently return silently with only
a `console.log`. The user sees nothing.

**Two-layer approach (both layers needed):**

**Layer A — Popup URL hint** (prevents confusion before injection)
- Before calling `executeScript`, popup reads configured CRM URLs from `chrome.storage.sync`
- Compares against `tab.url`
- If no match: show a non-blocking warning in the popup (`⚠ Not a CRM page`) in a small banner
- Does NOT prevent injection (user may have clicked on a CRM iframe URL that the popup can't see)
- Low complexity: `tab.url` is already available from `chrome.tabs.query`

**Layer B — Content script error panel** (for when injection fires but Xrm is absent)
- In `main()`, when `typeof Xrm === 'undefined' || !Xrm.Page`:
  - **Skip** if `window !== window.top` (non-top frame — expected, correct, silent)
  - **Show error panel** if `window === window.top` (top frame has no Xrm = wrong page)
- Error panel reuses existing `injectStyles()` + `PANEL_ID` infrastructure
- Content: `"⚠ CRM Tools: Xrm.Page not found. Open a Dynamics CRM 2016 form first."` 
- Panel dismissible with ✕ button (same pattern as the main panel)
- Error panel does NOT use a full table — just a styled message card
- **Does not auto-dismiss** (auto-dismiss requires timers, adds complexity for minimal value; ✕ is sufficient)

**What NOT to do:**
- Do not use `chrome.scripting.executeScript` return value (`InjectionResult[]`) to detect failures — it reports
  JS execution errors, not "Xrm was absent" (which is not an error, it's a guard)
- Do not block the "All Fields" button in the popup based on URL alone — the user may have navigated to the CRM
  form after the popup was opened

**Dependencies:** Layer A depends on CRM URL restriction feature (to have URLs to compare against).
Layer B has no dependencies — implement first.

---

### 2. Interactive Column Sort (Vanilla JS, No Framework)

**Pattern (well-established, no library needed):**

```typescript
type SortKey = 'label' | 'schema' | 'type' | 'value';
interface SortState { key: SortKey; dir: 1 | -1; }
let currentSort: SortState = { key: 'label', dir: 1 };
```

**On `<th>` click:**
1. If same column → flip direction (`dir * -1`)
2. If different column → set new key, reset `dir` to `1`
3. Sort the **source data array** (`sortedAttrs`) using the sort state
4. Clear `tbody` and re-append rows in new order (don't re-create — rows already exist as DOM elements, just move them)
5. Re-apply current search filter (call the same filter logic used by `searchInput.addEventListener('input')`)

**Visual indicators on headers:**
- Active column: append `▲` (asc) or `▼` (desc) to `th.textContent`
- All `th` elements: `cursor: pointer`, remove default `user-select: none` to avoid text selection flicker on click

**Existing infrastructure that helps:**
- `tr.dataset.searchLabel/searchSchema/searchValue` already set on every row — reuse for sort comparison
- `tbody.querySelectorAll<HTMLTableRowElement>('tr')` pattern already exists for search filter
- Initial sort-by-label is already present in `buildPanel()` — the interactive sort just makes this stateful

**Search + sort interaction:**
- Sort operates on ALL rows (including hidden filtered rows) — correct: when user clears search, sort order is maintained
- Filter operates on visibility — search filter reruns automatically because it reads `display` state from `dataset`, not DOM position

**Complexity note:** The rows must be stored or re-queried as an array to sort and re-insert. Two approaches:
- **Keep a `rows: HTMLTableRowElement[]` reference** in `buildPanel` closure — preferable (avoids re-querying)
- Re-query `tbody.querySelectorAll('tr')` on each sort — also fine at this scale (< 300 rows)

---

### 3. CRM URL Restriction + Settings UI

**Architecture decision: `options_ui` with `open_in_tab: true` (not popup-embedded)**

**Why not popup-embedded:**
- Popup is 260px wide — a URL list editor is cramped and unusable
- URL configuration is a one-time setup task, not a per-session action
- Popup already has a clear purpose (tool buttons); mixing settings creates cognitive overload

**Why `options_ui` over `options_page`:**
- `options_ui` is the MV3-preferred key (same functional outcome with `open_in_tab: true`)
- Opened via `chrome.runtime.openOptionsPage()` from popup — standard MV3 pattern
- `open_in_tab: true` gives full browser tab (vs. embedded in chrome://extensions detail pane)
- Chrome 99+ supports `openOptionsPage()` as a Promise

**Storage: `chrome.storage.sync`**
- Syncs across user's Chrome instances — appropriate for developer tool configuration
- Storage format: `{ crmUrls: string[] }` — array of URL patterns/hostnames
- Requires adding `"storage"` to `permissions` in `manifest.json`
- Quota: 512 items max, but a URL list of < 20 entries will never approach limits

**Settings page (`src/options/options.ts` + `src/options/options.html`):**
- New build entry point — must be added to `build.js` and `eslint.config.js`
- UI: textarea or `<ul>` of editable URL rows, Save button, success toast
- URL format to store: hostname patterns (`mycompany.crm.dynamics.com`) or full prefixes
- NO regex — plain hostname/prefix matching is sufficient and safe

**Popup changes:**
- Add `⚙ Settings` link/button at bottom of popup
- On click: `chrome.runtime.openOptionsPage()`
- On load: read `chrome.storage.sync` + `tab.url`, show warning banner if no URL match

**`host_permissions` scoping (coupled change):**
- Once settings UI exists, `host_permissions` can be tightened to known Dynamics domains:
  ```json
  "host_permissions": [
    "*://*.dynamics.com/*",
    "*://*.microsoftdynamics.com/*",
    "*://*.crm.dynamics.com/*"
  ]
  ```
- Settings UI covers on-premises / custom domain deployments that don't match above
- This is a **security + Web Store compliance** win; implement alongside settings UI

---

### 4. GitHub Actions CI Pipeline

**Pattern: standard Node.js workflow**

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - run: npm ci
      - run: npm run check
```

`npm run check` already exists: `tsc && eslint src/` — no new scripts needed.

**What it catches:**
- TypeScript errors (strict mode via existing `tsconfig.json`)
- ESLint violations (existing `eslint.config.js`)

**What it does NOT do (intentionally out of scope):**
- Extension build validation (would need Chrome headless + `chrome-extension-tester` or similar — premature)
- Automated tests (deferred to later milestone per PROJECT.md)

**Complexity:** Low. Single YAML file. No secrets needed. No matrix needed (single Node version, no cross-platform concerns).

---

## Differentiators

Features that would set this tool apart from generic CRM inspector tools. Not required for this milestone but worth noting for future phases.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Export fields to CSV/JSON** | Developers debugging CRM often want to share field data or compare between records | Medium | Adds a button to the panel; `Blob` + download link — no external deps |
| **Copy single field value** | Click a cell → copies schema name + value to clipboard | Low | `navigator.clipboard.writeText` — single event delegation on tbody |
| **Dirty field highlighting** | Show which fields have been modified since page load | Medium | Requires capturing initial values at injection time + `Xrm.Page.data.entity.attributes` isDirty check |
| **Multi-record comparison mode** | Open two CRM records side-by-side in the panel | High | Requires persistent state across tabs — out of scope for this extension's architecture |

---

## Anti-Features

Features to explicitly NOT build in this milestone (or ever, per PROJECT.md constraints).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automated tests against mock Xrm** | CRM 2016 runtime required; mock `Xrm` would need to replicate an extensive API surface | CI validates types + lint; defer Playwright to later milestone |
| **Virtual list / windowing for 300+ rows** | Premature optimization; CRM 2016 entities rarely exceed 150–200 attributes; standard `<tbody>` performs fine | Monitor real-world performance; add virtual list only if scroll lag is reported |
| **`MAIN` world mitigation / isolation sandbox** | `Xrm` is only on `window`; any isolation approach breaks the core use case | Accept MAIN world as architectural requirement |
| **`chrome.scripting.insertCSS` for styles** | Inline `injectStyles()` is self-contained in the injected script; switching to `insertCSS` adds API complexity without benefit | Keep inline style injection |
| **Settings in popup body (popup-embedded)** | 260px popup is too narrow for URL list management; mixes tool dispatch + configuration concerns | Use dedicated `options_ui` page |
| **Auto-dismiss error panel (setTimeout)** | Adds timing complexity; error state may be missed if user looks away | Use ✕ dismiss button, same as main panel |
| **Background service worker logic** | No message passing, no alarms, no lifecycle management needed | Remove `background.ts` entirely (separate tech debt ticket) |
| **URL validation/regex in settings** | Adds false precision; hostname prefix matching is sufficient for the use case | Plain string includes/startsWith matching |

---

## Feature Dependencies

```
Layer A popup URL hint  ──depends on──▶  CRM URL Restriction settings UI
                                         (needs chrome.storage.sync populated)

Layer B content error panel  ──no deps──▶  implement first

Column sort  ──depends on──▶  existing buildPanel() + dataset attributes (already there)

Settings UI  ──enables──▶  host_permissions scoping (security improvement)

CI pipeline  ──no deps──▶  implement independently
```

**Suggested implementation order:**
1. **CI pipeline** — no deps, unblocks everything else (PRs can be validated)
2. **Layer B error panel** — no deps, isolated to `all-fields.ts`
3. **Column sort** — no deps, isolated to `buildPanel()` in `all-fields.ts`
4. **Settings UI + storage** — new files, new build entries, manifest changes
5. **Layer A popup URL hint** — depends on settings UI (needs stored URLs to compare against)
6. **`host_permissions` scoping** — deploy alongside or after settings UI

---

## MVP Recommendation

All four features in the milestone are table stakes for this iteration:

**Build in this order:**
1. CI pipeline (YAML only, zero risk)
2. Column sort (isolated to `buildPanel()`, no new files)
3. Layer B error panel (isolated to `main()` guard block, no new files)
4. Settings UI → Layer A popup URL hint → `host_permissions` scoping (as a single cohesive PR)

**Defer to later milestone:**
- CSV/JSON export
- Clipboard copy per field
- Dirty field highlighting
- Automated Playwright tests

---

## Sources

- Direct codebase analysis: `src/content/all-fields.ts`, `src/popup/popup.ts`, `manifest.json`
- Chrome Extensions API (Context7, HIGH confidence): `chrome.storage`, `chrome.runtime.openOptionsPage`, `chrome.scripting.executeScript`  
  Source: https://developer.chrome.com/docs/extensions/reference/api/
- Chrome Extension Manifest options_ui / options_page (Context7, HIGH confidence):  
  Source: https://developer.chrome.com/docs/extensions/reference/manifest/
- Vanilla JS table sort: established DOM manipulation pattern, no library reference needed (LOW external confidence but pattern is well-understood and directly applicable to existing codebase's `dataset` + `tbody` structure)
