---
slug: remove-hardcoded-domain
date: 2026-04-18
status: complete
commit: dcfe904
---

# Summary: Remove hardcoded domain from version control

## What was done

Removed `vlpadr.net` from source files tracked by git. The CRM ribbon toolbar
`content_scripts` match pattern is now supplied by a local, gitignored
`crm.config.json` file that is merged into the manifest at build time.

## Files changed

- **`manifest.json`** — Removed `content_scripts` block entirely
- **`build.js`** — `copyStatics()` now calls `generateManifest()` instead of
  `copyFileSync`. `generateManifest()` reads `manifest.json`, merges
  `crm.config.json` (if present), and writes the result to `dist/manifest.json`
- **`.gitignore`** — Added `crm.config.json`
- **`crm.config.example.json`** (new) — Committed template; copy to
  `crm.config.json` and replace placeholder URL to configure

## How to configure

```bash
cp crm.config.example.json crm.config.json
# Edit crm.config.json — replace the placeholder match with your real URL
npm run build
```

## Outcome

- `vlpadr.net` no longer appears in any committed file
- Build with `crm.config.json` present: injects `content_scripts` into `dist/manifest.json`
- Build without `crm.config.json`: extension still works via popup injection; logs a reminder
