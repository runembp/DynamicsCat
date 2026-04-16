# Architecture Patterns — MV3 Hardening Milestone

**Domain:** Chrome Extension MV3 — Dynamics CRM 2016 tooling
**Researched:** 2026-04-16
**Overall confidence:** HIGH (Chrome extension API behavior is deterministic; verified via Context7 official docs)

---

## Scope of This Document

Three specific questions posed by this milestone:

1. How does a MAIN-world injected script read `chrome.storage` settings?
2. How does a content script surface user-visible feedback without a background message channel?
3. How are host_permissions scoped per URL pattern + user-configured domains?

Plus: the new **options page** component this milestone introduces.

---

## Existing Architecture Baseline

```
chrome toolbar click
  └─ popup.html / popup.ts  (extension context — full chrome.* access)
       └─ chrome.scripting.executeScript({ world: 'MAIN', files: [...], allFrames: true })
            └─ content/all-fields.ts  (CRM page context — DOM + Xrm access, no chrome.* APIs)
```

Key constraint that does NOT change: `world: 'MAIN'` is architecturally required to access
`window.Xrm`. Changing it would break the core use case. All new patterns must work around it.

---

## Question 1: Reading `chrome.storage` from a MAIN-World Injected Script

### Finding: MAIN World Has No `chrome` Extension API Access

**Confidence: HIGH** — Chrome extension isolation boundary is deterministic.

A script injected with `world: 'MAIN'` runs in the host page's JavaScript execution context.
The `chrome` extension API bridge (which provides `chrome.storage`, `chrome.scripting`,
`chrome.tabs`, etc.) is **only injected into ISOLATED world contexts**. In MAIN world, `chrome`
is absent or provides only the tiny `chrome.runtime.sendMessage` / `chrome.runtime.connect`
subset that web pages receive — not `chrome.storage`.

Any call to `chrome.storage.*` inside `all-fields.ts` throws:
```
TypeError: Cannot read properties of undefined (reading 'sync')
```
TypeScript does not catch this — `chrome` is typed globally as the full extension API, so the
type-checker sees valid code that fails only at runtime.

### Correct Pattern: Read Settings in Popup, Settings Are Not Needed in Content Script

**For this milestone, the content script does not need settings at all.**

The URL restriction logic (checking if the current tab matches a configured CRM URL) is
entirely a popup-layer concern:

```
popup.ts
  1. chrome.tabs.query() → get tab.url
  2. chrome.storage.sync.get({ crmUrls: [] }) → get configured URLs
  3. if tab.url does not match any crmUrl → show warning banner in popup HTML
  4. still call chrome.scripting.executeScript (injection proceeds regardless)
  └─ all-fields.ts has NO knowledge of settings; it only checks typeof Xrm
```

The content script's Xrm availability check is sufficient for its own guard logic. Settings
are never needed inside the MAIN world script. No `func`+`args` migration is required.

### When `func` + `args` Would Be Needed (Not This Milestone)

If a future feature requires passing data INTO the content script (e.g., user preferences for
panel layout), the correct pattern is:

```typescript
// popup.ts — settings-aware injection (future pattern)
const settings = await chrome.storage.sync.get({ panelWidth: 360 });
await chrome.scripting.executeScript({
  target: { tabId: tab.id!, allFrames: true },
  world: 'MAIN',
  func: (opts: { panelWidth: number }) => {
    // opts available here; called as a serialized self-contained function
    // ALL helper functions (buildPanel, injectStyles, etc.) must be inside this func body
  },
  args: [settings],
});
```

**Important constraint:** `func` and `files` are mutually exclusive. Using `func` means the
entire content script body must be a single self-contained function — external references to
imported modules are not serialized. This would require restructuring `all-fields.ts` into a
single exported function accepting a settings parameter and registering it as a build entry
that produces a callable export rather than an IIFE.

**Recommendation: Avoid `func` for this milestone.** The settings-in-popup architecture
cleanly sidesteps the problem. Revisit only if a genuine cross-boundary data requirement emerges.

---

## Question 2: User-Visible Feedback from Content Script Without a Message Channel

### Finding: DOM Manipulation Is the Correct and Only Required Mechanism

**Confidence: HIGH** — MAIN world has full DOM access; this is the established extension pattern.

