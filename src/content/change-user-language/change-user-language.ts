import { getLanguageLabel, getTargetLanguageId } from '../../language';
import { getDynamicsContext, updateUserLanguage } from '../dynamics-context';

const LANGUAGE_TARGET_PREFIX = '__dynamicscat_language_target_';

function readStoredTarget(currentLanguageId: number): number | null {
  const raw = localStorage.getItem(`${LANGUAGE_TARGET_PREFIX}${currentLanguageId}`);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function askForTargetLanguage(currentLanguageId: number): number | null {
  const currentLabel = getLanguageLabel(currentLanguageId) ?? String(currentLanguageId);
  const fallbackTarget = getTargetLanguageId(currentLanguageId);
  const prompted = window.prompt(
    `DynamicsCat: Current language is ${currentLabel} (${currentLanguageId}). Enter target LCID.`,
    fallbackTarget ? String(fallbackTarget) : '',
  );
  if (prompted === null) return null;

  const parsed = parseInt(prompted.trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    alert(`DynamicsCat: "${prompted}" is not a valid LCID.`);
    return null;
  }

  localStorage.setItem(`${LANGUAGE_TARGET_PREFIX}${currentLanguageId}`, String(parsed));
  return parsed;
}

(async () => {
  const context = getDynamicsContext();
  if (!context || !context.userId) {
    console.debug('[DynamicsCat] switch-user-language skipped: no Xrm context in this frame.');
    return;
  }

  const currentLanguageId = context.userLanguageId;
  if (currentLanguageId === null) {
    console.debug('[DynamicsCat] switch-user-language skipped: no current language in this frame.');
    return;
  }

  const targetLanguageId = getTargetLanguageId(currentLanguageId)
    ?? readStoredTarget(currentLanguageId)
    ?? askForTargetLanguage(currentLanguageId);
  if (targetLanguageId === null) {
    return;
  }

  try {
    await updateUserLanguage(context, targetLanguageId);
    window.top?.location.reload();
    return;
  } catch (err) {
    console.debug('[DynamicsCat] switch-user-language failed', err);
  }

  const currentLabel = getLanguageLabel(currentLanguageId) ?? String(currentLanguageId);
  const targetLabel = getLanguageLabel(targetLanguageId) ?? String(targetLanguageId);
  alert(`DynamicsCat: Failed to switch language from ${currentLabel} to ${targetLabel} via Dynamics Web API.`);
})();
