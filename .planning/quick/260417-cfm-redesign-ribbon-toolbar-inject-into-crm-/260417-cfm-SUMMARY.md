---
phase: 260417-cfm
plan: "01"
subsystem: content-script
tags: [toolbar, dom-injection, ribbon, chrome-extension, typescript]
one_liner: "DOM-injected 'C' toggle button at CRM ribbon far-left with dropdown for All Fields / Option Sets actions"
dependency_graph:
  requires: []
  provides: [ribbon-toolbar-injection]
  affects: [dist/content/ribbon-toolbar.js]
tech_stack:
  added: []
  patterns: [dom-injection, toggle-dropdown, click-outside-guard, idempotency-guard]
key_files:
  modified:
    - src/content/ribbon-toolbar.ts
decisions:
  - "Use display:none/block (not visibility) for dropdown so it takes no space when hidden"
  - "e.stopPropagation() on toggle click prevents same-click close by click-outside listener"
  - "RIBBON_SELECTORS tried in order; first match used for prepend()"
  - "Fallback to document.body.prepend + crt-fallback class triggers fixed-position CSS"
  - "Dropdown closes before sendMessage (UX: menu dismisses on tool selection)"
metrics:
  duration: ~5 minutes
  completed: 2025-04-26
  tasks_completed: 1
  files_modified: 1
---

# Phase 260417-cfm Plan 01: Rewrite Ribbon Toolbar Summary

**One-liner:** DOM-injected "C" toggle button at CRM ribbon far-left with dropdown for All Fields / Option Sets actions.

## What Was Done

Completely rewrote `src/content/ribbon-toolbar.ts` to replace the old fixed-position floating overlay (top-right `position: fixed` panel always visible) with a proper DOM-injected "C" toggle button that prepends into the CRM ribbon/command bar.

### Key changes vs. old implementation

| Aspect | Old | New |
|--------|-----|-----|
| Positioning | `position: fixed; top: 12px; right: 12px` always | Inline in ribbon via `prepend()`; fallback to `position: fixed; top: 6px; left: 6px` only when no selector matches |
| UI | All buttons always visible in floating panel | "C" toggle button; dropdown hidden by default |
| Ribbon targeting | None — always appended to `document.body` | 6 `RIBBON_SELECTORS` tried in order; first match used |
| Click-outside close | N/A | `document.addEventListener('click')` with `wrapper.contains(e.target)` guard |
| Dropdown toggle | N/A | `e.stopPropagation()` on "C" click prevents immediate close |
| Tool button UX | Opens action immediately | Closes dropdown first, then sends message |

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Rewrite ribbon-toolbar.ts with DOM injection | `68e252d` |

## Verification Results

- `npm run check` (tsc + eslint): ✅ exit 0, zero errors
- `node build.js`: ✅ exit 0, `dist/content/ribbon-toolbar.js` 2.9kb emitted
- `RIBBON_SELECTORS` array with 6 selectors: ✅ present
- Base wrapper uses `position: relative` (not `position: fixed`): ✅ confirmed
- `.crt-fallback` class applies `position: fixed; top: 6px; left: 6px`: ✅ confirmed
- Dropdown `display: none` default with toggle logic: ✅ confirmed
- `chrome.runtime.sendMessage({ action: 'injectAllFields' })` and `{ action: 'injectOptionSets' }`: ✅ preserved

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced beyond what the plan's threat model already covers.

## Self-Check: PASSED

- `src/content/ribbon-toolbar.ts` — present and updated ✅
- Commit `68e252d` — exists in git log ✅
