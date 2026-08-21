export interface DynamicsContext {
  clientUrl: string;
  userId: string | null;
  userLanguageId: number | null;
  crmVersion: string | null;
}

export interface EntityMeta {
  LogicalName: string;
  DisplayName?: { UserLocalizedLabel?: { Label: string } | null } | null;
  EntitySetName: string;
  PrimaryIdAttribute?: string;
}

const API_VERSION_CACHE_PREFIX = 'dynamicscat:api-version:';
const apiVersionPromises = new Map<string, Promise<string>>();

interface GlobalContextLike {
  getClientUrl?: () => string;
  getVersion?: () => string;
  userSettings?: {
    userId?: string;
    languageId?: number;
  };
}

interface LegacyContextLike {
  getClientUrl?: () => string;
  getVersion?: () => string;
  getUserId?: () => string;
  getUserLcid?: () => number;
}

function cleanGuid(id: string): string {
  return id.replace(/[{}]/g, '').toLowerCase();
}

function getGlobalContext(): GlobalContextLike | null {
  try {
    if (typeof Xrm !== 'undefined' && Xrm.Utility?.getGlobalContext) {
      return Xrm.Utility.getGlobalContext() as GlobalContextLike;
    }
  } catch (err) {
    console.debug('[DynamicsCat] getGlobalContext failed', err);
  }
  return null;
}

function getLegacyContext(): LegacyContextLike | null {
  try {
    if (typeof Xrm !== 'undefined' && Xrm.Page?.context) {
      return Xrm.Page.context as LegacyContextLike;
    }
  } catch (err) {
    console.debug('[DynamicsCat] get legacy context failed', err);
  }
  return null;
}

export function getDynamicsContext(): DynamicsContext | null {
  const globalContext = getGlobalContext();
  const legacyContext = getLegacyContext();

  const clientUrl = globalContext?.getClientUrl?.() ?? legacyContext?.getClientUrl?.() ?? null;
  if (!clientUrl) return null;

  const globalUserId = globalContext?.userSettings?.userId;
  const legacyUserId = legacyContext?.getUserId?.();
  const userId = globalUserId || legacyUserId ? cleanGuid(String(globalUserId ?? legacyUserId)) : null;

  const globalLanguageId = globalContext?.userSettings?.languageId;
  const legacyLanguageId = legacyContext?.getUserLcid?.();
  let userLanguageId: number | null = null;
  if (typeof globalLanguageId === 'number' && Number.isInteger(globalLanguageId)) {
    userLanguageId = globalLanguageId;
  } else if (typeof legacyLanguageId === 'number' && Number.isInteger(legacyLanguageId)) {
    userLanguageId = legacyLanguageId;
  }

  const crmVersion = globalContext?.getVersion?.() ?? legacyContext?.getVersion?.() ?? null;

  return {
    clientUrl: clientUrl.replace(/\/$/, ''),
    userId,
    userLanguageId,
    crmVersion,
  };
}

export function getApiVersionCandidates(crmVersion: string | null): string[] {
  const versions = new Set<string>();
  const major = crmVersion ? parseInt(crmVersion.split('.')[0] ?? '', 10) : Number.NaN;
  const minor = crmVersion ? parseInt(crmVersion.split('.')[1] ?? '', 10) : Number.NaN;

  if (Number.isInteger(major)) {
    if (major >= 9) {
      versions.add(Number.isInteger(minor) ? `v${major}.${minor}` : 'v9.2');
      versions.add('v9.2');
      versions.add('v9.1');
      versions.add('v9.0');
      return Array.from(versions);
    } else if (major === 8) {
      versions.add(Number.isInteger(minor) ? `v8.${minor}` : 'v8.2');
      versions.add('v8.2');
      versions.add('v8.1');
      versions.add('v8.0');
      return Array.from(versions);
    }
  }

  versions.add('v9.2');
  versions.add('v9.1');
  versions.add('v9.0');
  versions.add('v8.2');
  versions.add('v8.1');
  versions.add('v8.0');
  return Array.from(versions);
}

function getApiVersionCacheKey(context: DynamicsContext): string {
  return `${API_VERSION_CACHE_PREFIX}${context.clientUrl.toLowerCase()}`;
}

function getCachedApiVersion(context: DynamicsContext): string | null {
  try {
    return localStorage.getItem(getApiVersionCacheKey(context));
  } catch {
    return null;
  }
}

