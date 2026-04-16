# Coding Conventions

**Analysis Date:** 2025-01-31

## Naming Patterns

**Files:**
- `kebab-case` for all source files: `all-fields.ts`, `hello-world.ts`, `popup.ts`
- CSS files share the name of their paired TypeScript file: `all-fields.css`, `popup.css`
- HTML files share the name of their folder entry point: `popup.html`

**Functions:**
- `camelCase` for all functions: `main()`, `buildPanel()`, `injectStyles()`, `formatValue()`, `copyStatics()`, `runLint()`
- Verb-noun pattern for action functions: `buildPanel`, `injectStyles`, `formatValue`

**Variables:**
- `camelCase` for local variables: `labelMap`, `sortedAttrs`, `entityName`, `closeBtn`, `searchInput`
- `SCREAMING_SNAKE_CASE` for module-level constants: `PANEL_ID`, `STYLE_ID`, `LOG`
- `camelCase` for destructured parameters: `([tab])` in Chrome API callbacks

**Types / Interfaces:**
- No custom type aliases or interfaces defined yet (project is small)
- TypeScript generics used on DOM queries: `tbody.querySelectorAll<HTMLTableRowElement>('tr')`
- Type assertions used when Xrm types are too broad: `(ctrl as Xrm.Controls.StandardControl).getLabel()`

**CSS Classes:**
- `kebab-case` for all CSS class names: `.tool-btn`, `.tool-group-label`, `.header-icon`, `.header-title`
- Panel-scoped content classes use `cfp-` prefix (short for "CRM Fields Panel"): `.cfp-header`, `.cfp-close`, `.cfp-subheader`, `.cfp-body`, `.cfp-type`, `.cfp-null`, `.cfp-no-results`, `.cfp-search`, `.cfp-error`
- IDs use `crm-tools-` prefix to avoid collision with host page: `crm-tools-fields-panel`, `crm-tools-fields-style`

**HTML IDs (buttons):**
- `btn-` prefix for button elements: `btn-hello-world`, `btn-all-fields`

## TypeScript Configuration

**Strict mode is fully enabled** (`tsconfig.json`):
- `"strict": true` — enables all strict type checks
- `"noUnusedLocals": true` — no unused variables
- `"noUnusedParameters": true` — no unused function parameters
- `"noImplicitReturns": true` — all code paths must return
- `"noEmit": true` — TypeScript is type-check only; esbuild handles compilation

**Target:** `ES2020`, `"lib": ["ES2020", "DOM"]`

**Module resolution:** `"moduleResolution": "bundler"` (esbuild handles bundling)

**External types:** `@types/chrome` and `@types/xrm` (Dynamics CRM) declared in `"types"` array

## Code Style

**Formatting:**
- No Prettier config present — formatting is enforced only through ESLint rules inherited from `typescript-eslint`
- Indentation: 2 spaces (observed throughout all source files)
- Single quotes for strings in TypeScript files
- Semicolons present

**Linting:**
- ESLint flat config (`eslint.config.js`) — ESLint v9 format
- Extends `js.configs.recommended` and `tseslint.configs.recommended`
- Per-file-group globals: `serviceworker` globals for `background.ts`, `browser` + `chrome` for popup/content, `node` for `build.js`
- `Xrm` declared as a `readonly` global only in `src/content/**/*.ts`
- Run command: `npm run lint` → `eslint src/`

**Non-null assertions:**
- Used sparingly when element existence is guaranteed by HTML structure: `document.getElementById('btn-hello-world')!`

**Optional chaining:**
- Used when API method may not exist on all attribute types: `attr.getAttributeType ? attr.getAttributeType() : '?'`
- Used for Xrm methods that may be absent: `(attr as Xrm.Attributes.OptionSetAttribute).getText?.()`

**Nullish coalescing / fallbacks:**
- `||` used for string fallbacks: `labelMap[name] || name`
- `??` used for null/undefined distinction: `(rawValue ?? 'null').toLowerCase()`

## Import Organization

**No external runtime dependencies** — all imports are type-only (dev tools) or Node built-ins.

**`build.js` import order** (the only file with real imports):
1. Third-party: `esbuild`, `eslint`
2. Node built-ins with `node:` prefix: `node:fs`

**Content/popup scripts:** No imports at all — self-contained IIFE bundles targeting Chrome extension injection. All code lives in a single file per entry point.

## Error Handling

**Pattern: try/catch with silent fallback**
All Xrm API calls that may fail are wrapped in try/catch with a fallback value rather than propagating errors:

```typescript
// In all-fields.ts — label map building
try {
  labelMap[name] = (ctrl as Xrm.Controls.StandardControl).getLabel() || name;
} catch {
  labelMap[name] = name;
}

// In formatValue() — reading attribute value
try {
  const val = attr.getValue() as unknown;
  // ...
} catch {
  return '(error reading value)';
}

// In main() — inline value reading
try { val = attr.getValue(); } catch { val = '(error)'; }
```

**Guard clauses for environment checks:**
Xrm availability is checked with `typeof` guard before use:
```typescript
if (typeof Xrm === 'undefined' || !Xrm.Page) {
  LOG('Xrm.Page not found in this frame — skipping.');
  return;
}
```

**Toggle/idempotency pattern:**
Content scripts check for existing DOM state before doing work:
```typescript
const existing = document.getElementById(PANEL_ID);
if (existing) {
  existing.remove();
  return;
}
```

