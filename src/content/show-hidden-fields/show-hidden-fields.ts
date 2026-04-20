// Toggle content script: reveals all hidden controls on the CRM form, or hides them again.
// State is stored in the top-frame dataset so it is shared across all frames.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

export {};

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
  const existing = document.getElementById(TOAST_ID);
  if (existing) existing.remove();
  injectStyles();
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('crm-toast-fade'); }, 2500);
  setTimeout(() => { toast.remove(); }, 3000);
}

// Returns the dataset of the top-level document, falling back to the current frame
// when the top frame is cross-origin (e.g. CRM embedded inside an external portal).
function getStateDs(): DOMStringMap {
  try {
    return ((window.top ?? window) as Window).document.documentElement.dataset;
  } catch {
    return document.documentElement.dataset;
  }
}

function main(): void {
  // Skip frames without a CRM form UI
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;

  // allFrames: true runs this in every frame. CRM 2016 may expose Xrm in both the top
  // frame and the form iframe, so without a guard each click executes twice and the two
  // executions undo each other. The first Xrm-capable frame acquires a short-lived lock
  // in the shared top-frame dataset; any subsequent frames that also pass the Xrm check
  // see the lock and skip.
  const ds = getStateDs();
  const LOCK = 'dynamicsCatToggleLock';
  if (ds[LOCK]) return;
  ds[LOCK] = '1';
  setTimeout(() => { delete ds[LOCK]; }, 1000);
  const isActive = ds['dynamicsCatHiddenActive'] === '1';
  const storedJson = ds['dynamicsCatRevealedNames'];
  const storedNames: string[] = storedJson ? (JSON.parse(storedJson) as string[]) : [];

  // Fields are currently revealed — hide them
  if (isActive && storedNames.length > 0) {
    let hiddenCount = 0;
    storedNames.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl) { ctrl.setVisible(false); hiddenCount++; }
      } catch { /* ignore */ }
    });
    ds['dynamicsCatHiddenActive'] = '0';
    if (hiddenCount === 0) delete ds['dynamicsCatRevealedNames']; // stale names, clean up
    showToast(`🙈 ${hiddenCount} field(s) hidden again`);
    return;
  }

  // Fields were hidden by us — re-reveal by stored names
  if (!isActive && storedNames.length > 0) {
    let revealedCount = 0;
    storedNames.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl) { ctrl.setVisible(true); revealedCount++; }
      } catch { /* ignore */ }
    });
    if (revealedCount > 0) {
      ds['dynamicsCatHiddenActive'] = '1';
      showToast(`👁 ${revealedCount} hidden field(s) made visible`);
      return;
    }
    // Stored names no longer match this form (e.g. navigated to different record) — fall through
    delete ds['dynamicsCatRevealedNames'];
  }

  // Initial state — detect all hidden fields via getVisible() and reveal them
  const revealed: string[] = [];
  Xrm.Page.ui.controls.forEach((ctrl) => {
    try {
      const standard = ctrl as Xrm.Controls.StandardControl;
      if (standard.getVisible && standard.getVisible() === false) {
        standard.setVisible(true);
        revealed.push(ctrl.getName());
      }
    } catch {
      // Some controls (sub-grids, web resources) may not support getVisible/setVisible
    }
  });

  if (revealed.length > 0) {
    ds['dynamicsCatRevealedNames'] = JSON.stringify(revealed);
    ds['dynamicsCatHiddenActive'] = '1';
    showToast(`👁 ${revealed.length} hidden field(s) made visible`);
  } else {
    showToast('No hidden fields found');
  }
}

main();
