---
task: 260417-cvx
subsystem: content-script
tags: [toolbar, injection, z-index, crmMasthead]
key-files:
  modified:
    - src/content/ribbon-toolbar.ts
decisions:
  - "Use position:fixed for dropdown appended to body to escape CRM ribbon stacking context"
  - "Mirror navTabButton/navTabButtonLink/navTabButtonImageContainer structure from crm-power-pane-button"
  - "Primary injection point #crmMasthead, fallback to #navBar, then body+crt-fallback"
---

# Quick Task 260417-cvx: Rewrite ribbon-toolbar — crmMasthead inject + z-index fix

**One-liner:** Rewrote ribbon-toolbar to inject as a `navTabButton` into `#crmMasthead` and moved dropdown to `document.body` with `position:fixed` to escape CRM ribbon stacking context.

## What Changed

### Injection point
- **Before:** Searched a list of generic ribbon selectors (`#RibbonContainer`, `.ms-crm-commandBar`, etc.)
- **After:** Targets `#crmMasthead` first (where the Power Pane button lives), falls back to `#navBar`, then `document.body` + `.crt-fallback`

### Button structure
- **Before:** Plain `<div id="crm-tools-ribbon-toolbar">` wrapping a `<button class="crt-toggle">`
- **After:** `<span class="navTabButton">` → `<a class="navTabButtonLink">` → `<span class="navTabButtonImageContainer">` → `<span class="crt-icon">C</span>` — mirrors the existing CRM Power Pane button exactly

### Dropdown z-index fix (core change)
- **Before:** `position: absolute` inside the wrapper div → inherits CRM ribbon stacking context → rendered under form content
- **After:** `position: fixed` appended directly to `document.body`, coordinates set from `wrapper.getBoundingClientRect()` on every open — fully escapes any ribbon stacking context, `z-index: 2147483647`

### Click-outside handler
- Updated to check both `wrapper.contains()` AND `dropdown.contains()` since dropdown is no longer a DOM child of wrapper

### Idempotency
- Stale detached dropdown cleanup added (`document.getElementById(DROPDOWN_ID)` → remove before rebuild)

### Styles
- Replaced old styles with spec'd scoped CSS: `.navTabButtonLink`, `.crt-icon`, `.crt-dropdown-btn`, `.crt-fallback`

## Verification

- `npm run check` (tsc + eslint): ✅ exit 0
- `node build.js`: ✅ exit 0 — `dist/content/ribbon-toolbar.js` 2.8kb

## Commit

- `3660cd3`: fix: inject into crmMasthead as navTabButton, fix dropdown z-index [260417-cvx]

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/content/ribbon-toolbar.ts` — modified ✅
- Commit `3660cd3` exists ✅