**No thrown errors:** No `throw` statements exist in the codebase. Errors surface as user-visible fallback strings (`'(error)'`, `'(error reading value)'`).

## Logging

**Module-level log helper constant:**
```typescript
const LOG = (msg: string) => console.log('[CRM Tools]', msg);
```
- Defined once per content script file
- All diagnostic logging goes through `LOG()`
- Direct `console.log` used only for per-attribute data dumps in the attributes loop (intentional verbose output)
- No logging framework — plain `console.log` with `[CRM Tools]` prefix for filtering in DevTools

## DOM Manipulation Patterns

**Manual DOM construction** — no templating library. Elements are created with `document.createElement()` and assembled with `appendChild()`:

```typescript
const panel = document.createElement('div');
panel.id = PANEL_ID;

const header = document.createElement('div');
header.className = 'cfp-header';

header.appendChild(title);
header.appendChild(closeBtn);
panel.appendChild(header);
```

**`textContent` over `innerHTML`** — user-derived data (attribute names, values) always goes through `textContent` to avoid XSS. `innerHTML` is only used for static trusted markup:
```typescript
thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>';
```

**`dataset` attributes for filter state:**
Row filter data is stored as `dataset` properties on `<tr>` elements, avoiding repeated Xrm API calls during search:
```typescript
tr.dataset.searchLabel  = label.toLowerCase();
tr.dataset.searchSchema = name.toLowerCase();
tr.dataset.searchValue  = (rawValue ?? 'null').toLowerCase();
```

**Event propagation isolation:**
Content scripts stop keyboard event propagation to prevent the host CRM page from intercepting input:
```typescript
searchInput.addEventListener('keydown', (e) => e.stopPropagation());
searchInput.addEventListener('keyup',   (e) => e.stopPropagation());
```

**`requestAnimationFrame` for post-render measurements:**
DOM measurements that require layout are deferred to rAF:
```typescript
requestAnimationFrame(() => {
  const tableWidth = table.offsetWidth;
  panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + 'px';
});
```

**Style injection pattern for content scripts:**
Inline CSS is injected via a `<style>` tag with a known ID to allow idempotent injection:
```typescript
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `...css...`;
  document.head.appendChild(style);
}
```
Note: An external `all-fields.css` file also exists and is copied to `dist/` but not currently injected. The inline style in `all-fields.ts` is what actually runs.

## CSS Conventions

**Reset:** Universal `* { box-sizing: border-box; margin: 0; padding: 0; }` applied in `popup.css`

**Color palette (consistent across all files):**
- Brand blue: `#1e64c8`
- Hover blue (background): `#e8f0fe`, `#dceafe`
- Active blue: `#d2e3fc`
- Light blue border: `#c5d8fb`
- Table header background: `#f0f4ff`
- Alternate row: `#f8f9ff`
- Text primary: `#222`
- Text muted: `#555`, `#666`, `#888`, `#aaa`
- Background light: `#f5f5f5` (popup body), `#fff` (cards/panel)
- Type badge: `#e8e8e8` background, `#444` text

**Typography:**
- Font stack: `Segoe UI, Arial, sans-serif` (matches Dynamics CRM UI)
- Monospace font: `Consolas, monospace` (for schema names)
- Base font size: `13px`
- Label/badge font size: `11px`
- Header font size: `14px`
- Schema column font size: `12px`

**Section dividers in CSS:**
Box-drawing comments used to section popup.css:
```css
/* ── Header ───────────────────────────────────────── */
/* ── Main content ─────────────────────────────────── */
/* ── Tool group ───────────────────────────────────── */
/* ── Tool button ──────────────────────────────────── */
```

**Scoping strategy for content panel:**
All panel styles are prefixed with `#crm-tools-fields-panel` to prevent leaking into the host CRM page's styles.

**Transitions:**
Subtle transitions on interactive elements: `transition: background 0.15s, border-color 0.15s`

**Z-index:**
Maximum z-index used for the panel overlay: `z-index: 2147483647` (max 32-bit integer, ensures panel floats above CRM page)

## Function Design

**Size:** Functions are small and single-purpose. Largest function is `buildPanel()` (~130 lines) which handles all panel DOM construction. It is intentionally monolithic since it's the one UI assembly point.

**Entry point pattern:** Each content script ends with a direct `main()` call at module scope (IIFE context from esbuild):
```typescript
main();
```

**`void` return type annotation** on all top-level functions that don't return values:
```typescript
function main(): void { ... }
function injectStyles(): void { ... }
function buildPanel(...): void { ... }
```

**Explicit return type on value-returning functions:**
```typescript
function formatValue(attr: Xrm.Attributes.Attribute): string | null { ... }
```

**`let val: unknown`** pattern for values read from external APIs before type narrowing:
```typescript
let val: unknown;
try { val = attr.getValue(); } catch { val = '(error)'; }
```

## Module Design

**No exports:** All content/popup scripts are self-contained. No `export` statements — esbuild bundles each entry point as an IIFE.

**No barrel files** — not applicable given the flat per-feature file structure.

**Shared utilities:** None yet — each file is standalone. The `LOG` helper and `PANEL_ID`/`STYLE_ID` constants are duplicated if needed per file (currently only in `all-fields.ts`).

---

*Convention analysis: 2025-01-31*
