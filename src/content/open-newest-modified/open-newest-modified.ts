import { showToast, makeDraggable } from '../shared';

const PANEL_ID   = 'crm-tools-newest-modified-panel';
const STYLE_ID   = 'crm-tools-newest-modified-style';
const LIST_ID    = 'crm-tools-newest-modified-list';
const CACHE_KEY  = 'crm-tools-entity-cache';
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
}

function apiVersionFromCrmVersion(crmVersion: string): string {
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  return major >= 9 ? 'v9.0' : 'v8.2';
}

function getDisplayName(meta: EntityMeta): string {
  return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
}

function loadCachedEntities(clientUrl: string): EntityMeta[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as EntityCache;
    return cache.clientUrl === clientUrl ? cache.entities : null;
  } catch {
    return null;
  }
}

function saveCachedEntities(clientUrl: string, entities: EntityMeta[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ clientUrl, entities } satisfies EntityCache));
  } catch { /* storage full — ignore */ }
}

async function main(): Promise<void> {
  const existing = document.getElementById(PANEL_ID);
  if (existing) { existing.remove(); return; }

  if (typeof Xrm === 'undefined' || !Xrm.Page?.context) return;

  const clientUrl  = Xrm.Page.context.getClientUrl();
  const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());

  injectStyles();

  // ── Panel skeleton ───────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  const header = document.createElement('div');
  header.className = 'cnm-header';
  const titleEl = document.createElement('span');
  titleEl.className = 'cnm-title';
  titleEl.textContent = '🕐 Jump to Latest';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'cnm-close';
  closeBtn.textContent = '✕';
  closeBtn.title = 'Close';
  closeBtn.addEventListener('click', () => panel.remove());
  header.append(titleEl, closeBtn);

  const body = document.createElement('div');
  body.className = 'cnm-body';

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
  input.addEventListener('keyup', (e) => e.stopPropagation());
  entityRow.append(entityLabel, input, datalist);

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
  guidInput.addEventListener('keyup',  (e) => e.stopPropagation());
  guidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void openRecord();
    e.stopPropagation();
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
  withinInput.addEventListener('keyup',  (e) => e.stopPropagation());
  withinInput.addEventListener('keydown', (e) => e.stopPropagation());
  actionRow.append(withinInput, openBtn);

  // Disable sort when a GUID is entered
  guidInput.addEventListener('input', () => {
    const isGuid = GUID_RE.test(guidInput.value.trim());
    sortBtns.forEach(b => { b.disabled = isGuid; });
  });

  body.append(entityRow, guidRow, sortRow, actionRow);
  panel.append(header, body);
  document.body.appendChild(panel);
  makeDraggable(panel, header, closeBtn);

  // ── Fetch entity list (sessionStorage cached) ────────────────────────────────
  let allEntities: EntityMeta[] = [];
  const cached = loadCachedEntities(clientUrl);
  if (cached) {
    allEntities = cached;
  } else {
    try {
      const res  = await fetch(
        `${clientUrl}/api/data/${apiVersion}/EntityDefinitions` +
        `?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`,
      );
      const json = await res.json() as { value: EntityMeta[] };
      allEntities = json.value
        .filter(e => e.EntitySetName)
        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
      saveCachedEntities(clientUrl, allEntities);
    } catch {
      input.placeholder = 'Failed to load entities';
      showToast('Could not load entity list.', 'warn');
      return;
    }
  }

  for (const e of allEntities) {
    const opt = document.createElement('option');
    opt.value = getDisplayName(e);
    opt.label = e.LogicalName;
    datalist.appendChild(opt);
  }
  input.placeholder = 'Type entity name…';
  input.disabled    = false;
  openBtn.disabled  = false;

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
    e.stopPropagation();
  });
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${PANEL_ID} {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
  background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  z-index: 2147483647; overflow: hidden;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#${PANEL_ID} .cnm-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px;
  cursor: move; user-select: none;
}
#${PANEL_ID} .cnm-title { font-size: 14px; font-weight: 600; }
#${PANEL_ID} .cnm-close {
  background: none; border: none; color: #fff;
  font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#${PANEL_ID} .cnm-close:hover { opacity: 1; }
#${PANEL_ID} .cnm-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
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
  document.head.appendChild(style);
}

void main();
