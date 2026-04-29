// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads all Xrm attributes and renders a side-panel with a sortable table.

import { buildLabelMap } from '../shared';
import { createPanelShell, createSearchBar, createCopySpan, isolateKeyboard } from '../panel';

const PANEL_ID = 'crm-tools-fields-panel';
const STYLE_ID = 'crm-tools-fields-style';

const EXTRA_CSS = `
#${PANEL_ID} .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 16px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85; margin-right: 4px;
}
#${PANEL_ID} .cfp-refresh:hover { opacity: 1; }
#${PANEL_ID} .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#${PANEL_ID} .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
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
#${PANEL_ID} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${PANEL_ID} .cfp-null { color: #aaa; font-style: italic; }
`;

function main(): void {
  // Xrm is only available in the CRM form iframe — silently skip other frames
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
    return;
  }

  const shell = createPanelShell({
    panelId: PANEL_ID,
    styleId: STYLE_ID,
    title: '📋 All Fields',
    extraCss: EXTRA_CSS,
  });
  if (!shell) return; // toggled off

  const { panel, header, closeBtn, body } = shell;

  // Refresh button — inserted before close
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'cfp-refresh';
  refreshBtn.title = 'Refresh form data';
  refreshBtn.textContent = '↻';
  header.insertBefore(refreshBtn, closeBtn);

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
  panel.insertBefore(subheader, body);

  // Table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  const noResults = document.createElement('div');
  noResults.className = 'dcat-no-results';
  noResults.textContent = 'No matching fields.';
  noResults.style.display = 'none';

  // Search bar
  const filterRows = (q: string) => {
    let visible = 0;
    tbody.querySelectorAll<HTMLTableRowElement>('tr').forEach((row) => {
      const match = !q
        || row.dataset.searchLabel!.includes(q)
        || row.dataset.searchSchema!.includes(q)
        || row.dataset.searchValue!.includes(q);
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    noResults.style.display = visible === 0 ? '' : 'none';
  };
  const search = createSearchBar({
    placeholder: 'Search by label, schema name or value…',
    onFilter: filterRows,
  });
  isolateKeyboard(search.input);
  panel.insertBefore(search.container, body);

  // Initial data
  const attributes = Xrm.Page.data.entity.attributes.get();
  const labelMap   = buildLabelMap();
  populateTbody(tbody, attributes, labelMap);

  // Refresh handler
  refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('cfp-spinning');
    Xrm.Page.data.refresh(false).then(
      () => {
        populateTbody(tbody, Xrm.Page.data.entity.attributes.get(), buildLabelMap());
        search.triggerFilter();
        refreshBtn.classList.remove('cfp-spinning');
        refreshBtn.disabled = false;
      },
      (err: unknown) => {
        console.error('[DynamicsCat] Refresh failed:', err);
        refreshBtn.classList.remove('cfp-spinning');
        refreshBtn.disabled = false;
      },
    );
  });

  body.appendChild(table);
  body.appendChild(noResults);

  // Size the panel to fit the table's natural width
  requestAnimationFrame(() => {
    const tableWidth = table.offsetWidth;
    panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + 'px';
  });
}

function formatValue(attr: Xrm.Attributes.Attribute): string | null {
  try {
    const val = attr.getValue() as unknown;
    if (val === null || val === undefined) return null;

    const type = attr.getAttributeType ? attr.getAttributeType() : typeof val;

    switch (type) {
      case 'lookup': {
        if (!Array.isArray(val)) return String(val);
        return (val as Xrm.LookupValue[]).map((v) => v.name || v.id).join(', ');
      }
      case 'optionset':
      case 'multiselectoptionset': {
        const text = (attr as Xrm.Attributes.OptionSetAttribute).getText?.();
        return text != null ? String(text) : String(val);
      }
      case 'datetime': {
        return val instanceof Date ? val.toLocaleString() : String(val);
      }
      case 'boolean': {
        return val ? 'Yes' : 'No';
      }
      default:
        return String(val);
    }
  } catch {
    return '(error reading value)';
  }
}

function populateTbody(
  tbody: HTMLTableSectionElement,
  attributes: Xrm.Attributes.Attribute[],
  labelMap: Record<string, string>,
): void {
  tbody.innerHTML = '';
  const sortedAttrs = [...attributes].sort((a, b) => {
    const la = (labelMap[a.getName()] || a.getName()).toLowerCase();
    const lb = (labelMap[b.getName()] || b.getName()).toLowerCase();
    return la.localeCompare(lb);
  });
  sortedAttrs.forEach((attr) => {
    const name     = attr.getName();
    const label    = labelMap[name] || name;
    const type     = attr.getAttributeType ? attr.getAttributeType() : '—';
    const rawValue = formatValue(attr);

    const tr = document.createElement('tr');

    const tdLabel = document.createElement('td');
    tdLabel.textContent = label;

    const tdSchema = document.createElement('td');
    tdSchema.textContent = name;

    const tdType = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = 'cfp-type';
    typeBadge.textContent = type;
    tdType.appendChild(typeBadge);

    const tdValue = document.createElement('td');
    if (rawValue === null) {
      const nullSpan = document.createElement('span');
      nullSpan.className = 'cfp-null';
      nullSpan.textContent = 'null';
      tdValue.appendChild(nullSpan);
    } else {
      tdValue.textContent = rawValue;
    }

    tr.dataset.searchLabel  = label.toLowerCase();
    tr.dataset.searchSchema = name.toLowerCase();
    tr.dataset.searchValue  = (rawValue ?? 'null').toLowerCase();
    tr.appendChild(tdLabel);
    tr.appendChild(tdSchema);
    tr.appendChild(tdType);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  });
}

main();