Content scripts in MAIN world have complete access to the host page's DOM. No message channel,
no `chrome.runtime.sendMessage`, no background service worker is required. The existing
`all-fields.ts` already demonstrates this pattern: it creates DOM elements and appends them
to `document.body`. The same approach applies to error feedback.

### Error Panel Pattern (Already Designed in FEATURES.md)

```typescript
// all-fields.ts — when Xrm is absent on top frame
if (typeof Xrm === 'undefined' || !Xrm.Page) {
  if (window !== window.top) {
    // Sub-frame without Xrm — expected; silent skip
    return;
  }
  // Top frame without Xrm — user is on wrong page; show feedback
  injectStyles();          // idempotent — already guards against double injection
  buildErrorPanel();       // new function, same DOM pattern as buildPanel()
  return;
}
```

**`buildErrorPanel()` design:**
- Creates a fixed-position div with `PANEL_ID` (same constant as main panel — prevents doubles)
- Reuses `injectStyles()` — styles already include the panel container layout
- Content: `⚠ CRM Tools: Xrm.Page not found. Open a Dynamics CRM 2016 form first.`
- ✕ dismiss button (same pattern as main panel close)
- Does NOT auto-dismiss (no setTimeout complexity needed; ✕ is sufficient)
- Shares the `#crm-tools-fields-panel` ID so toggle behavior is consistent: a second click
  closes it, same as the main panel

**Why no toast/overlay library is needed:** The existing `injectStyles()` CSS already defines
a fixed-position container. Adding a message-only variant of that panel is a handful of DOM
lines, no new dependencies.

**Why no message channel is needed:** The feedback is scoped to the frame where the error
occurred. There is nothing to route — the DOM element appears directly in the page where the
user is looking.

---

## Question 3: URL Matching for `host_permissions` Scoping

### Finding: `activeTab` Grants Per-Frame Access; `allFrames` Requires `host_permissions`

**Confidence: HIGH** — Chrome's `activeTab` scope boundary is explicitly documented.

`activeTab` grants temporary access to the **top-level tab** only. It does not extend to
sub-frames. `executeScript` with `allFrames: true` requires the extension to have
`host_permissions` matching each frame's URL.

This has a direct implication: scoping `host_permissions` to Dynamics cloud patterns only
breaks injection for any on-premise CRM user. The settings UI solves this by letting users
declare their on-prem domains.

### Cloud Domain Patterns (Static, In Manifest)

```json
"host_permissions": [
  "*://*.dynamics.com/*",
  "*://*.microsoftdynamics.com/*",
  "*://*.crm.dynamics.com/*"
]
```

These cover all known Dynamics 365 / CRM Online hosted domains. They replace the current
`"*://*/*"` which is overly broad and triggers Chrome Web Store review scrutiny.

### On-Premise / Custom Domains (User-Configured, Optional Permission)

Two approaches, ordered by preference:

**Option A — `optional_host_permissions` + `chrome.permissions.request()`** (recommended)
```json
// manifest.json
"optional_host_permissions": ["*://*/*"]
```
```typescript
// options.ts — when user adds a custom domain
chrome.permissions.request(
  { origins: [`*://${domain}/*`] },
  (granted) => { if (granted) storeDomain(domain); }
);
```
- Must be called inside a user gesture handler (button click) — Chrome enforces this
- Shows a system permission prompt to the user explaining what access is being granted
- Grants injection rights for that domain without re-installing the extension
- Domains list stored in `chrome.storage.sync.crmUrls`

**Option B — Popup-only runtime check without optional permissions** (simpler, reduced UX)
- Store custom domain list in `chrome.storage.sync`
- Check in popup before injection; show "unsupported domain — add to settings" hint
- Injection still silently fails on unmatched domains (executeScript rejects, `.catch()` handles it)
- Acceptable if on-prem support is lower priority than shipping quickly

**Recommendation: Start with Option B (popup hint + `.catch()` on executeScript), then
add Option A in a follow-up.** Option B costs one `.catch()` and one URL comparison; Option A
adds the permissions flow to the options page. Both require the settings UI to exist first.

### Runtime URL Check in Popup (Layer A)

```typescript
// popup.ts — before/after executeScript
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const { crmUrls } = await chrome.storage.sync.get({ crmUrls: [] });

