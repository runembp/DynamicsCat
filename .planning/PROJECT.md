# CRM Chrome Tools

## What This Is

A Chrome Extension (Manifest V3) that injects developer tooling into Dynamics CRM 2016 pages. The primary tool — "All Fields" — renders a searchable, sortable side-panel overlay listing every CRM entity attribute (schema name, label, type, value) directly on the form. Intended for developers and power users debugging CRM form data.

## Core Value

Instant visibility into all CRM field values on any form, without opening DevTools or the CRM field editor.

## Requirements

### Validated

- ✓ Popup panel with tool buttons dispatching content scripts — existing
- ✓ All Fields tool: injects searchable field panel reading `Xrm.Page` attributes — existing
- ✓ Panel toggle: clicking All Fields again closes the panel — existing
- ✓ Keyboard input isolation: `stopPropagation` on search input — existing
- ✓ Multi-frame injection: runs in all CRM iframes, skips non-CRM frames — existing

### Active

<!-- Tech Debt -->
- [ ] README updated: correct `dist/` load path, current popup+button UX, Chrome version requirement documented
- [ ] `hello-world.ts` scaffold removed: content script, popup button, and `build.js` entry all deleted
- [ ] Orphan `dist/show-fields.*` files deleted; `clean` npm script added (`rimraf dist`)
- [ ] `background.ts` and service worker manifest entry removed (no background logic needed in MV3)
- [ ] `all-fields.css` dead file removed; inline `injectStyles()` remains as sole style source
- [ ] `npm run build` runs lint after bundling (not only in watch mode)

<!-- Security -->
- [ ] `host_permissions` scoped to Dynamics URL patterns (`*.dynamics.com`, `*.microsoftdynamics.com`, `*.crm.dynamics.com`)
- [ ] Explicit `content_security_policy` added to `manifest.json`
- [ ] Null guards replace `!` non-null assertions in `popup.ts`

<!-- Fragile / Performance -->
- [ ] `keypress` event suppression added to search input
- [ ] Search input debounced (~100ms)

<!-- Missing Critical Features -->
- [ ] User-facing error shown when `Xrm.Page` is unavailable (non-CRM page or unsupported form)
- [ ] Column sort on All Fields panel (click Label / Schema Name / Type / Value headers to re-sort)
- [ ] CRM URL restriction: settings UI for users to define their CRM instance URLs; popup shows hint when not on a configured CRM URL

<!-- Quality -->
- [ ] GitHub Actions CI workflow: runs `npm run check` on push/PR
- [ ] README documents `Xrm.Page` / CRM 2016 scope and `esbuild` `chrome120` target

### Out of Scope

- Automated unit/integration tests — CRM runtime required; Playwright against mock Xrm deferred to a later milestone
- Switching from inline CSS injection to `chrome.scripting.insertCSS` — inline approach is simpler and self-contained for injected scripts
- Virtual list for 300+ field tables — premature optimization at current scale
- `MAIN` world mitigation — architectural requirement; `Xrm` is only accessible in page context

## Context

Brownfield Chrome Extension with an existing working "All Fields" tool. The codebase has accumulated tech debt from its scaffold origin (hello-world button, stale README), plus security and UX gaps identified in a January 2025 codebase audit. The extension explicitly targets Dynamics CRM 2016 (`Xrm.Page` API); modern UCI forms using `executionContext.getFormContext()` are not in scope.

Key architectural constraints:
- Content scripts must run in `world: 'MAIN'` — required to access the `Xrm` global on the CRM page
- `allFrames: true` injection — required because CRM 2016 renders forms inside nested iframes
- No message passing between popup and content scripts — popup is fire-and-forget

## Constraints

- **Compatibility**: Targets Dynamics CRM 2016 `Xrm.Page` API — modern UCI `executionContext` pattern not applicable
- **Runtime**: Chrome 120+ (MV3, `iife` bundles targeting `chrome120`)
- **Arch**: Content scripts must run in `MAIN` world to access `Xrm` — cannot be isolated
- **Build**: esbuild + tsc strict; new entry points must be registered in `build.js` and `eslint.config.js`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep inline CSS injection, remove `all-fields.css` | Injected scripts cannot load external CSS files easily; inline is self-contained and already working | — Pending |
| Remove `background.ts` + service worker entry | No background logic required; empty stub adds noise and potential confusion | — Pending |
| Remove `hello-world` entirely (not gate behind flag) | No dev-only infrastructure exists; a flag would require new build complexity | — Pending |
| Scope `host_permissions` to known Dynamics domains | Reduces Chrome Web Store risk; add settings UI for custom on-prem domains | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initialization*
