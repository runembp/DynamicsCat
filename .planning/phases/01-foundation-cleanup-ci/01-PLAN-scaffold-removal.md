---
phase: 01-foundation-cleanup-ci
plan: 03
type: execute
wave: 2
depends_on:
  - 01-PLAN-groundwork-ci
  - 01-PLAN-security-hardening
files_modified:
  - src/popup/popup.html
  - src/popup/popup.ts
  - build.js
  - manifest.json
  - eslint.config.js
autonomous: true
requirements:
  - CLEN-02
  - CLEN-04
  - CLEN-05
  - CLEN-06

must_haves:
  truths:
    - "Popup shows only the 📋 All Fields button — no hello-world button exists anywhere"
    - "`npm run clean && npm run build` produces a dist/ with no background.js, show-fields.*, or hello-world.* artifacts"
    - "`npm run build` (one-shot, non-watch) runs ESLint automatically after esbuild completes"
    - "src/ contains no hello-world.ts, no background.ts, no all-fields.css dead files"
  artifacts:
    - path: "src/popup/popup.html"
      provides: "Popup UI with only All Fields button"
      contains: "btn-all-fields"
    - path: "src/popup/popup.ts"
      provides: "Popup logic with only All Fields listener"
      contains: "btn-all-fields"
    - path: "build.js"
      provides: "Build config with only live entry points + lint in build path"
      contains: "runLint"
    - path: "manifest.json"
      provides: "Manifest without background service worker entry"
    - path: "eslint.config.js"
      provides: "ESLint config without stale background.ts block"
  key_links:
    - from: "build.js else branch"
      to: "runLint()"
      via: "await call after esbuild.build() + copyStatics()"
      pattern: "await runLint"
    - from: "manifest.json"
      to: "no background key"
      via: "CLEN-04 atomic removal"
      pattern: "background"
---

<objective>
Remove all hello-world scaffold artifacts, remove the empty background service worker,
remove the dead CSS file, and wire ESLint into the one-shot build path — leaving a
clean, minimal codebase where `npm run build` is a full quality gate.

Purpose:
- CLEN-02: hello-world scaffold (alert-based smoke test) is not suitable for production;
  its button, listener, content script, and build entry must all be removed together.
- CLEN-04: background.ts is an empty stub; removing it eliminates the service worker
  registration and one dead compiled artifact. **Atomic:** both manifest.json and build.js
  must be updated in the same commit, then a clean build must verify no stale dist/background.js.
- CLEN-05: src/content/all-fields.css is never loaded (styles are injected inline by
  injectStyles()); the file is dead code and the build copies it to dist/ needlessly.
- CLEN-06: runLint() is currently only called in the watch plugin's onEnd callback —
  one-shot `npm run build` skips lint entirely, allowing type/lint errors to ship.

Output:
- src/popup/popup.html — hello-world button removed
- src/popup/popup.ts — hello-world listener + null guard removed
- build.js — hello-world + background entry points removed; all-fields.css copy removed; runLint() added to one-shot path
- manifest.json — background service worker entry removed
- eslint.config.js — background.ts ESLint config block removed
- src/content/hello-world.ts — DELETED
- src/background.ts — DELETED
- src/content/all-fields.css — DELETED

PRECONDITIONS (must be satisfied before this plan runs):
1. rimraf must be installed (from Plan 01) — needed for `npm run clean` verification
2. popup.ts must have null guards on getElementById (from Plan 02) — safe to remove
   hello-world block without crashing the DOMContentLoaded callback
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

<interfaces>
<!-- popup.ts state AFTER Plan 02 (SEC-02) — this is the starting state for Task 1 -->
src/popup/popup.ts after Plan 02:
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

<!-- current build.js one-shot path (lines 62-66) -->
From build.js (one-shot else branch, current state):
```javascript
} else {
  await esbuild.build(options);
  copyStatics();
  console.log('Build complete → dist/');
}
```

<!-- current build.js entryPoints -->
From build.js options.entryPoints (current state):
```javascript
entryPoints: {
  'background': 'src/background.ts',
  'popup/popup': 'src/popup/popup.ts',
  'content/hello-world': 'src/content/hello-world.ts',
  'content/all-fields': 'src/content/all-fields.ts',
},
```

