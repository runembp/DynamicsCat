export {};

function sendAction(action: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.runtime.sendMessage({ action, tabId: tab.id });
  });
}

function bindButton(id: string, action: string): void {
  const btn = document.getElementById(id);
  if (!btn) {
    console.error(`[DynamicsCat] Popup element #${id} not found`);
    return;
  }
  btn.addEventListener('click', () => sendAction(action));
}

document.addEventListener('DOMContentLoaded', () => {
  bindButton('btn-all-fields',         'injectAllFields');
  bindButton('btn-show-option-sets',   'injectOptionSets');
  bindButton('btn-show-hidden-fields', 'injectShowHiddenFields');
  bindButton('btn-dirty-fields',       'injectDirtyFields');
});
