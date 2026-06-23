export const ENGLISH_LCID = 1033;
export const DANISH_LCID = 1030;

export type UserLanguageLcid = typeof ENGLISH_LCID | typeof DANISH_LCID;

const USER_LANGUAGE_LCIDS: UserLanguageLcid[] = [ENGLISH_LCID, DANISH_LCID];

export function parseUserLanguageLcid(value: unknown): UserLanguageLcid | null {
  const lcid = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : null;

  if (!Number.isInteger(lcid)) return null;
  return USER_LANGUAGE_LCIDS.find(option => option === lcid) ?? null;
}

export function getOtherUserLanguageLcid(lcid: UserLanguageLcid): UserLanguageLcid {
  return lcid === ENGLISH_LCID ? DANISH_LCID : ENGLISH_LCID;
}

function getShortLanguageName(lcid: UserLanguageLcid): 'ENG' | 'DK' {
  return lcid === ENGLISH_LCID ? 'ENG' : 'DK';
}

export function getUserLanguageSwitchLabel(value: unknown): string {
  const currentLcid = parseUserLanguageLcid(value);
  if (currentLcid === null) return 'Switch language';

  const nextLcid = getOtherUserLanguageLcid(currentLcid);
  return `Switch language: ${getShortLanguageName(currentLcid)} -> ${getShortLanguageName(nextLcid)}`;
}
