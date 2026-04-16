# Technology Stack — Hardening & Feature Research

**Project:** CRM Chrome Tools (MV3 Chrome Extension)
**Milestone:** Hardening + CRM developer tooling extensions
**Researched:** 2026-04-16
**Research Mode:** Ecosystem (existing codebase, adding specific capabilities)

---

## Existing Stack (Do Not Re-Architect)

The codebase is TypeScript + esbuild + ESLint flat config. All additions below are
additive — no framework changes, no new bundler, no new test setup.

| Layer | Current | Status |
|-------|---------|--------|
| Language | TypeScript `^5.7.0` | Keep — `^6.0.2` is available but upgrade is not milestone scope |
| Bundler | esbuild `^0.24.0` | Keep — latest is `0.28.0` but no breaking changes for this work |
| Linting | ESLint `^9.0.0` + typescript-eslint `^8.0.0` | Keep — ESLint 10.x exists but 9.x is fully supported |
| Chrome types | `@types/chrome` `^0.0.268` | Keep — latest is `0.1.40`; no action needed |
| Xrm types | `@types/xrm` `^9.0.85` | Keep — latest is `9.0.91`; no action needed |

> **Confidence: HIGH** — npm registry verified 2026-04-16.

---

## New Dependencies Required

### 1. rimraf — Clean Script

**Recommendation:** Add `rimraf@^6.1.3` as a `devDependency`.

```bash
npm install -D rimraf
```

**npm script to add:**
```json
"clean": "rimraf dist"
```

**Why rimraf over `fs.rmSync`:**
rimraf is intention-signaling and universally understood by contributors. While
`fs.rmSync('dist', { recursive: true, force: true })` works in Node.js 14+ without
any dep, `rimraf dist` in a script is idiomatic for "clean build output" across the
ecosystem. The project's `build.js` already depends on `node:fs` for copying statics —
if you want zero deps for clean, inline `fs.rmSync` in `build.js` is viable. Either
choice is correct; rimraf wins on legibility in package.json scripts.

**Why NOT rimraf v5 or v4:**
- rimraf v6 (current) is ESM-native, aligns with `"type": "module"` in `package.json`
- rimraf v4/v5 have CommonJS-first APIs that required workarounds in ESM projects

> **Confidence: HIGH** — npm registry, rimraf GitHub README verified.

---

### 2. chrome.storage API — Settings Persistence

**No new npm dependency.** `chrome.storage` is a Chrome Extension built-in.

**Recommendation: Use `chrome.storage.sync`** for the CRM URL configuration setting.

**Why `sync` over `local`:**

| Factor | `chrome.storage.sync` | `chrome.storage.local` |
|--------|----------------------|------------------------|
| Quota | ~100 KB total, 8 KB per item | 10 MB |
| Syncs across devices | ✓ Yes, when user is signed into Chrome | ✗ No |
| Works offline | ✓ Degrades to local | ✓ Always |
| Appropriate for | User preferences, settings | Large data, cache, sensitive tokens |

A list of CRM instance URLs (e.g., `https://myorg.crm.dynamics.com`) will be a tiny
fraction of the 8 KB-per-item quota. The `sync` area is the correct choice because a
developer running the extension on both home and work machines expects their configured
URLs to follow them.

**Manifest change required — add `"storage"` permission:**
```json
"permissions": ["activeTab", "scripting", "storage"]
```

`chrome.storage` requires the `"storage"` permission to be declared. This is a
low-sensitivity permission that does not trigger a Chrome Web Store warning.

**Usage pattern (TypeScript):**
```typescript
// Save settings
await chrome.storage.sync.set({ crmUrls: ['https://myorg.crm.dynamics.com'] });

// Load settings
const { crmUrls } = await chrome.storage.sync.get({ crmUrls: [] as string[] });

// React to changes across extension contexts
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.crmUrls) {
    // Update UI or behavior
  }
});
```

> **Confidence: HIGH** — Chrome Extension developer docs verified via Context7
> (source: developer.chrome.com/docs/extensions/reference/api/storage).

---

### 3. Settings UI — Where to Put CRM URL Configuration

**Recommendation: Embed settings in `popup.html`**, not a separate `options.html`.

**Rationale:**
The popup is already the extension's single user-facing surface. The requirement is
"settings UI for users to define their CRM instance URLs." This is a small form (one
text input + add/remove list). Introducing a separate options page (`options_ui` or
`options_page`) adds a new entry point, a new TypeScript file, a new esbuild entry, and
a new static copy step — all for a form that fits comfortably in the popup.

**When to use `options_ui` instead:**
Use `options_ui` (embedded in `chrome://extensions`) when settings are complex enough to
warrant a full page, or when following extension store UX conventions. Not warranted here.

