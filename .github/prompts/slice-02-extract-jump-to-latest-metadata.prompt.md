---
mode: agent
description: "Extract shared Jump to Latest entity metadata/cache logic into the Jump to Latest slice."
---

## Task

Deduplicate entity metadata/cache logic currently repeated in:

- `src/content/jump-to-latest/jump-to-latest.ts`
- `src/content/jump-to-latest/jump-to-latest-quick.ts`
- `src/content/prefetch-entities/prefetch-entities.ts`

Move shared symbols into a flat Jump to Latest slice module: cache keys, TTL, `EntityMeta`, `EntityCache`, CRM API version resolution, display-name resolution, cache read/write/validation, metadata fetch/sort. Re-point all three scripts to the shared module while preserving behavior.

## Target structure

```text
src/content/jump-to-latest/
├── JumpToLatestMetadata.ts
├── jump-to-latest.ts
├── jump-to-latest-quick.ts
└── jump-to-latest.css
```

## Constraints

- Only modify code related to this specific extraction.
- Keep Chrome extension entry points unchanged in `build.js`.
- Preserve existing localStorage key names.
- Keep public keyboard shortcut behavior unchanged.
- Keep the slice folder flat.
- Prefix every file in the slice with the feature name.
- Do not add a framework or new build tooling.

## Verification

```bash
npm run check
npm run build
```
