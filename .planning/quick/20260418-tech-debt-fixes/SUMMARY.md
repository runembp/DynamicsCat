---
slug: tech-debt-fixes
date: 2026-04-18
status: complete
commit: 10ee030
---

# Summary: Tech debt fixes from CONCERNS.md

## What was done
- **`src/popup/popup.ts`** — Replaced all `!` non-null DOM assertions with a
  `bindButton()` helper that null-checks and logs a descriptive error if an
  element is missing. Extracted `injectScript()` to remove duplication.
- **`build.js`** — Added `await runLint()` to the one-shot build path so lint
  runs on every `npm run build`. Removed the dead `all-fields.css` copy
  (never injected; inline styles are the single source of truth).
- **`package.json`** — Added `clean` script using Node.js `fs.rmSync` (no
  extra dependency needed).
