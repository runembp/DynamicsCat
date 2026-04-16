---
phase: 01-foundation-cleanup-ci
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/popup/popup.ts
  - manifest.json
autonomous: true
requirements:
  - SEC-01
  - SEC-02

must_haves:
  truths:
    - "popup.ts DOM lookups use explicit null guards that throw descriptive errors — no `!` assertions remain"
    - "manifest.json declares content_security_policy using the MV3 nested-object format"
    - "The extension loads in Chrome without any manifest parse error after adding CSP"
  artifacts:
    - path: "src/popup/popup.ts"
      provides: "Null-safe popup initialization"
      contains: "throw new Error"
    - path: "manifest.json"
      provides: "MV3 CSP declaration"
      contains: "extension_pages"
  key_links:
    - from: "src/popup/popup.ts"
      to: "document.getElementById"
      via: "null guard before addEventListener"
      pattern: "if (!btn"
    - from: "manifest.json"
      to: "content_security_policy.extension_pages"
      via: "nested object key (MV3 format)"
      pattern: "extension_pages"
---

<objective>
Replace all `!` non-null assertions on `document.getElementById` calls in `popup.ts`
with explicit null guards, and add an explicit MV3 Content Security Policy to
`manifest.json`.

Purpose:
- SEC-02: The `!` assertions cause the entire `DOMContentLoaded` callback to crash
  silently if any referenced element is absent — disabling ALL popup tools as a side
  effect. Null guards with descriptive errors surface the failure precisely.
- SEC-01: An explicit CSP blocks future inline script injection and remote resource
  loading in extension pages (popup.html). Absence leaves the extension relying on MV3
  defaults without any audit trail.

Output:
- src/popup/popup.ts — null guards replacing `!` assertions on getElementById calls
- manifest.json — `content_security_policy.extension_pages` in MV3 nested-object format
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

<interfaces>
<!-- Current popup.ts — full file for executor reference -->
From src/popup/popup.ts (current state):
```typescript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-hello-world')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content/hello-world.js'],
      });
    });
  });

  document.getElementById('btn-all-fields')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/all-fields.js'],
        world: 'MAIN',
      });
    });
  });
});
```

<!-- Current manifest.json — full file for executor reference -->
From manifest.json (current state):
```json
{
  "manifest_version": 3,
  "name": "CRM Chrome Tools",
  "version": "0.1.0",
  "description": "Dynamics CRM 2016 helper tools — form field viewer, form manipulation, and more.",
  "permissions": ["activeTab", "scripting"],
  "host_permissions": ["*://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "CRM Chrome Tools",
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace ! assertions with null guards in popup.ts (SEC-02)</name>
  <files>src/popup/popup.ts</files>
  <action>
Replace the entire content of `src/popup/popup.ts` with the following null-safe version:

```typescript
document.addEventListener('DOMContentLoaded', () => {
  const btnHelloWorld = document.getElementById('btn-hello-world');
  if (!btnHelloWorld) throw new Error('Expected element #btn-hello-world');
  btnHelloWorld.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content/hello-world.js'],
      });
    });
  });

  const btnAllFields = document.getElementById('btn-all-fields');
  if (!btnAllFields) throw new Error('Expected element #btn-all-fields');
  btnAllFields.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/all-fields.js'],
        world: 'MAIN',
      });
    });
  });
});
```

**What changed:**
- `document.getElementById('btn-hello-world')!` → `const btnHelloWorld = document.getElementById('btn-hello-world'); if (!btnHelloWorld) throw new Error('Expected element #btn-hello-world');`
- `document.getElementById('btn-all-fields')!` → `const btnAllFields = document.getElementById('btn-all-fields'); if (!btnAllFields) throw new Error('Expected element #btn-all-fields');`

**What did NOT change (keep as-is):**
- `tab.id!` on lines 5 and 14 — these are Chrome API returns, not getElementById calls.
  SEC-02 requirement targets only `document.getElementById` assertions. Do not touch `tab.id!`.
- The hello-world listener block remains intact — it will be removed in Plan 03 (CLEN-02)
  after this null-safe version is in place.

**Rationale:** With null guards in place, Plan 03 can safely remove the `btn-hello-world`
button from `popup.html` without crashing the DOMContentLoaded callback. Without these
guards, removing the button while the `!` assertion remains would cause an uncaught
TypeError that prevents `btn-all-fields` from registering its listener too.
  </action>
  <verify>
    <automated>npm run check</automated>
  </verify>
  <done>
    - `src/popup/popup.ts` contains no `!` assertions on `document.getElementById` calls
    - Both getElementById calls are followed by `if (!element) throw new Error(...)` guards
    - The descriptive error messages include the element ID (`#btn-hello-world`, `#btn-all-fields`)
    - `npm run check` passes (typecheck + lint, no new errors)
  </done>
