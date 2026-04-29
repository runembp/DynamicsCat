// Toggle content script: live-tracks modified attributes on the CRM form.
// While enabled, subscribes to onChange on every attribute and highlights each
// field the moment it changes. Pressing the button again unsubscribes and removes highlights.
// Injected via chrome.scripting.executeScript with allFrames: true, world: 'MAIN'.

import { showToast } from '../shared';
import { writeFlag } from '../state';

declare global {
  interface Window {
    __dynamicsCatDirtyTracking?: boolean;
    __dynamicsCatDirtyHandler?: (ctx?: Xrm.Events.EventContext) => void;
    __dynamicsCatDirtyFields?: Set<string>;
  }
}

const STYLE_ID = 'crm-tools-dirty-fields-style';

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
    writeFlag('dirtyActive', '0');
    showToast('🔴 Dirty field tracking disabled');
    return;
  }

  // Toggle on: subscribe onChange to every attribute and highlight as fields change.
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
  writeFlag('dirtyActive', '1');
  showToast('🟢 Dirty field tracking enabled');
}

main();
