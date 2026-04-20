// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads all optionset/multiselectoptionset attributes and renders a side-panel.

import { debounce, buildLabelMap, makeDraggable, copyToClipboard } from './shared';

const PANEL_ID= 'crm-tools-optionsets-panel';
const STYLE_ID = 'crm-tools-optionsets-style';

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

  // Build label map from UI controls
  const labelMap = buildLabelMap();

  // Filter to only optionset / multiselectoptionset attributes
  const attrs = Xrm.Page.data.entity.attributes.get().filter(
    (a) => a.getAttributeType() === 'optionset' || a.getAttributeType() === 'multiselectoptionset',
  );

  // Sort by label
  const sortedAttrs = [...attrs].sort((a, b) => {
    const la = (labelMap[a.getName()] || a.getName()).toLowerCase();
    const lb = (labelMap[b.getName()] || b.getName()).toLowerCase();
    return la.localeCompare(lb);
  });

  injectStyles();
  buildPanel(sortedAttrs, labelMap);
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-optionsets-panel {
  position: fixed; top: 0; right: 0; width: auto; min-width: 420px; max-width: 90vw; max-height: 90vh;
  background: #fff; border: 2px solid #1e64c8;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18);
  z-index: 2147483647; display: flex; flex-direction: column;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#crm-tools-optionsets-panel .cop-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#crm-tools-optionsets-panel .cop-header-title { font-size: 14px; font-weight: 600; }
#crm-tools-optionsets-panel .cop-close {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#crm-tools-optionsets-panel .cop-close:hover { opacity: 1; }
#crm-tools-optionsets-panel .cop-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#crm-tools-optionsets-panel .cop-body { overflow-y: auto; overflow-x: auto; flex: 1; }
#crm-tools-optionsets-panel table { border-collapse: collapse; }
#crm-tools-optionsets-panel thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#crm-tools-optionsets-panel tbody tr:nth-child(even) { background: #f8f9ff; }
#crm-tools-optionsets-panel tbody tr:hover { background: #dceafe; }
#crm-tools-optionsets-panel td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#crm-tools-optionsets-panel td:nth-child(1), #crm-tools-optionsets-panel th:nth-child(1) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(2), #crm-tools-optionsets-panel th:nth-child(2) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(3), #crm-tools-optionsets-panel th:nth-child(3) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(4), #crm-tools-optionsets-panel th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#crm-tools-optionsets-panel td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#crm-tools-optionsets-panel .cop-null { color: #aaa; font-style: italic; }
#crm-tools-optionsets-panel .cop-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb;
  flex-shrink: 0;
}
#crm-tools-optionsets-panel .cop-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#crm-tools-optionsets-panel .cop-search input:focus { border-color: #1e64c8; }
#crm-tools-optionsets-panel .cop-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
#crm-tools-optionsets-panel .cop-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8;
  transition: background 0.15s;
}
#crm-tools-optionsets-panel .cop-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#crm-tools-optionsets-panel .cop-copy-val.cop-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#crm-tools-optionsets-panel .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#crm-tools-optionsets-panel .cop-options-list li { white-space: nowrap; }
  `;
  document.head.appendChild(style);
}

function makeCopySpan(display: string, copyValue: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'cop-copy-val';
  span.textContent = display;
  span.title = `Click to copy: ${copyValue}`;
  span.addEventListener('click', () => {
    copyToClipboard(copyValue);
    span.classList.add('cop-copied');
    setTimeout(() => span.classList.remove('cop-copied'), 1200);
  });
  return span;
}

function buildPanel(
  attrs: Xrm.Attributes.Attribute[],
  labelMap: Record<string, string>,
): void {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // Header
  const header = document.createElement('div');
  header.className = 'cop-header';

  const title = document.createElement('span');
  title.className = 'cop-header-title';
  title.textContent = '🔘 Option Sets';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'cop-close';
  closeBtn.title = 'Close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  makeDraggable(panel, header, closeBtn);

  // Entity info subheader
  const entityName = Xrm.Page.data.entity.getEntityName();
  const entityId   = Xrm.Page.data.entity.getId();

  const subheader = document.createElement('div');
  subheader.className = 'cop-subheader';
  subheader.append('Entity: ');
  subheader.appendChild(makeCopySpan(entityName, entityName));
  subheader.append('  |  ID: ');
  if (entityId) {
    const cleanId = entityId.replace(/^\{|\}$/g, '');
    subheader.appendChild(makeCopySpan(entityId, cleanId));
  } else {
    subheader.append('(new record)');
  }
  subheader.append(`  |  ${attrs.length} option set field(s)`);
  panel.appendChild(subheader);

  // Search bar
  const searchContainer = document.createElement('div');
  searchContainer.className = 'cop-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search by label or schema name…';
  // Prevent the host CRM page from swallowing keyboard events inside the panel
  searchInput.addEventListener('keydown', (e) => e.stopPropagation());
  searchInput.addEventListener('keyup', (e) => e.stopPropagation());
  searchContainer.appendChild(searchInput);
  panel.appendChild(searchContainer);

  // Scrollable body with table
  const body = document.createElement('div');
  body.className = 'cop-body';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  attrs.forEach((attr) => {
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
      li.appendChild(makeCopySpan(String(opt.value), String(opt.value)));
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
  noResults.className = 'cop-no-results';
  noResults.textContent = 'No matching fields.';
  noResults.style.display = 'none';

  searchInput.addEventListener('input', debounce(() => {
    const q = searchInput.value.toLowerCase().trim();
    let visible = 0;
    tbody.querySelectorAll<HTMLTableRowElement>('tr').forEach((row) => {
      const match = !q
        || row.dataset.searchLabel!.includes(q)
        || row.dataset.searchSchema!.includes(q);
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    noResults.style.display = visible === 0 ? '' : 'none';
  }, 100));

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