function cacheApiVersion(context: DynamicsContext, version: string): void {
  try {
    localStorage.setItem(getApiVersionCacheKey(context), version);
  } catch {
    // Storage can be unavailable in restricted CRM frames.
  }
}

function normalizeRequestInit(init?: RequestInit): RequestInit | undefined {
  return init?.headers
    ? { ...init, headers: new Headers(init.headers) }
    : init;
}

async function scanApiVersion(context: DynamicsContext): Promise<string> {
  for (const version of getApiVersionCandidates(context.crmVersion)) {
    const response = await fetch(`${context.clientUrl}/api/data/${version}/`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      cacheApiVersion(context, version);
      return version;
    }
    if (response.status !== 404 && response.status !== 501) {
      throw new Error(`Web API scan failed (${version}, HTTP ${response.status})`);
    }
  }
  throw new Error('No supported Dynamics Web API version found');
}

export function getApiVersion(context: DynamicsContext): Promise<string> {
  const cached = getCachedApiVersion(context);
  if (cached) return Promise.resolve(cached);

  const key = context.clientUrl.toLowerCase();
  const existing = apiVersionPromises.get(key);
  if (existing) return existing;

  const detection = scanApiVersion(context).finally(() => apiVersionPromises.delete(key));
  apiVersionPromises.set(key, detection);
  return detection;
}

export async function fetchJson<T>(
  context: DynamicsContext,
  pathForVersion: (version: string) => string,
  init?: RequestInit,
): Promise<T> {
  const version = await getApiVersion(context);
  const response = await fetch(
    `${context.clientUrl}/api/data/${version}/${pathForVersion(version)}`,
    normalizeRequestInit(init),
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Web API failed (${version}, HTTP ${response.status}): ${body.slice(0, 160)}`);
  }
  return await response.json() as T;
}

export async function send(
  context: DynamicsContext,
  pathForVersion: (version: string) => string,
  init: RequestInit,
): Promise<Response> {
  const version = await getApiVersion(context);
  const response = await fetch(
    `${context.clientUrl}/api/data/${version}/${pathForVersion(version)}`,
    normalizeRequestInit(init),
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Web API failed (${version}, HTTP ${response.status}): ${body.slice(0, 160)}`);
  }
  return response;
}

export async function resolveEntitySetName(context: DynamicsContext, entityName: string): Promise<string> {
  if (typeof Xrm !== 'undefined' && typeof Xrm.Utility?.getEntityMetadata === 'function') {
    const meta = await Xrm.Utility.getEntityMetadata(entityName, []);
    if (meta.EntitySetName) return meta.EntitySetName;
  }

  const result = await fetchJson<{ EntitySetName: string }>(
    context,
    () => `EntityDefinitions(LogicalName='${encodeURIComponent(entityName)}')?$select=EntitySetName`,
  );
  return result.EntitySetName;
}

export async function fetchEntityDefinitions(context: DynamicsContext): Promise<EntityMeta[]> {
  const result = await fetchJson<{ value: EntityMeta[] }>(
    context,
    () => 'EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute',
  );
  return result.value;
}

export function buildEntityRecordUrl(context: DynamicsContext, logicalName: string, id: string): string {
  return `${context.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(logicalName)}&id=%7B${cleanGuid(id)}%7D`;
}

/**
 * Escalating date windows (days, null = all time). Avoids a full unsorted table
 * scan on huge entities by widening gradually instead of jumping to all-time.
 */
export function buildSearchWindows(withinDays: number | null): (number | null)[] {
  if (withinDays === null || Number.isNaN(withinDays)) return [null];
  const steps = [withinDays, 90, 365].filter(d => d >= withinDays);
  return [...new Set(steps), null];
}

export function buildDateFilterClause(sortField: string, days: number | null): string {
  if (days === null) return '';
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return `&$filter=${sortField}%20ge%20${since}`;
}

export function getDisplayName(meta: EntityMeta): string {
  return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
}

export async function updateUserLanguage(context: DynamicsContext, languageId: number): Promise<void> {
  if (!context.userId) throw new Error('No user id found in Dynamics context.');

  if (typeof Xrm !== 'undefined' && Xrm.WebApi?.updateRecord) {
    await Xrm.WebApi.updateRecord('usersettings', context.userId, { uilanguageid: languageId });
    return;
  }

  await send(
    context,
    () => `usersettingscollection(${context.userId})`,
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
      body: JSON.stringify({ uilanguageid: languageId }),
    },
  );
}
