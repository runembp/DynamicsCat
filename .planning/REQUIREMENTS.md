# Requirements: CRM Chrome Tools

**Defined:** 2026-04-16
**Core Value:** Instant visibility into all CRM field values on any form, without opening DevTools or the CRM field editor.

## v1 Requirements

### Cleanup / Tech Debt

- [ ] **CLEN-01**: README updated with correct `dist/` load path, current popup+button UX description, Chrome 120+ version note, and CRM 2016 / `Xrm.Page` scope note
- [ ] **CLEN-02**: `hello-world.ts` content script, popup button (`btn-hello-world`), and `build.js` entry point removed entirely
- [ ] **CLEN-03**: `rimraf` added as devDependency; `npm run clean` script added (`rimraf dist`); orphan `dist/content/show-fields.js` and `dist/content/show-fields.css` deleted
- [ ] **CLEN-04**: `src/background.ts` and the `"background"` service worker entry in `manifest.json` removed (no background logic required)
- [ ] **CLEN-05**: `src/content/all-fields.css` dead file removed; inline `injectStyles()` function remains as the sole style source
- [ ] **CLEN-06**: `npm run build` calls `runLint()` after `esbuild.build()` completes (not only during watch mode)

### Security

- [ ] **SEC-01**: Explicit `content_security_policy` added to `manifest.json` using MV3 nested object format: `{ "extension_pages": "script-src 'self'; object-src 'self'" }`
- [ ] **SEC-02**: Non-null `!` assertions on `document.getElementById` in `popup.ts` replaced with null guards that throw descriptive errors
- [ ] **SEC-03**: `host_permissions` scoped to `*://*.dynamics.com/*`, `*://*.microsoftdynamics.com/*`, `*://*.crm.dynamics.com/*`; `chrome.scripting.executeScript` call in `popup.ts` given a `.catch()` handler; ships atomically with SET-01/SET-02

### Content Script UX

- [ ] **CSUX-01**: When "All Fields" is clicked on a non-CRM page (or a CRM page where `Xrm.Page` is unavailable), a styled inline error panel is rendered in the top frame instead of silently exiting
- [ ] **CSUX-02**: Search input in the All Fields panel is debounced (~100ms); `keypress` event suppression added alongside existing `keydown`/`keyup` suppression
- [ ] **CSUX-03**: All Fields panel header columns (Label, Schema Name, Type, Value) are clickable to sort rows ascending/descending; sort state persists while panel is open

### Settings

- [ ] **SET-01**: Options UI page (`src/options/options.ts` + `options.html`) allows users to add and remove CRM instance URLs; data stored in `chrome.storage.sync`; registered as `options_ui` in `manifest.json`
- [ ] **SET-02**: Popup shows a warning banner when the active tab URL does not match any configured CRM URL; banner includes a link to open the options page
- [ ] **SET-03**: `"storage"` permission added to `manifest.json` permissions array

### Quality / CI

- [ ] **CI-01**: GitHub Actions workflow (`.github/workflows/ci.yml`) runs `npm run check` (typecheck + lint) on every push and pull request

## v2 Requirements

### Testing

- **TEST-01**: Integration tests using Playwright against a mock `Xrm` global covering panel render, search filter, sort, and toggle behavior
- **TEST-02**: CI extended to run integration tests on push/PR

### Extended Compatibility

- **COMPAT-01**: Optional `chrome.permissions.request()` flow for custom on-premise CRM domains not covered by declared `host_permissions` patterns

## Out of Scope

| Feature | Reason |
|---------|--------|
| Unit/integration test suite (v1) | Requires CRM runtime mock; deferred to v2 |
| Switching inline CSS to `chrome.scripting.insertCSS` | Inline is self-contained and working; migration adds complexity without user benefit |
| Virtual list for 300+ field tables | Premature optimization at current scale |
| `MAIN` world mitigation | Architectural requirement — `Xrm` is only accessible in page context |
| Real-time message passing (popup ↔ content) | Fire-and-forget architecture is simpler and sufficient |
| `Xrm.Page` → modern UCI `executionContext` migration | Extension explicitly targets CRM 2016; UCI migration is a separate milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEN-01 | Phase 1 | Pending |
| CLEN-02 | Phase 1 | Pending |
| CLEN-03 | Phase 1 | Pending |
| CLEN-04 | Phase 1 | Pending |
| CLEN-05 | Phase 1 | Pending |
| CLEN-06 | Phase 1 | Pending |
| CI-01 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| CSUX-01 | Phase 2 | Pending |
| CSUX-02 | Phase 2 | Pending |
| CSUX-03 | Phase 2 | Pending |
| SET-01 | Phase 3 | Pending |
| SET-02 | Phase 3 | Pending |
| SET-03 | Phase 3 | Pending |
| SEC-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
