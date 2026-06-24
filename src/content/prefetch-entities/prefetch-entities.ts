// Lightweight prefetch script — runs on every CRM page load (MAIN world).
// Populates localStorage with entity metadata so the "Jump to Latest" panel opens instantly.

import { EntityMeta, fetchEntityDefinitions, getDisplayName, getDynamicsContext } from '../dynamics-context';

const CACHE_KEY = '__dynamicscat_entity_cache';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

async function prefetch(): Promise<void> {
  const context = getDynamicsContext();
  if (!context) return;

  const clientUrl = context.clientUrl;
  if (isCacheValid(clientUrl)) return;

  try {
    const entities = (await fetchEntityDefinitions(context))
      .filter(e => e.EntitySetName)
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

    const cache: EntityCache = { clientUrl, entities, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silent fail — panel will fetch on-demand as fallback
  }
}

void prefetch();
