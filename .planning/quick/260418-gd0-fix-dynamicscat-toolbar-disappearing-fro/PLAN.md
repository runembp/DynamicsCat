# Quick Task: Fix DynamicsCat toolbar disappearing from CRM ribbon

**ID:** 260418-gd0  
**Date:** 2026-04-18

## Problem

The DynamicsCat toolbar button (`#crm-tools-ribbon-toolbar`) disappears from the CRM ribbon (`#navBar`) after SPA navigation within Dynamics CRM.

**Root cause:** `startObserver()` in `ribbon-toolbar.ts` attaches the `MutationObserver` to `document.getElementById('crmMasthead')`. When CRM's SPA navigation *replaces* the `#crmMasthead` element entirely (rather than modifying its contents), the observer is now watching a detached DOM node. It never fires again, so the toolbar is never re-injected.

Evidence: The CRM Power Pane extension button (`#crm-power-pane-button`) persists in the ribbon, suggesting that extension's injection is more robust (likely observes `document.body`).

## Fix

In `src/content/ribbon-toolbar.ts`, change `startObserver()` to observe `document.body` instead of `#crmMasthead`. `document.body` is always stable and cannot be replaced during page lifetime.

**Before:**
```typescript
const root = document.getElementById('crmMasthead') ?? document.body;
```

**After:**
```typescript
const root = document.body;
```

## Tasks

1. Edit `src/content/ribbon-toolbar.ts` — change observer root to `document.body`
2. Run `npm run build` to compile and verify no errors
3. Commit the fix

## Verification

- Build succeeds with no TypeScript or ESLint errors
- The `startObserver()` function now uses `document.body` as observer root
