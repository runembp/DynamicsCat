# Roadmap: CRM Chrome Tools — Hardening Milestone

**Milestone:** Hardening
**Granularity:** Coarse
**Phases:** 3
**Coverage:** 16/16 v1 requirements mapped ✓
**Created:** 2026-04-16

---

## Phases

- [ ] **Phase 1: Foundation Cleanup + CI** — Remove scaffold debt, enforce null safety, gate all future work behind CI
- [ ] **Phase 2: Content Script Hardening + Sort** — Interactive column sort, user-visible error panel, search polish
- [ ] **Phase 3: Settings UI + Security Hardening** — CRM URL settings, popup warning banner, scoped host_permissions (ships atomically)

---

## Phase Details

### Phase 1: Foundation Cleanup + CI
**Goal**: The codebase is clean, null-safe, and every future change is gated by automated CI
**Depends on**: Nothing (first phase)
**Requirements**: CLEN-01, CLEN-02, CLEN-03, CLEN-04, CLEN-05, CLEN-06, CI-01, SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes without errors and runs lint automatically — no manual `npm run check` step needed to catch type or lint issues
  2. The loaded extension popup shows only the "All Fields" button — no hello-world button exists; clicking All Fields still works correctly
  3. `npm run clean && npm run build` produces a `dist/` folder with no orphan `show-fields.*` or `background.*` artifacts
  4. GitHub Actions CI passes green on every push and pull request, running `npm run check` automatically
  5. `manifest.json` includes an explicit `content_security_policy` in MV3 nested-object format and `popup.ts` DOM lookups use null guards instead of `!` assertions
**Plans**: 3 plans

Plans:
- [ ] 01-PLAN-groundwork-ci.md — README overhaul, rimraf/clean setup, GitHub Actions CI (CLEN-01, CLEN-03, CI-01)
- [ ] 01-PLAN-security-hardening.md — Null guards in popup.ts, MV3 CSP in manifest (SEC-01, SEC-02)
- [ ] 01-PLAN-scaffold-removal.md — Remove hello-world scaffold, background.ts, dead CSS; wire lint into build (CLEN-02, CLEN-04, CLEN-05, CLEN-06)

### Phase 2: Content Script Hardening + Sort
**Goal**: The All Fields panel gives clear feedback on non-CRM pages and provides interactive sorting and polished keyboard isolation
**Depends on**: Phase 1
**Requirements**: CSUX-01, CSUX-02, CSUX-03
**Success Criteria** (what must be TRUE):
  1. Clicking "All Fields" on a non-CRM page (or a page where `Xrm.Page` is unavailable) renders a styled inline error panel — the button does not silently do nothing
  2. Clicking a column header (Label, Schema Name, Type, Value) sorts all visible rows ascending; clicking the same header again reverses to descending order
  3. Sort state is preserved while the panel is open — searching while sorted does not reset the sort direction
  4. Typing in the All Fields search box does not fire CRM keyboard shortcuts (`keypress` suppression active alongside existing `keydown`/`keyup`); search results update after a ~100ms debounce, not on every keystroke
**Plans**: TBD
**UI hint**: yes

### Phase 3: Settings UI + Security Hardening
**Goal**: Users can configure their CRM instance URLs, the popup warns when they are on an unconfigured page, and the extension's host permissions are scoped to Dynamics domains — all shipped atomically
**Depends on**: Phase 2
**Requirements**: SET-01, SET-02, SET-03, SEC-03
**Success Criteria** (what must be TRUE):
  1. Opening the extension options page allows a user to add and remove CRM instance URLs; the list persists across browser restarts and syncs across the user's Chrome instances
  2. Opening the popup on a tab whose URL does not match any configured CRM URL displays a warning banner with a direct link to the options page
  3. The extension only holds `host_permissions` for `*.dynamics.com`, `*.microsoftdynamics.com`, and `*.crm.dynamics.com` by default — `*://*/*` is gone from the manifest
  4. An on-prem CRM user who adds their domain in settings can run "All Fields" against that domain without a permission error
  5. If `chrome.scripting.executeScript` fails (e.g. permission denied on an unconfigured domain), the failure is caught and surfaced rather than silently swallowed
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Cleanup + CI | 0/? | Not started | - |
| 2. Content Script Hardening + Sort | 0/? | Not started | - |
| 3. Settings UI + Security Hardening | 0/? | Not started | - |

---

## Coverage Map

| Requirement | Phase | Category |
|-------------|-------|----------|
| CLEN-01 | Phase 1 | Cleanup |
| CLEN-02 | Phase 1 | Cleanup |
| CLEN-03 | Phase 1 | Cleanup |
| CLEN-04 | Phase 1 | Cleanup |
| CLEN-05 | Phase 1 | Cleanup |
| CLEN-06 | Phase 1 | Cleanup |
| CI-01 | Phase 1 | Quality |
| SEC-01 | Phase 1 | Security |
| SEC-02 | Phase 1 | Security |
| CSUX-01 | Phase 2 | Content Script UX |
| CSUX-02 | Phase 2 | Content Script UX |
| CSUX-03 | Phase 2 | Content Script UX |
| SET-01 | Phase 3 | Settings |
| SET-02 | Phase 3 | Settings |
| SET-03 | Phase 3 | Settings |
| SEC-03 | Phase 3 | Security |

**Total:** 16/16 ✓ — No orphaned requirements

---

## Key Constraints

- **Phase 3 is atomic**: SEC-03 (`host_permissions` scoping) MUST ship in the same change as SET-01 (options UI) and SET-02 (popup warning). Scoping permissions before the settings UI exists silently breaks all on-prem CRM users. Do not split.
- **`chrome.storage` stays in popup layer**: Content scripts run in `world: 'MAIN'` and cannot call `chrome.storage`. Settings reads belong in `popup.ts` only — never in `all-fields.ts`.
- **`background.ts` removal is two-place** (CLEN-04): `manifest.json` AND `build.js` must be updated in one commit; run `npm run clean` before verifying.
- **CSP format is MV3 nested-object** (SEC-01): `{ "extension_pages": "script-src 'self'; object-src 'self'" }` — not a flat MV2 string.

---

*Roadmap created: 2026-04-16*
*Milestone: Hardening*
