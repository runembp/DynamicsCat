# Project Research Summary

**Project:** CRM Chrome Tools
**Domain:** Chrome Extension MV3 — Dynamics CRM 2016 developer tooling
**Researched:** 2026-04-16
**Confidence:** HIGH

---

## Executive Summary

CRM Chrome Tools is a Manifest V3 Chrome Extension that injects a developer overlay panel into Dynamics CRM 2016 pages. The working "All Fields" panel is already shipping, and this milestone focuses on hardening a brownfield codebase: removing scaffold tech debt, tightening security posture, and delivering the four features users need to trust the tool (error feedback, interactive sort, CRM URL settings, and CI). All research is HIGH confidence — the Chrome extension API is deterministic, verified via official documentation, and the codebase has been directly audited.

The recommended approach treats every change as additive to the existing TypeScript + esbuild pipeline. No new frameworks, no new bundler, no architectural surgery. The single new dependency is `rimraf` for clean builds. The most important architectural constraint — `world: 'MAIN'` injection required to access `window.Xrm` — is immovable and shapes every other decision: settings must be read in the popup layer, and all user feedback must be DOM-based rather than message-passing.

The primary risk is the interdependency between `host_permissions` scoping and the settings UI. Scoping permissions without a way for on-prem CRM users to add their domains is a silent breaking change for a large portion of the target audience. Research is unanimous: these two changes must ship together, with a `.catch()` on `executeScript` already in place before any permission narrowing. Secondary risks are all well-understood and preventable with the patterns documented in ARCHITECTURE.md and PITFALLS.md.

---

## Key Findings

### Recommended Stack

The existing stack is correct and should not change for this milestone. TypeScript `^5.7.0`, esbuild `^0.24.0`, and ESLint `^9.0.0` are all current and sufficient. The only addition is `rimraf@^6.1.3` as a devDependency for clean builds — its ESM-native v6 is required for the project's `"type": "module"` setup.

**Core technologies:**
- **TypeScript `^5.7.0`**: Typed language for all extension code — keep as-is; TS 6.x exists but is out of scope
- **esbuild `^0.24.0`**: Bundler producing IIFE bundles targeting `chrome120` — keep; IIFE format is safe for MV3 CSP (no eval)
- **ESLint `^9.0.0` + typescript-eslint `^8.0.0`**: Lint enforcement — keep; ESLint 10.x exists but 9.x is fully supported
- **rimraf `^6.1.3`** *(new)*: `npm run clean` to wipe `dist/` — ESM-native, idiomatic, one line in package.json
- **`chrome.storage.sync`** *(no new dep)*: Settings persistence that syncs across user's Chrome instances — correct choice for developer tool configuration; requires adding `"storage"` to manifest permissions
- **GitHub Actions `ubuntu-latest` + Node 20 LTS**: CI environment — single workflow file, no secrets, `npm ci` + `npm run check`

**Manifest changes required:**
- Add `"storage"` to `permissions`
- Scope `host_permissions` from `*://*/*` to specific Dynamics domains
- Add `content_security_policy.extension_pages: "default-src 'self'"` (MV3 nested-object format — NOT the MV2 flat string)
- Add `optional_host_permissions: ["https://*/*"]` for on-prem user custom domains

### Expected Features

**Must have (table stakes) — all four are in scope for this milestone:**
- **User-facing error when Xrm unavailable** — silent failure on non-CRM pages reads as broken extension; two-layer approach: popup URL banner (Layer A, depends on settings) + in-page error panel (Layer B, no deps)
- **Interactive column sort on All Fields table** — headers already look clickable; developers need to sort by schema name or type; vanilla DOM sort, no library needed
- **CRM URL restriction + settings UI** — `*://*/*` host_permissions is a Web Store compliance risk and UX gap; requires `options_ui` page + `chrome.storage.sync` + manifest scoping
- **GitHub Actions CI** — `npm run check` exists but runs manually only; one YAML file closes the gap

**Should have (differentiators — defer to future milestone):**
- Export fields to CSV/JSON — no external deps, but not milestone scope
- Copy single field value to clipboard — `navigator.clipboard.writeText`, low complexity
- Dirty field highlighting — requires capturing initial `Xrm.Page` attribute state at injection time

**Defer (v2+):**
- Automated Playwright tests against mock Xrm — CRM runtime required; premature
- Virtual list windowing for 300+ rows — CRM 2016 entities rarely exceed 150–200 attributes
- Multi-record comparison mode — requires cross-tab state; architectural mismatch

**Anti-features (never build):**
- React/Preact for settings UI — massively oversized for a URL list form
- `webextension-polyfill` — Chrome-only extension, no cross-browser requirement
- Auto-dismiss error panel with `setTimeout` — adds timing complexity; ✕ button is sufficient
- `unsafe-inline` in CSP — never; would require inline event handlers

### Architecture Approach

