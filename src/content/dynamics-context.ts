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

interface WebApiError {
  version: string;
  status: number;
  body: string;
}

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
    } else if (major === 8) {
      versions.add(Number.isInteger(minor) ? `v8.${minor}` : 'v8.2');
      versions.add('v8.2');
      versions.add('v8.1');
      versions.add('v8.0');
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

export async function fetchJsonWithApiFallback<T>(
  context: DynamicsContext,
  pathForVersion: (version: string) => string,
  init?: RequestInit,
): Promise<{ json: T; version: string }> {
  const errors: WebApiError[] = [];

  for (const version of getApiVersionCandidates(context.crmVersion)) {
    const url = `${context.clientUrl}/api/data/${version}/${pathForVersion(version)}`;
    const response = await fetch(url, init);
    if (response.ok) {
      return { json: await response.json() as T, version };
    }

    errors.push({ version, status: response.status, body: await response.text() });
    if (response.status !== 404 && response.status !== 400) break;
  }

  const last = errors[errors.length - 1];
  throw new Error(last
    ? `Web API failed (${last.version}, HTTP ${last.status}): ${last.body.slice(0, 160)}`
    : 'Web API failed before receiving a response');
}

export async function sendWithApiFallback(
  context: DynamicsContext,
  pathForVersion: (version: string) => string,
  init: RequestInit,
): Promise<{ response: Response; version: string }> {
  const errors: WebApiError[] = [];

  for (const version of getApiVersionCandidates(context.crmVersion)) {
    const url = `${context.clientUrl}/api/data/${version}/${pathForVersion(version)}`;
    const response = await fetch(url, init);
    if (response.ok) return { response, version };

    errors.push({ version, status: response.status, body: await response.text() });
    if (response.status !== 404 && response.status !== 400) break;
  }

  const last = errors[errors.length - 1];
  throw new Error(last
    ? `Web API failed (${last.version}, HTTP ${last.status}): ${last.body.slice(0, 160)}`
    : 'Web API failed before receiving a response');
}

export async function resolveEntitySetName(context: DynamicsContext, entityName: string): Promise<string> {
  if (typeof Xrm !== 'undefined' && typeof Xrm.Utility?.getEntityMetadata === 'function') {
    const meta = await Xrm.Utility.getEntityMetadata(entityName, []);
    if (meta.EntitySetName) return meta.EntitySetName;
  }

  const result = await fetchJsonWithApiFallback<{ EntitySetName: string }>(
    context,
    () => `EntityDefinitions(LogicalName='${encodeURIComponent(entityName)}')?$select=EntitySetName`,
  );
  return result.json.EntitySetName;
}

export async function fetchEntityDefinitions(context: DynamicsContext): Promise<EntityMeta[]> {
  const result = await fetchJsonWithApiFallback<{ value: EntityMeta[] }>(
    context,
    () => 'EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute',
  );
  return result.json.value;
}

export function buildEntityRecordUrl(context: DynamicsContext, logicalName: string, id: string): string {
  return `${context.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(logicalName)}&id=%7B${cleanGuid(id)}%7D`;
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

  await sendWithApiFallback(
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
