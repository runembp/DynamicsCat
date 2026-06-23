import { showToast } from '../shared';
import { getOtherUserLanguageLcid, parseUserLanguageLcid } from '../../user-languages';

const LANGUAGE_ATTRIBUTE = 'data-dynamicscat-selected-language';
const CHANGE_LOCK_KEY = 'DynamicsCat:change-user-language';
const CHANGE_LOCK_MS = 5_000;

function hasXrmContext(): boolean {
  return typeof Xrm !== 'undefined'
    && (
      typeof Xrm.Utility?.getGlobalContext === 'function'
      || Boolean(Xrm.Page?.context)
    );
}

function getUserId(): string | null {
  if (typeof Xrm.Utility?.getGlobalContext === 'function') {
    const userId = Xrm.Utility.getGlobalContext().userSettings?.userId;
    if (userId) return userId;
  }

  const pageUserId = Xrm.Page?.context?.getUserId?.();
  return pageUserId ? String(pageUserId) : null;
}

function getClientUrl(): string | null {
  if (typeof Xrm.Utility?.getGlobalContext === 'function') {
    return Xrm.Utility.getGlobalContext().getClientUrl();
  }

  return Xrm.Page?.context?.getClientUrl?.() ?? null;
}

function getCurrentUserLanguage(): number | null {
  if (typeof Xrm.Utility?.getGlobalContext === 'function') {
    const languageId = Xrm.Utility.getGlobalContext().userSettings?.languageId;
    if (typeof languageId === 'number') return languageId;
  }

  const pageLanguageId = Xrm.Page?.context?.getUserLcid?.();
  return typeof pageLanguageId === 'number' ? pageLanguageId : null;
}

function getApiVersions(): string[] {
  const crmVersion = Xrm.Page?.context?.getVersion?.();
  if (!crmVersion) return ['v8.2', 'v9.0', 'v9.1', 'v9.2'];

  const major = Number.parseInt(crmVersion.split('.')[0] ?? '', 10);
  return Number.isInteger(major) && major >= 9
    ? ['v9.0', 'v9.1', 'v9.2', 'v8.2']
    : ['v8.2'];
}

async function readResponseText(response: Response): Promise<string> {
  const text = await response.text();
  return text ? ` - ${text.slice(0, 160)}` : '';
}

async function patchUserSettings(baseUrl: string, userId: string, lcid: number): Promise<string | null> {
  let lastFailure = 'usersettings endpoint not found';

  for (const version of getApiVersions()) {
    const url = `${baseUrl.replace(/\/$/, '')}/api/data/${version}/usersettingscollection(${userId})`;
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'If-Match': '*',
      },
      body: JSON.stringify({ uilanguageid: lcid }),
    });

    if (response.ok) return null;

    lastFailure = `${version} returned HTTP ${response.status}${await readResponseText(response)}`;
    if (response.status !== 404) return lastFailure;
  }

  return lastFailure;
}

function acquireChangeLock(lcid: number): boolean {
  try {
    const now = Date.now();
    const existing = window.sessionStorage.getItem(CHANGE_LOCK_KEY);
    if (existing) {
      const [existingLcid, existingTimestamp] = existing.split(':');
      const timestamp = Number(existingTimestamp);
      if (existingLcid === String(lcid) && Number.isFinite(timestamp) && now - timestamp < CHANGE_LOCK_MS) {
        return false;
      }
    }

    window.sessionStorage.setItem(CHANGE_LOCK_KEY, `${lcid}:${now}`);
  } catch (error) {
    console.debug('[DynamicsCat] Could not acquire language change lock', error);
  }

  return true;
}

async function changeUserLanguage(): Promise<void> {
  const raw = document.documentElement.getAttribute(LANGUAGE_ATTRIBUTE);
  document.documentElement.removeAttribute(LANGUAGE_ATTRIBUTE);

  if (!hasXrmContext()) return;

  const currentLcid = parseUserLanguageLcid(raw) ?? parseUserLanguageLcid(getCurrentUserLanguage());
  if (currentLcid === null) {
    showToast('Cannot determine current language. Language change aborted.', 'warn');
    return;
  }

  const lcid = getOtherUserLanguageLcid(currentLcid);
  if (!acquireChangeLock(lcid)) return;

  const rawUserId = getUserId();
  if (!rawUserId) {
    showToast('Cannot determine current user. Language change aborted.', 'warn');
    return;
  }

  const userId = rawUserId.replace(/[{}]/g, '').toLowerCase();

  if (typeof Xrm.WebApi?.updateRecord === 'function') {
    try {
      await Xrm.WebApi.updateRecord('usersettings', userId, { uilanguageid: lcid });
      window.location.reload();
      return;
    } catch (error) {
      console.debug('[DynamicsCat] Xrm.WebApi.updateRecord failed, falling back to direct Web API', error);
    }
  }

  const clientUrl = getClientUrl();
  if (!clientUrl) {
    showToast('Cannot determine CRM URL. Switch language via CRM personal settings.', 'warn');
    return;
  }

  try {
    const failure = await patchUserSettings(clientUrl, userId, lcid);
    if (failure === null) {
      window.location.reload();
      return;
    }

    showToast(`Failed to change language: ${failure}`, 'warn');
  } catch (error) {
    showToast(`Language change request failed: ${error instanceof Error ? error.message : String(error)}`, 'warn');
  }
}

void changeUserLanguage();
