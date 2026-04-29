// Toggle content script: reveals all hidden controls on the CRM form, or hides them again.
// State is stored in the top-frame dataset so it is shared across all frames.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

import { showToast } from '../shared';
import { acquireToggleLock, readFlag, writeFlag, clearFlag, readJsonArray, writeJsonArray } from '../state';

function main(): void {
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;

  // allFrames: true → first Xrm-capable frame acquires a short-lived lock so
  // subsequent frames don't undo the toggle.
  if (!acquireToggleLock()) return;

  const isActive = readFlag('hiddenActive') === '1';
  const storedNames = readJsonArray('revealedNames');

  // Fields are currently revealed — hide them
  if (isActive && storedNames.length > 0) {
    let hiddenCount = 0;
    storedNames.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl) { ctrl.setVisible(false); hiddenCount++; }
      } catch { /* ignore */ }
    });
    writeFlag('hiddenActive', '0');
    if (hiddenCount === 0) clearFlag('revealedNames');
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
      writeFlag('hiddenActive', '1');
      showToast(`👁 ${revealedCount} hidden field(s) made visible`);
      return;
    }
    clearFlag('revealedNames');
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
    writeJsonArray('revealedNames', revealed);
    writeFlag('hiddenActive', '1');
    showToast(`👁 ${revealed.length} hidden field(s) made visible`);
  } else {
    showToast('No hidden fields found');
  }
}

main();
