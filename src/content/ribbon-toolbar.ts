// DOM-injection toolbar for CRM pages (ISOLATED world).
// Injects a "C" toggle button at the far left of #navBar (the CRM masthead nav bar),
// mirroring the crm-power-pane-button structure.
// Does NOT touch Xrm — delegates actions to background via sendMessage.

const TOOLBAR_ID = 'crm-tools-ribbon-toolbar';
const STYLE_ID   = 'crm-tools-ribbon-style';
const DROPDOWN_ID = 'crm-tools-ribbon-dropdown';
const CTX_BANNER_ID = 'crm-tools-ctx-banner';

let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

/** Show a persistent banner when the extension context has been invalidated. */
function showContextInvalidatedBanner(): void {
  if (document.getElementById(CTX_BANNER_ID)) return;
  const banner = document.createElement('div');
  banner.id = CTX_BANNER_ID;
  banner.style.cssText = [
    'position: fixed', 'top: 0', 'left: 0', 'right: 0',
    'z-index: 2147483647', 'background: #c0392b', 'color: #fff',
    'font-family: Segoe UI, Arial, sans-serif', 'font-size: 13px',
    'padding: 8px 16px', 'text-align: center',
  ].join('; ');
  banner.textContent = '⚠️ DynamicsCat was reloaded — please refresh this tab to restore the toolbar.';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'margin-left: 12px; background: transparent; border: none; color: #fff; cursor: pointer; font-size: 15px;';
  closeBtn.addEventListener('click', () => banner.remove());
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

/** Send a message to the background service worker, handling invalidated contexts gracefully. */
function sendAction(action: string): void {
  try {
    chrome.runtime.sendMessage({ action });
  } catch {
    // Extension was reloaded/updated while the tab was open. Chrome invalidates the
    // runtime context but DOM event listeners remain live — any chrome.runtime call
    // will throw "Extension context invalidated". Prompt the user to refresh.
    showContextInvalidatedBanner();
  }
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-ribbon-toolbar .navTabButtonLink { cursor: pointer; text-decoration: none; }
.crt-dropdown-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; height: 40px; padding: 0 16px;
  background: transparent; border: none;
  color: #1f1f1f; font-size: 13px; font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif;
  cursor: pointer; text-align: left; white-space: nowrap;
}
.crt-dropdown-btn:hover { background: #f1f3f4; }
.crt-dropdown-btn:active { background: #e8eaed; }
.crt-btn-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
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
  wrapper.title = 'DynamicsCat';

  const link = document.createElement('a');
  link.className = 'navTabButtonLink';
  link.role = 'button';
  link.tabIndex = 0;
  link.title = '';

  const imgContainer = document.createElement('span');
  imgContainer.className = 'navTabButtonImageContainer';

  const icon = document.createElement('img');
  let iconSrc = '';
  try {
    iconSrc = chrome.runtime.getURL('icons/icon32.png');
  } catch { /* context already invalid — icon will be missing, banner shown on first click */ }
  icon.src = iconSrc;
  icon.alt = 'DynamicsCat';
  icon.style.cssText = 'width:24px;height:24px;display:block;';

  imgContainer.appendChild(icon);
  link.appendChild(imgContainer);
  wrapper.appendChild(link);

  // --- Dropdown panel — appended to document.body for z-index escape ---
  const dropdown = document.createElement('div');
  dropdown.id = DROPDOWN_ID;
  dropdown.style.cssText = [
    'position: fixed',
    'z-index: 2147483647',
    'background: #fff',
    'border-radius: 8px',
    'box-shadow: 0 2px 10px rgba(0,0,0,0.18)',
    'padding: 8px 0',
    'min-width: 220px',
    'display: none',
  ].join('; ');

  function makeDropdownBtn(icon: string, label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'crt-dropdown-btn';
    const iconEl = document.createElement('span');
    iconEl.className = 'crt-btn-icon';
    iconEl.textContent = icon;
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    btn.appendChild(iconEl);
    btn.appendChild(labelEl);
    return btn;
  }

  const allFieldsBtn = makeDropdownBtn('📋', 'All Fields');
  allFieldsBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    sendAction('injectAllFields');
  });

  const optionSetsBtn = makeDropdownBtn('🔘', 'Option Sets');
  optionSetsBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    sendAction('injectOptionSets');
  });

  dropdown.appendChild(allFieldsBtn);
  dropdown.appendChild(optionSetsBtn);

  const showHiddenBtn = makeDropdownBtn('👁', 'Hidden Fields');
  showHiddenBtn.addEventListener('click', () => {
    dropdown.style.display = 'none';
    sendAction('injectShowHiddenFields');
  });

  dropdown.appendChild(showHiddenBtn);

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

  // --- Click-outside handler (replace previous to avoid duplicate listeners) ---
  if (outsideClickHandler) document.removeEventListener('click', outsideClickHandler);
  outsideClickHandler = (e: MouseEvent) => {
    if (!wrapper.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  };
  document.addEventListener('click', outsideClickHandler);

  // --- Inject into #navBar (where crm-power-pane-button lives) ---
  // If navBar isn't in the DOM yet, clean up and let the MutationObserver retry.
  // Never fall back to body — avoids polluting CRM form iframes with a stray button.
  const navBar = document.getElementById('navBar');
  if (!navBar) {
    dropdown.remove();
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler);
      outsideClickHandler = null;
    }
    return;
  }
  navBar.prepend(wrapper);
}

/** Re-inject the toolbar whenever CRM removes it (e.g. internal SPA navigation). */
function startObserver(): void {
  // Observe document.body (never replaced) rather than #crmMasthead so that
  // the observer stays alive even when CRM SPA navigation replaces the masthead element.
  const root = document.body;
  new MutationObserver(() => {
    if (!document.getElementById(TOOLBAR_ID)) buildToolbar();
  }).observe(root, { childList: true, subtree: true });
}

/** Returns true when the page is a Dynamics CRM or Dynamics 365 page.
 *  Detects CRM 2016 via body[scroll=no] and Dynamics 365 via div[data-id=topBar]. */
function isCrmPage(): boolean {
  const mainBody = document.querySelectorAll('body[scroll=no]');
  const topBar   = document.querySelector('div[data-id=topBar]');
  return (mainBody && mainBody.length > 0) || topBar !== null;
}

if (isCrmPage()) {
  buildToolbar();
  startObserver();
}
