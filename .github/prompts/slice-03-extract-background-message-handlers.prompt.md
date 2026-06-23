---
mode: agent
description: "Extract feature-specific background message handlers out of the service worker dispatcher."
---

## Task

Reduce feature-specific branching in `src/background.ts` by extracting message handlers for tool-specific dispatch paths:

- `injectOverrideReadonly`
- `injectFieldClick`
- `probeActivatable`
- `probeUserLanguage`

Keep `src/background.ts` as the service worker entry point and thin dispatcher. Move feature-specific handler functions into flat modules that match their owning slices or background role, then import and call them from `src/background.ts`.

## Target structure

```text
src/background.ts
src/content/override-readonly/OverrideReadonlyBackground.ts
src/content/field-click/FieldClickBackground.ts
src/content/activate-activity/ActivateActivityBackground.ts
src/content/change-user-language/SwitchLanguageBackground.ts
```

## Constraints

- Only modify code related to this specific extraction.
- Keep all `chrome.runtime` message action names unchanged.
- Keep all `chrome.scripting.executeScript` targets, `world`, and `allFrames` behavior unchanged.
- Keep public keyboard shortcut behavior unchanged.
- Keep slice folders flat.
- Prefix every file in each slice with the feature name.
- Do not add a framework or new build tooling.

## Verification

```bash
npm run check
npm run build
```
