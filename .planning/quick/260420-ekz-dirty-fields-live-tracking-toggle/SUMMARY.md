---
status: complete
---

# Quick Task 260420-ekz: dirty-fields live tracking toggle

**Completed:** 2026-04-20
**Commit:** 3bfad6b

## Summary

Converted `dirty-fields.ts` from a one-shot snapshot tool to a live tracking toggle.

## Changes

- `src/content/dirty-fields/dirty-fields.ts` — replaced snapshot logic with `addOnChange`/`removeOnChange` subscription pattern
- Window globals renamed: `__dynamicsCatDirtyTracking`, `__dynamicsCatDirtyHandler`, `__dynamicsCatDirtyFields`
- Enable: subscribes to all attributes, highlights each field the moment it changes
- Disable: removes all handlers, clears highlights and state

## Verification

- `npm run check` — typecheck + lint: ✅ no errors
- `npm run build` — esbuild: ✅ clean, 2.0kb output
