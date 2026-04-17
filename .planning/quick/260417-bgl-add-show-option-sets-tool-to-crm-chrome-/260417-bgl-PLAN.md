---
phase: quick/260417-bgl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/option-sets.ts
  - src/content/option-sets.css
  - src/popup/popup.html
  - src/popup/popup.ts
  - build.js
autonomous: true
requirements: [QUICK-260417-BGL]

must_haves:
  truths:
    - "Popup shows a 🔘 Show Option Sets button"
    - "Clicking the button injects the content script into all CRM form frames"
    - "Panel appears showing only optionset/multiselectoptionset attributes"
    - "Each row shows: Label, Schema Name, Current Value (selected text), All Options list"
    - "Search bar filters rows by label or schema name"
    - "Clicking the button again closes the panel (toggle)"
    - "Panel is visually consistent with the All Fields panel"
  artifacts:
    - path: "src/content/option-sets.ts"
      provides: "Content script — option sets panel"
    - path: "src/content/option-sets.css"
      provides: "Panel CSS scoped to #crm-tools-optionsets-panel"
    - path: "src/popup/popup.html"
      provides: "Button #btn-show-option-sets"
    - path: "src/popup/popup.ts"
      provides: "Click handler injecting content/option-sets.js"
    - path: "build.js"
      provides: "esbuild entry point + CSS copyStatics entry"
  key_links:
    - from: "src/popup/popup.ts"
      to: "dist/content/option-sets.js"
      via: "chrome.scripting.executeScript files array"
    - from: "src/content/option-sets.ts"
      to: "Xrm.Page.data.entity.attributes"
      via: "getAttributeType() filter + getOptions() call"
---

<objective>
Add a "Show Option Sets" tool to the CRM Chrome extension popup.

Purpose: Lets developers instantly see all option set fields on a CRM form — field labels, schema names, current selected value, and the full list of available options — without opening DevTools.

Output:
- `src/content/option-sets.ts` — injected content script, mirrors all-fields.ts toggle/style conventions
- `src/content/option-sets.css` — panel CSS scoped under `#crm-tools-optionsets-panel`
- Updated `popup.html`, `popup.ts`, `build.js`
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/content/all-fields.ts
@src/popup/popup.ts
@src/popup/popup.html
@build.js

<interfaces>
<!-- Key patterns extracted from all-fields.ts — follow these exactly. -->

Toggle pattern (check for existing panel, remove + return if found):
```typescript
const PANEL_ID = 'crm-tools-optionsets-panel';
const STYLE_ID = 'crm-tools-optionsets-style';
const existing = document.getElementById(PANEL_ID);
if (existing) { existing.remove(); return; }
```

Xrm guard:
```typescript
if (typeof Xrm === 'undefined' || !Xrm.Page) return;
```

Label map build:
```typescript
const labelMap: Record<string, string> = {};
Xrm.Page.ui.controls.forEach((ctrl) => {
  const name = ctrl.getName();
  if (name) {
    try { labelMap[name] = (ctrl as Xrm.Controls.StandardControl).getLabel() || name; }
    catch { labelMap[name] = name; }
  }
});
```

Option set type filter:
```typescript
const attrs = Xrm.Page.data.entity.attributes.get().filter(
  (a) => a.getAttributeType() === 'optionset' || a.getAttributeType() === 'multiselectoptionset'
);
```

getOptions() call:
```typescript
const options = (attr as Xrm.Attributes.OptionSetAttribute).getOptions();
// returns Array<{ text: string; value: number }>
```

getText() for current value:
```typescript
const currentText = (attr as Xrm.Attributes.OptionSetAttribute).getText?.() ?? null;
```

Keyboard event guard (copy verbatim):
```typescript
searchInput.addEventListener('keydown', (e) => e.stopPropagation());
searchInput.addEventListener('keyup',   (e) => e.stopPropagation());
```