**Pattern to follow:**
- Add a "⚙ Settings" toggle section at the bottom of `popup.html`
- Show/hide via a button click (CSS class toggle, no framework needed)
- Save to `chrome.storage.sync` on input change or submit
- Read on popup load to pre-populate

> **Confidence: HIGH** — Chrome Extension options page docs verified via Context7
> (source: developer.chrome.com/docs/extensions/develop/ui/options-page).

---

### 4. GitHub Actions CI

**No new npm dependencies.** CI runs the existing `npm run check` script.

**Recommended workflow file:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    name: Typecheck + Lint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run checks
        run: npm run check
```

**Action versions (verified 2026-04-16):**
| Action | Latest | Release date |
|--------|--------|--------------|
| `actions/checkout` | `v6.0.2` | 2026-01-09 |
| `actions/setup-node` | `v6.3.0` | 2026-03-04 |

**Why these choices:**
- `ubuntu-latest` — sufficient for a pure TypeScript/ESLint check with no browser runtime needed
- `node-version: '20'` — LTS; matches local Node `v20.19.2`; avoids `node-version: 'lts/*'` which can silently shift
- `cache: 'npm'` — caches `~/.npm` using `package-lock.json` as key; no extra action needed
- `npm ci` over `npm install` — reproducible installs, fails if `package-lock.json` is out of sync
- Only `npm run check` (typecheck + lint) — no build step needed for CI correctness; building produces no artifacts worth caching in this repo

**What to NOT include in CI for this milestone:**
- Build step (`npm run build`) — adds ~5s, produces no tested artifact
- Automated extension upload/release — out of scope per PROJECT.md
- Browser-based tests (Playwright) — explicitly deferred to a future milestone per PROJECT.md

> **Confidence: HIGH** — GitHub API verified action versions; workflow pattern is
> standard for TypeScript/ESLint-only CI.

---

### 5. Content Security Policy (MV3)

**No new dependency.** CSP is a `manifest.json` declaration.

**Recommendation:** Add explicit `content_security_policy` to `manifest.json`.

**MV3 CSP format** (changed from MV2 — must be an object, not a string):
```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'"
  }
}
```

**Why this exact policy:**
- `default-src 'self'` — restricts all resource loading (scripts, styles, fonts, frames,
  XHR/fetch, websockets) to same-origin (the extension's own origin `chrome-extension://[id]/`)
- Blocks remote script injection, eval-based code execution, and inline scripts in
  extension pages (popup.html)
- This is the strictest sane policy and what Chrome Web Store reviewers expect to see
- MV3 already blocks `'unsafe-eval'` and `'unsafe-inline'` by platform default;
  making it explicit removes any ambiguity and prevents future accidental relaxation

**Important scope clarification:**
`content_security_policy.extension_pages` governs:
- `popup/popup.html`
- Any `options.html` if added later
- The service worker (`background.js`) once re-added

It does **NOT** govern content scripts (`all-fields.ts` injected into CRM pages).
Content scripts run in the host page's context and are governed by the CRM host's CSP.
There is no manifest field to set CSP for injected content scripts.

**MV3 `sandbox` key:** Only needed if the extension uses sandboxed pages
(e.g., for eval in an isolated context). Not applicable here — omit it.

> **Confidence: HIGH** — Chrome Extension security docs verified via Context7
> (sources: developer.chrome.com/docs/extensions/migrating/improve-security,
> developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure).

---

### 6. host_permissions Scoping

**No new dependency.** Manifest change only.

**Current (too broad):**
```json
"host_permissions": ["*://*/*"]
```

**Recommended (scoped):**
```json
"host_permissions": [
  "https://*.dynamics.com/*",
  "https://*.microsoftdynamics.com/*",
  "https://*.crm.dynamics.com/*"
]
```

**For custom on-prem CRM domains** (users who configure additional URLs in settings):
Use `optional_host_permissions` + `chrome.permissions.request()` at runtime.

```json
"optional_host_permissions": ["https://*/*"]
```

This pattern: the extension requests broad optional permission only when the user
actively adds a custom URL in settings, rather than declaring `*://*/*` at install time.
Chrome Web Store reviewers flag broad `host_permissions` as a security concern; scoping
reduces review friction and minimizes the extension's attack surface.

> **Confidence: HIGH** — Chrome Extension host_permissions docs verified via Context7
> (source: developer.chrome.com/docs/extensions/develop/migrate/manifest).

---

### 7. Column Sorting — DOM Only, No Library

**No new dependency.** Vanilla TypeScript DOM manipulation.

