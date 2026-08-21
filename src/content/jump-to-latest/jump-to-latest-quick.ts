import { showToast } from '../shared';
import {
  EntityMeta,
  buildDateFilterClause,
  buildEntityRecordUrl,
  buildSearchWindows,
  fetchJson,
  getDisplayName,
  getDynamicsContext,
} from '../dynamics-context';

const CACHE_KEY = '__dynamicscat_entity_cache';
const LAST_ENTITY_KEY = '__dynamicscat_last_entity';
const LAST_SORT_KEY = '__dynamicscat_last_sort';
const LAST_WITHIN_DAYS_KEY = '__dynamicscat_last_within_days';

interface EntityCache {
  clientUrl: string;
  entities: EntityMeta[];
  timestamp: number;
}

async function main(): Promise<void> {
  const context = getDynamicsContext();
  if (!context) return;

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
  if (cache.clientUrl !== context.clientUrl) {
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

  const lastSort = localStorage.getItem(LAST_SORT_KEY);
  const sortField = lastSort === 'createdon' ? 'createdon' : 'modifiedon';
  const withinDaysValue = localStorage.getItem(LAST_WITHIN_DAYS_KEY) ?? '14';
  const withinDays = withinDaysValue ? parseInt(withinDaysValue, 10) : null;
  const windows = buildSearchWindows(withinDays);

  try {
    if (!meta.PrimaryIdAttribute) {
      showToast('Could not determine primary id field.', 'warn');
      return;
    }
    const queryTop = async (clause: string) => {
      return await fetchJson<{ value: Record<string, string>[] }>(
        context,
        () => `${meta.EntitySetName}?$select=${meta.PrimaryIdAttribute}&$orderby=${sortField}%20desc&$top=1${clause}`,
        {
          headers: {
            'Accept': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
          },
        },
      );
    };

    let json: { value: Record<string, string>[] } = { value: [] };
    for (const days of windows) {
      json = await queryTop(buildDateFilterClause(sortField, days));
      if (json.value?.length) {
        if (days !== windows[0]) {
          showToast(
            `No records within last ${withinDays} days — opening newest ${days === null ? 'overall' : `within ${days} days`}.`,
            'warn',
          );
        }
        break;
      }
    }

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
      buildEntityRecordUrl(context, meta.LogicalName, cleanId),
      '_blank',
    );
  } catch {
    showToast('Failed to fetch record.', 'warn');
  }
}

void main();
