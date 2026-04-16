# Domain Pitfalls

**Domain:** Chrome Extension MV3 — Dynamics CRM 2016 tooling hardening
**Researched:** 2025-01-31
**Codebase ref:** `manifest.json`, `src/popup/popup.ts`, `src/content/all-fields.ts`, `build.js`

---

## Critical Pitfalls

Mistakes that cause broken injection, silent runtime failures, or Chrome loading errors.

---

### Pitfall 1: `activeTab` Does Not Cover Sub-Frames — `allFrames: true` Requires `host_permissions`

**Phase:** Host permission scoping

**What goes wrong:**
`popup.ts` injects `all-fields.js` with `allFrames: true` because Dynamics CRM 2016 renders
the form inside nested iframes. The `activeTab` permission only grants transient access to the
**top-level frame** of the active tab. It does NOT extend to sub-frames.

If `host_permissions` is narrowed to `*.dynamics.com` patterns, and the sub-frame URLs do not
match those patterns (or if the user is on an on-premise CRM domain), `executeScript` with
`allFrames: true` will inject into the top-level frame only — silently skipping every iframe
where `Xrm` actually lives. The panel never appears; there is no error.

**Why it happens:**
Chrome's `activeTab` grant is defined as "the top-level tab URL that was active when the user
invoked the extension." It is explicitly not recursive into frames. The `scripting` API enforces
host_permissions checks per-frame for `allFrames` injections.

**Current code at risk:**
```typescript
// src/popup/popup.ts — line 14
target: { tabId: tab.id!, allFrames: true },
files: ['content/all-fields.js'],
world: 'MAIN',
```

**Consequences:**
- On cloud CRM (`*.crm.dynamics.com`), scoped patterns work because top and sub-frames share
  the same domain — injection succeeds.
- On on-premise CRM (e.g., `https://crm.contoso.com`), no pattern matches, `executeScript`
  rejects for every frame, and the promise is silently swallowed because popup.ts has no
  `.catch()` handler (non-null assertions on lines 2/11 are a separate crash vector too).

**Prevention:**
1. Scope `host_permissions` to all known Dynamics cloud patterns **plus** add `<all_urls>` as
   an optional permission requestable via the settings UI for on-prem users.
2. Add `.catch()` to the `executeScript` call in popup.ts to surface the permission error to
   the user rather than failing silently.
3. Verify sub-frame injection on a real CRM page after scoping — the toggle behavior
   (panel appears/disappears) is the only observable symptom of successful frame injection.

**Warning signs:**
- Button click produces no panel, no console error in the popup DevTools.
- `chrome.runtime.lastError` would be set but is swallowed because there is no `.catch()`.
- The popup closes immediately (as designed) so errors are invisible.

---

### Pitfall 2: `chrome.storage` Is Not Available in MAIN World Injected Scripts

**Phase:** Settings storage (CRM URL restriction UI)

**What goes wrong:**
Any attempt to call `chrome.storage.sync.get(...)` or `chrome.storage.local.get(...)` inside
`all-fields.ts` will throw at runtime. In the MAIN world, the script runs in the CRM page's
JavaScript execution context. The `chrome` object that exists there (if at all) is the web-page
subset exposed by Chrome — it provides only `chrome.runtime.sendMessage` and
`chrome.runtime.connect`. It does not include `chrome.storage`, `chrome.scripting`,
`chrome.tabs`, or any other extension-only API.

**Current injection path:**
```
popup.ts (extension context, full chrome.*) 
  → executeScript({ world: 'MAIN', files: ['all-fields.js'] })
    → all-fields.ts runs in CRM page context (no chrome.storage)
```

**Why it happens:**
Developers see the extension API working in popup.ts and assume it is available everywhere. The
`world: 'MAIN'` parameter is the architectural requirement that removes API access — it cannot
be changed without losing access to `Xrm`.

**Consequences:**
- `chrome.storage.sync.get(...)` → `TypeError: Cannot read properties of undefined (reading 'sync')`
- This crashes `all-fields.ts` before the panel is built; no panel appears.
- TypeScript will NOT catch this — `chrome` is typed as the extension API globally, so the
  type-checker sees valid code that fails at runtime.

**Prevention — correct architecture:**
Read settings in `popup.ts` (where full `chrome.*` access is available), **before** calling
`executeScript`. Pass settings into the injected script via `func` + `args` instead of `files`:

