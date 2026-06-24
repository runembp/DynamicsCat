export const ENGLISH_LCID = 1033;
export const DANISH_LCID = 1030;

export interface LanguageDef {
  lcid: number;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { lcid: ENGLISH_LCID, label: 'English' },
  { lcid: DANISH_LCID, label: 'Danish' },
];

export function getLanguageLabel(lcid: number): string | null {
  return SUPPORTED_LANGUAGES.find(language => language.lcid === lcid)?.label ?? null;
}

export function getTargetLanguageId(currentLanguageId: number): number | null {
  if (currentLanguageId === ENGLISH_LCID) return DANISH_LCID;
  if (currentLanguageId === DANISH_LCID) return ENGLISH_LCID;
  return null;
}

export function formatSwitchLanguageLabel(currentLanguageId: number | null): string {
  if (currentLanguageId === null) return 'Switch Language';

  const targetLanguageId = getTargetLanguageId(currentLanguageId);
  if (targetLanguageId === null) return 'Switch Language';

  const currentLabel = getLanguageLabel(currentLanguageId);
  const targetLabel = getLanguageLabel(targetLanguageId);
  if (!currentLabel || !targetLabel) return 'Switch Language';

  return `${currentLabel} -> ${targetLabel}`;
}