const isOnCrmPage = crmUrls.some(
  (u: string) => tab.url?.includes(u)
) || KNOWN_DYNAMICS_DOMAINS.some(
  (pattern) => tab.url?.match(pattern)
);

if (!isOnCrmPage) {
  showPopupBanner('⚠ Not a configured CRM page — results may be empty');
}

// Still inject — user may be on an unconfigured CRM page
chrome.scripting.executeScript({ ... }).catch((err) => {
  showPopupBanner(`⚠ Injection failed: ${err.message}`);
});
```

**Known Dynamics domain patterns (hardcoded in popup.ts, not in storage):**
```typescript
const KNOWN_DYNAMICS_DOMAINS = [
  /\.dynamics\.com$/,
  /\.microsoftdynamics\.com$/,
  /\.crm\.dynamics\.com$/,
];
```

---

## Component Boundaries — Updated for This Milestone

### Existing Components (Modified)

**`popup.ts` — Extended**
- Adds: `chrome.storage.sync.get({ crmUrls: [] })` on load
- Adds: URL comparison logic (`tab.url` vs known patterns + stored custom URLs)
- Adds: Warning banner DOM element in `popup.html` (shown/hidden based on URL match)
- Adds: "⚙ Settings" button → `chrome.runtime.openOptionsPage()`
- Adds: `.catch()` on `executeScript` call (currently swallows all errors)
- Adds: `"storage"` to `permissions` in `manifest.json` (required for `chrome.storage`)
- Unchanged: `executeScript` call pattern (`files` + `world: 'MAIN'` + `allFrames: true`)

**`all-fields.ts` — Extended**
- Adds: `buildErrorPanel()` function for top-frame Xrm-absent case
- Modifies: `main()` guard block — differentiates top-frame from sub-frame in the Xrm check
- Unchanged: Everything else — injection pattern, styles, panel build, search, toggle

### New Component

**`src/options/options.ts` + `src/options/options.html` + `src/options/options.css`**

| Responsibility | Detail |
|----------------|--------|
| Renders settings UI | URL list (add/remove), Save button |
| Reads/writes `chrome.storage.sync` | `{ crmUrls: string[] }` |
| Runs in extension context | Full `chrome.*` access — no MAIN-world restrictions |
| Opened via | `chrome.runtime.openOptionsPage()` from popup |
| Registered in manifest as | `options_ui: { page: "options/options.html", open_in_tab: true }` |

New build entries required:
- `src/options/options.ts` → `dist/options/options.js` (add to `build.js` entryPoints)
- `src/options/options.html` → `dist/options/options.html` (add to `build.js` file copies)
- Add `options.ts` to `eslint.config.js` source glob

---

## Data Flow

### Settings Read (popup → storage)

```
popup.html loads
  → popup.ts: chrome.storage.sync.get({ crmUrls: [] })
  → compare tab.url to crmUrls + KNOWN_DYNAMICS_DOMAINS
  → show/hide warning banner in popup DOM
  → [user clicks tool button]
  → chrome.scripting.executeScript({ files: ['content/all-fields.js'], world: 'MAIN', allFrames: true })
       .catch(err => showPopupBanner(err.message))
```

### Settings Write (options page → storage)

```
chrome.runtime.openOptionsPage()     [triggered from popup ⚙ button]
  → options.html opens in new tab
  → options.ts: chrome.storage.sync.get({ crmUrls: [] }) → populate URL list UI
  → user edits URLs → clicks Save
  → options.ts: chrome.storage.sync.set({ crmUrls: [...] })
  → options.ts: show success toast ("Settings saved")
```

### Content Script Error Feedback (in-page, no message channel)

```
all-fields.ts runs in CRM page frame
  → main() checks typeof Xrm
  → if absent AND window === window.top:
       injectStyles()
       buildErrorPanel()           ← appends DOM element to document.body
       return
  → if absent AND window !== window.top:
       LOG('skipping non-CRM sub-frame')
       return
  → if present:
       [normal panel build flow]
```

### host_permissions Enforcement

```
chrome.scripting.executeScript({ allFrames: true })
  → Chrome checks each frame URL against host_permissions
  → cloud CRM frames (*.dynamics.com etc.) → allowed → injection proceeds
  → on-prem CRM frames (crm.contoso.com) → NO match → frame skipped silently
  → popup.ts .catch() catches the top-level rejection → shows banner

