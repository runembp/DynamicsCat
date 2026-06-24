import { ACTIONS } from '../actions';
import { formatSwitchLanguageLabel } from '../language';

function sendAction(action: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.runtime.sendMessage({ action, tabId: tab.id });
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

function readLanguageResponse(response: unknown): number | null {
  if (typeof response !== 'object' || response === null) return null;
  const language = (response as Record<string, unknown>).language;
  return typeof language === 'number' && Number.isInteger(language) ? language : null;
}

function probeUserLanguage(tabId: number): Promise<number | null> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'probeUserLanguage', tabId }, (response: unknown) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(readLanguageResponse(response));
    });
  });
}

function setSwitchLanguageLabel(button: HTMLButtonElement, languageId: number | null): void {
  const label = button.querySelector<HTMLElement>('.btn-label');
  if (label) label.textContent = formatSwitchLanguageLabel(languageId);
}

document.addEventListener('DOMContentLoaded', async () => {
  let switchLanguageButton: HTMLButtonElement | null = null;

  for (const def of ACTIONS) {
    if (!def.popupBtnId) continue;
    const btn = document.getElementById(def.popupBtnId);
    if (!btn) {
      console.error(`[DynamicsCat] Popup element #${def.popupBtnId} not found`);
      continue;
    }
    if (def.action === 'switchUserLanguage') {
      switchLanguageButton = btn as HTMLButtonElement;
    }
    btn.addEventListener('click', () => {
      sendAction(def.action);
    });
  }

  // Conditionally show the Activate button
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    if (switchLanguageButton) {
      const languageId = await probeUserLanguage(tab.id);
      setSwitchLanguageLabel(switchLanguageButton, languageId);
    }

    const canActivate = await probeActivatable(tab.id);
    if (canActivate) {
      const btn = document.getElementById('btn-activate-activity');
      if (btn) btn.hidden = false;
    }
  }
});
