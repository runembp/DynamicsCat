---
phase: quick
plan: 260417-c2p
subsystem: content-scripts, background, popup
tags: [ribbon-toolbar, content-script, message-routing, scaffold-removal]
dependency_graph:
  requires: []
  provides: [auto-injected-crm-toolbar, background-message-routing]
  affects: [popup, background, manifest, build]
tech_stack:
  added: []
  patterns: [chrome.runtime.sendMessage, chrome.runtime.onMessage, chrome.scripting.executeScript, inline-style-injection, idempotent-dom-insertion]
key_files:
  created:
    - src/content/ribbon-toolbar.ts
  modified:
    - src/background.ts
    - manifest.json
    - build.js
    - src/popup/popup.html
    - src/popup/popup.ts
    - eslint.config.js
  deleted:
    - src/content/hello-world.ts
decisions:
  - ESLint argsIgnorePattern added globally so _sendResponse satisfies no-unused-vars without rule suppression comments
metrics:
  duration: ~10 minutes
  completed: 2026-04-17
  tasks_completed: 2
  files_changed: 7
---

# Quick Task 260417-c2p Summary

**One-liner:** Removed Hello World scaffold and added auto-injected floating CRM ribbon toolbar (ISOLATED world content script) routing All Fields / Option Sets injection through background service worker.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Remove Hello World scaffold (popup, build, ts file) | `1f48557` |
| 2 | Create ribbon-toolbar.ts + wire background + update manifest + fix ESLint | `d5029cb` |

## What Was Built

### Task 1 — Hello World Removal
- Deleted `btn-hello-world` button from `popup.html`
- Removed the corresponding `click` handler from `popup.ts`
- Removed `content/hello-world` entry from `build.js` entryPoints
- `git rm src/content/hello-world.ts` — deletion tracked in git

### Task 2 — Ribbon Toolbar
- **`src/content/ribbon-toolbar.ts`** — Auto-injected floating toolbar in the ISOLATED world. Runs at `document_idle` on `*://*.vlpadr.net/velliv*`. Contains `TOOLBAR_ID` idempotency guard, inline CSS injection with `STYLE_ID` guard, two buttons (📋 All Fields, 🔘 Option Sets) that fire `chrome.runtime.sendMessage`.
- **`src/background.ts`** — Replaced placeholder comment with `chrome.runtime.onMessage.addListener` routing `injectAllFields` → `content/all-fields.js` and `injectOptionSets` → `content/option-sets.js`, both with `allFrames: true` and `world: 'MAIN'`. `tabId` sourced from `sender.tab?.id` (trusted, not from payload).
- **`manifest.json`** — Added `content_scripts` array with match `*://*.vlpadr.net/velliv*`, `js: ["content/ribbon-toolbar.js"]`, `run_at: "document_idle"`. No `all_frames` (toolbar in top frame only).
- **`build.js`** — Added `'content/ribbon-toolbar': 'src/content/ribbon-toolbar.ts'` to entryPoints.
- **`eslint.config.js`** — Added global `@typescript-eslint/no-unused-vars` rule with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'` so `_sendResponse` passes lint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Config] ESLint argsIgnorePattern not configured**
- **Found during:** Task 2 — `npm run check` lint phase
- **Issue:** `_sendResponse` triggered `@typescript-eslint/no-unused-vars` error even with underscore prefix; `eslint.config.js` had no `argsIgnorePattern` configured
- **Fix:** Added global `@typescript-eslint/no-unused-vars` rule override with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'` in `eslint.config.js`
- **Files modified:** `eslint.config.js`
- **Commit:** `d5029cb`

## Verification Results

- ✅ `npm run check` — 0 TypeScript errors, 0 ESLint errors
- ✅ `node build.js` — exit 0, `dist/content/ribbon-toolbar.js` produced (1.9kb)
- ✅ `src/content/hello-world.ts` does not exist
- ✅ `manifest.json` contains `content_scripts` with match `*://*.vlpadr.net/velliv*`
- ✅ `src/background.ts` contains `onMessage.addListener` routing both actions
- ✅ Popup has 2 buttons (All Fields, Show Option Sets) — Hello World gone

## Known Stubs

None.

## Threat Flags

None — all new surface (content_scripts registration, onMessage routing) was covered by the plan's threat model (T-c2p-01, T-c2p-02, T-c2p-03).

## Self-Check: PASSED

- `src/content/ribbon-toolbar.ts` — FOUND
- `dist/content/ribbon-toolbar.js` — FOUND (produced by build)
- Commit `1f48557` — FOUND
- Commit `d5029cb` — FOUND
