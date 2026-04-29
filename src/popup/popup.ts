import { ACTIONS } from '../actions';

function sendAction(action: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.runtime.sendMessage({ action, tabId: tab.id });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  for (const def of ACTIONS) {
    if (!def.popupBtnId) continue;
    const btn = document.getElementById(def.popupBtnId);
    if (!btn) {
      console.error(`[DynamicsCat] Popup element #${def.popupBtnId} not found`);
      continue;
    }
    btn.addEventListener('click', () => sendAction(def.action));
  }
});
