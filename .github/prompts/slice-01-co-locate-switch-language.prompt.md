---
mode: agent
description: "Co-locate Switch language helpers with the Switch language slice."
---

## Task

Move Switch language-specific helper code from `src/user-languages.ts` into the `src/content/change-user-language/` slice. Update imports in:

- `src/content/change-user-language/change-user-language.ts`
- `src/popup/popup.ts`
- `src/ribbon/ribbon-toolbar/ribbon-toolbar.ts`
- `src/background.ts`

Remove `src/user-languages.ts` after its exports are fully moved. Keep behavior unchanged: popup/ribbon labels still render `Switch language: DK -> ENG` or `Switch language: ENG -> DK`, background `probeUserLanguage` still validates LCIDs, and the content script still switches between English LCID `1033` and Danish LCID `1030`.

## Target structure

```text
src/content/change-user-language/
├── SwitchLanguage.ts
└── change-user-language.ts
```

## Constraints

- Only modify code related to this specific extraction.
- Keep public Chrome runtime message action names unchanged.
- Keep the slice folder flat.
- Prefix every file in the slice with the feature name.
- Do not add a framework or new build tooling.

## Verification

```bash
npm run check
npm run build
```
