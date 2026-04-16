---
phase: 01-foundation-cleanup-ci
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - package.json
  - .github/workflows/ci.yml
autonomous: true
requirements:
  - CLEN-01
  - CLEN-03
  - CI-01

must_haves:
  truths:
    - "README instructs developers to load from dist/, describes the popup + All Fields button UX, and notes Chrome 120+ and CRM 2016/Xrm.Page scope"
    - "`npm run clean` exists and successfully deletes dist/ using rimraf"
    - "GitHub Actions CI runs npm run check on every push and pull_request, and passes green"
  artifacts:
    - path: "README.md"
      provides: "Accurate developer onboarding documentation"
      contains: "dist/"
    - path: "package.json"
      provides: "rimraf devDependency and clean script"
      contains: "rimraf"
    - path: ".github/workflows/ci.yml"
      provides: "CI automation gating every push and PR"
      contains: "npm run check"
  key_links:
    - from: ".github/workflows/ci.yml"
      to: "npm run check"
      via: "run step"
      pattern: "npm run check"
    - from: "package.json scripts.clean"
      to: "rimraf"
      via: "script invocation"
      pattern: "rimraf dist"
---

<objective>
Update developer documentation to reflect the current build workflow, add a rimraf-based
clean script that eliminates stale dist/ artifacts, and create the GitHub Actions CI
workflow that gates every future push and pull request behind typecheck + lint.

Purpose: Establishes the catch-net (CI) and the clean-build foundation before any scaffold
removal — ensures no stale artifacts survive removals in Wave 2 and no future change can
silently introduce type or lint errors.

Output:
- README.md — accurate load path, current UX description, Chrome 120+ + CRM 2016 scope notes
- package.json — rimraf devDependency + `clean` npm script
- .github/workflows/ci.yml — CI workflow (checkout@v4 + setup-node@v4, node 20, npm ci + npm run check)
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

<interfaces>
<!-- Current package.json scripts and devDependencies — executor must preserve all existing entries -->
From package.json:
```json
"scripts": {
  "build": "node build.js",
  "dev": "node build.js --dev",
  "watch": "node build.js --watch",
  "typecheck": "tsc",
  "lint": "eslint src/",
  "check": "npm run typecheck && npm run lint"
},
"devDependencies": {
  "@eslint/js": "^9.0.0",
  "@types/chrome": "^0.0.268",
  "@types/xrm": "^9.0.85",
  "esbuild": "^0.24.0",
  "eslint": "^9.0.0",
  "globals": "^15.0.0",
  "typescript": "^5.7.0",
  "typescript-eslint": "^8.0.0"
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: README overhaul + rimraf/clean setup (CLEN-01, CLEN-03)</name>
  <files>README.md, package.json</files>
  <action>
**README.md** — Replace the entire file content with accurate documentation:

```markdown
# CRM Chrome Tools

A Chrome Extension for **Dynamics CRM 2016** — form field inspection tools.
Requires Chrome 120+. Uses `Xrm.Page` API (CRM 2016 / on-premise).

## Development Setup

### Prerequisites

- Node.js (any LTS)
- npm

### Build

```bash
npm install
npm run build       # Production build → dist/
npm run dev         # Dev build with inline sourcemaps
npm run watch       # Watch mode — rebuilds and lints on every change
npm run clean       # Delete dist/ (removes stale artifacts)
npm run check       # Typecheck + lint (no build)
```

### Load the extension in Chrome

1. Run `npm run build` to produce `dist/`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the **`dist/`** folder inside the project (not the project root)

The extension icon will appear in the toolbar. Pin it for easy access.

### Using the extension

Click the extension icon to open the popup. The popup shows:

- **📋 All Fields** — Injects a searchable side-panel overlay into the active CRM
  form frame, listing every `Xrm.Page` attribute (label, schema name, type, current value).
  Click the button again to dismiss the panel.

### Scope

This extension targets **Dynamics CRM 2016** and relies on the `Xrm.Page` API. It will
not work on non-CRM pages or on modern Dynamics 365 UCI forms where `Xrm.Page` is
unavailable.

## Project Structure

```
CRMChromeTools/
├── manifest.json         # Chrome Extension manifest (MV3)
├── build.js              # esbuild configuration and static asset copy
├── src/
│   ├── popup/            # Extension popup UI (popup.html + popup.ts)
│   └── content/          # Scripts injected into CRM pages
│       └── all-fields.ts # All Fields panel implementation
├── icons/                # Extension icons
└── dist/                 # Build output — load THIS folder as unpacked extension
```

## Planned Features