<!-- current eslint.config.js background block to remove -->
From eslint.config.js (block to remove in Task 2):
```javascript
// Background service worker
{
  files: ['src/background.ts'],
  languageOptions: {
    globals: { ...globals.serviceworker, ...chromeGlobals },
  },
},
```

<!-- manifest.json state AFTER Plan 02 (SEC-01) — background block to remove in Task 2 -->
manifest.json after Plan 02 adds CSP:
```json
"background": {
  "service_worker": "background.js"
},
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove hello-world scaffold entirely (CLEN-02)</name>
  <files>src/popup/popup.html, src/popup/popup.ts, build.js</files>
  <action>
**Step A — Delete the content script file:**
Delete `src/content/hello-world.ts`. This file contains only `alert('Hello world')`.

**Step B — Update `src/popup/popup.html`:**
Remove the entire `<button id="btn-hello-world" ...>` element. The `<section class="tool-group">` must retain only the All Fields button. The resulting `<main>` block:

```html
  <main>
    <section class="tool-group">
      <h2 class="tool-group-label">🛠 Tools</h2>
      <button id="btn-all-fields" class="tool-btn">
        📋 All Fields
      </button>
    </section>
  </main>
```

**Step C — Update `src/popup/popup.ts`:**
Remove the entire hello-world block (null guard + listener). The file must become:

```typescript
document.addEventListener('DOMContentLoaded', () => {
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

**Step D — Update `build.js` entryPoints:**
Remove the `'content/hello-world': 'src/content/hello-world.ts',` line from the
`entryPoints` object. The result:

```javascript
entryPoints: {
  'background': 'src/background.ts',
  'popup/popup': 'src/popup/popup.ts',
  'content/all-fields': 'src/content/all-fields.ts',
},
```

Note: The `background` entry stays for now — it will be removed in Task 2 (CLEN-04).

**After all four changes**, run `npm run check` to confirm typecheck + lint pass.
  </action>
  <verify>
    <automated>npm run check</automated>
  </verify>
  <done>
    - `src/content/hello-world.ts` no longer exists
    - `src/popup/popup.html` contains no `btn-hello-world` button element
    - `src/popup/popup.ts` contains no hello-world variable, null guard, or listener block
    - `build.js` `entryPoints` contains no `content/hello-world` entry
    - `npm run check` passes (typecheck + lint clean)
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove background.ts atomically — manifest + build + ESLint config (CLEN-04)</name>
  <files>manifest.json, build.js, eslint.config.js</files>
  <action>
CLEN-04 requires an **atomic** change: both `manifest.json` AND `build.js` must be
updated in the same operation. If only one is changed, Chrome will either fail to load
the extension ("Could not load background script") or produce a dead dist/background.js.

**Step A — Update `build.js` entryPoints:**
Remove the `'background': 'src/background.ts',` line. The result:

```javascript
entryPoints: {
  'popup/popup': 'src/popup/popup.ts',
  'content/all-fields': 'src/content/all-fields.ts',
},
```

**Step B — Update `manifest.json`:**
Remove the entire `"background"` key and its value. The manifest (which already has the
CSP from Plan 02) must NOT contain any `background` key at the top level. Result:

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

**Step C — Delete `src/background.ts`:**
Delete the file. It contains only a comment line with no logic.

**Step D — Update `eslint.config.js`:**
Remove the "Background service worker" config block (the entire object with
`files: ['src/background.ts']`). The file must no longer reference `src/background.ts`
or `globals.serviceworker`. The remaining structure:

```javascript
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Popup scripts
  {
    files: ['src/popup/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...chromeGlobals },
    },
  },

  // Content scripts (browser globals + Xrm for CRM pages)
  {
    files: ['src/content/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...chromeGlobals, Xrm: 'readonly' },
    },
  },

  // Build scripts (Node.js)
  {
    files: ['build.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
```

**Step E — Clean build to eliminate stale dist/background.js:**
Run `npm run clean && npm run build`. This removes the old `dist/` (which contains
`background.js` from previous builds) and rebuilds from scratch. After the clean build,
verify `dist/background.js` does NOT exist.

(npm run clean requires rimraf, which was installed in Plan 01.)
  </action>
  <verify>
    <automated>npm run clean; npm run build; if (Test-Path "dist/background.js") { Write-Error "FAIL: stale dist/background.js still exists" } else { Write-Host "No stale background.js: OK" }; npm run check</automated>
  </verify>
  <done>
    - `src/background.ts` no longer exists
    - `build.js` `entryPoints` contains no `background` entry
    - `manifest.json` contains no `background` top-level key
    - `eslint.config.js` contains no reference to `src/background.ts` or `globals.serviceworker`
    - `dist/background.js` does NOT exist after `npm run clean && npm run build`
    - `dist/manifest.json` does NOT contain a `background` key (it is copied from root manifest.json by copyStatics)
    - `npm run check` passes
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove dead CSS file + wire lint into one-shot build (CLEN-05, CLEN-06)</name>
  <files>build.js</files>
  <action>
**Step A — Remove dead CSS copy from `build.js` (CLEN-05):**
In the `copyStatics()` function, remove the line that copies `all-fields.css`:

Remove this line:
```javascript
copyFileSync('src/content/all-fields.css', 'dist/content/all-fields.css');
```

The `injectStyles()` function inside `all-fields.ts` is the sole style source (injects
a `<style>` tag at runtime). The `src/content/all-fields.css` file is never loaded by
any code — it is dead. After removing the copyFileSync call, delete the source file too.

Delete `src/content/all-fields.css`.

**Step B — Wire runLint() into the one-shot build path (CLEN-06):**
The current one-shot `else` branch (at the bottom of build.js) is:

```javascript
} else {
  await esbuild.build(options);
  copyStatics();
  console.log('Build complete → dist/');
}
```

Add `await runLint()` after `copyStatics()`:

```javascript
} else {
  await esbuild.build(options);
  copyStatics();
  await runLint();
  console.log('Build complete → dist/');
}
```

**Important:** `runLint()` is already defined earlier in build.js and already called in
the watch plugin's `onEnd` callback — do NOT redefine or duplicate it. Only add the
`await runLint()` call in the `else` branch.

**After both changes**, run `npm run build` (one-shot, not watch). Confirm that ESLint
output appears in the build output (either "ESLint: no errors" or lint findings).
  </action>
  <verify>
    <automated>npm run build 2>&1 | Tee-Object -Variable buildOutput; if ($buildOutput -match "ESLint") { Write-Host "runLint() fires in one-shot build: OK" } else { Write-Error "FAIL: ESLint output not seen in npm run build" }; if (Test-Path "dist/content/all-fields.css") { Write-Error "FAIL: stale dist/content/all-fields.css still exists" } else { Write-Host "No stale all-fields.css in dist: OK" }</automated>
  </verify>
  <done>
    - `src/content/all-fields.css` no longer exists
    - `build.js` `copyStatics()` function does not copy `all-fields.css`
    - `dist/content/all-fields.css` does NOT exist after a clean build
    - `build.js` one-shot `else` branch calls `await runLint()` after `copyStatics()`
    - `npm run build` (not watch) produces ESLint output ("ESLint: no errors" or findings)
    - `npm run check` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build.js manifest copy → Chrome extension loader | dist/manifest.json is read by Chrome; source manifest.json is the authoritative file |
| dist/ artifacts → Chrome extension loader | Stale artifacts in dist/ are loaded by Chrome if not cleaned |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering | CLEN-04 two-place removal | mitigate | Edit root `manifest.json` AND `build.js` entryPoints in same task; run `npm run clean && npm run build` to purge stale `dist/background.js` — if only one file changed, Chrome would fail to load the extension or load a dead service worker |
| T-03-02 | Tampering | Stale `dist/` artifacts | mitigate | `npm run clean` (rimraf — installed in Plan 01) wipes dist/ before verify; prevents Chrome from loading removed scripts from stale build output |
| T-03-03 | Tampering | `dist/manifest.json` edited directly | mitigate | Task instructs editing root `manifest.json` (source), not `dist/manifest.json` — the build's `copyStatics()` overwrites dist/manifest.json on every build |
| T-03-04 | Denial of Service | `alert('Hello world')` in hello-world.ts | mitigate | CLEN-02 removes the file and its entry point entirely; `alert()` blocks the page's main thread and is inappropriate in injected production scripts |
| T-03-05 | Information Disclosure | ESLint skipped in one-shot build | mitigate | CLEN-06 adds `await runLint()` to the one-shot build path; lint errors are now surfaced during `npm run build` not only during `npm run watch` or explicit `npm run check` |
</threat_model>

<verification>
After all three tasks complete (full phase verification):

```powershell
# --- File existence checks ---
@(
  "src/content/hello-world.ts",
  "src/background.ts",
  "src/content/all-fields.css"
) | ForEach-Object {
  if (Test-Path $_) { Write-Error "FAIL: $_ should not exist" } else { Write-Host "Deleted: $_" }
}

# --- Source content checks ---
$popup_html = Get-Content src/popup/popup.html -Raw
if ($popup_html -match "btn-hello-world") { Write-Error "FAIL: hello-world button still in popup.html" }
if ($popup_html -notmatch "btn-all-fields") { Write-Error "FAIL: all-fields button missing from popup.html" }
Write-Host "popup.html: OK"

$popup_ts = Get-Content src/popup/popup.ts -Raw
if ($popup_ts -match "hello-world") { Write-Error "FAIL: hello-world reference in popup.ts" }
if ($popup_ts -notmatch "btn-all-fields") { Write-Error "FAIL: btn-all-fields missing from popup.ts" }
Write-Host "popup.ts: OK"

$build = Get-Content build.js -Raw
if ($build -match "'background'") { Write-Error "FAIL: background entry still in build.js entryPoints" }
if ($build -match "hello-world") { Write-Error "FAIL: hello-world entry still in build.js" }
if ($build -match "all-fields\.css") { Write-Error "FAIL: all-fields.css copy still in build.js" }
if ($build -notmatch "await runLint") { Write-Error "FAIL: runLint() not in one-shot build path" }
Write-Host "build.js: OK"

$manifest = Get-Content manifest.json | ConvertFrom-Json
if ($manifest.background) { Write-Error "FAIL: background key still in manifest.json" }
Write-Host "manifest.json: OK"

$eslint = Get-Content eslint.config.js -Raw
if ($eslint -match "background\.ts") { Write-Error "FAIL: background.ts still in eslint.config.js" }
Write-Host "eslint.config.js: OK"

# --- Clean build + dist/ artifact checks ---
npm run clean
npm run build
@(
  "dist/background.js",
  "dist/content/hello-world.js",
  "dist/content/show-fields.js",
  "dist/content/show-fields.css",
  "dist/content/all-fields.css"
) | ForEach-Object {
  if (Test-Path $_) { Write-Error "FAIL: stale artifact $_ in dist/" } else { Write-Host "Not present (correct): $_" }
}

# dist/ must contain these live artifacts
@(
  "dist/popup/popup.js",
  "dist/popup/popup.html",
  "dist/content/all-fields.js",
  "dist/manifest.json"
) | ForEach-Object {
  if (-not (Test-Path $_)) { Write-Error "FAIL: expected artifact $_ missing from dist/" } else { Write-Host "Present: $_" }
}

# Final quality gate
npm run check
Write-Host "All Phase 1 checks passed"
```
</verification>

<success_criteria>
- No `hello-world.ts`, `background.ts`, or `all-fields.css` exist in `src/`
- Popup shows only the "📋 All Fields" button — `btn-hello-world` absent from popup.html and popup.ts
- `npm run clean && npm run build` produces `dist/` with no `background.js`, `hello-world.js`, `show-fields.*`, or `all-fields.css` artifacts
- `npm run build` (one-shot) prints ESLint output automatically — no separate `npm run check` step needed to see lint results
- `manifest.json` has no `background` key; `eslint.config.js` has no `src/background.ts` block
- `npm run check` passes (typecheck + lint)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-cleanup-ci/01-scaffold-removal-SUMMARY.md`
</output>
