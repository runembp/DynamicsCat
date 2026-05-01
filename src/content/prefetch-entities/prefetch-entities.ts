// Lightweight prefetch script — runs on every CRM page load (MAIN world).
// Populates localStorage with entity metadata so the "Jump to Latest" panel opens instantly.

const CACHE_KEY = '__dynamicscat_entity_cache';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

function isCacheValid(clientUrl: string): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const cache = JSON.parse(raw) as EntityCache;
    if (cache.clientUrl !== clientUrl) return false;
    return Date.now() - cache.timestamp < TTL_MS;
  } catch {
    return false;
  }
}

function getDisplayName(meta: EntityMeta): string {
  return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
}

async function prefetch(): Promise<void> {
  if (typeof Xrm === 'undefined' || !Xrm.Page?.context) return;

  const clientUrl = Xrm.Page.context.getClientUrl();
  if (isCacheValid(clientUrl)) return;

  const crmVersion = Xrm.Page.context.getVersion();
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  const apiVersion = major >= 9 ? 'v9.0' : 'v8.2';

  try {
    const res = await fetch(
      `${clientUrl}/api/data/${apiVersion}/EntityDefinitions` +
      `?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`,
    );
    const json = await res.json() as { value: EntityMeta[] };
    const entities = json.value
      .filter(e => e.EntitySetName)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

    const cache: EntityCache = { clientUrl, entities, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silent fail — panel will fetch on-demand as fallback
  }
}

void prefetch();
