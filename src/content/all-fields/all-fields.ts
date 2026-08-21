// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads entity metadata and renders a side-panel with a sortable table.

import { buildLabelMap } from '../shared';
import { createPanelShell, createSearchBar, createCopySpan, isolateKeyboard } from '../panel';
import {
  fetchJson,
  getDynamicsContext,
  resolveEntitySetName,
} from '../dynamics-context';

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

interface AttributeMetadata {
  LogicalName: string;
  SchemaName: string;
  AttributeType: string | null;
  AttributeOf: string | null;
  IsValidForRead: boolean;
  DisplayName?: { UserLocalizedLabel?: { Label: string } | null } | null;
}

interface FieldRow {
  label: string;
  name: string;
  type: string;
  value: string | null;
}

async function main(): Promise<void> {
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

  const loadFields = async (): Promise<void> => {
    const rows = await getAllFields(entityName, entityId);
    populateTbody(tbody, rows);
    search.triggerFilter();
  };

  // Refresh handler
  refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('cfp-spinning');
    Xrm.Page.data.refresh(false).then(
      async () => {
        try {
          await loadFields();
        } catch (err) {
          console.error('[DynamicsCat] Loading all fields failed:', err);
        } finally {
          refreshBtn.classList.remove('cfp-spinning');
          refreshBtn.disabled = false;
        }
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

  try {
    await loadFields();
  } catch (err) {
    console.error('[DynamicsCat] Loading all fields failed:', err);
    tbody.innerHTML = '<tr><td colspan="4" class="cfp-error">Could not load entity fields.</td></tr>';
  }

  // Size the panel to fit the table's natural width
  requestAnimationFrame(() => {
    const tableWidth = table.offsetWidth;
    panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + 'px';
  });
}

async function getAllFields(entityName: string, entityId: string): Promise<FieldRow[]> {
  const context = getDynamicsContext();
  if (!context) throw new Error('Dynamics context is unavailable');

  const metadata = await fetchJson<{ value: AttributeMetadata[] }>(
    context,
    () => `EntityDefinitions(LogicalName='${encodeURIComponent(entityName)}')/Attributes`
      + '?$select=LogicalName,SchemaName,AttributeType,AttributeOf,IsValidForRead,DisplayName',
  );
  let record: Record<string, unknown> = {};
  if (entityId) {
    try {
      record = await fetchRecord(entityName, entityId);
    } catch (err) {
      console.warn('[DynamicsCat] Saved field values could not be loaded:', err);
    }
  }

  const formAttributes = new Map(
    Xrm.Page.data.entity.attributes.get().map((attr) => [attr.getName(), attr]),
  );
  const formLabels = buildLabelMap();

  return metadata.value.map((field) => {
    const name = field.LogicalName;
    const formAttribute = formAttributes.get(name);
    const recordValue = record[name] ?? record[`_${name}_value`];
    return {
      label: formLabels[name] || field.DisplayName?.UserLocalizedLabel?.Label || name,
      name,
      type: formAttribute?.getAttributeType?.() || field.AttributeType || '—',
      value: formAttribute ? formatValue(formAttribute) : formatRecordValue(recordValue),
    };
  });
}

async function fetchRecord(
  entityName: string,
  entityId: string,
): Promise<Record<string, unknown>> {
  const context = getDynamicsContext();
  if (!context) throw new Error('Dynamics context is unavailable');

  const entitySetName = await resolveEntitySetName(context, entityName);
  const cleanId = entityId.replace(/[{}]/g, '');
  return await fetchJson<Record<string, unknown>>(
    context,
    () => `${entitySetName}(${cleanId})`,
    { headers: { Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' } },
  );
}

function formatRecordValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
  fields: FieldRow[],
): void {
  tbody.innerHTML = '';
  const sortedFields = [...fields].sort((a, b) => a.label.localeCompare(b.label));
  sortedFields.forEach(({ label, name, type, value }) => {

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
    if (value === null) {
      const nullSpan = document.createElement('span');
      nullSpan.className = 'cfp-null';
      nullSpan.textContent = 'null';
      tdValue.appendChild(nullSpan);
    } else {
      tdValue.textContent = value;
    }

    tr.dataset.searchLabel  = label.toLowerCase();
    tr.dataset.searchSchema = name.toLowerCase();
    tr.dataset.searchValue  = (value ?? 'null').toLowerCase();
    tr.appendChild(tdLabel);
    tr.appendChild(tdSchema);
    tr.appendChild(tdType);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  });
}

void main();
