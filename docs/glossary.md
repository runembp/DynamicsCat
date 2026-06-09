# Glossary

Domain terms used in this codebase.

| Term | Definition | Found in |
|------|-----------|----------|
| Xrm | The global JavaScript API exposed by Dynamics CRM on form pages. Provides access to attributes, controls, entity data, and page context. | All content scripts |
| Attribute | A data field on a CRM form, accessed via `Xrm.Page.data.entity.attributes`. Has a name, type, value, and dirty state. | `all-fields`, `option-sets`, `dirty-fields`, `shared.ts` |
| Control | A UI element on a CRM form (field input, sub-grid, web resource). Accessed via `Xrm.Page.ui.controls`. Controls can be shown/hidden. | `show-hidden-fields`, `shared.ts` |
| EntitySetName | The OData collection name for a CRM entity (e.g. `accounts` for the `account` entity). Required for Web API calls. | `open-on-api`, `jump-to-latest`, `activate-activity`, `prefetch-entities` |
| PrimaryIdAttribute | The schema name of the entity's primary key field (e.g. `accountid`). Used to select the ID column in OData queries. | `jump-to-latest`, `prefetch-entities` |
| statecode | A system field on CRM entities indicating active (0) or inactive/closed (non-zero) state. Used to determine if an activity can be reactivated. | `activate-activity`, `background.ts`, `popup.ts` |
| MAIN world | Chrome extension script injection context where the script runs in the page's own JavaScript context, giving access to page globals like `Xrm`. | `manifest.json`, `background.ts` |
| ISOLATED world | Chrome extension script injection context where the script runs in a sandboxed context. Cannot access page globals but can use `chrome.*` APIs. | `ribbon-toolbar` |
| Panel Shell | Reusable factory (`createPanelShell`) that builds the common container, header, close button, drag handle, and CSS isolation for feature panels. | `panel.ts`, `all-fields`, `option-sets`, `jump-to-latest` |
| Toggle pattern | Content scripts that check for their own panel ID on load — if present, remove it (toggle off); otherwise, create it (toggle on). | `all-fields`, `option-sets`, `show-hidden-fields`, `dirty-fields` |
| Toggle lock | A short-lived lock stored in the top-frame dataset to prevent multiple frames from executing the same toggle action when injected with `allFrames: true`. | `state.ts`, `show-hidden-fields` |
| Action | A registered tool in the `ACTIONS` array. Each action maps a name to a content script, label, icon, and optional conditional visibility. | `actions.ts` |
| ActionDef | TypeScript interface describing one tool entry: `action`, `file`, `label`, `icon`, `allFrames`, `popupBtnId`, `conditional`. | `actions.ts` |
| Conditional action | An action with a `conditional` property (e.g. `'activatable'`). The button is hidden by default and shown only after a runtime probe confirms it should appear. | `actions.ts`, `popup.ts`, `ribbon-toolbar` |
| Entity cache | localStorage-cached array of `EntityMeta` objects (all CRM entities with their display names and OData metadata). Shared between Prefetch Entities and Jump to Latest via `__dynamicscat_entity_cache`. | `prefetch-entities`, `jump-to-latest` |
| Dirty field | A form attribute whose value has been modified since the form was loaded. Detected via `getIsDirty()` or `onChange` subscription. | `dirty-fields` |
| Override Readonly | A toggle tool that intercepts modifier+click events to unlock readonly form fields via `setDisabled(false)`. The modifier key is configurable (default: Alt). | `override-readonly`, `background.ts`, `state.ts` |
| Unlock All Fields | A toggle tool that unlocks every disabled control on the form at once via `setDisabled(false)`, then re-locks exactly those fields on the next toggle. Triggered from popup/ribbon or Alt+U. | `unlock-all-fields`, `state.ts` |
| Field Click | A toggle tool that intercepts modifier+click events on form fields. Clicking a populated lookup field's value opens the referenced record in a background tab; clicking a field's label copies its logical name to the clipboard (with a toast). The modifier key is configurable (default: Ctrl). | `field-click`, `background.ts`, `state.ts` |
| Chrome commands | Chrome extension keyboard shortcuts registered in `manifest.json` under the `commands` key (Jump to Latest = Alt+O, Jump to Latest Quick = Alt+Shift+O, Show Hidden Fields = Alt+A, Unlock All Fields = Alt+U). Handled by `chrome.commands.onCommand` in the background worker. Users can customize them at `chrome://extensions/shortcuts`. | `manifest.json`, `background.ts` |
| Jump to Latest Quick | Headless (no-panel) variant of Jump to Latest. Reads last-used entity and preferences from localStorage, queries OData directly, and opens the result. Triggered via Alt+Shift+O keyboard shortcut. | `jump-to-latest-quick.ts`, `background.ts` |
| Shortcut config | User-configurable modifier key combinations (e.g. `alt`, `ctrl+shift`) stored in `chrome.storage.local` and injected into page context via dataset attributes. Used by Override Readonly and Field Click. | `background.ts`, `popup.ts`, `ribbon-toolbar`, `state.ts` |
| navBar | The CRM masthead navigation bar element (`#navBar`). The ribbon toolbar injects itself as the first child of this element. | `ribbon-toolbar` |
