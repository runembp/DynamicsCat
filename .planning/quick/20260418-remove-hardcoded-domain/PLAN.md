---
slug: remove-hardcoded-domain
date: 2026-04-18
status: in-progress
---

# Quick Task: Remove hardcoded domain from version control

## Goal
Remove `vlpadr.net` from `manifest.json` so it's no longer tracked in git.
Make the content_scripts match pattern configurable via a local, gitignored config file
that gets injected into the built manifest at build time.

## Tasks

1. Remove `content_scripts` from `manifest.json`
2. Create `crm.config.example.json` (committed) — template for users
3. Update `build.js` — generate dist/manifest.json from manifest.json + crm.config.json
4. Update `.gitignore` — add `crm.config.json`
5. Create user's `crm.config.json` (gitignored, local only)
6. Verify build succeeds and dist/manifest.json has correct content
7. Commit atomically

## Files changed

- `manifest.json`
- `build.js`
- `.gitignore`
- `crm.config.example.json` (new)
- `crm.config.json` (new, gitignored — not committed)
