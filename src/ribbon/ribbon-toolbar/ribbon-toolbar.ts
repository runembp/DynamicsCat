// DOM-injection toolbar for CRM pages (ISOLATED world).
// Injects a "C" toggle button at the far left of #navBar (the CRM masthead nav bar),
// mirroring the crm-power-pane-button structure.
// Does NOT touch Xrm — delegates actions to background via sendMessage.

import { ACTIONS } from '../../actions';
import { STATE_KEYS, getSharedDataset, writeFlag } from '../../content/state';

const TOOLBAR_ID = 'crm-tools-ribbon-toolbar';
const STYLE_ID   = 'crm-tools-ribbon-style';
const DROPDOWN_ID = 'crm-tools-ribbon-dropdown';
const CTX_BANNER_ID = 'crm-tools-ctx-banner';
const DEFAULT_READONLY_SHORTCUT = 'alt';
const DEFAULT_LOOKUPS_OPENER_SHORTCUT = 'ctrl';

type ShortcutStorage = {
  readonlyShortcut?: string;
  lookupsOpenerShortcut?: string;
};

function createShortcutSelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'crt-readonly-settings-select';

  const options = [
    { value: 'alt+shift', label: 'Alt+Shift+Click' },
    { value: 'alt', label: 'Alt+Click' },
    { value: 'shift', label: 'Shift+Click' },
    { value: 'ctrl', label: 'Ctrl+Click' },
    { value: 'ctrl+shift', label: 'Ctrl+Shift+Click' },
  ];

  for (const option of options) {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  }

  return select;
}

function loadShortcutSettings(callback: (settings: ShortcutStorage) => void): void {
  try {
    chrome.storage.local.get(['readonlyShortcut', 'lookupsOpenerShortcut'], (result) => {
      callback(result as ShortcutStorage);
    });
  } catch {
    showContextInvalidatedBanner();
  }
}

function stopKeyPropagation(element: HTMLSelectElement): void {
  for (const eventName of ['keydown', 'keyup']) {
    element.addEventListener(eventName, (e) => {
      e.stopPropagation();
    });
  }
}

