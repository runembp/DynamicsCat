---
phase: 260417-cfm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/ribbon-toolbar.ts
autonomous: true
requirements:
  - QUICK-01
must_haves:
  truths:
    - "A 'C' button appears at the far left of the CRM ribbon/command bar"
    - "Clicking 'C' toggles a dropdown containing All Fields and Option Sets buttons"
    - "Dropdown is hidden by default; shown/hidden via display toggle"
    - "Clicking outside the dropdown closes it"
    - "Tool buttons send chrome.runtime.sendMessage exactly as before"
    - "Falls back to fixed top-left position when no ribbon selector matches"
    - "Toolbar is never injected twice (idempotency guard)"
  artifacts:
    - path: "src/content/ribbon-toolbar.ts"
      provides: "Complete rewrite — DOM injection into CRM ribbon"
      contains: "RIBBON_SELECTORS"
  key_links:
    - from: "C button click handler"
      to: "dropdown display toggle"
      via: "dropdown.style.display === 'none' ? 'block' : 'none'"
    - from: "document click handler"
      to: "dropdown close"
      via: "!wrapper.contains(e.target)"
    - from: "tool buttons"
      to: "chrome.runtime.sendMessage"
      via: "click event listener"
---

<objective>
Completely rewrite `src/content/ribbon-toolbar.ts` to replace the fixed-position floating overlay with a proper DOM injection into the CRM ribbon.

Purpose: The toolbar should integrate naturally into the Dynamics CRM 2016 ribbon/command bar as a "C" toggle button at the far left, opening a dropdown with the two tool actions.

Output: Single updated TypeScript file — no other changes needed.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/content/ribbon-toolbar.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite ribbon-toolbar.ts with DOM injection</name>
  <files>src/content/ribbon-toolbar.ts</files>
  <action>
Replace the entire contents of `src/content/ribbon-toolbar.ts` with the implementation below.

**Key rules (TypeScript strict — noUnusedLocals, noUnusedParameters, noImplicitReturns):**
- Keep `TOOLBAR_ID` constant and `document.getElementById(TOOLBAR_ID)` guard at the top of `buildToolbar()`
- All variables must be used; no implicit any; all code paths return

**Implementation:**

```typescript
// DOM-injection toolbar for CRM pages (ISOLATED world).
// Injects a "C" toggle button at the far left of the CRM ribbon.
// Does NOT touch Xrm — delegates actions to background via sendMessage.

const TOOLBAR_ID = 'crm-tools-ribbon-toolbar';
const STYLE_ID   = 'crm-tools-ribbon-style';

const RIBBON_SELECTORS = [
  '#RibbonContainer',
  '#crmRibbonManager',
  '.ms-crm-commandBar',
  '#CommandBarContainer',
  '#navBar',
  'nav[role="navigation"]',
] as const;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-ribbon-toolbar {
  position: relative;
  display: inline-flex;
  align-items: center;
  font-family: Segoe UI, Arial, sans-serif;
  user-select: none;
}
#crm-tools-ribbon-toolbar.crt-fallback {
  position: fixed;
  top: 6px;
  left: 6px;
  z-index: 2147483647;
}
#crm-tools-ribbon-toolbar .crt-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #1e64c8;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  flex-shrink: 0;
}
#crm-tools-ribbon-toolbar .crt-toggle:hover {
  background: #174fa0;
}
#crm-tools-ribbon-toolbar .crt-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 2147483647;
  background: #1e64c8;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  padding: 4px;
  min-width: 150px;
  display: none;
}
#crm-tools-ribbon-toolbar .crt-btn {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-family: Segoe UI, Arial, sans-serif;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: background 0.15s;
  box-sizing: border-box;
}
#crm-tools-ribbon-toolbar .crt-btn:first-child {
  margin-top: 0;
}
#crm-tools-ribbon-toolbar .crt-btn:hover {
  background: rgba(255,255,255,0.28);
}
  `;
  (document.head || document.documentElement).appendChild(style);
}