```typescript
// popup.ts — correct pattern for settings-aware injection
const settings = await chrome.storage.sync.get({ crmUrls: [] });
await chrome.scripting.executeScript({
  target: { tabId: tab.id!, allFrames: true },
  world: 'MAIN',
  func: (opts: { crmUrls: string[] }) => {
    // opts.crmUrls available here; no chrome.storage call needed
    window.__crmToolsSettings = opts;
    // ... trigger all-fields logic
  },
  args: [settings],
});
```

**Note:** `args` only works with `func` (inline function), **not** with `files`. Once settings
are needed, the injection pattern must migrate from `files` to `func` or a two-phase approach
(ISOLATED world reads storage → posts message → MAIN world listens via CustomEvent).

**Warning signs:**
- Panel never appears after adding any `chrome.storage` call to `all-fields.ts`.
- Browser DevTools on the CRM page (not popup DevTools) shows the TypeError.
- TypeScript build succeeds with no errors.

---

### Pitfall 3: Two-Place Removal Required for `background.ts` — Manifest and Build Must Be Atomic

**Phase:** `background.ts` + service worker removal

**What goes wrong:**
Removing the `background.service_worker` key from `manifest.json` without also removing
`'background': 'src/background.ts'` from `build.js` entryPoints leaves `dist/background.js`
being compiled and shipped as a dead artifact. The reverse (removing build entry only) causes
Chrome to fail extension loading: the manifest references `background.js` but no such file
exists in `dist/`.

**The copy chain:**
```
manifest.json (project root)  ← edit HERE
    ↓ copyFileSync in build.js
dist/manifest.json             ← Chrome reads THIS
dist/background.js             ← still compiled if build.js entry not removed
```

**Why it happens:**
`build.js` copies `manifest.json` from the project root to `dist/` on every build. Developers
sometimes test by editing `dist/manifest.json` directly, which is immediately overwritten by the
next build. The source file must be edited; dist is ephemeral.

**Consequences:**
- Partial removal (manifest only): Chrome's extension loader errors "Could not load background
  script" and marks the extension broken until a clean reload.
