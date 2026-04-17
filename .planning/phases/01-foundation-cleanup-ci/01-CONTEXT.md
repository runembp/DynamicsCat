# Phase 1: Foundation Cleanup + CI - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Remove scaffold tech debt (hello-world button, background.ts placeholder, dead CSS), enforce null safety in popup.ts, add MV3 CSP to manifest.json, wire lint into the build pipeline, add a clean script, and set up GitHub Actions CI. The codebase is clean and null-safe after this phase; every subsequent change is gated by automated checks.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from STATE.md and ROADMAP:
- `rimraf@^6.1.3` is the only new dependency (ESM-native v6 required for `"type": "module"` project)
- Background removal is two-place: `manifest.json` + `build.js` must change in the same commit; run `npm run clean` after
- CSP must use MV3 nested-object format: `{ "extension_pages": "script-src 'self'; object-src 'self'" }` — NOT a flat MV2 string
- `!` assertions in popup.ts must be replaced with null guards before removing the hello-world listener (removing the button before removing its listener crashes the DOMContentLoaded callback)
- lint must run automatically as part of `npm run build` (success criterion 1)
- CI must run on both push and pull_request, executing `npm run check`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eslint.config.js` — already configured with per-glob rules for background, popup, content, and build.js; no changes needed to rules, just ensure it runs in CI
- `build.js` — already imports ESLint and has a `runLint()` function used in watch mode; needs to be called in non-watch build path too

### Established Patterns
- Build system uses esbuild directly via `build.js` (no config file); entry points declared explicitly — background removal requires deleting the `'background'` entry
- Static assets copied by `copyStatics()` — not processed by esbuild
- `"type": "module"` in package.json — all scripts must use ESM syntax

### Integration Points
- `popup.ts` uses `!` non-null assertions on `getElementById` for both `btn-hello-world` and `btn-all-fields`; hello-world handler must be removed before null-guard refactor
- `popup.html` has the hello-world `<button id="btn-hello-world">` that must be removed
- `manifest.json` references `background.js` service worker — must be removed
- `build.js` entry points include `'background': 'src/background.ts'` and `'content/hello-world': 'src/content/hello-world.ts'` — both must be removed

</code_context>

<specifics>
## Specific Ideas

Plans already defined in ROADMAP (in execution order due to the `!` assertion dependency):
1. **01-PLAN-scaffold-removal.md** — Remove hello-world (button + handler + content script), remove background.ts, remove dead CSS; wire lint into `npm run build`
2. **01-PLAN-security-hardening.md** — Replace `!` assertions in popup.ts with null guards; add MV3 CSP to manifest.json
3. **01-PLAN-groundwork-ci.md** — README overhaul, add rimraf + `clean` script, add GitHub Actions CI workflow

Note: Plan 1 (scaffold removal) should run before Plan 2 (null guards) to avoid the crash described in the pitfalls. Plan 3 (CI/README) is independent and can run in any order relative to Plan 2.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