function findRibbonContainer(): Element | null {
  for (const selector of RIBBON_SELECTORS) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function buildToolbar(): void {
  // Idempotent: skip if already injected (e.g. soft navigation without full page unload)
  if (document.getElementById(TOOLBAR_ID)) return;

  injectStyles();

  // --- Wrapper ---
  const wrapper = document.createElement('div');
  wrapper.id = TOOLBAR_ID;

  // --- Toggle "C" button ---
  const toggle = document.createElement('button');
  toggle.className = 'crt-toggle';
  toggle.textContent = 'C';
  toggle.title = 'CRM Tools';

  // --- Dropdown panel ---
  const dropdown = document.createElement('div');
  dropdown.className = 'crt-dropdown';

  const allFieldsBtn = document.createElement('button');
  allFieldsBtn.className = 'crt-btn';
  allFieldsBtn.textContent = '📋 All Fields';
  allFieldsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'injectAllFields' });
    dropdown.style.display = 'none';
  });

  const optionSetsBtn = document.createElement('button');
  optionSetsBtn.className = 'crt-btn';
  optionSetsBtn.textContent = '🔘 Option Sets';
  optionSetsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'injectOptionSets' });
    dropdown.style.display = 'none';
  });

  dropdown.appendChild(allFieldsBtn);
  dropdown.appendChild(optionSetsBtn);

  // --- Toggle click handler ---
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });

  // --- Click-outside handler ---
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });

  wrapper.appendChild(toggle);
  wrapper.appendChild(dropdown);

  // --- Inject into ribbon or fall back to body ---
  const ribbonContainer = findRibbonContainer();
  if (ribbonContainer) {
    ribbonContainer.prepend(wrapper);
  } else {
    wrapper.classList.add('crt-fallback');
    document.body.prepend(wrapper);
  }
}

buildToolbar();
```
  </action>
  <verify>
    <automated>cd C:\Source\CRMChromeTools && npx tsc --noEmit</automated>
  </verify>
  <done>
    - `src/content/ribbon-toolbar.ts` contains the new implementation
    - `npx tsc --noEmit` exits 0 with no errors
    - `RIBBON_SELECTORS` array is present
    - `position: fixed` no longer appears in the default wrapper style (only in `.crt-fallback`)
    - `chrome.runtime.sendMessage` calls are preserved unchanged
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Content script → CRM DOM | Script prepends elements into host page DOM |
| Content script → Background | `chrome.runtime.sendMessage` crosses extension trust boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-cfm-01 | Tampering | DOM injection | accept | Isolated world content script cannot be tampered by page JS; CRM page cannot access extension's JS objects |
| T-cfm-02 | Spoofing | sendMessage calls | accept | Messages go directly to extension background; no external origin involved |
| T-cfm-03 | Denial of Service | Idempotency guard | mitigate | `getElementById(TOOLBAR_ID)` guard prevents duplicate injection on soft navigations |
</threat_model>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. Confirm `RIBBON_SELECTORS` array with all 6 selectors is present
3. Confirm wrapper uses `position: relative` (not `position: fixed`) in base style
4. Confirm `.crt-fallback` class applies `position: fixed; top: 6px; left: 6px`
5. Confirm dropdown `display: none` default and toggle logic
6. Confirm `chrome.runtime.sendMessage({ action: 'injectAllFields' })` and `{ action: 'injectOptionSets' }` are unchanged
</verification>

<success_criteria>
- TypeScript compiles cleanly (strict mode, no unused locals/params)
- "C" button injects at far-left of matched ribbon container via `prepend()`
- Dropdown hidden by default, toggled on "C" click, closed on outside click
- Falls back gracefully to `document.body.prepend` + `crt-fallback` class when no selector matches
- sendMessage calls identical to original implementation
</success_criteria>

<output>
After completion, create `.planning/quick/260417-cfm-redesign-ribbon-toolbar-inject-into-crm-/260417-cfm-01-SUMMARY.md`
</output>