- Partial removal (build.js only): `dist/background.js` still compiled and present; Chrome
  happily loads it (it's an empty IIFE). Waste, but not a crash.
- Stale `dist/`: Without a `clean` npm script, old `dist/background.js` from a previous build
  persists even after removing the build entry. Must run `rimraf dist` + rebuild.

**Prevention:**
1. Change `manifest.json` (root) and `build.js` entryPoints in the same commit.
2. Run `npm run clean` (once the rimraf script is added) before verifying the removal.
3. Reload the extension in `chrome://extensions` after the build to force Chrome to re-parse
   the updated manifest.

**Warning signs:**
- `chrome://extensions` shows a red error badge immediately after loading the updated dist/.
- Error text: "Service worker registration failed" or "Could not load background script".
- `dist/background.js` exists but `dist/manifest.json` has no `background` key (or vice versa).

---

### Pitfall 4: CSP Placed at Wrong Manifest Key — MV2 Flat String Rejected in MV3

**Phase:** Adding `content_security_policy` to manifest.json

**What goes wrong:**
MV3 requires CSP to be a nested object with `extension_pages` (and optionally `sandbox`) keys.
Using the MV2 flat string format causes Chrome to reject the manifest entirely with a parse
error, breaking extension loading.

**Wrong (MV2 style — Chrome rejects this in MV3):**
```json
"content_security_policy": "script-src 'self'; object-src 'self'"
```

**Correct (MV3):**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

**Why it happens:**
Every MV2 tutorial and Stack Overflow answer uses the flat string. Documentation migration is
uneven. Copy-paste from old references is the most common cause.

**Consequences:**
- Chrome fails to load the extension entirely.
- Error in `chrome://extensions`: "Invalid value for 'content_security_policy'."
- Extension shows as broken until the manifest is corrected and the extension reloaded.

**Prevention:**
Use exactly the nested form above. No other variation is valid in MV3.

**Warning signs:**
- Extension stops loading after adding `content_security_policy`.
- `chrome://extensions` shows manifest parse error.
- Error mentions `content_security_policy` key.

---

## Moderate Pitfalls

---

### Pitfall 5: Extension-Page CSP Does Not Govern Injected Content Scripts

**Phase:** Adding CSP / understanding scope

**What goes wrong:**
The CSP defined under `content_security_policy.extension_pages` applies to the extension's own
HTML pages (`popup.html`, any options page). It does **not** apply to scripts injected into CRM
pages via `chrome.scripting.executeScript`. Those scripts are governed by the **CRM page's own
CSP**, not the extension's.

Specifically: `all-fields.ts`'s `injectStyles()` appends a `<style>` element to the CRM
page's `document.head`. If the CRM server returned a strict `Content-Security-Policy` header
blocking inline styles, the style injection would be blocked regardless of what the extension's
manifest CSP says.

**Relevance:** Dynamics CRM 2016 on-premise does not typically enforce strict CSP headers, so
this is unlikely to cause a problem in practice. However, cloud-hosted Dynamics 365 has
progressively tightened CSP — future-proofing requires awareness.

**Prevention:**
- Document that extension CSP ≠ injected script governance.
- If style injection ever fails in a stricter CRM environment, the solution is
  `chrome.scripting.insertCSS` (called from popup.ts in extension context, not from
  the MAIN world script).

---

### Pitfall 6: `'unsafe-eval'` Cannot Be Added to MV3 Extension CSP — esbuild IIFE Format Is Safe

**Phase:** Adding CSP / build system concerns

**What goes wrong:**
MV3 permanently blocks `'unsafe-eval'` in extension pages. Chrome ignores it even if added to
the manifest CSP, and Chrome Web Store submission with `'unsafe-eval'` triggers rejection.

This would be a problem if the popup bundle used `eval()` (e.g., certain Webpack configurations,
VM modules, or source-map-support packages). The current build uses **esbuild with IIFE format**
targeting Chrome 120 — this format does NOT use `eval` or `new Function`. Safe as-is.

**Prevention:**
- Never add `eval()`-dependent code or libraries to `src/popup/popup.ts`.
- If esbuild configuration changes (e.g., switching format to `esm` with dynamic import), verify
  the output is eval-free before shipping.
- Adding source maps with `'unsafe-eval'`-requiring devtools hooks would break in MV3; use
  `sourcemap: 'inline'` (which esbuild already does in `--dev` mode) — inline source maps in
  the JS file do not require `'unsafe-eval'`.

---

### Pitfall 7: On-Premise CRM Domain Is Silently Excluded by Cloud-Only `host_permissions`

**Phase:** Host permission scoping + settings UI

**What goes wrong:**
Scoping `host_permissions` to only `*://*.dynamics.com/*`, `*://*.microsoftdynamics.com/*`, and
`*://*.crm.dynamics.com/*` excludes every on-premise Dynamics CRM installation. On-prem CRM is
common at organizations running CRM 2016 (the explicit target of this extension). Users on
`https://crm.contoso.com` will find the extension's popup button enabled (because `action`
defaults to show on all pages) but all injection attempts silently fail.

**Why it happens:**
On-premise CRM uses arbitrary organization-controlled domains. There is no canonical pattern to
enumerate them. The scoping decision is correct for Web Store compliance, but the user experience
of silent failure is unacceptable.

**Consequences:**
- Extension appears to do nothing for a large segment of the target audience.
- No error is shown because popup.ts has no `.catch()` on the executeScript call.

**Prevention:**
1. The settings UI (CRM URL restriction feature) must ship **before or simultaneously with**
   the host_permissions scoping change. Shipping scoped permissions without a way to add custom
   domains is a breaking change for on-prem users.
2. Add a fallback message in the popup when injection is on a non-CRM URL — the error from
   `executeScript` (permissions rejection) should be caught and displayed.
3. Consider requesting the broader `host_permissions` as an **optional** runtime permission
   (`chrome.permissions.request`) rather than a declared manifest permission, for users who
   prefer not to configure individual URLs.

---

### Pitfall 8: `dist/` Stale Artifacts Without a Clean Script

**Phase:** Removing hello-world scaffold and background.ts

**What goes wrong:**
`build.js` has no clean step — it never deletes `dist/` before building. Removing an entry
point from `build.js` (e.g., `hello-world`, `background`) does not remove its compiled artifact
from `dist/`. If Chrome is running the extension from the stale `dist/`, it continues to load
the deleted script indefinitely.

