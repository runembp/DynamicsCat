---
slug: search-debounce
date: 2026-04-18
status: in-progress
---

# Quick Task: Debounce search input in all-fields panel

## Goal
Add ~100ms debounce to the `input` event handler in `all-fields.ts` to avoid
synchronous DOM manipulation on every keystroke. Eliminates forced style
recalculations per keypress on entities with 300+ fields.

## Files
- `src/content/all-fields.ts`
