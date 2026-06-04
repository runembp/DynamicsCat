// Toggle content script: unlocks all disabled (locked) controls on the CRM form,
// or re-locks them again.  State is stored in the top-frame dataset so it is shared
// across all frames.  Injected via chrome.scripting.executeScript with
// allFrames: true, world: 'MAIN'.

import { showToast } from '../shared';
import { acquireToggleLock, readFlag, writeFlag, clearFlag, readJsonArray, writeJsonArray } from '../state';

function main(): void {
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;

  // allFrames: true → first Xrm-capable frame acquires a short-lived lock so
  // subsequent frames don't undo the toggle.
  if (!acquireToggleLock()) return;

  const isActive = readFlag('unlockAllActive') === '1';
  const storedNames = readJsonArray('unlockedNames');

  // Fields are currently unlocked by us — lock them again
  if (isActive && storedNames.length > 0) {
    let lockedCount = 0;
    storedNames.forEach((name) => {
      try {
        const ctrl = Xrm.Page.ui.controls.get(name) as Xrm.Controls.StandardControl | null;
        if (ctrl && typeof ctrl.setDisabled === 'function') {
          ctrl.setDisabled(true);
          lockedCount++;
        }
      } catch { /* ignore */ }
    });
    writeFlag('unlockAllActive', '0');
    clearFlag('unlockedNames');
    showToast(`🔒 ${lockedCount} field(s) locked again`);
    return;
  }

  // Initial state — detect all disabled fields via getDisabled() and unlock them
  const unlocked: string[] = [];
  Xrm.Page.ui.controls.forEach((ctrl) => {
    try {
      const standard = ctrl as Xrm.Controls.StandardControl;
      if (
        typeof standard.getDisabled === 'function'
        && standard.getDisabled() === true
        && typeof standard.setDisabled === 'function'
      ) {
        standard.setDisabled(false);
        unlocked.push(ctrl.getName());
      }
    } catch {
      // Some controls (sub-grids, web resources) may not support getDisabled/setDisabled
    }
  });

  if (unlocked.length > 0) {
    writeJsonArray('unlockedNames', unlocked);
    writeFlag('unlockAllActive', '1');
    showToast(`🔓 ${unlocked.length} locked field(s) unlocked`);
  } else {
    showToast('No locked fields found');
  }
}

main();