**Recommended pattern:**
```typescript
// Data-driven: keep sorted copy of rows, re-render on header click
type SortKey = 'label' | 'schemaName' | 'type' | 'value';
type SortDir = 'asc' | 'desc';

function sortTable(tbody: HTMLTableSectionElement, key: SortKey, dir: SortDir): void {
  const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));
  rows.sort((a, b) => {
    const aVal = a.dataset[key] ?? '';
    const bVal = b.dataset[key] ?? '';
    return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  rows.forEach(row => tbody.appendChild(row)); // DOM re-order is in-place
}
```

Store sort state as module-level variables in `all-fields.ts`. Use `data-*` attributes
on `<tr>` elements at render time for sort keys rather than reading cell text (avoids
brittle text parsing). Toggle indicator on `<th>` with a CSS class (`sort-asc`/`sort-desc`).

**Why no sorting library (e.g., list.js, tablesort):**
- The table is a fixed, non-paginated list of field rows; 4 columns
- At 300+ rows, DOM re-order is fast enough (no virtualization until >1000 rows)
- Inline sort keeps all field-panel logic in one file (`all-fields.ts`) with no new bundle entry
- Sorting libraries are designed for static HTML tables, not dynamically constructed ones

> **Confidence: HIGH** — Vanilla DOM sort is a well-established pattern; no library
> evaluation needed.

---

## Dependency Change Summary

| Change | Package | Version | Reason |
|--------|---------|---------|--------|
| ADD devDep | `rimraf` | `^6.1.3` | `npm run clean` to wipe `dist/` before builds |
| ADD permission | *(manifest)* | `"storage"` | Required for `chrome.storage` API |
| ADD manifest key | *(manifest)* | `content_security_policy` | Explicit MV3 CSP for extension pages |
| CHANGE manifest | *(manifest)* | `host_permissions` scoped | Remove `*://*/*`, add specific Dynamics domains |
| ADD script | *(package.json)* | `"clean": "rimraf dist"` | — |
| NO CHANGE | TypeScript | `^5.7.0` stays | 6.0.2 exists but upgrade is not this milestone's scope |
| NO CHANGE | ESLint | `^9.0.0` stays | 10.2.0 exists; 9.x is fully supported |
| NO CHANGE | esbuild | `^0.24.0` stays | 0.28.0 exists; no relevant new features needed |

---

## What NOT to Use

| Rejected | Why |
|----------|-----|
| React / Preact for settings UI | Massively oversized for a 2-field settings form; no framework in codebase already |
| `webextension-polyfill` | Extension targets Chrome only; no cross-browser requirement |
| `options_ui` separate page | Settings scope is small enough for popup inline; avoids new esbuild entry |
| Virtual scroll library | Out of scope; PROJECT.md explicitly defers this |
| `unsafe-inline` in CSP | Never add; inline scripts in popup would require this; don't do inline event handlers |
| rimraf v4 or v5 | v4 was pre-ESM; v5 had transitional API; v6 is ESM-native and current |
| `actions/checkout@v4` | v6.0.2 is current stable (Jan 2026); use latest major |

---

## Installation

```bash
# Add only new runtime devDep
npm install -D rimraf
```

No other `npm install` commands needed. All other changes are manifest.json, package.json
scripts, or new TypeScript/HTML/CSS source files built by the existing esbuild pipeline.

New source files that feed esbuild do NOT need new entrypoints unless they are
independently loaded. A settings module inside `popup.ts` (not a new HTML page) requires
no `build.js` changes.

---

## Sources

| Claim | Source | Confidence |
|-------|--------|------------|
| `chrome.storage.sync` quotas (100KB total, 8KB/item) | developer.chrome.com/docs/extensions/reference/api/storage | HIGH |
| `chrome.storage` requires `"storage"` permission | developer.chrome.com/docs/extensions/reference/api/storage | HIGH |
| MV3 CSP must be dict with `extension_pages` key | developer.chrome.com/docs/extensions/migrating/improve-security | HIGH |
| `options_ui` `open_in_tab: false` = embedded in chrome://extensions | developer.chrome.com/docs/extensions/develop/ui/options-page | HIGH |
| rimraf v6.1.3 is latest stable | npmjs.com (verified 2026-04-16) | HIGH |
| `actions/checkout@v6.0.2` is latest | api.github.com/repos/actions/checkout/releases/latest | HIGH |
| `actions/setup-node@v6.3.0` is latest | api.github.com/repos/actions/setup-node/releases/latest | HIGH |
| typescript-eslint@8.x supports ESLint 9/10 and TypeScript ≥4.8.4 <6.1.0 | npm show typescript-eslint@latest peerDependencies | HIGH |
| TypeScript 6.0.2 is latest stable | npmjs.com (verified 2026-04-16) | HIGH |
| host_permissions patterns for Dynamics domains | developer.chrome.com/docs/extensions/develop/concepts/network-requests | HIGH |

---

*Research: 2026-04-16 — Milestone: hardening + feature extension*
