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

function bindOpenOnApi(): void {
  const btn = document.getElementById('btn-open-on-api');
  if (!btn) {
    console.error('[DynamicsCat] Popup element #btn-open-on-api not found');
    return;
  }
  btn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      const url = tab.url ?? '';
      const isRecord = /[?&]pagetype=entityrecord/i.test(url);
      if (!isRecord) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => {
            const CONTAINER_ID = 'crm-tools-toast-container';
            let container = document.getElementById(CONTAINER_ID);
            if (!container) {
              container = document.createElement('div');
              container.id = CONTAINER_ID;
              container.style.cssText = [
                'position:fixed', 'bottom:24px', 'right:24px',
                'z-index:2147483647', 'display:flex', 'flex-direction:column', 'gap:8px',
                'pointer-events:none',
              ].join(';');
              document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.style.cssText = [
              'background:#e65100', 'color:#fff',
              'font-family:"Google Sans",Roboto,"Segoe UI",Arial,sans-serif',
              'font-size:13px', 'padding:10px 16px', 'border-radius:6px',
              'box-shadow:0 2px 8px rgba(0,0,0,0.25)',
              'pointer-events:auto', 'opacity:1', 'transition:opacity 0.3s ease',
            ].join(';');
            toast.textContent = 'No record open — navigate to a record first.';
            container.appendChild(toast);
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => toast.remove(), 350);
            }, 3500);
          },
        });
        return;
      }
      chrome.runtime.sendMessage({ action: 'openOnApi', tabId: tab.id });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindButton('btn-all-fields',         'injectAllFields');
  bindButton('btn-show-option-sets',   'injectOptionSets');
  bindButton('btn-show-hidden-fields', 'injectShowHiddenFields');
  bindButton('btn-dirty-fields',       'injectDirtyFields');
  bindOpenOnApi();
});
