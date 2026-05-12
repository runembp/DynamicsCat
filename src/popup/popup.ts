import { ACTIONS } from '../actions';

const DEFAULT_READONLY_SHORTCUT = 'alt';
const DEFAULT_LOOKUPS_OPENER_SHORTCUT = 'ctrl';

type ShortcutSettings = {
  readonlyShortcut?: string;
  lookupsOpenerShortcut?: string;
};

function sendAction(action: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.runtime.sendMessage({ action, tabId: tab.id });
  });
}

function stopKeyPropagation(element: HTMLSelectElement): void {
  for (const eventName of ['keydown', 'keyup']) {
    element.addEventListener(eventName, (e) => {
      e.stopPropagation();
    });
  }
}

function loadShortcutSettings(callback: (settings: ShortcutSettings) => void): void {
  chrome.storage.local.get(['readonlyShortcut', 'lookupsOpenerShortcut'], (result) => {
    callback(result as ShortcutSettings);
  });
}

/**
 * Probe the active tab to check if the current entity can be activated.
 * Uses a two-step approach: MAIN world script writes result to a data attribute,
 * then ISOLATED world script reads it back (MAIN world cannot return values to extension).
 */
async function probeActivatable(tabId: number): Promise<boolean> {
  const marker = '__dynamicscat_activatable';
  try {
    // Step 1: inject into MAIN world to check Xrm state, write result to document element
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      func: (attr: string) => {
        if (typeof Xrm === 'undefined' || !Xrm.Page?.data) return;
        const sc = Xrm.Page.getAttribute('statecode');
        if (!sc) return;
        const closed = (sc.getValue() as number) !== 0;
        if (closed) document.documentElement.setAttribute(attr, '1');
      },
      args: [marker],
    });

    // Step 2: read the marker from ISOLATED world (can return values)
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: (attr: string) => {
        const val = document.documentElement.getAttribute(attr);
        if (val) document.documentElement.removeAttribute(attr);
        return val === '1';
      },
      args: [marker],
    });
    return results.some(r => r.result === true);
  } catch {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  for (const def of ACTIONS) {
    if (!def.popupBtnId) continue;
    const btn = document.getElementById(def.popupBtnId);
    if (!btn) {
      console.error(`[DynamicsCat] Popup element #${def.popupBtnId} not found`);
      continue;
    }
    btn.addEventListener('click', () => {
      if (def.action === 'injectOverrideReadonly') {
        chrome.storage.local.get('readonlyOverride', (result) => {
          chrome.storage.local.set({ readonlyOverride: result.readonlyOverride === false });
        });
      }
      if (def.action === 'injectLookupsOpener') {
        chrome.storage.local.get('lookupsOpenerOverride', (result) => {
          chrome.storage.local.set({ lookupsOpenerOverride: result.lookupsOpenerOverride === false });
        });
      }
      sendAction(def.action);
    });
  }

  // --- Shortcut settings ---
  const readonlyGearBtn = document.getElementById('btn-readonly-settings');
  const readonlySettingsPanel = document.getElementById('readonly-settings-panel');
  const readonlyShortcutSelect = document.getElementById('readonly-shortcut-select') as HTMLSelectElement | null;
  const lookupsGearBtn = document.getElementById('btn-lookups-opener-settings');
  const lookupsSettingsPanel = document.getElementById('lookups-opener-settings-panel');
  const lookupsShortcutSelect = document.getElementById('lookups-opener-shortcut-select') as HTMLSelectElement | null;

  const toggleSettingsPanel = (button: HTMLElement | null, panel: HTMLElement | null): void => {
    if (!button || !panel) return;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
    });
  };

  toggleSettingsPanel(readonlyGearBtn, readonlySettingsPanel);
  toggleSettingsPanel(lookupsGearBtn, lookupsSettingsPanel);

  if (readonlyShortcutSelect && lookupsShortcutSelect) {
    loadShortcutSettings((result) => {
      readonlyShortcutSelect.value = result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT;
      lookupsShortcutSelect.value = result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
    });

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
          chrome.storage.local.set({ [storageKey]: nextValue });
          previousValue = nextValue;
        });
      });
      stopKeyPropagation(select);
    };

    bindShortcutSelect(readonlyShortcutSelect, 'readonlyShortcut', 'lookupsOpenerShortcut', 'Lookups Opener', DEFAULT_READONLY_SHORTCUT);
    bindShortcutSelect(lookupsShortcutSelect, 'lookupsOpenerShortcut', 'readonlyShortcut', 'Override Readonly', DEFAULT_LOOKUPS_OPENER_SHORTCUT);
  }

  // Conditionally show the Activate button
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    const canActivate = await probeActivatable(tab.id);
    if (canActivate) {
      const btn = document.getElementById('btn-activate-activity');
      if (btn) btn.hidden = false;
    }
  }
});
