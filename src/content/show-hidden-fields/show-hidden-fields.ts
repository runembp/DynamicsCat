// Toggle content script: reveals all hidden controls on the CRM form, or hides them again.
// Hidden tabs and sections are revealed too — a visible control inside a hidden section
// (or tab) stays invisible until its parent container is shown, so control-level
// reveal alone is not enough.
// State is stored in the top-frame dataset so it is shared across all frames.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

import { showToast } from '../shared';
import { acquireToggleLock, readFlag, writeFlag, clearFlag, readJsonArray, writeJsonArray } from '../state';

// Stored entries are tagged so the toggle-back / re-reveal passes can target the
// right container:  't|<tab>', 's|<tab>|<section>', 'c|<control>', 'd|<tab>'.
// 'd' = a collapsed tab we expanded (display state), restored on toggle-back.
const SEP = '|';

function tabEntry(tab: string): string { return `t${SEP}${tab}`; }
function sectionEntry(tab: string, section: string): string { return `s${SEP}${tab}${SEP}${section}`; }
function controlEntry(control: string): string { return `c${SEP}${control}`; }
function displayEntry(tab: string): string { return `d${SEP}${tab}`; }

function setEntryVisible(entry: string, visible: boolean): boolean {
  const parts = entry.split(SEP);
  try {
    switch (parts[0]) {
      case 't': {
        const tab = Xrm.Page.ui.tabs.get(parts[1]);
        if (tab) { tab.setVisible(visible); return true; }
        return false;
      }
      case 's': {
        const tab = Xrm.Page.ui.tabs.get(parts[1]);
        const section = tab?.sections.get(parts[2]);
        if (section) { section.setVisible(visible); return true; }
        return false;
      }
      case 'c': {
        const ctrl = Xrm.Page.ui.controls.get(parts[1]) as Xrm.Controls.StandardControl | null;
        if (ctrl && ctrl.setVisible) { ctrl.setVisible(visible); return true; }
        return false;
      }
      case 'd': {
        // visible=true → expand (reveal pass); visible=false → collapse (toggle-back)
        const tab = Xrm.Page.ui.tabs.get(parts[1]);
        if (tab && tab.setDisplayState) { tab.setDisplayState(visible ? 'expanded' : 'collapsed'); return true; }
        return false;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function main(): void {
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;

  // allFrames: true → first Xrm-capable frame acquires a short-lived lock so
  // subsequent frames don't undo the toggle.
  if (!acquireToggleLock()) return;

  const isActive = readFlag('hiddenActive') === '1';
  const storedEntries = readJsonArray('revealedNames');

  // Items are currently revealed — hide them again
  if (isActive && storedEntries.length > 0) {
    let hiddenCount = 0;
    storedEntries.forEach((entry) => { if (setEntryVisible(entry, false)) hiddenCount++; });
    writeFlag('hiddenActive', '0');
    if (hiddenCount === 0) clearFlag('revealedNames');
    showToast(`🙈 ${hiddenCount} item(s) hidden again`);
    return;
  }

  // Items were hidden by us — re-reveal by stored entries
  if (!isActive && storedEntries.length > 0) {
    let revealedCount = 0;
    storedEntries.forEach((entry) => { if (setEntryVisible(entry, true)) revealedCount++; });
    if (revealedCount > 0) {
      writeFlag('hiddenActive', '1');
      showToast(`👁 ${revealedCount} hidden item(s) made visible`);
      return;
    }
    clearFlag('revealedNames');
  }

  // Initial state — detect hidden tabs, sections and controls and reveal them.
  // Tabs and sections must be revealed too: a visible control inside a hidden
  // section/tab stays invisible until its parent container is shown.
  const revealed: string[] = [];

  Xrm.Page.ui.tabs.forEach((tab) => {
    try {
      if (tab.getVisible && tab.getVisible() === false) {
        tab.setVisible(true);
        revealed.push(tabEntry(tab.getName()));
      }
    } catch { /* ignore */ }

    try {
      if (tab.getDisplayState && tab.getDisplayState() === 'collapsed') {
        tab.setDisplayState('expanded');
        revealed.push(displayEntry(tab.getName()));
      }
    } catch { /* ignore */ }

    try {
      tab.sections.forEach((section) => {
        try {
          if (section.getVisible && section.getVisible() === false) {
            section.setVisible(true);
            revealed.push(sectionEntry(tab.getName(), section.getName()));
          }
        } catch { /* ignore */ }
      });
    } catch { /* ignore */ }
  });

  Xrm.Page.ui.controls.forEach((ctrl) => {
    try {
      const standard = ctrl as Xrm.Controls.StandardControl;
      if (standard.getVisible && standard.getVisible() === false) {
        standard.setVisible(true);
        revealed.push(controlEntry(ctrl.getName()));
      }
    } catch {
      // Some controls (sub-grids, web resources) may not support getVisible/setVisible
    }
  });

  if (revealed.length > 0) {
    writeJsonArray('revealedNames', revealed);
    writeFlag('hiddenActive', '1');
    showToast(`👁 ${revealed.length} hidden item(s) made visible`);
  } else {
    showToast('No hidden fields found');
  }
}

main();