**Current state:**
- `dist/content/show-fields.js` and `dist/content/show-fields.css` already exist as stale
  orphans from a previous rename (documented in CONCERNS.md).
- After removing `hello-world.ts` from `build.js`, `dist/content/hello-world.js` persists.
- After removing `background.ts`, `dist/background.js` persists.

**Prevention:**
Add a `clean` npm script as a prerequisite before any verification of removals:
```json
"scripts": {
  "clean": "rimraf dist",
  "build": "node build.js",
  "build:clean": "npm run clean && npm run build"
}
```
The `rimraf` package is already used in the ecosystem — add it as a devDependency. After any
structural change to `build.js`, always run a clean build before testing.

---

## Minor Pitfalls

---

### Pitfall 9: Popup Non-Null Assertions Crash on Missing DOM Elements After HTML Refactor

**Phase:** Removing hello-world scaffold

**What goes wrong:**
`popup.ts` lines 2 and 11 use `!` non-null assertions on `document.getElementById(...)`. When
`btn-hello-world` is deleted from `popup.html` but the corresponding listener registration is
not removed from `popup.ts` (or vice versa), the `!` assertion causes an uncaught `TypeError`
that prevents the DOMContentLoaded callback from completing — meaning `btn-all-fields` also
stops working as a side effect.

**Prevention:**
Replace both `!` assertions with explicit null guards before performing the scaffold removal.
Doing so means a missing element fails gracefully (logs an error) rather than crashing the
entire popup initialization chain. This is a prerequisite to safe scaffold removal.

---

### Pitfall 10: `style-src` Is Unrestricted in the Recommended Extension CSP

**Phase:** Adding CSP

**What goes wrong:**
The recommended CSP (`script-src 'self'; object-src 'self'`) does not restrict `style-src`.
CSS in the extension popup is loaded via `<link rel="stylesheet" href="popup.css" />` — a
`'self'` relative URL — so it works fine. However, if someone adds an inline `style` attribute
to popup.html elements (e.g., `<button style="color: red">`), it will be permitted because
`style-src` defaults to the browser's permissive default when not explicitly listed.

This is a minor security omission, not a functional break. Adding `style-src 'self'` would
block inline style attributes on extension pages (no inline styles currently exist in popup.html).

**Prevention:**
The recommended manifest CSP is sufficient for the current codebase. No action required unless
inline styles are added to extension HTML pages in the future.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Scope `host_permissions` | `allFrames: true` breaks for on-prem/unmatched domains (Pitfall 1, 7) | Add settings UI first; add `.catch()` to executeScript call |
| Remove `background.ts` | Two-place removal + stale dist/ (Pitfall 3, 8) | Edit root `manifest.json` + `build.js` together; run `clean` before verify |
| Add `chrome.storage` for settings | `chrome.storage` unavailable in MAIN world (Pitfall 2) | Read settings in popup.ts; pass via `func`+`args` pattern |
| Add `content_security_policy` | Wrong manifest key format (Pitfall 4); scope confusion (Pitfall 5) | Use `extension_pages` nested key; verify popup loads immediately after adding |
| Remove hello-world scaffold | Non-null assertion crash breaks all-fields button (Pitfall 9) | Add null guards to popup.ts before removing the button/listener |
| Column sort feature | No API pitfalls — pure DOM sort logic; fragile only if headers are regenerated on re-sort (rebuilding DOM resets search state) | Sort in-memory array + re-render; preserve search input value |
| GitHub Actions CI | `npm run build` skips lint (CONCERNS.md); CI must call `npm run check` explicitly | Define CI step as `npm run check` (tsc + eslint), not `npm run build` |

---

## Sources

- Codebase audit: `.planning/codebase/CONCERNS.md` (2025-01-31)
- Codebase direct inspection: `manifest.json`, `src/popup/popup.ts`, `src/content/all-fields.ts`, `build.js`
- Chrome Extensions MV3 docs: `chrome.scripting.executeScript` — `world`, `allFrames`, `activeTab` semantics
  (HIGH confidence — behavior is deterministic and well-documented)
- MV3 CSP requirements: `content_security_policy.extension_pages` nested key — MV3 breaking change from MV2
  (HIGH confidence — Chrome rejects flat string format at manifest parse time; observable)
- MAIN world API access: `chrome.storage` absence in injected MAIN world scripts
  (HIGH confidence — fundamental isolation boundary of the Chrome extension model)