/** Buttons that are hidden until their probe succeeds. Keyed by conditional type. */
const conditionalButtons: Record<string, HTMLButtonElement[]> = {};

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
.crt-dropdown-btn.crt-active { background: rgba(46,125,50,0.08); }
.crt-dropdown-btn.crt-active:hover { background: rgba(46,125,50,0.14); }
.crt-btn-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.crt-btn-active-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e7d32; margin-left: auto; flex-shrink: 0; display: none; }
.crt-dropdown-btn.crt-active .crt-btn-active-dot { display: block; }
.crt-readonly-settings-wrap { display: flex; flex-direction: column; }
.crt-readonly-settings-row {
  display: flex; align-items: center;
}
.crt-readonly-settings-row .crt-dropdown-btn {
  flex: 1 1 auto; width: auto; min-width: 0;
}
.crt-readonly-settings-gear {
  background: transparent; border: none; cursor: pointer;
  font-size: 14px; padding: 2px 4px; margin-right: 16px; border-radius: 4px; opacity: 0.6;
  flex-shrink: 0;
}
.crt-readonly-settings-gear:hover { opacity: 1; background: #f1f3f4; }
.crt-readonly-settings-panel {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #5f6368;
  padding: 0 16px 8px 48px;
}
.crt-readonly-settings-panel[hidden] { display: none; }
.crt-readonly-settings-select {
  font-family: inherit; font-size: 12px; padding: 2px 4px;
  border: 1px solid #dadce0; border-radius: 4px; background: #fff; color: #1f1f1f;
}
   `;
  (document.head || document.documentElement).appendChild(style);
}

function setButtonActive(btn: HTMLButtonElement, active: boolean): void {
  btn.classList.toggle('crt-active', active);
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
    'min-width: 400px',
    'display: none',
    'grid-template-columns: 1fr 1fr',
  ].join('; ');

  function makeDropdownBtn(icon: string, label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'crt-dropdown-btn';
    const iconEl = document.createElement('span');
    iconEl.className = 'crt-btn-icon';
    iconEl.textContent = icon;
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    const dot = document.createElement('span');
    dot.className = 'crt-btn-active-dot';
    btn.appendChild(iconEl);
    btn.appendChild(labelEl);
    btn.appendChild(dot);
    return btn;
  }

  // --- Build buttons from action registry ---
  const colLeft = document.createElement('div');
  const colRight = document.createElement('div');
  colRight.style.cssText = 'border-left: 1px solid #e8eaed;';

  // Actions are split into two columns: first 4 left, rest right
  const LEFT_ACTIONS = new Set([
    'injectAllFields',
    'injectOptionSets',
    'injectShowHiddenFields',
    'injectDirtyFields',
    'injectOverrideReadonly',
    'injectLookupsOpener',
  ]);

  // Track buttons that show active state
  const activeButtons: Record<string, HTMLButtonElement> = {};
  let readonlyShortcutSelect: HTMLSelectElement | null = null;
  let lookupsOpenerShortcutSelect: HTMLSelectElement | null = null;

  const bindShortcutSelect = (
    select: HTMLSelectElement,
    storageKey: 'readonlyShortcut' | 'lookupsOpenerShortcut',
    otherStorageKey: 'readonlyShortcut' | 'lookupsOpenerShortcut',
    otherToolLabel: string,
    defaultValue: string,
  ): void => {
    let previousValue = defaultValue;
    select.addEventListener('focus', () => {
      previousValue = select.value;
    });
    select.addEventListener('change', () => {
      const nextValue = select.value;
      loadShortcutSettings((settings) => {
        const otherValue = settings[otherStorageKey]
          || (otherStorageKey === 'readonlyShortcut' ? DEFAULT_READONLY_SHORTCUT : DEFAULT_LOOKUPS_OPENER_SHORTCUT);
        if (nextValue === otherValue) {
          alert(`Shortcut already used by ${otherToolLabel}`);
          select.value = previousValue;
          return;
        }
        try {
          chrome.storage.local.set({ [storageKey]: nextValue });
          previousValue = nextValue;
        } catch {
          showContextInvalidatedBanner();
        }
      });
    });
    stopKeyPropagation(select);
  };

  const createShortcutSettingsControl = (
    btn: HTMLButtonElement,
    storageKey: 'readonlyShortcut' | 'lookupsOpenerShortcut',
    defaultValue: string,
    otherStorageKey: 'readonlyShortcut' | 'lookupsOpenerShortcut',
    otherToolLabel: string,
  ): HTMLDivElement => {
    const wrap = document.createElement('div');
    wrap.className = 'crt-readonly-settings-wrap';

    const settingsRow = document.createElement('div');
    settingsRow.className = 'crt-readonly-settings-row';

    const gearBtn = document.createElement('button');
    gearBtn.type = 'button';
    gearBtn.className = 'crt-readonly-settings-gear';
    gearBtn.title = 'Shortcut settings';
    gearBtn.setAttribute('aria-label', 'Shortcut settings');
    gearBtn.textContent = '⚙️';

    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'crt-readonly-settings-panel';
    settingsPanel.hidden = true;

    const label = document.createElement('label');
    label.textContent = 'Shortcut:';

    const select = createShortcutSelect();

    const loadShortcut = (): void => {
      loadShortcutSettings((result) => {
        select.value = storageKey === 'readonlyShortcut'
          ? result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT
          : result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
      });
    };

    gearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextHidden = !settingsPanel.hidden;
      settingsPanel.hidden = nextHidden;
      if (!nextHidden) loadShortcut();
    });

    bindShortcutSelect(select, storageKey, otherStorageKey, otherToolLabel, defaultValue);

    settingsPanel.appendChild(label);
    settingsPanel.appendChild(select);
    settingsRow.appendChild(btn);
    settingsRow.appendChild(gearBtn);
    wrap.appendChild(settingsRow);
    wrap.appendChild(settingsPanel);
    return wrap;
  };

  for (const def of ACTIONS) {
    if (!def.popupBtnId) continue;
    const btn = makeDropdownBtn(def.icon, def.label);
    btn.addEventListener('click', () => {
      dropdown.style.display = 'none';
      if (def.action === 'injectOverrideReadonly') {
        const willBeActive = getSharedDataset()[STATE_KEYS.readonlyOverrideActive] !== '1';
        try { chrome.storage.local.set({ readonlyOverride: willBeActive }); } catch { /* context invalidated */ }
      }
      if (def.action === 'injectLookupsOpener') {
        const willBeActive = getSharedDataset()[STATE_KEYS.lookupsOpenerActive] !== '1';
        try { chrome.storage.local.set({ lookupsOpenerOverride: willBeActive }); } catch { /* context invalidated */ }
      }
      sendAction(def.action);
    });
    if (def.conditional) {
      btn.style.display = 'none';
      (conditionalButtons[def.conditional] ??= []).push(btn);
    }
    if (
      def.action === 'injectShowHiddenFields'
      || def.action === 'injectDirtyFields'
      || def.action === 'injectOverrideReadonly'
      || def.action === 'injectLookupsOpener'
    ) {
      activeButtons[def.action] = btn;
    }

    const parent = LEFT_ACTIONS.has(def.action) ? colLeft : colRight;
    if (def.action !== 'injectOverrideReadonly' && def.action !== 'injectLookupsOpener') {
      parent.appendChild(btn);
      continue;
    }
    if (def.action === 'injectOverrideReadonly') {
    const wrap = createShortcutSettingsControl(
      btn,
      'readonlyShortcut',
      DEFAULT_READONLY_SHORTCUT,
      'lookupsOpenerShortcut',
      'Lookups Opener',
    );
      readonlyShortcutSelect = wrap.querySelector('select');
      parent.appendChild(wrap);
      continue;
    }

    const wrap = createShortcutSettingsControl(
      btn,
      'lookupsOpenerShortcut',
      DEFAULT_LOOKUPS_OPENER_SHORTCUT,
      'readonlyShortcut',
      'Override Readonly',
    );
    lookupsOpenerShortcutSelect = wrap.querySelector('select');
    parent.appendChild(wrap);
  }

  loadShortcutSettings((result) => {
    if (readonlyShortcutSelect) {
      readonlyShortcutSelect.value = result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT;
    }
    if (lookupsOpenerShortcutSelect) {
      lookupsOpenerShortcutSelect.value = result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
    }
  });

  dropdown.appendChild(colLeft);
  dropdown.appendChild(colRight);

  // Append dropdown to body so it escapes the ribbon's stacking context
  document.body.appendChild(dropdown);

  // --- Toggle click handler ---
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.style.display === 'grid') {
      dropdown.style.display = 'none';
    } else {
      // Recalculate position each time in case page has scrolled
      const rect = wrapper.getBoundingClientRect();
      dropdown.style.top  = rect.bottom + 'px';
      dropdown.style.left = rect.left + 'px';
      // Reflect toggle state written by MAIN-world content scripts via dataset
      const ds = getSharedDataset();
      const hiddenBtn = activeButtons['injectShowHiddenFields'];
      const dirtyBtn = activeButtons['injectDirtyFields'];
      const readonlyBtn = activeButtons['injectOverrideReadonly'];
      const lookupsBtn = activeButtons['injectLookupsOpener'];
      if (hiddenBtn) setButtonActive(hiddenBtn, ds[STATE_KEYS.hiddenActive] === '1');
      if (dirtyBtn) setButtonActive(dirtyBtn, ds[STATE_KEYS.dirtyActive] === '1');
      if (readonlyBtn) setButtonActive(readonlyBtn, ds[STATE_KEYS.readonlyOverrideActive] === '1');
      if (lookupsBtn) setButtonActive(lookupsBtn, ds[STATE_KEYS.lookupsOpenerActive] === '1');
      dropdown.style.display = 'grid';
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

  // --- Blur handler: close dropdown when focus leaves top window (e.g. click in CRM iframe) ---
  window.addEventListener('blur', () => {
    dropdown.style.display = 'none';
  });

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

/** Returns true only when the CRM nav bar is present in the DOM.
 *  Main CRM windows always have #navBar at document_idle (server-rendered).
 *  Dialog and popup windows (Advanced Find, Edit Form, etc.) never do — skipping
 *  the MutationObserver on those pages prevents runaway DOM querying and browser hangs. */
function hasNavBar(): boolean {
  return document.getElementById('navBar') !== null;
}

/**
 * Probe conditional actions via background executeScript (MAIN world).
 * The ribbon runs in ISOLATED world so cannot access Xrm directly.
 * Background runs the probe in MAIN world and returns the result.
 */
function probeConditionalActions(): void {
  try {
    chrome.runtime.sendMessage({ action: 'probeActivatable' }, (response) => {
      if (response?.activatable) {
        const ds = getSharedDataset();
        ds[STATE_KEYS.activatable] = '1';
        for (const btn of conditionalButtons['activatable'] ?? []) {
          btn.style.display = '';
        }
      }
    });
  } catch {
    showContextInvalidatedBanner();
  }
}

if (isCrmPage() && hasNavBar()) {
  buildToolbar();
  startObserver();
  probeConditionalActions();
  try {
    chrome.storage.local.get(['readonlyOverride', 'lookupsOpenerOverride'], (result) => {
      if (result.readonlyOverride !== false) {
        writeFlag('readonlySilentInject', '1');
        sendAction('injectOverrideReadonly');
      }
      if (result.lookupsOpenerOverride !== false) {
        writeFlag('lookupsOpenerSilentInject', '1');
        sendAction('injectLookupsOpener');
      }
    });
  } catch {
    showContextInvalidatedBanner();
  }

  // Listen for background-tab-open requests from MAIN world content scripts (via postMessage across frames)
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type !== 'dynamicscat-open-background-tab' || !e.data.url) return;
    const url = e.data.url as string;
    if (!url.startsWith(window.location.origin + '/')) return;
    try {
      chrome.runtime.sendMessage({ action: 'openBackgroundTab', url });
    } catch {
      showContextInvalidatedBanner();
    }
  });
}
