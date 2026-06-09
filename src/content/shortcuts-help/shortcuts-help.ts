// Toggle content script: shows a panel listing the keyboard/mouse shortcuts
// DynamicsCat adds to CRM forms.  The two configurable click-shortcuts (Unlock
// field / Open lookup field) are read from the shared dataset so the panel
// reflects the user's current configuration; the rest are fixed.
// Injected into the top frame only (allFrames: false), world: 'MAIN'.

import { readFlag } from '../state';
import { createPanelShell } from '../panel';

const PANEL_ID = 'crm-tools-shortcuts-panel';
const STYLE_ID = 'crm-tools-shortcuts-style';

const DEFAULT_READONLY_SHORTCUT = 'alt';
const DEFAULT_FIELD_CLICK_SHORTCUT = 'ctrl';

const EXTRA_CSS = `
#${PANEL_ID} table { width: 100%; border-collapse: collapse; }
#${PANEL_ID} td { padding: 8px 4px; border-bottom: 1px solid #e8e8e8; vertical-align: middle; }
#${PANEL_ID} tr:last-child td { border-bottom: none; }
#${PANEL_ID} .dcat-keys { white-space: nowrap; width: 1%; }
#${PANEL_ID} kbd {
  display: inline-block; font-family: Consolas, monospace; font-size: 12px;
  background: #f0f4ff; border: 1px solid #c5d8fb; border-bottom-width: 2px;
  border-radius: 4px; padding: 2px 7px; color: #1e64c8;
  min-width: 12px; text-align: center;
}
#${PANEL_ID} .dcat-plus { color: #888; margin: 0 3px; }
#${PANEL_ID} .dcat-action { padding-left: 16px; color: #333; }
`;

interface ShortcutRow {
  keys: string[];
  action: string;
}

/** 'alt+shift' → ['Alt', 'Shift', 'Click'] */
function clickShortcutKeys(shortcut: string): string[] {
  const parts = shortcut.split('+').map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  parts.push('Click');
  return parts;
}

function main(): void {
  const shell = createPanelShell({
    panelId: PANEL_ID,
    styleId: STYLE_ID,
    title: '⌨️ Keyboard Shortcuts',
    variant: 'dialog',
    extraCss: EXTRA_CSS,
  });
  if (!shell) return; // toggled off

  const readonlyShortcut = readFlag('readonlyShortcut') || DEFAULT_READONLY_SHORTCUT;
  const fieldClickShortcut = readFlag('fieldClickShortcut') || DEFAULT_FIELD_CLICK_SHORTCUT;

  const rows: ShortcutRow[] = [
    { keys: clickShortcutKeys(readonlyShortcut), action: 'Unlock field' },
    { keys: clickShortcutKeys(fieldClickShortcut), action: 'Open lookup field' },
    { keys: clickShortcutKeys(fieldClickShortcut), action: 'Copy field logical name (on label)' },
    { keys: ['Alt', 'A'], action: 'Show all hidden fields' },
    { keys: ['Alt', 'U'], action: 'Unlock all fields' },
    { keys: ['Alt', 'O'], action: 'Toggle Jump to Latest panel' },
    { keys: ['Alt', 'Shift', 'O'], action: 'Repeat last Jump to Latest search' },
  ];

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  rows.forEach((row) => {
    const tr = document.createElement('tr');

    const tdKeys = document.createElement('td');
    tdKeys.className = 'dcat-keys';
    row.keys.forEach((key, i) => {
      if (i > 0) {
        const plus = document.createElement('span');
        plus.className = 'dcat-plus';
        plus.textContent = '+';
        tdKeys.appendChild(plus);
      }
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      tdKeys.appendChild(kbd);
    });

    const tdAction = document.createElement('td');
    tdAction.className = 'dcat-action';
    tdAction.textContent = row.action;

    tr.append(tdKeys, tdAction);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  shell.body.appendChild(table);
}

main();
