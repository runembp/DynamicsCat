// Injected into CRM form frames via chrome.scripting.executeScript.
// Reads entity metadata and renders a side-panel with a sortable table.

import { buildLabelMap, showToast } from '../shared';
import { createPanelShell, createSearchBar, createCopySpan, isolateKeyboard } from '../panel';
import {
  fetchJson,
  getDynamicsContext,
  resolveEntitySetName,
  send,
} from '../dynamics-context';
import { acquireToggleLock } from '../state';

const PANEL_ID = 'crm-tools-fields-panel';
const STYLE_ID = 'crm-tools-fields-style';
const DEFAULT_PANEL_WIDTH = 728;

const EXTRA_CSS = `
#${PANEL_ID} {
  top: 16px; left: 16px; right: auto; transform: none;
  box-sizing: border-box; width: ${DEFAULT_PANEL_WIDTH}px; min-width: 400px; max-width: 90vw;
  resize: both; overflow: hidden; min-height: 280px;
  height: 720px;
}
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
  letter-spacing: 0.4px; color: #444; white-space: nowrap; cursor: pointer;
}
#${PANEL_ID} thead th:hover { background: #dfe9ff; }
#${PANEL_ID} thead th:focus { outline: 2px solid #1e64c8; outline-offset: -2px; }
#${PANEL_ID} thead th::after { content: ' ↕'; color: #888; }
#${PANEL_ID} thead th[aria-sort="ascending"]::after { content: ' ↑'; color: #1e64c8; }
#${PANEL_ID} thead th[aria-sort="descending"]::after { content: ' ↓'; color: #1e64c8; }
#${PANEL_ID} tbody tr:nth-child(even) { background: #f8f9ff; }
#${PANEL_ID} tbody tr:hover { background: #dceafe; }
#${PANEL_ID} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${PANEL_ID} td:nth-child(1), #${PANEL_ID} th:nth-child(1) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(2), #${PANEL_ID} th:nth-child(2) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(3), #${PANEL_ID} th:nth-child(3) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(4), #${PANEL_ID} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${PANEL_ID} td:nth-child(5), #${PANEL_ID} th:nth-child(5) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${PANEL_ID} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${PANEL_ID} .cfp-null { color: #aaa; font-style: italic; }
#${PANEL_ID} .cfp-value { display: flex; align-items: flex-start; gap: 6px; }
#${PANEL_ID} .cfp-value-text { flex: 1; min-width: 0; }
#${PANEL_ID} .cfp-edit {
  flex: none; padding: 0 3px; border: 0; background: none; color: #1e64c8;
  cursor: pointer; font-size: 14px; line-height: 1.2; opacity: 0.7;
}
#${PANEL_ID} .cfp-edit:hover { opacity: 1; }
#${PANEL_ID} .cfp-editor { display: flex; gap: 5px; min-width: 230px; }
#${PANEL_ID} .cfp-editor input {
  min-width: 0; flex: 1; padding: 3px 6px; border: 1px solid #bbb;
  border-radius: 3px; font: inherit; color: #222;
}
#${PANEL_ID} .cfp-editor input:focus { border-color: #1e64c8; outline: none; }
#${PANEL_ID} .cfp-save {
  padding: 3px 8px; border: 1px solid #1e64c8; border-radius: 3px;
  background: #1e64c8; color: #fff; cursor: pointer; font: inherit;
}
#${PANEL_ID} .cfp-save:disabled { opacity: 0.55; cursor: default; }
#${PANEL_ID} .cfp-cancel {
  padding: 3px 6px; border: 1px solid #aaa; border-radius: 3px;
  background: #fff; color: #555; cursor: pointer; font: inherit;
}
#${PANEL_ID} .cfp-update-mode {
  display: inline-block; padding: 2px 6px; border-radius: 10px;
  font-size: 11px; font-weight: 600;
}
#${PANEL_ID} .cfp-update-form { background: #fff3cd; color: #795600; }
#${PANEL_ID} .cfp-update-api { background: #d9ecff; color: #145a96; }
#${PANEL_ID} .cfp-update-readonly { background: #eee; color: #666; }
`;

interface AttributeMetadata {
  LogicalName: string;
  SchemaName: string;
  AttributeType: string | null;
  AttributeOf: string | null;
  IsValidForRead: boolean;
  IsValidForUpdate?: boolean | { Value?: boolean };
  DisplayName?: { UserLocalizedLabel?: { Label: string } | null } | null;
}