Popup injection pattern (copy all-fields handler, change file name):
```typescript
document.getElementById('btn-show-option-sets')!.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id!, allFrames: true },
      files: ['content/option-sets.js'],
      world: 'MAIN',
    });
  });
});
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create option-sets content script and CSS</name>
  <files>src/content/option-sets.ts, src/content/option-sets.css</files>
  <action>
Create `src/content/option-sets.ts` following the exact same structure as `all-fields.ts`:

1. **Constants:** `PANEL_ID = 'crm-tools-optionsets-panel'`, `STYLE_ID = 'crm-tools-optionsets-style'`

2. **`main()` function:**
   - Toggle: check `document.getElementById(PANEL_ID)`, remove + return if found
   - Guard: `typeof Xrm === 'undefined' || !Xrm.Page` → return
   - Build `labelMap` from `Xrm.Page.ui.controls` (same pattern as all-fields.ts)
   - Filter attributes: `Xrm.Page.data.entity.attributes.get().filter(a => a.getAttributeType() === 'optionset' || a.getAttributeType() === 'multiselectoptionset')`
   - Sort by label (same localeCompare sort as all-fields.ts)
   - Call `injectStyles()` then `buildPanel(attrs, labelMap)`

3. **`injectStyles()` function:**
   - Guard: `if (document.getElementById(STYLE_ID)) return;`
   - Inject inline `<style>` with content mirroring all-fields.css visual style but scoped to `#crm-tools-optionsets-panel` and CSS class prefix `cop-` (instead of `cfp-`)
   - Styles needed: same panel layout (fixed, right edge, full height, blue border/header), header, subheader, close button, search bar, table (thead sticky, zebra rows, hover), `.cop-null`, `.cop-no-results`, `.cop-options-list` (small grey text list of all options)

4. **`buildPanel(attrs, labelMap)` function:**
   - Create panel div with `id = PANEL_ID`
   - Header: title `🔘 Option Sets`, close button (removes panel), same `cop-header` / `cop-header-title` / `cop-close` class naming
   - Subheader: `Entity: ${entityName}  |  ID: ${entityId || '(new record)'}  |  ${attrs.length} option set field(s)`
   - Search bar: input with `placeholder="Search by label or schema name…"`, attach `keydown`/`keyup` `stopPropagation`, attach `input` filter handler
   - Scrollable body with table: thead columns = `Label | Schema Name | Current Value | All Options`
   - For each attr (already sorted):
     - `name = attr.getName()`, `label = labelMap[name] || name`
     - `currentText = (attr as Xrm.Attributes.OptionSetAttribute).getText?.() ?? null`
     - `options = (attr as Xrm.Attributes.OptionSetAttribute).getOptions()` — catch errors, default to `[]`
     - Render row: tdLabel, tdSchema (monospace), tdCurrentValue (null-styled if null), tdOptions
     - tdOptions: render a `<ul class="cop-options-list">` with one `<li>` per option: `${option.value}: ${option.text}`
     - Set `tr.dataset.searchLabel` and `tr.dataset.searchSchema` for search filtering
   - Search filter: on `input`, match `q` against `searchLabel` and `searchSchema` dataset, hide non-matching rows, show `.cop-no-results` if zero visible
   - Auto-size panel width using `requestAnimationFrame` (same pattern as all-fields.ts)
   - `document.body.appendChild(panel)`

5. **Call `main()` at bottom of file**

---

Create `src/content/option-sets.css` as an empty file (styles are injected inline; the CSS file is copied to dist to satisfy `copyStatics()` and keep the build consistent with `all-fields.css`). Add a single comment:
```css
/* Styles for option-sets panel are injected inline by option-sets.ts */
```
  </action>
  <verify>
    <automated>node build.js 2>&1 | Select-String -Pattern "error|Error" -NotMatch | Select-Object -Last 5; node build.js 2>&1 | Select-String "error" -CaseSensitive</automated>
  </verify>
  <done>
    - `src/content/option-sets.ts` exists with `main()`, `injectStyles()`, `buildPanel()` functions and `main()` call at bottom
    - `src/content/option-sets.css` exists (even if just a comment)
    - `npm run build` (or `node build.js`) produces `dist/content/option-sets.js` without TypeScript/esbuild errors (after Task 2 wires the entry point)
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire popup button and build config</name>
  <files>src/popup/popup.html, src/popup/popup.ts, build.js</files>
  <action>
