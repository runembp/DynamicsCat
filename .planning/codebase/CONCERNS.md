# Codebase Concerns

**Analysis Date:** 2025-01-31

---

## Tech Debt

**README describes a stale developer workflow:**
- Issue: `README.md` instructs developers to "Load unpacked" and select the `DynamicsCat` project folder, but the build system outputs to `dist/`. The extension must be loaded from `dist/` not the project root (which has no bundled JS).
- Files: `README.md`, `build.js` (line 62: `outdir: 'dist'`)
- Impact: New developers following the README will load a broken extension (source `.ts` files are not directly executable by Chrome).
- Fix approach: Update README to specify `dist/` as the Load Unpacked target. Add a note that `npm run build` must be run first.

**README references a scaffold "Hello World" alert as the expected UX:**
- Issue: `README.md` line 18 says: *"Click the extension icon on any tab — you should see an `alert('Hello world')` dialog."* The extension now uses a popup panel, not an auto-fire alert on icon click.
- Files: `README.md`
- Impact: Misleads contributors about how the extension works.
- Fix approach: Rewrite the README to describe the current popup + tool-button UX.

**`hello-world.ts` is an unremoved scaffold:**
- Issue: `src/content/hello-world.ts` contains only `alert('Hello world')`. `alert()` blocks the browser tab's main thread and is inappropriate for production tooling. The script is still wired up as a real popup button (`btn-hello-world`) in `src/popup/popup.html` and `src/popup/popup.ts`.
- Files: `src/content/hello-world.ts`, `src/popup/popup.html`, `src/popup/popup.ts` (lines 3–8)
- Impact: Shipping to production would expose a jarring, non-functional tool to users. Clicking the button on restricted pages (e.g., `chrome://` URLs) will silently fail with no feedback.
- Fix approach: Remove or replace with a real tool. If kept for dev purposes, gate it behind a dev build flag.

**Orphan `show-fields.*` artifacts in `dist/`:**
- Issue: `dist/content/show-fields.js` and `dist/content/show-fields.css` exist in the build output directory, compiled from a now-deleted `src/content/show-fields.ts`. These are leftovers from a script rename to `all-fields`.
- Files: `dist/content/show-fields.js`, `dist/content/show-fields.css`
- Impact: `dist/` is gitignored so this doesn't affect source control, but developers running the extension from a pre-existing `dist/` without a clean rebuild carry dead scripts. Could cause confusion when debugging.
- Fix approach: Delete the orphan files. Add a `clean` npm script (`rimraf dist`) to enable clean builds. Note: `build.js` never cleans `dist/` before building.

**`background.ts` is an empty stub:**
- Issue: `src/background.ts` contains a single comment line with no functionality. It is compiled and shipped as `dist/background.js` (an empty IIFE). No service worker logic has been established.
- Files: `src/background.ts`
- Impact: Any future background logic (e.g., message passing, context menus, storage, session tracking) has no existing pattern to follow. The service worker registers but does nothing.
- Fix approach: Either delete the background entry and remove it from `manifest.json` if not needed, or scaffold a minimal message-handler pattern as a reference.

**Inline CSS in `all-fields.ts` duplicates (and diverges from) `all-fields.css`:**
- Issue: `src/content/all-fields.ts`'s `injectStyles()` function (lines 57–123) injects its own inline `<style>` block via a JavaScript template literal. A separate `src/content/all-fields.css` file also exists and is copied to `dist/content/all-fields.css` by the build — but it is **never linked or injected** by any code. The two CSS definitions are not identical: `all-fields.css` declares `width: 580px` on the panel while the inline JS declares `min-width: 420px; max-width: 90vw`.
- Files: `src/content/all-fields.ts` (lines 57–123), `src/content/all-fields.css`
- Impact: `all-fields.css` is dead code — copied to `dist/` but never used. The panel width inconsistency means any developer editing the `.css` file will see no effect. Future style maintenance will be confused by two sources of truth.
- Fix approach: Either (a) remove `all-fields.css` and keep the inline approach (simpler for injected scripts), or (b) inject the CSS file via `chrome.scripting.insertCSS` and remove the inline `injectStyles()` function.

**Build does not run lint in one-shot `npm run build`:**
- Issue: `build.js`'s `runLint()` function is only called inside the watch plugin's `onEnd` callback (lines 52–54). Running `npm run build` (lines 62–65) skips lint entirely.
- Files: `build.js` (lines 46–66)
- Impact: CI or manual production builds can ship code with lint errors. Only `npm run watch` and the separate `npm run check` script catch lint issues during the build itself.
- Fix approach: Call `await runLint()` in the one-shot build path after `esbuild.build()` completes, or document that `npm run check` must be run before building for release.

---

## Security Considerations

