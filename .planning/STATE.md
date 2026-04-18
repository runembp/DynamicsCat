# State: CRM Chrome Tools — Hardening Milestone

## Project Reference

**Core Value:** Instant visibility into all CRM field values on any form, without opening DevTools or the CRM field editor.
**Milestone:** Hardening
**Goal:** Remove scaffold tech debt, tighten security posture, and deliver four user-facing capabilities: error feedback, interactive sort, CRM URL settings, and CI automation.

---

## Current Position

**Phase:** 1 — Foundation Cleanup + CI
**Plan:** None started
**Status:** Not started
**Last action:** Roadmap created

```
Progress: [ Phase 1 ] [ Phase 2 ] [ Phase 3 ]
            ░░░░░░░░    ░░░░░░░░    ░░░░░░░░
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 3 |
| Phases complete | 0 |
| Requirements total (v1) | 16 |
| Requirements complete | 0 |
| Plans complete | 0 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| 3 coarse phases | Granularity set to coarse; requirements cluster naturally into 3 coherent delivery boundaries |
| Phase 3 ships atomically | SEC-03 (host_permissions scoping) cannot precede SET-01/SET-02 (settings UI + popup warning) — on-prem users would be silently broken |
| Settings in popup layer only | Content scripts run in `world: 'MAIN'` — `chrome.storage` is inaccessible from `all-fields.ts`; all settings reads stay in `popup.ts` |
| Options UI as separate tab | Popup is 260px wide — unsuitable for a URL list editor; `options_ui` with `open_in_tab: true` is correct |
| `rimraf@^6.1.3` only new dependency | ESM-native v6 required for `"type": "module"` project setup |

### Critical Pitfalls (from research)

1. **Background removal is two-place** — `manifest.json` + `build.js` must change together; run `npm run clean` after
2. **CSP must use MV3 nested-object format** — flat string causes Chrome to reject the manifest entirely
3. **`chrome.storage` never in `all-fields.ts`** — MAIN world throws `TypeError`; TypeScript won't catch it
4. **`host_permissions` scoping before settings UI** — silently breaks on-prem users; `.catch()` must exist first
5. **`!` assertions must be replaced before scaffold removal** — deleting the hello-world button before removing its listener crashes the entire `DOMContentLoaded` callback

### Architecture Notes

- **Two-layer system:** popup layer (full `chrome.*` API) + content script layer (MAIN world, DOM + Xrm, no `chrome.*`)
- **Injection:** `chrome.scripting.executeScript({ world: 'MAIN', allFrames: true })` — unchanged throughout milestone
- **Settings flow:** options.html → `chrome.storage.sync.set` → popup.ts reads on open → URL comparison → warning banner
- **Error feedback:** `all-fields.ts` → `buildErrorPanel()` → DOM append (no message channel)
- **New build entry needed:** `src/options/options.ts` must be registered in `build.js` and `eslint.config.js` (Phase 3)

### Todos

- [ ] Verify `rimraf@^6.1.3` added to devDependencies in Phase 1
- [ ] Confirm `.catch()` on `executeScript` lands before any `host_permissions` narrowing in Phase 3
- [ ] Confirm `optional_host_permissions` included in Phase 3 manifest changes for on-prem users

### Blockers

None.

---

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Add Show Option Sets tool to extension popup | 2026-04-17 | 905c8fd | .planning/quick/260417-bgl-add-show-option-sets-tool-to-crm-chrome- |
| 2 | Auto-injected CRM ribbon toolbar + remove Hello World | 2026-04-17 | d5029cb | .planning/quick/260417-c2p-inject-crm-ribbon-toolbar-with-all-field |
| 3 | Ribbon toolbar redesign: DOM inject + toggle dropdown + C icon | 2026-04-17 | 68e252d | .planning/quick/260417-cfm-redesign-ribbon-toolbar-inject-into-crm- |
| 4 | Fix ribbon: inject into crmMasthead as navTabButton, fix dropdown z-index | 2026-04-17 | 3660cd3 | .planning/quick/260417-cvx-fix-ribbon-toolbar-inject-into-crmmasthe |
| 5 | Remove hardcoded domain (vlpadr.net) from version control | 2026-04-18 | dcfe904 | .planning/quick/20260418-remove-hardcoded-domain |

---

## Session Continuity

### To resume work:
1. Run `cat .planning/ROADMAP.md` to see phase structure and success criteria
2. Run `cat .planning/REQUIREMENTS.md` to see requirement status
3. Current phase: **Phase 1** — start with `/gsd-plan-phase 1`

### Phase transition checklist:
- Update REQUIREMENTS.md: mark completed requirements with phase reference
- Update this STATE.md: advance Current Position, update metrics
- Update PROJECT.md: move completed items from Active to Validated
- Check Key Constraints in ROADMAP.md before starting Phase 3

---

*State initialized: 2026-04-16*
*Milestone: Hardening*
