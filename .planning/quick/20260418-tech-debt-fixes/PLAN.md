---
slug: tech-debt-fixes
date: 2026-04-18
status: in-progress
---

# Quick Task: Tech debt fixes from CONCERNS.md

## Goal
Address all actionable tech debt items from .planning/codebase/CONCERNS.md:

1. Remove dead `all-fields.css` from build (never injected, diverges from inline styles)
2. Replace `!` non-null assertions in `popup.ts` with null guards
3. Fix `build.js` one-shot build to also run lint (currently only watch mode does)
4. Add `clean` npm script (`rimraf dist`)

Note: background.ts concern is already resolved (has real message listener).
README + hello-world concerns fixed in prior quick tasks.

## Files
- `build.js`
- `src/popup/popup.ts`
- `package.json`
