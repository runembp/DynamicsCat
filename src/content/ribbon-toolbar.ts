// DOM-injection toolbar for CRM pages (ISOLATED world).
// Injects a "C" toggle button at the far left of #navBar (the CRM masthead nav bar),
// mirroring the crm-power-pane-button structure.
// Does NOT touch Xrm — delegates actions to background via sendMessage.

const TOOLBAR_ID = 'crm-tools-ribbon-toolbar';
const STYLE_ID   = 'crm-tools-ribbon-style';
const DROPDOWN_ID = 'crm-tools-ribbon-dropdown';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-ribbon-toolbar .navTabButtonLink { cursor: pointer; text-decoration: none; }
#crm-tools-ribbon-toolbar .crt-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  background: #1e64c8; color: #fff;
  font-size: 14px; font-weight: 700;
  border-radius: 3px; font-family: Segoe UI, Arial, sans-serif;
}
.crt-dropdown-btn {
  display: block; width: 100%; padding: 6px 12px;
  background: transparent; border: none; border-radius: 3px;
  color: #fff; font-size: 13px; font-family: Segoe UI, Arial, sans-serif;
  cursor: pointer; text-align: left; white-space: nowrap;
}
.crt-dropdown-btn:hover { background: rgba(255,255,255,0.2); }
.crt-fallback { position: fixed !important; top: 6px; left: 6px; z-index: 2147483646; }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function buildToolbar(): void {
  // Idempotent: skip if already injected (e.g. soft navigation without full page unload)
  if (document.getElementById(TOOLBAR_ID)) return;

  // Clean up any detached dropdown from a previous injection
  const staleDropdown = document.getElementById(DROPDOWN_ID);
  if (staleDropdown) staleDropdown.remove();

  injectStyles();

  // --- Wrapper: mirrors <span class="navTabButton"> structure ---
  const wrapper = document.createElement('span');
  wrapper.className = 'navTabButton';
  wrapper.id = TOOLBAR_ID;
  wrapper.title = 'CRM Tools';

  const link = document.createElement('a');
  link.className = 'navTabButtonLink';
  link.role = 'button';
  link.tabIndex = 0;
  link.title = '';

  const imgContainer = document.createElement('span');
  imgContainer.className = 'navTabButtonImageContainer';

  const icon = document.createElement('span');
  icon.className = 'crt-icon';
  icon.textContent = 'C';

  imgContainer.appendChild(icon);
  link.appendChild(imgContainer);
  wrapper.appendChild(link);

  // --- Dropdown panel — appended to document.body for z-index escape ---
  const dropdown = document.createElement('div');
  dropdown.id = DROPDOWN_ID;
  dropdown.style.cssText = [
    'position: fixed',
    'z-index: 2147483647',
    'background: #1e64c8',
    'border-radius: 4px',
    'box-shadow: 0 4px 12px rgba(0,0,0,0.3)',
    'padding: 4px',
    'min-width: 160px',
    'display: none',
  ].join('; ');

  const allFieldsBtn = document.createElement('button');
  allFieldsBtn.className = 'crt-dropdown-btn';
  allFieldsBtn.textContent = '📋 All Fields';
  allFieldsBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'injectAllFields' });
  });

  const optionSetsBtn = document.createElement('button');
  optionSetsBtn.className = 'crt-dropdown-btn';
  optionSetsBtn.textContent = '🔘 Option Sets';
  optionSetsBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'injectOptionSets' });
  });

  dropdown.appendChild(allFieldsBtn);
  dropdown.appendChild(optionSetsBtn);

  // Append dropdown to body so it escapes the ribbon's stacking context
  document.body.appendChild(dropdown);

  // --- Toggle click handler ---
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    } else {
      // Recalculate position each time in case page has scrolled
      const rect = wrapper.getBoundingClientRect();
      dropdown.style.top  = rect.bottom + 'px';
      dropdown.style.left = rect.left + 'px';
      dropdown.style.display = 'block';
    }
  });

  // --- Click-outside handler ---
  document.addEventListener('click', (e: MouseEvent) => {
    if (!wrapper.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });

  // --- Inject into #navBar (where crm-power-pane-button lives), fall back to body ---
  const navBar = document.getElementById('navBar');
  if (navBar) {
    navBar.prepend(wrapper);
  } else {
    wrapper.classList.add('crt-fallback');
    document.body.prepend(wrapper);
  }
}

buildToolbar();
