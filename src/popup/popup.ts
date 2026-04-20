function injectScript(file: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: [file],
      world: 'MAIN',
    });
  });
}

function bindButton(id: string, file: string): void {
  const btn = document.getElementById(id);
  if (!btn) {
    console.error(`[DynamicsCat] Popup element #${id} not found`);
    return;
  }
  btn.addEventListener('click', () => injectScript(file));
}

document.addEventListener('DOMContentLoaded', () => {
  bindButton('btn-all-fields',        'content/all-fields.js');
  bindButton('btn-show-option-sets',  'content/option-sets.js');
  bindButton('btn-show-hidden-fields','content/show-hidden-fields.js');
  bindButton('btn-dirty-fields',       'content/dirty-fields.js');
});