type UpdateMode = 'form' | 'api' | 'readonly';
type SortKey = 'label' | 'schema' | 'type' | 'value' | 'updateMode';
type SortDirection = 'ascending' | 'descending';

interface FieldRow {
  label: string;
  name: string;
  type: string;
  value: string | null;
  rawValue: unknown;
  updateMode: UpdateMode;
  formAttribute: Xrm.Attributes.Attribute | null;
}

async function main(): Promise<void> {
  // Xrm is only available in the CRM form iframe — silently skip other frames
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
    return;
  }
  if (!acquireToggleLock()) return;

  const hostDocument = getTopDocument();

  const shell = createPanelShell({
    panelId: PANEL_ID,
    styleId: STYLE_ID,
    title: '📋 All Fields',
    extraCss: EXTRA_CSS,
    targetDocument: hostDocument,
  });
  if (!shell) return; // toggled off

  const { panel, header, closeBtn, body } = shell;
  positionPanelInViewport(panel, hostDocument);

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
  thead.innerHTML = [
    '<tr>',
    '<th data-sort-key="label">Label</th>',
    '<th data-sort-key="schema">Schema Name</th>',
    '<th data-sort-key="type">Type</th>',
    '<th data-sort-key="value">Value</th>',
    '<th data-sort-key="updateMode">Edit via</th>',
    '</tr>',
  ].join('');
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  const applySort = setupSorting(thead, tbody);

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
    populateTbody(tbody, rows, entityName, entityId);
    applySort();
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
    tbody.innerHTML = '<tr><td colspan="5" class="cfp-error">Could not load entity fields.</td></tr>';
  }

}

function getTopDocument(): Document {
  try {
    return window.top?.document ?? document;
  } catch {
    return document;
  }
}

function positionPanelInViewport(panel: HTMLElement, hostDocument: Document): void {
  const hostWindow = hostDocument.defaultView ?? window;
  const margin = 16;
  const width = Math.min(DEFAULT_PANEL_WIDTH, hostWindow.innerWidth - margin * 2);
  const height = Math.min(720, hostWindow.innerHeight - margin * 2);

  panel.style.width = `${width}px`;
  panel.style.height = `${height}px`;
  panel.style.maxWidth = `${hostWindow.innerWidth - margin * 2}px`;
  panel.style.maxHeight = `${hostWindow.innerHeight - margin * 2}px`;
  panel.style.left = `${Math.max(margin, (hostWindow.innerWidth - width) / 2)}px`;
  panel.style.top = `${Math.max(margin, (hostWindow.innerHeight - height) / 2)}px`;
  panel.style.right = '';
  panel.style.transform = '';
}

async function getAllFields(entityName: string, entityId: string): Promise<FieldRow[]> {
  const context = getDynamicsContext();
  if (!context) throw new Error('Dynamics context is unavailable');

  const metadata = await fetchJson<{ value: AttributeMetadata[] }>(
    context,
    () => `EntityDefinitions(LogicalName='${encodeURIComponent(entityName)}')/Attributes`
      + '?$select=LogicalName,SchemaName,AttributeType,AttributeOf,IsValidForRead,IsValidForUpdate,DisplayName',
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
    const formAttribute = formAttributes.get(name) ?? null;
    const recordValue = record[name] ?? record[`_${name}_value`];
    const rawValue = formAttribute ? formAttribute.getValue() : recordValue;
    const editable = field.AttributeOf === null
      && isSupportedEditType(formAttribute?.getAttributeType?.() || field.AttributeType)
      && isValidForUpdate(field.IsValidForUpdate);
    return {
      label: formLabels[name] || field.DisplayName?.UserLocalizedLabel?.Label || name,
      name,
      type: formAttribute?.getAttributeType?.() || field.AttributeType || '—',
      value: formAttribute ? formatValue(formAttribute) : formatRecordValue(recordValue),
      rawValue,
      updateMode: editable && canUpdateFormAttribute(formAttribute)
        ? 'form'
        : editable && Boolean(entityId)
          ? 'api'
          : 'readonly',
      formAttribute,
    };
  });
}

function isValidForUpdate(value: AttributeMetadata['IsValidForUpdate']): boolean {
  return value === true || (typeof value === 'object' && value?.Value === true);
}

function canUpdateFormAttribute(attr: Xrm.Attributes.Attribute | null): boolean {
  if (!attr) return false;
  try {
    return attr.getUserPrivilege().canUpdate;
  } catch {
    return false;
  }
}

