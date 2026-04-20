// Toggle content script: live-tracks modified attributes on the CRM form.
// While enabled, subscribes to onChange on every attribute and highlights each
// field the moment it changes. Pressing the button again unsubscribes and removes highlights.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

export {};

declare global {
  interface Window {
    __dynamicsCatDirtyTracking?: boolean;
    __dynamicsCatDirtyHandler?: (ctx?: Xrm.Events.EventContext) => void;
    __dynamicsCatDirtyFields?: Set<string>;
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

  // CRM 2016: {name}_d is the row wrapper containing both label and field control.
  const selectors = names.map((n) => `[id="${n}_d"]`).join(',\n');

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

  // Toggle off: unsubscribe all handlers and remove highlights.
  if (window.__dynamicsCatDirtyTracking) {
    if (window.__dynamicsCatDirtyHandler) {
      Xrm.Page.data.entity.attributes.forEach((attr) => {
        attr.removeOnChange(window.__dynamicsCatDirtyHandler!);
      });
    }
    document.getElementById(STYLE_ID)?.remove();
    window.__dynamicsCatDirtyTracking = false;
    window.__dynamicsCatDirtyHandler = undefined;
    window.__dynamicsCatDirtyFields = undefined;
    showToast('🔴 Dirty field tracking disabled');
    return;
  }

  // Toggle on: subscribe onChange to every attribute and highlight as fields change.
  // Seed with any attributes already dirty at enable time.
  const trackedFields = new Set<string>();
  Xrm.Page.data.entity.attributes.forEach((attr) => {
    if (attr.getIsDirty()) trackedFields.add(attr.getName());
  });
  window.__dynamicsCatDirtyFields = trackedFields;

  const handler = (ctx?: Xrm.Events.EventContext): void => {
    if (!ctx) return;
    const source = ctx.getEventSource() as Xrm.Attributes.Attribute | null;
    if (!source) return;
    trackedFields.add(source.getName());
    injectHighlights(Array.from(trackedFields));
  };

  window.__dynamicsCatDirtyHandler = handler;
  Xrm.Page.data.entity.attributes.forEach((attr) => {
    attr.addOnChange(handler);
  });

  if (trackedFields.size > 0) injectHighlights(Array.from(trackedFields));

  window.__dynamicsCatDirtyTracking = true;
  showToast('🟢 Dirty field tracking enabled');
}

main();
