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
    dropdown.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'injectAllFields' });
  });

  const optionSetsBtn = document.createElement('button');
  optionSetsBtn.className = 'crt-btn';
  optionSetsBtn.textContent = '🔘 Option Sets';
  optionSetsBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'injectOptionSets' });
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
