# Technology Stack

**Analysis Date:** 2025-01-31

## Languages

**Primary:**
- TypeScript 5.7+ — All source files under `src/` (`background.ts`, `popup/popup.ts`, `content/all-fields.ts`, `content/hello-world.ts`)
- HTML — Popup UI (`src/popup/popup.html`)
- CSS — Popup and content-script styles (`src/popup/popup.css`, `src/content/all-fields.css`)

**Secondary:**
- JavaScript (ESM) — Build script (`build.js`, `eslint.config.js`); runs in Node.js, not compiled

## Runtime

**Environment:**
- Browser (Chrome 120+) — Extension target; IIFE bundles loaded as content scripts and popup page
- Node.js — Build toolchain only (`build.js`); not shipped to users

**Package Manager:**
- npm
- Lockfile: `package-lock.json` — present

## Frameworks

**Core:**
- None — Vanilla TypeScript/DOM; no UI framework (React, Vue, etc.)

**Testing:**
- None — No test framework detected

**Build/Dev:**
- esbuild 0.24+ — Bundles TypeScript → IIFE JS; targets `chrome120`; config in `build.js`

## Key Dependencies

**Critical:**
- `typescript` ^5.7.0 — Type checking via `tsc --noEmit`; strict mode enabled
- `esbuild` ^0.24.0 — Fast bundler; handles TS compilation, minification, inline sourcemaps for dev
- `@types/chrome` ^0.0.268 — Chrome Extension API typings (`chrome.tabs`, `chrome.scripting`)
- `@types/xrm` ^9.0.85 — Microsoft Dynamics CRM / XRM JavaScript API typings; used in `src/content/all-fields.ts`

**Infrastructure:**
- `eslint` ^9.0.0 — Linting (flat config format)
- `typescript-eslint` ^8.0.0 — TypeScript-aware lint rules
- `@eslint/js` ^9.0.0 — ESLint JS recommended rule set
- `globals` ^15.0.0 — Predefined global sets (`browser`, `serviceworker`, `node`) for ESLint

## Configuration

**TypeScript (`tsconfig.json`):**
- `target`: ES2020
- `lib`: ES2020, DOM
- `module`: ESNext, `moduleResolution`: bundler
- `strict`: true
- `noEmit`: true (type-check only; esbuild handles transpilation)
- `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`: all true
- `types`: chrome, xrm
- Includes: `src/**/*`

**ESLint (`eslint.config.js`):**
- Flat config (ESLint 9 format)
- Per-file-glob globals:
  - `src/background.ts` → `serviceworker` + `chrome`
  - `src/popup/**/*.ts` → `browser` + `chrome`
  - `src/content/**/*.ts` → `browser` + `chrome` + `Xrm`
  - `build.js` → `node`

**esbuild (`build.js`):**
- Entry points: `background`, `popup/popup`, `content/hello-world`, `content/all-fields`
- Output: `dist/` directory
- Format: `iife` (required for Chrome extension content scripts)
- Target: `chrome120`
- Dev mode (`--dev`): inline sourcemaps, no minification
- Watch mode (`--watch`): incremental rebuild + ESLint after each build
- Static assets copied via Node.js `fs` APIs: `icons/`, `manifest.json`, HTML, CSS files

**Build:**
```
manifest.json       → dist/manifest.json
icons/              → dist/icons/
src/popup/popup.html → dist/popup/popup.html
src/popup/popup.css  → dist/popup/popup.css
src/content/all-fields.css → dist/content/all-fields.css
```

## npm Scripts

```bash
npm run build       # Production build → dist/
npm run dev         # Dev build (sourcemaps, no minify) → dist/
npm run watch       # Watch mode with live ESLint
npm run typecheck   # tsc (type-check only, no emit)
npm run lint        # eslint src/
npm run check       # typecheck + lint
```

## Platform Requirements

**Development:**
- Node.js (version not pinned; no `.nvmrc` or `.node-version` detected)
- Chrome 120+ for manual testing (load `dist/` as unpacked extension)

**Production:**
- Chrome browser (Manifest V3)
- No server-side component; purely client-side extension

---

*Stack analysis: 2025-01-31*
