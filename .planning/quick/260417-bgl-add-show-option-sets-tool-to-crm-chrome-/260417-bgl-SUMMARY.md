---
phase: quick/260417-bgl
plan: "01"
subsystem: crm-chrome-extension
tags: [content-script, popup, option-sets, xrm]
dependency_graph:
  requires: []
  provides: [option-sets-panel, popup-button]
  affects: [popup.html, popup.ts, build.js, all-fields.ts]
tech_stack:
  added: []
  patterns: [xrm-content-script, iife-injection, toggle-panel, inline-styles]
key_files:
  created:
    - src/content/option-sets.ts
    - src/content/option-sets.css
  modified:
    - src/popup/popup.html
    - src/popup/popup.ts
    - build.js
    - src/content/all-fields.ts
decisions:
  - "Added export {} to both content scripts to isolate top-level declarations from TypeScript's global-script merging"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-26"
  tasks_completed: 2
  files_changed: 6
---

# Phase quick/260417-bgl Plan 01: Add Show Option Sets Tool — Summary

**One-liner:** Toggleable CRM option-sets inspector panel injected via popup button, showing label, schema name, current value, and full options list for all optionset/multiselectoptionset fields.

## What Was Built

- **`src/content/option-sets.ts`** — Content script injected into all CRM form frames. Implements a toggle panel (`PANEL_ID = 'crm-tools-optionsets-panel'`) filtered to `optionset`/`multiselectoptionset` attributes. Columns: Label, Schema Name, Current Value (null-styled when null), All Options (`value: text` list). Search bar filters by label and schema name. Inline styles scoped under `#crm-tools-optionsets-panel` with `cop-` class prefix. `getOptions()` wrapped in try/catch, defaults to `[]` (T-bgl-03 mitigation). Auto-sizes panel width via `requestAnimationFrame`.

- **`src/content/option-sets.css`** — Stub file with a single comment; styles are injected inline by the TS file. Copied to `dist/content/` by `copyStatics()`.

- **`src/popup/popup.html`** — Added `<button id="btn-show-option-sets" class="tool-btn">🔘 Show Option Sets</button>` after the All Fields button in the `tool-group` section.

- **`src/popup/popup.ts`** — Added click handler for `btn-show-option-sets` injecting `content/option-sets.js` with `allFrames: true` and `world: 'MAIN'`.

- **`build.js`** — Added `'content/option-sets': 'src/content/option-sets.ts'` entry point and `copyFileSync('src/content/option-sets.css', 'dist/content/option-sets.css')` in `copyStatics()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `export {}` to module-isolate content scripts**

- **Found during:** Task 1 verification (`npm run check`)
- **Issue:** TypeScript treats `.ts` files without any `import`/`export` as "script" files. When `option-sets.ts` was added alongside `all-fields.ts`, TypeScript merged their global scopes and reported 10 "Cannot redeclare" / "Duplicate function implementation" errors for `PANEL_ID`, `STYLE_ID`, `main`, `injectStyles`, `buildPanel`.
- **Fix:** Added `export {};` at the top of both `src/content/option-sets.ts` and `src/content/all-fields.ts`. This makes each file a proper ES module with its own scope. esbuild's IIFE bundling is unaffected — it processes each entry point independently regardless.
- **Files modified:** `src/content/option-sets.ts`, `src/content/all-fields.ts`
- **Commit:** 905c8fd

## Known Stubs

None — no hardcoded data, placeholder text, or unwired props.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. Threat model dispositions from the plan:
- **T-bgl-01** (option values read): accepted — data stays within the browser tab.
- **T-bgl-02** (panel DOM tampering): accepted — developer tool on trusted CRM instance.
- **T-bgl-03** (`getOptions()` throws): mitigated — `try/catch` defaults to `[]` ✅

## Self-Check

| Item | Status |
|------|--------|
| `src/content/option-sets.ts` | ✅ exists |
| `src/content/option-sets.css` | ✅ exists |
| `dist/content/option-sets.js` | ✅ exists (6.4kb) |
| `dist/content/option-sets.css` | ✅ exists |
| `dist/popup/popup.html` contains `btn-show-option-sets` | ✅ confirmed |
| `npm run check` (typecheck + lint) | ✅ exits 0 |
| `node build.js` | ✅ exits 0 |
| Commit f2b48a5 | ✅ task 1 |
| Commit 905c8fd | ✅ task 2 |

## Self-Check: PASSED