function isSupportedEditType(type: string | null | undefined): boolean {
  return [
    'boolean',
    'datetime',
    'decimal',
    'double',
    'integer',
    'memo',
    'money',
    'multiselectoptionset',
    'picklist',
    'state',
    'status',
    'string',
    'optionset',
  ].includes((type ?? '').toLowerCase());
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
  entityName: string,
  entityId: string,
): void {
  tbody.innerHTML = '';
  fields.forEach((field) => {
    const { label, name, type, value, updateMode } = field;

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
    renderValueCell(tdValue, field, entityName, entityId, tr);

    const tdUpdateMode = document.createElement('td');
    const updateBadge = document.createElement('span');
    updateBadge.className = `cfp-update-mode cfp-update-${updateMode}`;
    updateBadge.textContent = updateMode === 'form'
      ? 'Form'
      : updateMode === 'api'
        ? 'Web API'
        : 'Read only';
    updateBadge.title = updateMode === 'form'
      ? 'Updates the form value; saved by the normal CRM save action.'
      : updateMode === 'api'
        ? 'Saves immediately through the Dynamics Web API.'
        : 'This field type or metadata does not allow updates here.';
    tdUpdateMode.appendChild(updateBadge);

    tr.dataset.searchLabel  = label.toLowerCase();
    tr.dataset.searchSchema = name.toLowerCase();
    tr.dataset.searchValue  = (value ?? 'null').toLowerCase();
    tr.dataset.sortLabel = label;
    tr.dataset.sortSchema = name;
    tr.dataset.sortType = type;
    tr.dataset.sortValue = value ?? '';
    tr.dataset.sortUpdateMode = updateMode;
    tr.appendChild(tdLabel);
    tr.appendChild(tdSchema);
    tr.appendChild(tdType);
    tr.appendChild(tdValue);
    tr.appendChild(tdUpdateMode);
    tbody.appendChild(tr);
  });
}

function setupSorting(
  thead: HTMLTableSectionElement,
  tbody: HTMLTableSectionElement,
): () => void {
  let activeKey: SortKey = 'label';
  let direction: SortDirection = 'ascending';
  const headers = Array.from(thead.querySelectorAll<HTMLTableCellElement>('th[data-sort-key]'));
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  const applySort = (): void => {
    const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));
    const dataKey = `sort${activeKey[0]!.toUpperCase()}${activeKey.slice(1)}` as keyof DOMStringMap;
    const multiplier = direction === 'ascending' ? 1 : -1;
    rows.sort((a, b) => collator.compare(a.dataset[dataKey] ?? '', b.dataset[dataKey] ?? '') * multiplier);
    rows.forEach((row) => tbody.appendChild(row));

    headers.forEach((header) => {
      const isActive = header.dataset.sortKey === activeKey;
      header.setAttribute('aria-sort', isActive ? direction : 'none');
    });
  };

  const selectSort = (key: SortKey): void => {
    if (activeKey === key) {
      direction = direction === 'ascending' ? 'descending' : 'ascending';
    } else {
      activeKey = key;
      direction = 'ascending';
    }
    applySort();
  };

  headers.forEach((header) => {
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    const key = header.dataset.sortKey as SortKey;
    header.addEventListener('click', () => selectSort(key));
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectSort(key);
      }
    });
  });
  applySort();
  return applySort;
}

function renderValueCell(
  cell: HTMLTableCellElement,
  field: FieldRow,
  entityName: string,
  entityId: string,
  row: HTMLTableRowElement,
): void {
  cell.innerHTML = '';

  const valueContainer = document.createElement('div');
  valueContainer.className = 'cfp-value';

  const valueText = document.createElement('span');
  valueText.className = 'cfp-value-text';
  valueText.textContent = field.value ?? 'null';
  if (field.value === null) valueText.classList.add('cfp-null');
  valueContainer.appendChild(valueText);

  if (field.updateMode !== 'readonly') {
    const editBtn = document.createElement('button');
    editBtn.className = 'cfp-edit';
    editBtn.type = 'button';
    editBtn.textContent = '✎';
    editBtn.title = `Edit ${field.name}`;
    editBtn.setAttribute('aria-label', `Edit ${field.name}`);
    editBtn.addEventListener('click', () => {
      cell.innerHTML = '';
      cell.appendChild(createEditor(
        field,
        entityName,
        entityId,
        row,
        () => renderValueCell(cell, field, entityName, entityId, row),
      ));
      cell.querySelector<HTMLInputElement>('input')?.focus();
    });
    valueContainer.appendChild(editBtn);
  }

  cell.appendChild(valueContainer);
}

