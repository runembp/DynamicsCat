import { showToast } from '../shared';
import { readFlag, writeFlag, clearFlag } from '../state';

declare global {
  interface Window {
    __dynamicsCatReadonlyOverride?: boolean;
    __dynamicsCatReadonlyHandler?: (e: MouseEvent) => void;
  }
}

interface ModifierConfig {
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
}

function getControlLabel(ctrl: Xrm.Controls.Control): string {
  const standard = ctrl as Xrm.Controls.StandardControl;
  try {
    return standard.getLabel?.() || ctrl.getName() || 'Field';
  } catch {
    return ctrl.getName() || 'Field';
  }
}

function parseShortcut(shortcut: string): ModifierConfig {
  return {
    altKey: shortcut.includes('alt'),
    shiftKey: shortcut.includes('shift'),
    ctrlKey: shortcut.includes('ctrl'),
  };
}

function matchesShortcut(e: MouseEvent, config: ModifierConfig): boolean {
  return e.altKey === config.altKey
    && e.shiftKey === config.shiftKey
    && e.ctrlKey === config.ctrlKey
    && !e.metaKey;
}

function shortcutLabel(shortcut: string): string {
  const parts = shortcut.split('+').map(part => part.charAt(0).toUpperCase() + part.slice(1));
  return parts.join('+') + '+Click';
}

function main(): void {
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui) return;
  const shortcut = readFlag('readonlyShortcut') || 'alt';
  const shortcutConfig = parseShortcut(shortcut);
  const shortcutText = shortcutLabel(shortcut);

  if (window.__dynamicsCatReadonlyOverride) {
    if (window.__dynamicsCatReadonlyHandler) {
      document.removeEventListener('click', window.__dynamicsCatReadonlyHandler, true);
    }
    window.__dynamicsCatReadonlyHandler = undefined;
    window.__dynamicsCatReadonlyOverride = false;
    writeFlag('readonlyOverrideActive', '0');
    showToast('🔴 Override Readonly disabled');
    return;
  }

  const handler = (e: MouseEvent): void => {
    if (!matchesShortcut(e, shortcutConfig)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement | null;
    if (!target) return;

    let unlocked = false;
    Xrm.Page.ui.controls.forEach((ctrl) => {
      if (unlocked) return;

      const name = ctrl.getName();
      if (!name) return;

      const wrapper = document.getElementById(`${name}_d`);
      if (!wrapper || !wrapper.contains(target)) return;

      const standard = ctrl as Xrm.Controls.StandardControl;
      if (typeof standard.setDisabled !== 'function') return;

      try {
        standard.setDisabled(false);
        standard.setFocus();
        showToast('🔓 Unlocked: ' + getControlLabel(ctrl));
        unlocked = true;
      } catch {
        // Ignore unsupported controls with partial standard-control surface.
      }
    });
  };

  document.addEventListener('click', handler, true);
  window.__dynamicsCatReadonlyHandler = handler;
  window.__dynamicsCatReadonlyOverride = true;
  writeFlag('readonlyOverrideActive', '1');

  const silent = readFlag('readonlySilentInject') === '1';
  clearFlag('readonlySilentInject');
  if (!silent) {
    showToast(`🟢 Override Readonly enabled — ${shortcutText} to unlock fields`);
  }
}

main();
