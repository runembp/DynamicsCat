# Quick Task: Exclude Advanced Find popup from ribbon-toolbar injection

**ID:** 260420-bdi  
**Date:** 2026-04-20

## Problem

When the user opens Advanced Find in Dynamics CRM 2016, Chrome hangs indefinitely.  
Root cause: `ribbon-toolbar.ts` is injected into the Advanced Find popup window because `isCrmPage()` matches `body[scroll=no]`, which that window also has. The `MutationObserver` with `childList: true, subtree: true` on `document.body` fires constantly as Advanced Find dynamically loads its content, causing excessive DOM querying and hanging the browser.

## Fix

Modify `isCrmPage()` in `src/content/ribbon-toolbar.ts` to exclude known CRM dialog/popup pages that do not have (and will never have) `#navBar`:

- Check `window.location.pathname` and `window.location.search` for `advancedfind`
- This covers both `/advancedfind/advfind.aspx` and `?pagetype=advancedfind` URL patterns

## Tasks

1. Edit `src/content/ribbon-toolbar.ts`: add URL guard to `isCrmPage()` excluding `advancedfind` paths
2. Build and verify no TypeScript/lint errors
3. Commit