- Show all Dynamics CRM form fields (name, value, type)
- Form manipulation helpers
- UI enhancements for CRM pages
```

**package.json** — Add `rimraf` devDependency and `clean` script. Preserve all existing
entries. The final `scripts` and `devDependencies` objects must be:

```json
"scripts": {
  "build": "node build.js",
  "dev": "node build.js --dev",
  "watch": "node build.js --watch",
  "typecheck": "tsc",
  "lint": "eslint src/",
  "check": "npm run typecheck && npm run lint",
  "clean": "rimraf dist"
},
"devDependencies": {
  "@eslint/js": "^9.0.0",
  "@types/chrome": "^0.0.268",
  "@types/xrm": "^9.0.85",
  "esbuild": "^0.24.0",
  "eslint": "^9.0.0",
  "globals": "^15.0.0",
  "rimraf": "^6.1.3",
  "typescript": "^5.7.0",
  "typescript-eslint": "^8.0.0"
}
```

After editing package.json, run `npm install` to install rimraf and update
`package-lock.json`. Then run `npm run clean` to verify it executes without error
(dist/ may or may not exist at this point — rimraf is force-safe either way).
  </action>
  <verify>
    <automated>npm run clean -- --dry-run 2>$null; if ($LASTEXITCODE -ne 0) { npm run clean }; Write-Host "rimraf clean: OK"</automated>
  </verify>
  <done>
    - README.md describes `dist/` as the Load unpacked target (not project root)
    - README.md describes the "📋 All Fields" popup button UX (not hello-world alert)
    - README.md includes Chrome 120+ note and CRM 2016 / Xrm.Page scope note
    - package.json `scripts` includes `"clean": "rimraf dist"`
    - package.json `devDependencies` includes `"rimraf": "^6.1.3"`
    - `npm install` has run and `package-lock.json` is updated
    - `npm run clean` executes without error
  </done>
</task>

<task type="auto">
  <name>Task 2: GitHub Actions CI workflow (CI-01)</name>
  <files>.github/workflows/ci.yml</files>
  <action>
Create `.github/workflows/ci.yml`. The `.github/` directory may not exist — create it
along with `workflows/` subdirectory.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    name: Typecheck + Lint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck + Lint
        run: npm run check
```

**Critical details:**
- Use `actions/checkout@v4` and `actions/setup-node@v4` (not v3, not v6)
- `node-version: '20'` (LTS) — not `lts/*` which can shift silently
- `cache: 'npm'` — caches `~/.npm` keyed on `package-lock.json`; no extra action needed
- `npm ci` — reproducible install; fails if `package-lock.json` is out of sync with `package.json`
- `npm run check` — runs `typecheck && lint`; do NOT add a `npm run build` step (produces no tested artifact)
- Trigger on `push` AND `pull_request` to `main` branch
  </action>
  <verify>
    <automated>if (Test-Path ".github/workflows/ci.yml") { Get-Content ".github/workflows/ci.yml" | Select-String "npm run check" | Select-Object -First 1; Write-Host "ci.yml: OK" } else { Write-Error "ci.yml not found" }</automated>
  </verify>
  <done>
    - `.github/workflows/ci.yml` exists
    - Workflow triggers on push and pull_request to `main`
    - Uses `actions/checkout@v4` and `actions/setup-node@v4` with `node-version: '20'` and `cache: 'npm'`
    - CI step runs `npm ci` then `npm run check`
    - No build step in the workflow
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CI runner → npm registry | `npm ci` fetches packages from registry; lockfile pins exact versions |
| Repository → GitHub Actions | Workflow YAML is code — anyone with merge rights can modify it |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | `.github/workflows/ci.yml` | accept | Branch protection (enabling required status checks) is orthogonal to this plan; the workflow itself is the control |
| T-01-02 | Tampering | `npm ci` in workflow | mitigate | Use `npm ci` (not `npm install`) — fails fast if `package-lock.json` diverges from `package.json`, preventing dependency confusion attacks |
| T-01-03 | Information Disclosure | `README.md` stale load path | mitigate | CLEN-01 corrects the `dist/` load path; stale docs sent developers loading from project root (broken extension) |
| T-01-04 | Denial of Service | `rimraf dist` in `clean` script | accept | rimraf v6 uses `force: true` semantics — safe if dist/ doesn't exist; no DoS vector |
</threat_model>

<verification>
After both tasks complete:

```powershell
# Verify README has required content
$readme = Get-Content README.md -Raw
if ($readme -notmatch "dist/") { Write-Error "README missing dist/ reference" }
if ($readme -notmatch "Chrome 120") { Write-Error "README missing Chrome 120+ note" }
if ($readme -notmatch "CRM 2016") { Write-Error "README missing CRM 2016 scope note" }
if ($readme -notmatch "Xrm\.Page") { Write-Error "README missing Xrm.Page note" }
Write-Host "README checks: OK"

# Verify package.json
$pkg = Get-Content package.json | ConvertFrom-Json
if (-not $pkg.scripts.clean) { Write-Error "Missing clean script" }
if (-not $pkg.devDependencies.rimraf) { Write-Error "Missing rimraf devDependency" }
Write-Host "package.json checks: OK"

# Verify CI workflow
if (-not (Test-Path ".github/workflows/ci.yml")) { Write-Error "Missing ci.yml" }
$ci = Get-Content ".github/workflows/ci.yml" -Raw
if ($ci -notmatch "npm run check") { Write-Error "CI missing npm run check step" }
if ($ci -notmatch "checkout@v4") { Write-Error "CI using wrong checkout version" }
Write-Host "CI workflow checks: OK"

# Functional: clean runs without error
npm run clean
Write-Host "npm run clean: OK"

# Functional: check passes
npm run check
```
</verification>

<success_criteria>
- `README.md` correctly documents `dist/` as the Load unpacked target, describes "📋 All Fields" popup button UX, includes Chrome 120+ note, and CRM 2016 / `Xrm.Page` scope note
- `npm run clean` deletes `dist/` without error (rimraf installed and wired)
- `.github/workflows/ci.yml` exists, triggers on push + PR, runs `npm ci && npm run check`
- `npm run check` passes (typecheck + lint clean)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-cleanup-ci/01-groundwork-ci-SUMMARY.md`
</output>