**`host_permissions: ["*://*/*"]` is over-broad:**
- Risk: The extension requests permission to run scripts on every URL on every scheme. This is the maximum possible host permission scope. Any website the user visits is accessible to the extension via `chrome.scripting.executeScript`.
- Files: `manifest.json` (line 11)
- Current mitigation: The extension only injects scripts when the user explicitly clicks a popup button — no automatic injection occurs. However, the declared permission itself is flagged by Chrome Web Store review as high-risk and would require justification.
- Recommendations: Scope `host_permissions` to known Dynamics 365 URL patterns, e.g. `"*://*.dynamics.com/*"`, `"*://*.microsoftdynamics.com/*"`, and/or `"*://*.crm.dynamics.com/*"`. For on-premise/custom domains, provide a settings UI to let users add their own CRM URL.

**Content script runs in `world: 'MAIN'`:**
- Risk: `popup.ts` injects `all-fields.js` with `world: 'MAIN'` (line 15). This means the injected script shares the CRM page's JavaScript execution context. Any JavaScript running on the CRM page can read, modify, or interfere with the extension's code and vice versa. A compromised or adversarial CRM page could manipulate extension behavior or intercept data the extension reads.
- Files: `src/popup/popup.ts` (line 15)
- Current mitigation: `MAIN` world is architecturally required because `Xrm` is only available in the page's global context — it cannot be accessed from an `ISOLATED` world script.
- Recommendations: Document this constraint explicitly. Consider whether any extension data (e.g., read field values) could be exfiltrated by the page — currently the extension only reads and displays; it does not send data anywhere. No immediate action required but this should be revisited if write operations are added.

**No Content Security Policy declared in manifest:**
- Risk: `manifest.json` does not define a `content_security_policy` key. MV3 extensions receive Chrome's default CSP, but an explicit CSP for the popup page is a security best practice and expected by Chrome Web Store.
- Files: `manifest.json`
- Current mitigation: Default MV3 CSP applies. No `eval` or inline scripts are used in the popup.
- Recommendations: Add explicit `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }` to `manifest.json`.

**Non-null assertion on DOM elements in popup:**
- Risk: `src/popup/popup.ts` lines 2 and 11 use `!` (non-null assertion) on `document.getElementById(...)`. If element IDs change in `popup.html`, these will throw uncaught `TypeError: Cannot read properties of null` at runtime with no graceful error handling.
- Files: `src/popup/popup.ts` (lines 2, 11)
- Current mitigation: The HTML and TS are manually kept in sync. TypeScript strict mode does not catch this because `!` suppresses the null check.
- Recommendations: Add null guards with user-visible error handling, or use a typed query helper that asserts and throws a descriptive error.

---

## Compatibility Concerns

**`Xrm.Page` is deprecated:**
- Issue: `src/content/all-fields.ts` uses `Xrm.Page.data.entity.attributes.get()`, `Xrm.Page.ui.controls.forEach()`, `Xrm.Page.data.entity.getEntityName()`, and `Xrm.Page.data.entity.getId()` (lines 28, 32, 43, 182–183). `Xrm.Page` was the Dynamics CRM 2011/2013 API and was formally deprecated in Dynamics 365 v9.0 (2018). In the modern Unified Client Interface (UCI), `Xrm.Page` may return `null` or throw depending on the form event lifecycle.
- Files: `src/content/all-fields.ts` (lines 21–28, 32, 43, 182–183)
- Impact: The extension may silently fail (the `if (!Xrm.Page)` guard on line 21 causes a silent exit) or throw on modern UCI forms where `Xrm.Page` is `undefined`. The description in `manifest.json` and `package.json` explicitly targets "Dynamics CRM 2016", acknowledging this scope, but limits the extension's usefulness on post-2016 Dynamics 365 environments.
- Fix approach: The modern replacement is `executionContext.getFormContext()` — but this is only available in form event handler callbacks, not in externally injected scripts. A workaround for injected scripts is to call `Xrm.Page` with a fallback to scanning for `Xrm.App.sessions` (for UCI), or to document the 2016/legacy-only scope clearly.

**`@types/xrm` types reflect deprecated API:**
- Issue: `package.json` depends on `@types/xrm: ^9.0.85`. The `Xrm.Page` namespace in these types represents the deprecated interface. TypeScript will not emit deprecation warnings when using `Xrm.Page` members.
- Files: `package.json` (line 17)
- Impact: IDE tooling gives no signal that `Xrm.Page` usage is inadvisable on newer platforms.
- Fix approach: No immediate action needed given the explicit CRM 2016 target, but document the constraint.

**`esbuild` target pinned to `chrome120`:**
- Issue: `build.js` sets `target: 'chrome120'` (line 19). This prevents use of JavaScript features introduced after Chrome 120.
- Files: `build.js` (line 19)
- Impact: Minor — the constraint is reasonable. However, it is not documented and could silently block modern syntax usage as the codebase grows.
- Fix approach: Document the minimum Chrome version requirement in `README.md`. Consider keeping the target current (e.g., bumping periodically).

---

## Fragile Areas

