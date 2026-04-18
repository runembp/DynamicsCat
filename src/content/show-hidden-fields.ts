// Toggle content script: reveals all hidden controls on the CRM form, or hides them again.
// Uses window.__dynamicsCatRevealedFields to track revealed fields between injections.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

export {};

declare global {
  interface Window {
    __dynamicsCatRevealedFields?: string[];
    // true = fields currently revealed (next click should hide)
    // false = fields hidden by us (next click should re-reveal, bypassing getVisible())
    // undefined = initial state (next click should detect + reveal)
    __dynamicsCatFieldsRevealed?: boolean;
  }
}

const STYLE_ID = 'crm-tools-show-hidden-style';
const TOAST_ID = 'crm-tools-show-hidden-toast';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-show-hidden-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483647;
  background: #1e64c8;
  color: #fff;
  font-family: Segoe UI, Arial, sans-serif;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 1;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
#crm-tools-show-hidden-toast.crm-toast-fade {
  opacity: 0;
}
  `;
  (document.head || document.documentElement).appendChild(style);
}

function showToast(message: string): void {
  // Remove any existing toast
  const existing = document.getElementById(TOAST_ID);
  if (existing) existing.remove();

  injectStyles();

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Begin fade-out after 2.5s, then remove at 3s
  setTimeout(() => {
    toast.classList.add('crm-toast-fade');
  }, 2500);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function main(): void {
  // Silently skip frames that don't have Xrm.Page
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;

  // Fields are currently revealed — hide them and remember which ones we hid.
  if (window.__dynamicsCatFieldsRevealed === true) {
    const names = window.__dynamicsCatRevealedFields ?? [];
    let hiddenCount = 0;
    names.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl) {
          ctrl.setVisible(false);
          hiddenCount++;
        }
      } catch { /* ignore */ }
    });
    // Keep __dynamicsCatRevealedFields intact so the next click can re-reveal by name
    // without relying on getVisible() (which may lag behind CRM's async DOM updates).
    window.__dynamicsCatFieldsRevealed = false;
    showToast(`🙈 ${hiddenCount} field(s) hidden again`);
    return;
  }

  // Fields were hidden by us — re-reveal by stored name, bypassing getVisible().
  if (window.__dynamicsCatFieldsRevealed === false && window.__dynamicsCatRevealedFields && window.__dynamicsCatRevealedFields.length > 0) {
    let revealedCount = 0;
    window.__dynamicsCatRevealedFields.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl) {
          ctrl.setVisible(true);
          revealedCount++;
        }
      } catch { /* ignore */ }
    });
    window.__dynamicsCatFieldsRevealed = true;
    showToast(`👁 ${revealedCount} hidden field(s) made visible`);
    return;
  }

  // Initial state — detect all hidden fields via getVisible() and reveal them.
  const revealed: string[] = [];
  Xrm.Page.ui.controls.forEach((ctrl) => {
    try {
      const standard = ctrl as Xrm.Controls.StandardControl;
      if (standard.getVisible && standard.getVisible() === false) {
        standard.setVisible(true);
        revealed.push(ctrl.getName());
      }
    } catch {
      // Some special controls (e.g. sub-grids, web resources) may not support getVisible/setVisible
    }
  });

  window.__dynamicsCatRevealedFields = revealed;
  window.__dynamicsCatFieldsRevealed = revealed.length > 0 ? true : undefined;
  showToast(
    revealed.length > 0
      ? `👁 ${revealed.length} hidden field(s) made visible`
      : 'No hidden fields found',
  );
}

main();
