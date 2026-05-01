import { showToast } from '../shared';
import { createPanelShell, isolateKeyboard } from '../panel';

const PANEL_ID   = 'crm-tools-newest-modified-panel';
const STYLE_ID   = 'crm-tools-newest-modified-style';
const LIST_ID    = 'crm-tools-newest-modified-list';
const CACHE_KEY  = '__dynamicscat_entity_cache';
const TTL_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days
const GUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EntityMeta {
  LogicalName: string;
  DisplayName: { UserLocalizedLabel: { Label: string } | null } | null;
  EntitySetName: string;
  PrimaryIdAttribute: string;
}

interface EntityCache {
  clientUrl: string;
  entities: EntityMeta[];
  timestamp: number;
}

const EXTRA_CSS = `
#${PANEL_ID} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${PANEL_ID} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${PANEL_ID} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${PANEL_ID} .cnm-input:focus { border-color: #1e64c8; }
#${PANEL_ID} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${PANEL_ID} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${PANEL_ID} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${PANEL_ID} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#${PANEL_ID} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${PANEL_ID} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${PANEL_ID} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${PANEL_ID} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${PANEL_ID} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${PANEL_ID} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${PANEL_ID} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${PANEL_ID} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${PANEL_ID} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${PANEL_ID} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;

function apiVersionFromCrmVersion(crmVersion: string): string {
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  return major >= 9 ? 'v9.0' : 'v8.2';
}

function getDisplayName(meta: EntityMeta): string {
  return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
}

function loadCachedEntities(clientUrl: string): EntityMeta[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as EntityCache;
    if (cache.clientUrl !== clientUrl) return null;
    if (Date.now() - cache.timestamp >= TTL_MS) return null;
    return cache.entities;
  } catch {
    return null;
  }
}

function saveCachedEntities(clientUrl: string, entities: EntityMeta[]): void {
  try {
    const cache: EntityCache = { clientUrl, entities, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full — ignore */ }
}

async function main(): Promise<void> {
  if (typeof Xrm === 'undefined' || !Xrm.Page?.context) return;

  const shell = createPanelShell({
    panelId: PANEL_ID,
    styleId: STYLE_ID,
    title: '🕐 Jump to Latest',
    variant: 'dialog',
    extraCss: EXTRA_CSS,
  });
  if (!shell) return; // toggled off

  const { panel, body } = shell;

  const clientUrl  = Xrm.Page.context.getClientUrl();
  const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());

  // ── Form content ────────────────────────────────────────────────────────────

  // Entity input row
  const entityRow = document.createElement('div');
  entityRow.className = 'cnm-row';
  const entityLabel = document.createElement('label');
  entityLabel.className = 'cnm-label';
  entityLabel.textContent = 'Entity';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cnm-input';
  input.placeholder = 'Loading…';
  input.disabled = true;
  input.setAttribute('list', LIST_ID);
  input.setAttribute('autocomplete', 'off');
  const datalist = document.createElement('datalist');
  datalist.id = LIST_ID;
  isolateKeyboard(input);
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'cnm-refresh-btn';
  refreshBtn.textContent = '🔄';
  refreshBtn.title = 'Refresh entity list';
  entityRow.append(entityLabel, input, refreshBtn, datalist);

  // GUID row
  const guidRow = document.createElement('div');
  guidRow.className = 'cnm-row';
  const guidLabel = document.createElement('label');
  guidLabel.className = 'cnm-label';
  guidLabel.textContent = 'Record ID';
  const guidInput = document.createElement('input');
  guidInput.type = 'text';
  guidInput.className = 'cnm-input';
  guidInput.placeholder = 'Optional GUID…';
  isolateKeyboard(guidInput);
  guidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void openRecord();
  });
  guidRow.append(guidLabel, guidInput);

  // Sort-by row
  let sortField: 'modifiedon' | 'createdon' = 'modifiedon';
  const sortRow = document.createElement('div');
  sortRow.className = 'cnm-row';
  const sortLabel = document.createElement('span');
  sortLabel.className = 'cnm-label';
  sortLabel.textContent = 'Sort by';

  const sortBtns: HTMLButtonElement[] = [];
  const makeSortBtn = (text: string, field: typeof sortField) => {
    const btn = document.createElement('button');
    btn.className = 'cnm-sort-btn' + (field === sortField ? ' cnm-sort-active' : '');
    btn.textContent = text;
    sortBtns.push(btn);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      sortField = field;
      sortBtns.forEach(b => b.classList.remove('cnm-sort-active'));
      btn.classList.add('cnm-sort-active');
    });
    return btn;
  };
  sortRow.append(sortLabel, makeSortBtn('Newest Modified', 'modifiedon'), makeSortBtn('Newest Created', 'createdon'));

  // Action row — open button left, subtle days-limit input right
  const actionRow = document.createElement('div');
  actionRow.className = 'cnm-row cnm-action-row';
  const openBtn = document.createElement('button');
  openBtn.className = 'cnm-open-btn';
  openBtn.textContent = 'Open Record';
  openBtn.disabled = true;
  const withinInput = document.createElement('input');
  withinInput.type = 'number';
  withinInput.className = 'cnm-within-input';
  withinInput.min = '1';
  withinInput.value = '14';
  withinInput.title = 'Limit search to last N days (leave empty for all time)';
  isolateKeyboard(withinInput);
  actionRow.append(withinInput, openBtn);

  // Disable sort when a GUID is entered
  guidInput.addEventListener('input', () => {
    const isGuid = GUID_RE.test(guidInput.value.trim());
    sortBtns.forEach(b => { b.disabled = isGuid; });
  });

  body.append(entityRow, guidRow, sortRow, actionRow);

  // ── Fetch entity list (localStorage cached with TTL) ───────────────────────
  let allEntities: EntityMeta[] = [];

  async function fetchEntities(bypassCache = false): Promise<boolean> {
    if (!bypassCache) {
      const cached = loadCachedEntities(clientUrl);
      if (cached) { allEntities = cached; return true; }
    }
    try {
      const res = await fetch(
        `${clientUrl}/api/data/${apiVersion}/EntityDefinitions` +
        `?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`,
      );
      const json = await res.json() as { value: EntityMeta[] };
      allEntities = json.value
        .filter(e => e.EntitySetName)
        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
      saveCachedEntities(clientUrl, allEntities);
      return true;
    } catch {
      return false;
    }
  }

  function populateDatalist(): void {
    datalist.innerHTML = '';
    for (const e of allEntities) {
      const opt = document.createElement('option');
      opt.value = getDisplayName(e);
      opt.label = e.LogicalName;
      datalist.appendChild(opt);
    }
  }

  // Initial load
  input.placeholder = 'Loading…';
  input.disabled = true;
  if (await fetchEntities()) {
    populateDatalist();
    input.placeholder = 'Type entity name…';
    input.disabled = false;
    openBtn.disabled = false;
  } else {
    input.placeholder = 'Failed to load entities';
    showToast('Could not load entity list.', 'warn');
    return;
  }

  // Refresh button handler
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('cnm-spinning');
    input.disabled = true;
    input.placeholder = 'Refreshing…';
    localStorage.removeItem(CACHE_KEY);
    if (await fetchEntities(true)) {
      populateDatalist();
      input.placeholder = 'Type entity name…';
      input.disabled = false;
    } else {
      input.placeholder = 'Refresh failed';
      showToast('Could not refresh entity list.', 'warn');
      input.disabled = false;
    }
    refreshBtn.classList.remove('cnm-spinning');
  });

  // ── Open handler ─────────────────────────────────────────────────────────────
  const openRecord = async () => {
    const query = input.value.trim().toLowerCase();
    if (!query) { showToast('Enter an entity name.', 'warn'); return; }

    const meta = allEntities.find(e =>
      getDisplayName(e).toLowerCase() === query ||
      e.LogicalName.toLowerCase()      === query,
    );
    if (!meta) {
      showToast(`Entity "${input.value.trim()}" not found.`, 'warn');
      return;
    }

    const guidValue = guidInput.value.trim();
    if (GUID_RE.test(guidValue)) {
      const cleanId = guidValue.replace(/^\{|\}$/g, '');
      window.open(
        `${clientUrl}/main.aspx?pagetype=entityrecord&etn=${meta.LogicalName}&id=%7B${cleanId}%7D`,
        '_blank',
      );
      panel.remove();
      return;
    }

    const withinDays = withinInput.value ? parseInt(withinInput.value, 10) : null;
    let filterClause = '';
    if (withinDays !== null) {
      const since = new Date(Date.now() - withinDays * 86_400_000).toISOString();
      filterClause = `&$filter=${sortField}%20ge%20${since}`;
    }

    openBtn.disabled    = true;
    openBtn.textContent = 'Opening…';
    try {
      const recordUrl = `${clientUrl}/api/data/${apiVersion}/${meta.EntitySetName}` +
        `?$select=${meta.PrimaryIdAttribute}&$orderby=${sortField}%20desc&$top=1${filterClause}`;
      console.log('[DynamicsCat] OData query:', recordUrl);
      const res  = await fetch(recordUrl, {
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });
      const json = await res.json() as { value: Record<string, string>[] };

      if (!json.value?.length) {
        showToast(`No records found for "${getDisplayName(meta)}".`, 'warn');
        return;
      }

      const rawId   = json.value[0][meta.PrimaryIdAttribute] ?? '';
      const cleanId = rawId.replace(/^\{|\}$/g, '');
      if (!cleanId) { showToast('Could not determine record ID.', 'warn'); return; }

      window.open(
        `${clientUrl}/main.aspx?pagetype=entityrecord&etn=${meta.LogicalName}&id=%7B${cleanId}%7D`,
        '_blank',
      );
      panel.remove();
    } catch {
      showToast('Failed to fetch record.', 'warn');
    } finally {
      openBtn.disabled    = false;
      openBtn.textContent = 'Open Record';
    }
  };

  openBtn.addEventListener('click', () => { void openRecord(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void openRecord();
  });
}

void main();
