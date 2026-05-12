import { showToast } from '../shared';
import { readFlag, writeFlag, clearFlag } from '../state';

declare global {
  interface Window {
    __dynamicsCatLookupsOpener?: boolean;
    __dynamicsCatLookupsHandlers?: Array<{ event: string; fn: (e: Event) => void }>;
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
  const shortcut = readFlag('lookupsOpenerShortcut') || 'ctrl';
  const shortcutConfig = parseShortcut(shortcut);
  const shortcutText = shortcutLabel(shortcut);

  if (window.__dynamicsCatLookupsOpener) {
    if (window.__dynamicsCatLookupsHandlers) {
      for (const h of window.__dynamicsCatLookupsHandlers) {
        document.removeEventListener(h.event, h.fn, true);
      }
    }
    window.__dynamicsCatLookupsHandlers = undefined;
    window.__dynamicsCatLookupsOpener = false;
    writeFlag('lookupsOpenerActive', '0');
    showToast('🔴 Lookups Opener disabled');
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

  // Open on pointerdown (first event in the chain, always fires)
  const openHandler = (e: Event): void => {
    const pe = e as PointerEvent;
    if (pe.button !== 0) return; // left click only
    if (!matchesShortcut(pe, shortcutConfig)) return;

    const target = pe.target as HTMLElement | null;
    if (!target) return;

    const match = isInsideLookupWithValue(target);
    if (!match) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const url = `${window.location.origin}/main.aspx?etn=${encodeURIComponent(match.record.entityType!)}&id=${encodeURIComponent(match.record.id!)}&pagetype=entityrecord`;
    (window.top ?? window).postMessage({ type: 'dynamicscat-open-background-tab', url }, '*');
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

  window.__dynamicsCatLookupsHandlers = handlers;
  window.__dynamicsCatLookupsOpener = true;
  writeFlag('lookupsOpenerActive', '1');

  const silent = readFlag('lookupsOpenerSilentInject') === '1';
  clearFlag('lookupsOpenerSilentInject');
  if (!silent) {
    showToast(`🟢 Lookups Opener enabled — ${shortcutText} to open linked records`);
  }
}

main();
