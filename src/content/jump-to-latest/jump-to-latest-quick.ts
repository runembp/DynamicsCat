import { showToast } from '../shared';

const CACHE_KEY = '__dynamicscat_entity_cache';
const LAST_ENTITY_KEY = '__dynamicscat_last_entity';
const LAST_SORT_KEY = '__dynamicscat_last_sort';
const LAST_WITHIN_DAYS_KEY = '__dynamicscat_last_within_days';

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

function apiVersionFromCrmVersion(crmVersion: string): string {
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  return major >= 9 ? 'v9.0' : 'v8.2';
}

function getDisplayName(meta: EntityMeta): string {
  return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
}

async function main(): Promise<void> {
  if (typeof Xrm === 'undefined' || !Xrm.Page?.context) return;

  const lastEntity = localStorage.getItem(LAST_ENTITY_KEY);
  if (!lastEntity) {
    showToast('Use Jump to Latest (Alt+O) first.', 'warn');
    return;
  }

  const cacheRaw = localStorage.getItem(CACHE_KEY);
  if (!cacheRaw) {
    showToast('Use Jump to Latest (Alt+O) first.', 'warn');
    return;
  }

  let cache: EntityCache;
  try {
    cache = JSON.parse(cacheRaw) as EntityCache;
  } catch {
    showToast('Use Jump to Latest (Alt+O) first.', 'warn');
    return;
  }

  const meta = cache.entities.find((entity) =>
    getDisplayName(entity).toLowerCase() === lastEntity.toLowerCase()
    || entity.LogicalName.toLowerCase() === lastEntity.toLowerCase(),
  );
  if (!meta) {
    showToast('Use Jump to Latest (Alt+O) first.', 'warn');
    return;
  }

  const clientUrl = Xrm.Page.context.getClientUrl();
  const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());
  const lastSort = localStorage.getItem(LAST_SORT_KEY);
  const sortField = lastSort === 'createdon' ? 'createdon' : 'modifiedon';
  const withinDaysValue = localStorage.getItem(LAST_WITHIN_DAYS_KEY) ?? '14';
  const withinDays = withinDaysValue ? parseInt(withinDaysValue, 10) : null;
  let filterClause = '';
  if (withinDays !== null && !Number.isNaN(withinDays)) {
    const since = new Date(Date.now() - withinDays * 86_400_000).toISOString();
    filterClause = `&$filter=${sortField}%20ge%20${since}`;
  }

  try {
    const recordUrl = `${clientUrl}/api/data/${apiVersion}/${meta.EntitySetName}`
      + `?$select=${meta.PrimaryIdAttribute}&$orderby=${sortField}%20desc&$top=1${filterClause}`;
    const response = await fetch(recordUrl, {
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    const json = await response.json() as { value: Record<string, string>[] };
    if (!json.value?.length) {
      showToast('No records found.', 'warn');
      return;
    }

    const rawId = json.value[0][meta.PrimaryIdAttribute] ?? '';
    const cleanId = rawId.replace(/^\{|\}$/g, '');
    if (!cleanId) {
      showToast('No records found.', 'warn');
      return;
    }

    window.open(
      `${clientUrl}/main.aspx?pagetype=entityrecord&etn=${meta.LogicalName}&id=%7B${cleanId}%7D`,
      '_blank',
    );
  } catch {
    showToast('Failed to fetch record.', 'warn');
  }
}

void main();
