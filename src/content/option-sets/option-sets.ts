// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads all optionset/multiselectoptionset attributes and renders a side-panel.

import { buildLabelMap } from '../shared';
import { createPanelShell, createSearchBar, createCopySpan, isolateKeyboard } from '../panel';

const PANEL_ID = 'crm-tools-optionsets-panel';
const STYLE_ID = 'crm-tools-optionsets-style';

const EXTRA_CSS = `
#${PANEL_ID} table { width: 100%; border-collapse: collapse; }
#${PANEL_ID} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${PANEL_ID} tbody tr:nth-child(even) { background: #f8f9ff; }
#${PANEL_ID} tbody tr:hover { background: #dceafe; }
#${PANEL_ID} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${PANEL_ID} td:nth-child(1), #${PANEL_ID} th:nth-child(1) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(2), #${PANEL_ID} th:nth-child(2) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(3), #${PANEL_ID} th:nth-child(3) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(4), #${PANEL_ID} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${PANEL_ID} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${PANEL_ID} .cop-null { color: #aaa; font-style: italic; }
#${PANEL_ID} .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#${PANEL_ID} .cop-options-list li { white-space: nowrap; }
`;

function main(): void {
  // Xrm is only available in the CRM form iframe — silently skip other frames
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
    return;
  }

  const shell = createPanelShell({
    panelId: PANEL_ID,
    styleId: STYLE_ID,
    title: '🔘 Option Sets',
    extraCss: EXTRA_CSS,
  });
  if (!shell) return; // toggled off

  const { panel, body } = shell;

  const labelMap = buildLabelMap();

  // Filter to only optionset / multiselectoptionset attributes
  const attrs = Xrm.Page.data.entity.attributes.get().filter(
    (a) => a.getAttributeType() === 'optionset' || a.getAttributeType() === 'multiselectoptionset',
  );
  const sortedAttrs = [...attrs].sort((a, b) => {
    const la = (labelMap[a.getName()] || a.getName()).toLowerCase();
    const lb = (labelMap[b.getName()] || b.getName()).toLowerCase();
    return la.localeCompare(lb);
  });

  // Entity info subheader
  const entityName = Xrm.Page.data.entity.getEntityName();
  const entityId   = Xrm.Page.data.entity.getId();
  const subheader = document.createElement('div');
  subheader.className = 'dcat-subheader';
  subheader.append('Entity: ');
  subheader.appendChild(createCopySpan(entityName, entityName));
  subheader.append('  |  ID: ');
  if (entityId) {
    const cleanId = entityId.replace(/^\{|\}$/g, '');
    subheader.appendChild(createCopySpan(entityId, cleanId));
  } else {
    subheader.append('(new record)');
  }
  subheader.append(`  |  ${sortedAttrs.length} option set field(s)`);
  panel.insertBefore(subheader, body);

  // Table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  sortedAttrs.forEach((attr) => {
    const name  = attr.getName();
    const label = labelMap[name] || name;
    const currentText = (attr as Xrm.Attributes.OptionSetAttribute).getText?.() ?? null;

    let options: Array<{ text: string; value: number }> = [];
    try {
      options = (attr as Xrm.Attributes.OptionSetAttribute).getOptions();
    } catch {
      options = [];
    }

    const tr = document.createElement('tr');
    tr.dataset.searchLabel  = label.toLowerCase();
    tr.dataset.searchSchema = name.toLowerCase();

    const tdLabel = document.createElement('td');
    tdLabel.textContent = label;

    const tdSchema = document.createElement('td');
    tdSchema.textContent = name;

    const tdCurrentValue = document.createElement('td');
    if (currentText === null) {
      const nullSpan = document.createElement('span');
      nullSpan.className = 'cop-null';
      nullSpan.textContent = 'null';
      tdCurrentValue.appendChild(nullSpan);
    } else {
      tdCurrentValue.textContent = currentText;
    }

    const tdOptions = document.createElement('td');
    const ul = document.createElement('ul');
    ul.className = 'cop-options-list';
    options.forEach((opt) => {
      const li = document.createElement('li');
      li.appendChild(createCopySpan(String(opt.value), String(opt.value)));
      li.append(`: ${opt.text}`);
      ul.appendChild(li);
    });
    tdOptions.appendChild(ul);

    tr.appendChild(tdLabel);
    tr.appendChild(tdSchema);
    tr.appendChild(tdCurrentValue);
    tr.appendChild(tdOptions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  const noResults = document.createElement('div');
  noResults.className = 'dcat-no-results';
  noResults.textContent = 'No matching fields.';
  noResults.style.display = 'none';

  // Search bar
  const search = createSearchBar({
    placeholder: 'Search by label or schema name…',
    onFilter: (q) => {
      let visible = 0;
      tbody.querySelectorAll<HTMLTableRowElement>('tr').forEach((row) => {
        const match = !q
          || row.dataset.searchLabel!.includes(q)
          || row.dataset.searchSchema!.includes(q);
        row.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      noResults.style.display = visible === 0 ? '' : 'none';
    },
  });
  isolateKeyboard(search.input);
  panel.insertBefore(search.container, body);

  body.appendChild(table);
  body.appendChild(noResults);

  // Size the panel to fit the table's natural width
  requestAnimationFrame(() => {
    const tableWidth = table.offsetWidth;
    panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + 'px';
  });
}

main();