function createEditor(
  field: FieldRow,
  entityName: string,
  entityId: string,
  row: HTMLTableRowElement,
  closeEditor: () => void,
): HTMLDivElement {
  const editor = document.createElement('div');
  editor.className = 'cfp-editor';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = rawValueToInput(field.rawValue);
  input.placeholder = 'null';
  input.title = getInputHint(field.type);
  isolateKeyboard(input);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'cfp-save';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cfp-cancel';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeEditor);

  const save = async (): Promise<void> => {
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    saveBtn.textContent = field.updateMode === 'api' ? 'Saving…' : 'Applying…';
    try {
      const parsedValue = parseInputValue(input.value, field.type);
      if (field.updateMode === 'form' && field.formAttribute) {
        field.formAttribute.setValue(parsedValue);
        field.formAttribute.fireOnChange();
        showToast(`${field.name} updated on form; save the CRM record to persist it.`);
      } else if (field.updateMode === 'api') {
        await updateFieldViaApi(entityName, entityId, field.name, parsedValue);
        showToast(`${field.name} saved through Web API.`);
      }
      field.rawValue = parsedValue;
      field.value = formatRawValue(parsedValue);
      row.dataset.searchValue = (field.value ?? 'null').toLowerCase();
      row.dataset.sortValue = field.value ?? '';
      closeEditor();
    } catch (err) {
      console.error(`[DynamicsCat] Updating ${field.name} failed:`, err);
      showToast(
        `Could not update ${field.name}: ${err instanceof Error ? err.message : String(err)}`,
        'warn',
      );
      saveBtn.textContent = 'Save';
    } finally {
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  };

  saveBtn.addEventListener('click', () => { void save(); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor();
    }
  });
  editor.append(input, saveBtn, cancelBtn);
  return editor;
}

function rawValueToInput(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

function getInputHint(type: string): string {
  switch (type.toLowerCase()) {
    case 'boolean': return 'Use true or false. Empty sets null.';
    case 'datetime': return 'Use a valid date/time. Empty sets null.';
    case 'multiselectoptionset': return 'Use comma-separated option numbers. Empty sets null.';
    case 'picklist':
    case 'state':
    case 'status':
    case 'optionset': return 'Use the numeric option value. Empty sets null.';
    default: return 'Empty sets null.';
  }
}

function parseInputValue(input: string, type: string): Xrm.Attributes.AttributeValues | null {
  const normalizedType = type.toLowerCase();
  if (input === '') return null;

  if (normalizedType === 'boolean') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
    throw new Error('Expected true or false.');
  }

  if (normalizedType === 'datetime') {
    const value = new Date(input);
    if (Number.isNaN(value.getTime())) throw new Error('Expected a valid date/time.');
    return value;
  }

  if (normalizedType === 'multiselectoptionset') {
    const values = input.split(',').map((part) => Number(part.trim()));
    if (values.some((value) => !Number.isInteger(value))) {
      throw new Error('Expected comma-separated option numbers.');
    }
    return values;
  }

  if ([
    'decimal',
    'double',
    'integer',
    'money',
    'picklist',
    'state',
    'status',
    'optionset',
  ].includes(normalizedType)) {
    const value = Number(input);
    if (!Number.isFinite(value)) throw new Error('Expected a number.');
    return value;
  }

  return input;
}

function formatRawValue(value: Xrm.Attributes.AttributeValues | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

async function updateFieldViaApi(
  entityName: string,
  entityId: string,
  fieldName: string,
  value: Xrm.Attributes.AttributeValues | null,
): Promise<void> {
  const context = getDynamicsContext();
  if (!context) throw new Error('Dynamics context is unavailable.');

  const entitySetName = await resolveEntitySetName(context, entityName);
  const cleanId = entityId.replace(/[{}]/g, '');
  const apiValue = value instanceof Date
    ? value.toISOString()
    : Array.isArray(value)
      ? value.join(',')
      : value;

  await send(
    context,
    () => `${entitySetName}(${cleanId})`,
    {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'If-Match': '*',
      },
      body: JSON.stringify({ [fieldName]: apiValue }),
    },
  );
}

void main();