The architecture is a strict two-layer system: the **popup layer** (full `chrome.*` API access, extension context) and the **content script layer** (MAIN world, DOM + Xrm access, no `chrome.*` APIs). This boundary is immovable. Settings are read exclusively in the popup layer. User feedback from the content script is DOM-only. The new options page is a third extension-context component (full `chrome.*` access) opened via `chrome.runtime.openOptionsPage()`.

**Major components:**

1. **`popup.ts` (extended)** — Reads `chrome.storage.sync` on load, compares `tab.url` to known Dynamics patterns + stored custom URLs, shows warning banner if no match, dispatches `executeScript` with `.catch()` surfacing failures, adds ⚙ Settings button
2. **`all-fields.ts` (extended)** — Adds `buildErrorPanel()` for the top-frame Xrm-absent case; differentiates top-frame (show error) from sub-frame (silent skip) in `main()` guard block; existing sort-by-label becomes interactive with sort state tracking
3. **`src/options/` (new)** — `options.ts` + `options.html` + `options.css`; renders URL list editor; reads/writes `chrome.storage.sync.crmUrls`; registered as `options_ui` in manifest; new build entry in `build.js`

**Key data flows:**
- Settings write: `options.html` → `chrome.storage.sync.set({ crmUrls })` → popup reads on next open
- Settings read: `popup.ts` reads `chrome.storage.sync` → URL comparison → warning banner
- Error feedback: `all-fields.ts` → `buildErrorPanel()` → DOM append (no message channel needed)
- Injection: `popup.ts` → `chrome.scripting.executeScript({ world: 'MAIN', allFrames: true, files: [...] })` — unchanged

### Critical Pitfalls

1. **`chrome.storage` called from MAIN world `all-fields.ts`** — throws `TypeError` at runtime; TypeScript won't catch it; panel never appears. *Prevention: read all settings in `popup.ts`, never in `all-fields.ts`.*