**Multi-frame injection may open multiple panels:**
- Files: `src/popup/popup.ts` (line 13: `allFrames: true`), `src/content/all-fields.ts` (lines 8–17)
- Why fragile: The script is injected into all frames with `allFrames: true`. The toggle logic (lines 12–17 of `all-fields.ts`) checks for an existing panel by ID within each frame individually. On pages with multiple CRM form iframes, each frame will show its own panel independently, which may be the correct behavior — but is untested and undocumented.
- Safe modification: Test on multi-frame CRM views (e.g., sub-grids, embedded forms). Consider whether the intent is to show a panel in only the first matching CRM frame or all of them.
- Test coverage: None.

**Panel width sizing relies on `requestAnimationFrame`:**
- Files: `src/content/all-fields.ts` (lines 283–287)
- Why fragile: The panel width is set by reading `table.offsetWidth` inside `requestAnimationFrame` after the panel is added to the DOM. This assumes the browser has performed layout before the callback fires. In CRM pages with complex CSS or deferred rendering, `table.offsetWidth` may be `0` on the first frame, resulting in the panel collapsing to `420px` minimum width regardless of content.
- Safe modification: Consider using a `ResizeObserver` on the table, or accept a fixed width.
- Test coverage: None.

**Keyboard event suppression is partial:**
- Files: `src/content/all-fields.ts` (lines 197–199)
- Why fragile: `keydown` and `keyup` events on the search input call `e.stopPropagation()` to prevent CRM from consuming keyboard input. However, `keypress` (deprecated but still fired in some browsers) and `input` events are not suppressed. CRM keyboard shortcuts bound at the `window` or `document` level using `capture: true` listeners will still fire regardless of `stopPropagation` on the element. This may cause accidental CRM navigation when typing search queries.
- Safe modification: Add `keypress` suppression for completeness; note that capture-phase listeners on the host cannot be blocked from injected content.
- Test coverage: None.

---

## Test Coverage Gaps

**No automated tests exist:**
- What's not tested: All functionality — panel rendering, `Xrm` attribute reading, search filtering, style injection, popup button wiring, frame detection, toggle behavior.
- Files: All files under `src/`
- Risk: Any regression in panel rendering, Xrm API interaction, or popup behavior would only be caught by manual testing against a live Dynamics CRM environment. There is no CI enforcement.
- Priority: Medium — the codebase is small and the domain (CRM form inspection) is hard to unit test without a CRM runtime. Integration tests using Playwright against a mock Xrm global would provide meaningful coverage for the panel and search logic.

**No CI pipeline:**
- What's not tested: TypeScript compilation and lint are not automatically verified on commits or pull requests.
- Files: No `.github/workflows/` directory exists.
- Risk: Type errors or lint violations can be merged undetected.
- Priority: Low-medium — `npm run check` covers typecheck + lint locally. Adding a GitHub Actions workflow running `npm run check` would close this gap at minimal cost.

---

## Performance Bottlenecks

**Search filtering iterates all DOM rows on every keystroke:**
- Problem: `src/content/all-fields.ts` lines 264–276 iterate all `<tr>` elements and toggle `display` via inline style on every `input` event. For typical CRM entities (50–200 fields) this is negligible. For entities with 300+ attributes (e.g., opportunity or contact in heavily customized orgs), repeated forced style recalculations per keystroke could feel sluggish.
- Files: `src/content/all-fields.ts` (lines 264–276)
- Cause: No debounce on the `input` event handler; synchronous DOM manipulation per keypress.
- Improvement path: Add a debounce of ~100ms. Consider a virtual list for very large attribute sets.

**All field values are stored as lowercase strings in `dataset`:**
- Problem: `src/content/all-fields.ts` lines 247–249 copy label, schema name, and formatted value into `tr.dataset.*` attributes for each row. This doubles the memory footprint of the table data in the DOM.
- Files: `src/content/all-fields.ts` (lines 247–249)
- Cause: Convenience approach for simple search matching.
- Improvement path: Acceptable at current scale. No action needed unless panel performance becomes a complaint.

---

## Missing Critical Features

**No user feedback when `Xrm.Page` is unavailable:**
- Problem: When the user clicks "All Fields" on a non-CRM page or a CRM page where `Xrm.Page` is not available, the script silently exits after logging to the browser console. The user sees nothing — no error, no tooltip, no popup message.
- Blocks: Usability for non-expert users who do not have DevTools open.
- Files: `src/content/all-fields.ts` (lines 21–24), `src/popup/popup.ts`

**No configurable CRM URL restriction:**
- Problem: The extension activates its popup on every page (`host_permissions: ["*://*/*"]`), but provides no way for users to define which URLs are their CRM instances. Running the All Fields script on non-CRM pages silently fails.
- Blocks: Any future "only show extension button when on a CRM page" badge/UI behavior.
- Files: `manifest.json`

**No column sort interactivity:**
- Problem: The panel header row labels (Label, Schema Name, Type, Value) are rendered as plain `<th>` text with no click-to-sort behavior. The table is pre-sorted alphabetically by label at render time (lines 212–215 of `all-fields.ts`) with no way to re-sort.
- Blocks: Sorting by type or value, which would be useful for debugging.
- Files: `src/content/all-fields.ts` (lines 207–208, 212–215)

---

*Concerns audit: 2025-01-31*
