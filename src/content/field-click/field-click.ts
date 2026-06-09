import { showToast, copyToClipboard } from '../shared';
import { readFlag, writeFlag, clearFlag } from '../state';

declare global {
  interface Window {
    __dynamicsCatFieldClick?: boolean;
    __dynamicsCatFieldClickHandlers?: Array<{ event: string; fn: (e: Event) => void }>;
  }
}

interface ModifierConfig {
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
}

interface LookupValue {
  entityType?: string;
  id?: string;
  name?: string;
}

function parseShortcut(shortcut: string): ModifierConfig {
  return {
    altKey: shortcut.includes('alt'),
    shiftKey: shortcut.includes('shift'),
    ctrlKey: shortcut.includes('ctrl'),
  };
}

function matchesShortcut(e: MouseEvent | PointerEvent, config: ModifierConfig): boolean {
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
  const shortcut = readFlag('fieldClickShortcut') || 'ctrl';
  const shortcutConfig = parseShortcut(shortcut);
  const shortcutText = shortcutLabel(shortcut);

  if (window.__dynamicsCatFieldClick) {
    if (window.__dynamicsCatFieldClickHandlers) {
      for (const h of window.__dynamicsCatFieldClickHandlers) {
        document.removeEventListener(h.event, h.fn, true);
      }
    }
    window.__dynamicsCatFieldClickHandlers = undefined;
    window.__dynamicsCatFieldClick = false;
    writeFlag('fieldClickActive', '0');
    showToast('🔴 Field Click disabled');
    return;
  }

  function isInsideLookupWithValue(target: HTMLElement): { name: string; record: LookupValue } | null {
    let result: { name: string; record: LookupValue } | null = null;
    Xrm.Page.ui.controls.forEach((ctrl) => {
      if (result || ctrl.getControlType() !== 'lookup') return;

      const name = ctrl.getName();
      if (!name) return;

      const wrapper = document.getElementById(`${name}_d`);
      if (!wrapper || !wrapper.contains(target)) return;

      const value = Xrm.Page.getAttribute(name)?.getValue() as LookupValue[] | null;
      if (!Array.isArray(value) || value.length === 0) return;

      const record = value[0];
      if (!record?.entityType || !record.id) return;

      result = { name, record };
    });
    return result;
  }

  function findLabelAtTarget(target: HTMLElement): string | null {
    let result: string | null = null;
    Xrm.Page.ui.controls.forEach((ctrl) => {
      if (result) return;
      const name = ctrl.getName();
      if (!name) return;
      const labelCell = document.getElementById(`${name}_c`);
      if (!labelCell || !labelCell.contains(target)) return;
      result = name;
    });
    return result;
  }

  // Open on pointerdown (first event in the chain, always fires)
  const openHandler = (e: Event): void => {
    const pe = e as PointerEvent;
    if (pe.button !== 0) return; // left click only
    if (!matchesShortcut(pe, shortcutConfig)) return;

    const target = pe.target as HTMLElement | null;
    if (!target) return;

    const match = isInsideLookupWithValue(target);
    if (match) {
      e.preventDefault();
      e.stopImmediatePropagation();

      const url = `${window.location.origin}/main.aspx?etn=${encodeURIComponent(match.record.entityType!)}&id=${encodeURIComponent(match.record.id!)}&pagetype=entityrecord`;
      (window.top ?? window).postMessage({ type: 'dynamicscat-open-background-tab', url }, '*');
      return;
    }

    // Not a lookup with a value — if a field label was clicked, copy its logical name
    const fieldName = findLabelAtTarget(target);
    if (!fieldName) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    copyToClipboard(fieldName);
    showToast(`📋 ${fieldName}`);
  };

  // Suppress subsequent events to prevent CRM from also reacting
  const suppress = (e: Event): void => {
    const me = e as MouseEvent;
    if (!matchesShortcut(me, shortcutConfig)) return;
    const target = me.target as HTMLElement | null;
    if (!target) return;
    if (isInsideLookupWithValue(target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (findLabelAtTarget(target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  const handlers: Array<{ event: string; fn: (e: Event) => void }> = [
    { event: 'pointerdown', fn: openHandler },
    { event: 'mousedown', fn: suppress },
    { event: 'mouseup', fn: suppress },
    { event: 'click', fn: suppress },
  ];

  for (const h of handlers) {
    document.addEventListener(h.event, h.fn, true);
  }

  window.__dynamicsCatFieldClickHandlers = handlers;
  window.__dynamicsCatFieldClick = true;
  writeFlag('fieldClickActive', '1');

  const silent = readFlag('fieldClickSilentInject') === '1';
  clearFlag('fieldClickSilentInject');
  if (!silent) {
    showToast(`🟢 Field Click enabled — ${shortcutText} a lookup to open it, or a label to copy its logical name`);
  }
}

main();