2. **`host_permissions` scoped before settings UI ships** — silently breaks the extension for all on-prem CRM users (CRM 2016's primary audience); `executeScript` rejection is swallowed because `popup.ts` has no `.catch()`. *Prevention: add `.catch()` first, ship settings UI atomically with permission scoping.*

3. **`content_security_policy` using MV2 flat-string format** — Chrome rejects the manifest entirely; extension fails to load. *Prevention: always use the MV3 nested-object format `{ "extension_pages": "default-src 'self'" }`.*

4. **Two-place removal of `background.ts`** — removing from `manifest.json` without removing from `build.js` (or vice versa) causes Chrome load failure or dead artifact. *Prevention: edit root `manifest.json` + `build.js` in one commit; run `npm run clean` before verifying.*

5. **Non-null `!` assertions in `popup.ts` crash all buttons** — deleting `hello-world` from `popup.html` before removing its listener causes an uncaught `TypeError` that prevents the entire `DOMContentLoaded` callback from completing, breaking `btn-all-fields` as a side effect. *Prevention: replace `!` assertions with null guards before any scaffold removal.*

---

## Implications for Roadmap

Based on the combined research, the natural grouping is **three phases** that respect component boundaries, pitfall sequencing, and the atomic coupling of settings + host_permission scoping.

### Phase 1: Foundation Cleanup + CI
**Rationale:** Zero-risk changes that unblock everything else. CI must exist before any feature PR lands. Tech debt removal (scaffold, stale files, dead deps) eliminates confusing noise and prevents Pitfall 3 (two-place background removal) and Pitfall 5 (non-null assertion crash) from affecting feature work.
**Delivers:** Clean, well-typed codebase with automated CI catch-net; all stale artifacts gone; null-safe popup initialization
**Addresses:** README update, hello-world scaffold removal, orphan file cleanup, `background.ts` removal, `all-fields.css` dead file removal, null guards in `popup.ts`, `npm run build` lint fix, rimraf clean script, GitHub Actions CI
**Avoids:** Pitfall 3 (background removal atomicity), Pitfall 5 (non-null assertion crash), Pitfall 8 (stale dist artifacts)
**Research flag:** Standard patterns — no deeper research needed

### Phase 2: Content Script Hardening + Interactive Sort
**Rationale:** Isolated changes entirely within `all-fields.ts` and `popup.ts`; no new files, no manifest changes, no storage dependency. These can land in any order and are safe to parallelize in PRs. Sort re-uses existing `dataset` infrastructure. Error panel re-uses existing `injectStyles()` + `PANEL_ID` pattern.
**Delivers:** Interactive column sort (Label/Schema/Type/Value), user-visible error panel for non-CRM pages, search-debounce + keypress suppression polish
**Addresses:** Column sort feature, Layer B error panel (Xrm-absent top-frame), search input debounce (~100ms), `keypress` suppression
**Avoids:** The sort anti-pattern of rebuilding DOM on each sort (sort in-memory array, re-render preserving search state)
**Research flag:** Standard patterns — no deeper research needed

### Phase 3: Settings UI + Security Hardening (Atomic)
**Rationale:** These four changes are tightly coupled and MUST ship together or not at all. Scoping `host_permissions` without the settings UI breaks on-prem users (Pitfall 7). Layer A popup URL hint requires stored URLs to compare against. The CSP addition is a manifest-only change with no behavioral risk. All are security/compliance wins.
**Delivers:** CRM URL settings page, popup URL warning banner (Layer A), scoped `host_permissions`, explicit MV3 CSP, `"storage"` permission, `.catch()` on executeScript
**Addresses:** Settings UI (`src/options/`), `chrome.storage.sync` integration, `host_permissions` scoping to Dynamics domains, `optional_host_permissions` for on-prem, `content_security_policy` manifest key, Layer A popup banner
**Avoids:** Pitfall 1 (allFrames + activeTab boundary), Pitfall 2 (storage in MAIN world — settings stay in popup), Pitfall 4 (MV2 CSP flat-string format), Pitfall 7 (on-prem silent exclusion)
**Research flag:** Standard patterns — Chrome extension docs fully cover all patterns; no additional research needed

### Phase Ordering Rationale

- **Phase 1 first:** CI gating + null safety is the prerequisite for all PRs; scaffold removal is lowest-risk when no feature code exists yet to conflict
- **Phase 2 before Phase 3:** Error panel and sort are isolated; delivering them before the more complex settings work keeps PRs small and reviewable
- **Phase 3 atomic:** The ARCHITECTURE.md and PITFALLS.md research is unanimous — settings UI and `host_permissions` scoping are a coupled pair; splitting them across phases risks a broken intermediate state for on-prem users
- **`.catch()` added in Phase 3 before permission scoping:** Build manifest permission changes after the error surface is in place

### Research Flags

Phases with standard patterns (no additional research needed):
- **Phase 1:** Build tooling, CI, and TypeScript patterns are fully documented and ecosystem-standard
- **Phase 2:** DOM sort + error panel are vanilla DOM patterns; all code samples are already in FEATURES.md + ARCHITECTURE.md
- **Phase 3:** Chrome extension storage, options page, host_permissions, and CSP are all fully covered by official docs (verified HIGH confidence)

No phases require `/gsd-research-phase` deeper research before planning.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via npm registry and official docs on 2026-04-16; no speculation |
| Features | HIGH | Derived from direct codebase audit + Chrome extension API docs; well-matched to PROJECT.md requirements |
| Architecture | HIGH | Chrome extension isolation boundaries are deterministic; MAIN world API restrictions are binary — no ambiguity |
| Pitfalls | HIGH | All pitfalls are either directly observable in the codebase or represent documented Chrome API behavior |

**Overall confidence: HIGH**

### Gaps to Address

- **On-prem domain permissions UX:** Research recommends starting with Option B (popup hint + `.catch()` on executeScript failure) and adding `chrome.permissions.request()` (Option A) as a follow-up. The roadmap should decide whether Option A is in Phase 3 scope or a Phase 4 enhancement.
- **Options UI layout decision:** FEATURES.md recommends a dedicated `options_ui` page (`open_in_tab: true`); STACK.md recommends popup-embedded settings. These are in conflict. **Resolution: FEATURES.md wins** — the popup is 260px wide and unsuitable for a URL list editor; use `options_ui` as a separate tab. The roadmap should clarify this explicitly.
- **`npm run build` lint integration:** PROJECT.md lists this as an active requirement; STACK.md does not address it directly. It's a one-line change to `build.js` but should be in Phase 1 alongside the CI work.

---

## Sources

### Primary (HIGH confidence)
- `developer.chrome.com/docs/extensions/reference/api/storage` — storage API quotas, permission requirements, `sync` vs `local`
- `developer.chrome.com/docs/extensions/reference/api/scripting` — `executeScript` world/allFrames/func/files semantics
- `developer.chrome.com/docs/extensions/develop/concepts/content-scripts` — MAIN vs ISOLATED world API access
- `developer.chrome.com/docs/extensions/reference/manifest/content-security-policy` — MV3 nested-object CSP format
- `developer.chrome.com/docs/extensions/reference/api/permissions` — `optional_host_permissions` + `chrome.permissions.request()`
- `developer.chrome.com/docs/extensions/develop/ui/options-page` — `options_ui` vs `options_page` semantics
- `api.github.com/repos/actions/checkout` + `api.github.com/repos/actions/setup-node` — verified action versions
- `npmjs.com` — verified `rimraf@6.1.3`, TypeScript 6.0.2, ESLint 10.x, esbuild 0.28.0 on 2026-04-16

### Secondary (direct codebase audit)
- `src/popup/popup.ts`, `src/content/all-fields.ts`, `manifest.json`, `build.js` — runtime behavior, non-null assertions, missing `.catch()`, existing `dataset` attributes
- `.planning/codebase/CONCERNS.md` — stale orphan files, lint-in-build gap, tech debt inventory

---

*Research completed: 2026-04-16*
*Ready for roadmap: yes*