</task>

<task type="auto">
  <name>Task 2: Add MV3 Content Security Policy to manifest.json (SEC-01)</name>
  <files>manifest.json</files>
  <action>
Add the `content_security_policy` key to `manifest.json`. Insert it after the
`host_permissions` array and before the `background` object. The full updated
`manifest.json` must be:

```json
{
  "manifest_version": 3,
  "name": "CRM Chrome Tools",
  "version": "0.1.0",
  "description": "Dynamics CRM 2016 helper tools — form field viewer, form manipulation, and more.",
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "*://*/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "CRM Chrome Tools",
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Critical CSP format rules (per PITFALLS.md Pitfall 4):**
- The key MUST be an **object** with an `extension_pages` sub-key — NOT a flat string
- WRONG (MV2 format — Chrome rejects this entirely): `"content_security_policy": "script-src 'self'"`
- CORRECT (MV3 format): `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }`
- The `background` service worker entry stays for now — it will be removed in Plan 03 (CLEN-04)

**CSP scope note:** `extension_pages` governs `popup.html` and any future options pages.
It does NOT govern `all-fields.ts` injected into CRM pages — those scripts are subject to
the CRM page's own CSP.
  </action>
  <verify>
    <automated>$manifest = Get-Content manifest.json | ConvertFrom-Json; if ($manifest.content_security_policy.extension_pages -match "script-src 'self'") { Write-Host "CSP: OK" } else { Write-Error "CSP missing or wrong format" }</automated>
  </verify>
  <done>
    - `manifest.json` contains a `content_security_policy` key
    - The value is an object with an `extension_pages` sub-key (NOT a flat string)
    - `extension_pages` value is `"script-src 'self'; object-src 'self'"`
    - All other manifest keys are unchanged
    - `npm run build` succeeds (manifest is valid JSON)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Extension pages (popup.html) → external resources | CSP governs what popup.html can load |
| popup.ts → DOM element existence | Code assumes elements declared in popup.html always exist |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Denial of Service | `popup.ts` null dereference | mitigate | SEC-02: Replace `!` assertions with `if (!el) throw new Error(...)` guards — failure is now explicit and scoped to the missing element, not a cascade that kills all tool buttons |
| T-02-02 | Elevation of Privilege | `manifest.json` no CSP | mitigate | SEC-01: Explicit `content_security_policy.extension_pages` blocks inline scripts and remote resource loading in extension pages; prevents future accidental `unsafe-inline` addition |
| T-02-03 | Tampering | MV2 flat-string CSP format | mitigate | Use exact MV3 nested-object format `{ "extension_pages": "..." }` — Chrome rejects the manifest entirely with flat string, making the error visible immediately at load time |
| T-02-04 | Information Disclosure | `throw new Error(...)` in popup | accept | Error message contains element ID only (no sensitive data); thrown in extension context (not visible to CRM pages) |
</threat_model>

<verification>
After both tasks complete:

```powershell
# Verify no ! assertions remain on getElementById calls
$popup = Get-Content src/popup/popup.ts -Raw
if ($popup -match "getElementById\([^)]+\)!") {
  Write-Error "FAIL: ! assertion still present on getElementById call"
} else {
  Write-Host "No ! assertions on getElementById: OK"
}

# Verify null guards are present
if ($popup -notmatch "throw new Error\('Expected element #btn-hello-world'\)") {
  Write-Error "FAIL: missing null guard for btn-hello-world"
}
if ($popup -notmatch "throw new Error\('Expected element #btn-all-fields'\)") {
  Write-Error "FAIL: missing null guard for btn-all-fields"
}
Write-Host "Null guards: OK"

# Verify CSP in manifest
$manifest = Get-Content manifest.json | ConvertFrom-Json
if (-not $manifest.content_security_policy) {
  Write-Error "FAIL: missing content_security_policy key"
}
if (-not $manifest.content_security_policy.extension_pages) {
  Write-Error "FAIL: CSP is not nested object with extension_pages (MV2 flat-string format?)"
}
Write-Host "CSP format: OK"

# Functional: check passes
npm run check
```
</verification>

<success_criteria>
- `src/popup/popup.ts` has zero `!` assertions on `document.getElementById` calls
- Each getElementById call is guarded by `if (!el) throw new Error('Expected element #id')`
- `manifest.json` `content_security_policy` is a nested object `{ "extension_pages": "script-src 'self'; object-src 'self'" }`
- `npm run check` passes with no new errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-cleanup-ci/01-security-hardening-SUMMARY.md`
</output>
