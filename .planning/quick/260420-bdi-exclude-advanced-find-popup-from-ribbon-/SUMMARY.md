---
status: complete
---

# Quick Task Summary: Exclude Advanced Find popup from ribbon-toolbar injection

**ID:** 260420-bdi  
**Commit:** 9b31ef2

## What was done

Added URL guard to `isCrmPage()` in `src/content/ribbon-toolbar.ts`. When `window.location.pathname` or `window.location.search` contains `advancedfind`, the function returns `false` — skipping toolbar injection and the MutationObserver entirely.

## Result

Advanced Find popup no longer triggers the content script. Browser hang resolved.
