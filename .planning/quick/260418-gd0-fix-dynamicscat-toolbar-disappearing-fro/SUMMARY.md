---
status: complete
---

# Summary: Fix DynamicsCat toolbar disappearing from CRM ribbon

**Quick task:** 260418-gd0  
**Date:** 2026-04-18  
**Commit:** 21dabd9

## What was done

Fixed `ribbon-toolbar.ts`: changed `startObserver()` to observe `document.body` instead of `document.getElementById('crmMasthead')`.

## Root cause

When CRM SPA navigation *replaces* the `#crmMasthead` element entirely, the `MutationObserver` attached to it becomes stale — it watches a detached DOM node and never fires again. The toolbar button would disappear and never be re-injected.

## Fix

One-line change in `startObserver()`:
```diff
-const root = document.getElementById('crmMasthead') ?? document.body;
+// Observe document.body (never replaced) rather than #crmMasthead
+const root = document.body;
```

`document.body` is permanently stable during the page lifetime, so the observer survives any element replacement that CRM performs during navigation.

## Verification

- `npm run build` passed (TypeScript + ESLint: no errors)
- `dist/content/ribbon-toolbar.js` rebuilt (3.6kb)
