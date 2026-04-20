// Toggle content script: highlights dirty (modified) attributes on the CRM form.
// Injects CSS selectors targeting CRM 2016 field containers by logical name.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

export {};

declare global {
  interface Window {
    __dynamicsCatDirtyHighlighted?: boolean;
  }
}

const STYLE_ID  = 'crm-tools-dirty-fields-style';
const TOAST_ID  = 'crm-tools-dirty-toast';
const TOAST_CSS = 'crm-tools-dirty-toast-style';

function injectToastStyle(): void {
  if (document.getElementById(TOAST_CSS)) return;
  const style = document.createElement('style');
  style.id = TOAST_CSS;
  style.textContent = `
#${TOAST_ID} {
  position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
  background: #1e64c8; color: #fff;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px;
  padding: 10px 16px; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 1; transition: opacity 0.5s ease; pointer-events: none;
}
#${TOAST_ID}.crm-dirty-fade { opacity: 0; }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function showToast(message: string): void {
  document.getElementById(TOAST_ID)?.remove();
  injectToastStyle();
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('crm-dirty-fade'), 2500);
  setTimeout(() => toast.remove(), 3000);
}

function injectHighlights(names: string[]): void {
  document.getElementById(STYLE_ID)?.remove();

  // CRM 2016 field containers use IDs: {name} (input), {name}_d (row wrapper), {name}_c (cell)
  const selectors = names
    .flatMap((n) => [`[id="${n}"]`, `[id="${n}_d"]`, `[id="${n}_c"]`])
    .join(',\n');

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
${selectors} {
  outline: 2px solid #e8a800 !important;
  background-color: rgba(255, 200, 0, 0.18) !important;
}
  `;
  (document.head || document.documentElement).appendChild(style);
}

function main(): void {
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) return;

  // Toggle off: remove highlights
  if (window.__dynamicsCatDirtyHighlighted) {
    document.getElementById(STYLE_ID)?.remove();
    window.__dynamicsCatDirtyHighlighted = false;
    showToast('🔄 Dirty field highlights removed');
    return;
  }

  const dirtyAttrs = Xrm.Page.data.entity.attributes.get().filter((a) => a.getIsDirty());

  if (dirtyAttrs.length === 0) {
    showToast('✅ No dirty fields');
    return;
  }

  injectHighlights(dirtyAttrs.map((a) => a.getName()));
  window.__dynamicsCatDirtyHighlighted = true;
  showToast(`✏️ ${dirtyAttrs.length} dirty field(s) highlighted`);
}

main();
