// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads all Xrm attributes and renders a side-panel with a sortable table.

import { debounce, buildLabelMap, makeDraggable, copyToClipboard } from './shared';

const PANEL_ID = 'crm-tools-fields-panel';
const STYLE_ID = 'crm-tools-fields-style';

function main(): void {
  // Toggle: remove panel if already open
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    return;
  }

  // Xrm is only available in the CRM form iframe — silently skip other frames
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
    return;
  }

  const attributes = Xrm.Page.data.entity.attributes.get();
  const labelMap   = buildLabelMap();

  injectStyles();
  buildPanel(attributes, labelMap);
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-fields-panel {
  position: fixed; top: 0; right: 0; width: auto; min-width: 420px; max-width: 90vw; max-height: 90vh;
  background: #fff; border: 2px solid #1e64c8;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18);
  z-index: 2147483647; display: flex; flex-direction: column;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#crm-tools-fields-panel .cfp-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#crm-tools-fields-panel .cfp-header-title { font-size: 14px; font-weight: 600; }
#crm-tools-fields-panel .cfp-close,
#crm-tools-fields-panel .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#crm-tools-fields-panel .cfp-close:hover,
#crm-tools-fields-panel .cfp-refresh:hover { opacity: 1; }
#crm-tools-fields-panel .cfp-refresh { font-size: 16px; margin-right: 4px; }
#crm-tools-fields-panel .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#crm-tools-fields-panel .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#crm-tools-fields-panel .cfp-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8;
  transition: background 0.15s;
}
#crm-tools-fields-panel .cfp-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#crm-tools-fields-panel .cfp-copy-val.cfp-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#crm-tools-fields-panel .cfp-body { overflow-y: auto; overflow-x: auto; flex: 1; }
#crm-tools-fields-panel table { border-collapse: collapse; }
#crm-tools-fields-panel thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#crm-tools-fields-panel tbody tr:nth-child(even) { background: #f8f9ff; }
#crm-tools-fields-panel tbody tr:hover { background: #dceafe; }
#crm-tools-fields-panel td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#crm-tools-fields-panel td:nth-child(1), #crm-tools-fields-panel th:nth-child(1) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(2), #crm-tools-fields-panel th:nth-child(2) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(3), #crm-tools-fields-panel th:nth-child(3) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(4), #crm-tools-fields-panel th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#crm-tools-fields-panel td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#crm-tools-fields-panel .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#crm-tools-fields-panel .cfp-null { color: #aaa; font-style: italic; }
#crm-tools-fields-panel .cfp-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb;
  flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#crm-tools-fields-panel .cfp-search input:focus { border-color: #1e64c8; }
#crm-tools-fields-panel .cfp-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
  `;
  document.head.appendChild(style);
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

function makeCopySpan(display: string, copyValue: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cfp-copy-val';
  span.textContent = display;
  span.title = `Click to copy: ${copyValue}`;
  span.addEventListener('click', () => {
    copyToClipboard(copyValue);
    span.classList.add('cfp-copied');
    setTimeout(() => span.classList.remove('cfp-copied'), 1200);
  });
  return span;
}

function buildPanel(
  attributes: Xrm.Attributes.Attribute[],
  labelMap: Record<string, string>,
): void {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // Header
  const header = document.createElement('div');
  header.className = 'cfp-header';

  const title = document.createElement('span');
  title.className = 'cfp-header-title';
  title.textContent = '📋 All Fields';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'cfp-refresh';
  refreshBtn.title = 'Refresh form data';
  refreshBtn.textContent = '↻';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'cfp-close';
  closeBtn.title = 'Close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());

  header.appendChild(title);
  header.appendChild(refreshBtn);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  makeDraggable(panel, header, closeBtn);

  // Entity info subheader
  const entityName = Xrm.Page.data.entity.getEntityName();
  const entityId   = Xrm.Page.data.entity.getId();

  const subheader = document.createElement('div');
  subheader.className = 'cfp-subheader';

  subheader.append('Entity: ');
  subheader.appendChild(makeCopySpan(entityName, entityName));
  subheader.append('  |  ID: ');
  if (entityId) {
    // Strip surrounding braces from the GUID when copying
    const cleanId = entityId.replace(/^\{|\}$/g, '');
    subheader.appendChild(makeCopySpan(entityId, cleanId));
  } else {
    subheader.append('(new record)');
  }

  panel.appendChild(subheader);

  // Search bar
  const searchContainer = document.createElement('div');
  searchContainer.className = 'cfp-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search by label, schema name or value…';
  // Prevent the host CRM page from swallowing keyboard events inside the panel
  searchInput.addEventListener('keydown', (e) => e.stopPropagation());
  searchInput.addEventListener('keyup', (e) => e.stopPropagation());
  searchContainer.appendChild(searchInput);
  panel.appendChild(searchContainer);

  // Scrollable body with table
  const body = document.createElement('div');
  body.className = 'cfp-body';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  populateTbody(tbody, attributes, labelMap);

  table.appendChild(tbody);

  const noResults = document.createElement('div');
  noResults.className = 'cfp-no-results';
  noResults.textContent = 'No matching fields.';
  noResults.style.display = 'none';

  searchInput.addEventListener('input', debounce(() => {
    const q = searchInput.value.toLowerCase().trim();
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
  }, 100));

  const applySearch = () => searchInput.dispatchEvent(new Event('input'));

  refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('cfp-spinning');
    Xrm.Page.data.refresh(false).then(
      () => {
        const newAttrs    = Xrm.Page.data.entity.attributes.get();
        const newLabels   = buildLabelMap();
        populateTbody(tbody, newAttrs, newLabels);
        applySearch();
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
  panel.appendChild(body);
  document.body.appendChild(panel);

  // Size the panel to fit the table's natural width after it's in the DOM
  requestAnimationFrame(() => {
    const tableWidth = table.offsetWidth;
    panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + 'px';
  });
}

main();
