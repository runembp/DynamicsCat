# Testing Patterns

**Analysis Date:** 2025-01-31

## Test Framework

**Runner:** None — no automated test suite exists.

**Assertion Library:** None.

**Test files:** None. No `*.test.*` or `*.spec.*` files are present anywhere in the project.

**Test-related dependencies:** None in `package.json` (no Jest, Vitest, Mocha, Playwright, etc.).

## Manual Testing Approach

This is a Chrome extension. All testing is done by loading the built extension in Chrome Developer Mode and exercising it against a live Dynamics CRM 2016 page.

### Setup: Load Extension in Chrome

```
1. Run: npm run build         (or npm run dev for inline sourcemaps)
2. Open Chrome → chrome://extensions/
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the dist/ directory
6. Extension appears in toolbar
```

For iterative development, use watch mode:
```bash
npm run watch    # Rebuilds + re-lints on every file save
```
After each rebuild, Chrome auto-reloads the extension. Click the refresh icon on `chrome://extensions/` if changes don't take effect.

### Test Matrix: What to Verify Manually

**Popup UI:**
- Click extension icon → popup appears (260px wide)
- Header shows icon + "CRM Chrome Tools" title in blue
- Two buttons visible: "👋 Hello World" and "📋 All Fields"
- Hover states apply (blue background + border on `.tool-btn`)

**Hello World tool:**
- Navigate to any page in a Chrome tab
- Open popup → click "👋 Hello World"
- Expected: `alert('Hello world')` appears on the active tab
- File: `dist/content/hello-world.js` injected via `chrome.scripting.executeScript`

**All Fields tool (requires Dynamics CRM 2016 page):**
- Navigate to a CRM form page (entity record with `Xrm.Page` available)
- Open popup → click "📋 All Fields"
- Expected: Side panel slides in from right edge of the CRM form frame
- Panel contents: entity name + record ID in subheader, sortable table of all attributes
- Columns: Label | Schema Name | Type | Value

**All Fields — specific checks:**
| Scenario | Expected |
|---|---|
| Click "All Fields" again while panel open | Panel closes (toggle behavior) |
| Non-CRM frame (no `Xrm.Page`) | Script silently skips (no panel, no error) |
| Type in search box | Table rows filter instantly by label, schema name, or value |
| No matching rows | "No matching fields." message appears |
| Click ✕ close button | Panel removes from DOM |
| Long schema names / values | Panel auto-sizes to fit, max 90vw |
| Lookup attribute | Value shows `name` or `id` of referenced record |
| OptionSet attribute | Value shows human-readable text label |
| DateTime attribute | Value shows `toLocaleString()` formatted date |
| Boolean attribute | Value shows "Yes" or "No" |
| Null attribute | Value shows italic grey "null" |
| Error reading value | Value shows "(error reading value)" |

### DevTools Debugging

Content scripts log diagnostic output to the **CRM frame's console**, not the popup console:
1. Open CRM form page
2. Open Chrome DevTools (F12)
3. In the console frame selector, switch to the CRM form iframe context
4. Trigger "All Fields" → look for `[CRM Tools]` prefixed log lines:

```
[CRM Tools] all-fields.ts running in: https://your-crm.example.com/...
[CRM Tools] Xrm available: true
[CRM Tools] Xrm.Page found! Reading attributes…
[CRM Tools] Entity: account — 47 attribute(s)
  [string] Account Name (name) = Contoso Ltd
  [lookup] Primary Contact (primarycontactid) = [...]
  ...
```

Popup script errors appear in the popup's DevTools:
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for errors

### Build Scripts as Quality Gates

No test runner exists, but two quality checks run as part of the build pipeline:

**Type checking:**
```bash
npm run typecheck    # tsc --noEmit — fails on any TypeScript error
```
Config: `tsconfig.json` with `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`

**Linting:**
```bash
npm run lint         # eslint src/ — reports rule violations
```
Config: `eslint.config.js` — typescript-eslint recommended rules

**Combined check (run before commits):**
```bash
npm run check        # npm run typecheck && npm run lint
```

**Watch mode also lints:**
In `npm run watch`, ESLint runs automatically after each successful esbuild rebuild (`build.js` lines 54–55):
```javascript
build.onEnd(async (result) => {
  copyStatics();
  if (result.errors.length === 0) await runLint();
});
```

### Build Modes

```bash
npm run build    # Production: minified, no sourcemaps → dist/
npm run dev      # Dev: not minified, inline sourcemaps → dist/
npm run watch    # Dev + file watcher + auto-lint
```

Output goes to `dist/` — this directory is what gets loaded as the unpacked extension.

### Static File Verification

After build, verify `dist/` contains all required extension files:

```
dist/
├── manifest.json
├── background.js
├── icons/
│   └── icon*.png
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── content/
    ├── hello-world.js
    ├── all-fields.js
    └── all-fields.css
```

Note: `all-fields.css` is copied to `dist/content/` by `build.js` but is **not currently injected** by `all-fields.ts` (the script injects its styles inline via a `<style>` tag instead). The CSS file is present for future use or manual linking.

## Test Coverage

**Automated:** None (0%).

**Manually testable:** All user-facing features (popup rendering, Hello World injection, All Fields panel, search/filter, close/toggle).

**Not easily testable without CRM access:** Any code path that uses `Xrm.Page` — requires a real Dynamics CRM 2016 environment. The `typeof Xrm === 'undefined'` guard means the script silently no-ops on non-CRM pages.

## Future Testing Considerations

If automated tests are added, these areas would benefit most:

| Area | Suggested Approach |
|---|---|
| `formatValue()` in `all-fields.ts` | Unit tests with mock `Xrm.Attributes.Attribute` objects |
| Search/filter logic in `buildPanel()` | DOM-based unit test (jsdom or happy-dom) |
| Popup button wiring in `popup.ts` | Chrome extension API mocks (e.g., `chrome-extension-testing`) |
| Full extension flow | Playwright with `puppeteer-in-extension` or similar |

Recommended test runner if added: **Vitest** (compatible with the existing ESM + TypeScript setup, no config transform needed).

---

*Testing analysis: 2025-01-31*