[Settings UI flow for on-prem]
  → user adds 'crm.contoso.com' in options page
  → stored to chrome.storage.sync.crmUrls
  → [optional] chrome.permissions.request({ origins: ['*://crm.contoso.com/*'] })
  → future injections: host_permissions now includes the domain
```

---

## Suggested Build Order

Based on component dependencies and risk isolation:

| Step | Task | Rationale |
|------|------|-----------|
| 1 | Add `"storage"` to `permissions` in `manifest.json` | No-risk prerequisite for all storage work |
| 2 | Scope `host_permissions` to known Dynamics patterns + add `.catch()` to executeScript | Must happen together (scoping breaks on-prem without the catch; catch makes the failure visible) |
| 3 | Modify `all-fields.ts` — `buildErrorPanel()` for top-frame Xrm-absent case | Isolated to one file, no new dependencies, tests immediately by visiting a non-CRM page |
| 4 | Build options page (`src/options/`) — HTML + TS + CSS + build.js entries | New component, isolated; manually test by loading extension and visiting options |
| 5 | Extend `popup.ts` — read storage, compare URL, show warning banner, add ⚙ button | Depends on storage permission (step 1) and options page existing (step 4) |
| 6 | Wire `host_permissions` changes with settings UI to prevent on-prem breakage | Confirm popup hint appears for non-matching domains; confirm on-prem fail is visible |

Steps 2 and 3 are parallelizable (different files). Step 5 depends on steps 1 and 4.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling `chrome.storage` in `all-fields.ts`
**What goes wrong:** MAIN world has no extension API bridge — `TypeError` at runtime, TypeScript
will NOT catch it, panel never appears.
**Instead:** Read storage in `popup.ts`, which runs in extension context.

### Anti-Pattern 2: Relying on `func`+`args` to Pass Settings Into MAIN World
**What goes wrong:** `func` and `files` are mutually exclusive. Using `func` requires the entire
`all-fields.ts` logic to be a single self-contained function body — no top-level imports, no
external references. This would require a significant refactor with no benefit for this milestone.
**Instead:** Keep `files` for injection; handle settings entirely in popup layer.

### Anti-Pattern 3: Shipping `host_permissions` Scoping Without Settings UI
**What goes wrong:** On-prem CRM users find the extension silently broken. The failure is
invisible because popup.ts swallows the `executeScript` promise rejection.
**Instead:** Add `.catch()` first so the failure is visible; ship settings UI in the same PR
as or before the host_permissions tightening.

### Anti-Pattern 4: Editing `dist/manifest.json` Directly to Test Permission Changes
**What goes wrong:** `build.js` copies `manifest.json` from project root on every build —
`dist/manifest.json` is overwritten and the test state is lost.
**Instead:** Always edit the root `manifest.json`, then run `npm run build` (or add
`npm run build:clean` with rimraf) and reload the extension in `chrome://extensions`.

### Anti-Pattern 5: Using a Toast Timer (`setTimeout`) for the Error Panel
**What goes wrong:** Adds async timing complexity to a synchronous DOM operation; user may miss
the message if away from screen.
**Instead:** Use a ✕ dismiss button — same pattern as the existing main panel.

---

## Sources

- Chrome Extensions API — `chrome.scripting.executeScript` (world, allFrames, func/args, files):
  https://developer.chrome.com/docs/extensions/reference/api/scripting
  Context7 `/websites/developer_chrome_extensions` — HIGH confidence

- Chrome Extensions — Content Scripts isolated vs MAIN world API access:
  https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
  Context7 `/websites/developer_chrome_extensions` — HIGH confidence

- Chrome Extensions — `chrome.storage` API, permission requirement, context availability:
  https://developer.chrome.com/docs/extensions/reference/api/storage
  Context7 `/websites/developer_chrome_extensions_reference_api` — HIGH confidence

- Chrome Extensions — `optional_host_permissions` + `chrome.permissions.request()`:
  https://developer.chrome.com/docs/extensions/reference/api/permissions
  Context7 `/websites/developer_chrome_extensions` — HIGH confidence

- Chrome Extensions Manifest — `content_security_policy` MV3 nested format:
  https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
  Context7 `/websites/developer_chrome_extensions_reference_manifest` — HIGH confidence

- Codebase direct inspection: `src/popup/popup.ts`, `src/content/all-fields.ts`,
  `manifest.json`, `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`