**`src/popup/popup.html`** — add button after the `btn-all-fields` button, inside the same `<section class="tool-group">`:
```html
<button id="btn-show-option-sets" class="tool-btn">
  🔘 Show Option Sets
</button>
```

**`src/popup/popup.ts`** — add click listener inside the existing `DOMContentLoaded` callback, after the `btn-all-fields` handler:
```typescript
document.getElementById('btn-show-option-sets')!.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id!, allFrames: true },
      files: ['content/option-sets.js'],
      world: 'MAIN',
    });
  });
});
```

**`build.js`** — two changes:

1. Add entry point to the `entryPoints` object (after `'content/all-fields'`):
```js
'content/option-sets': 'src/content/option-sets.ts',
```

2. Add CSS copy in `copyStatics()` (after the `all-fields.css` line):
```js
copyFileSync('src/content/option-sets.css', 'dist/content/option-sets.css');
```
  </action>
  <verify>
    <automated>node build.js; Test-Path dist/content/option-sets.js; Test-Path dist/content/option-sets.css</automated>
  </verify>
  <done>
    - `popup.html` has `<button id="btn-show-option-sets" class="tool-btn">🔘 Show Option Sets</button>` after the All Fields button
    - `popup.ts` has a click handler for `btn-show-option-sets` injecting `content/option-sets.js` with `world: 'MAIN'` and `allFrames: true`
    - `build.js` has `'content/option-sets': 'src/content/option-sets.ts'` in `entryPoints` and the CSS copy in `copyStatics()`
    - `node build.js` completes without errors
    - `dist/content/option-sets.js` exists
    - `dist/content/option-sets.css` exists
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Injected script → CRM DOM | Content script runs in MAIN world; reads Xrm data from the page |
| Popup → chrome.scripting | Popup triggers injection; no user data crosses this boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-bgl-01 | Information Disclosure | option-sets.ts reads all option set values | accept | Data stays within the same browser tab/frame; no exfiltration path; user explicitly triggers injection |
| T-bgl-02| Tampering | Injected panel DOM manipulated by page JS | accept | Panel is for developer use on trusted CRM instance; risk/reward of hardening is not justified |
| T-bgl-03 | Denial of Service | `getOptions()` throws on malformed attribute | mitigate | Wrap `getOptions()` in try/catch, default to `[]`; handled in Task 1 action |
</threat_model>

<verification>
After both tasks complete:

1. `node build.js` exits 0 with no TypeScript or esbuild errors
2. `dist/content/option-sets.js` exists and is non-empty
3. `dist/popup/popup.html` contains `btn-show-option-sets`
4. Load the unpacked extension in Chrome (`chrome://extensions` → Load unpacked → `dist/`)
5. Open a Dynamics CRM 2016 form
6. Click the extension icon → popup shows "🔘 Show Option Sets" button
7. Click it → panel appears on the right with only optionset/multiselectoptionset rows
8. Each row shows Label, Schema Name, Current Value, and an options list
9. Type in the search box → rows filter by label/schema name
10. Click the button again → panel closes (toggle)
</verification>

<success_criteria>
- Build succeeds: `node build.js` exits 0
- `dist/content/option-sets.js` and `dist/content/option-sets.css` exist
- Popup HTML has the new button
- Panel toggle works (open / close on repeated clicks)
- Panel shows only option set fields with correct columns
- Search filters by label and schema name
- Visual style matches All Fields panel
</success_criteria>

<output>
After completion, create `.planning/quick/260417-bgl-add-show-option-sets-tool-to-crm-chrome-/260417-bgl-SUMMARY.md` with what was built, files changed, and any deviations from the plan.
</output>
