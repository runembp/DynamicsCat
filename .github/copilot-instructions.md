# CRM Chrome Tools — Copilot Instructions

Chrome Extension (Manifest V3) targeting Dynamics CRM 2016. TypeScript source compiled with esbuild into `dist/`.

## Commands

```bash
npm run build       # Production build → dist/
npm run dev         # Dev build with inline sourcemaps (no minify)
npm run watch       # Watch mode — rebuilds + lints on every change
npm run typecheck   # tsc --noEmit (type-check only, no output)
npm run lint        # ESLint over src/
npm run check       # typecheck + lint together
```

No test suite exists. Load the extension from `dist/` in Chrome (`chrome://extensions` → Developer mode → Load unpacked → select `dist/`).

## Architecture

The popup (`src/popup/popup.ts`) is the single entry point for user interaction. It queries the active tab and dispatches content scripts via `chrome.scripting.executeScript`. There is no message-passing between background and content scripts — the popup directly injects scripts.

Content scripts live in `src/content/`. They run inside the page and have access to the `Xrm` global exposed by Dynamics CRM. Because CRM forms render inside **iframes**, content scripts that need `Xrm` must be injected with `allFrames: true` and `world: 'MAIN'` (the ISOLATED world cannot see `Xrm`).

`src/background.ts` is a service worker placeholder — it currently does nothing.

## Build System

`build.js` uses esbuild directly (no config file). Entry points are declared explicitly in `build.js`; adding a new content script requires adding it there. Static assets (HTML, CSS, icons, `manifest.json`) are copied by `copyStatics()` — they are **not** processed by esbuild. Each content script gets its own CSS file copied separately.

Output format is `iife` targeting `chrome120`.

## Key Conventions

**TypeScript strictness** — `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` are all enabled. Every parameter and local must be used.

**Xrm types** — Use `@types/xrm` for all CRM API calls (`Xrm.Page`, `Xrm.Attributes.*`, etc.). ESLint declares `Xrm` as a `readonly` global only in `src/content/**` files; it is not available in popup or background code.

**DOM construction** — Content scripts build DOM imperatively (`createElement` / `appendChild`). There is no template engine or framework.

**Panel toggle pattern** — The all-fields panel checks for its own `id` on load and removes itself if already present, making the button a toggle. New panels should follow the same toggle idiom.

**CSS isolation** — Panel styles use a single scoped root ID (`#crm-tools-fields-panel`) with descendant selectors to avoid leaking into or inheriting from the CRM page. Inline `<style>` injection guards against double-injection via a `STYLE_ID` check.

**Keyboard event isolation** — Inputs inside injected panels must call `e.stopPropagation()` on `keydown`/`keyup` to prevent the CRM host page from swallowing keyboard events.
