---
slug: search-debounce
date: 2026-04-18
status: complete
commit: 8f0a0f7
---

# Summary: Debounce search input in all-fields panel

## What was done
Added a typed `debounce<T>()` helper at the top of `all-fields.ts` and wrapped
the search `input` event handler with a 100ms delay. Eliminates synchronous
DOM style recalculations on every keystroke — critical for entities with
300+ attributes where the previous approach caused noticeable lag.
