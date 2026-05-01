// Cross-frame state helpers for DynamicsCat content scripts.
// Both MAIN and ISOLATED world scripts can import this module — esbuild inlines
// it into each bundle.  Runtime communication goes through dataset properties on
// the top-level document element.

export const STATE_KEYS = {
  hiddenActive: 'dynamicsCatHiddenActive',
  dirtyActive: 'dynamicsCatDirtyActive',
  revealedNames: 'dynamicsCatRevealedNames',
  toggleLock: 'dynamicsCatToggleLock',
  activatable: 'dynamicsCatActivatable',
} as const;

type StateKey = keyof typeof STATE_KEYS;

/** Dataset of the top-level document, falling back to current frame when cross-origin. */
export function getSharedDataset(): DOMStringMap {
  try {
    return ((window.top ?? window) as Window).document.documentElement.dataset;
  } catch {
    return document.documentElement.dataset;
  }
}

export function readFlag(key: StateKey): string | undefined {
  return getSharedDataset()[STATE_KEYS[key]];
}

export function writeFlag(key: StateKey, value: string): void {
  getSharedDataset()[STATE_KEYS[key]] = value;
}

export function clearFlag(key: StateKey): void {
  delete getSharedDataset()[STATE_KEYS[key]];
}

/**
 * Acquire a short-lived lock to prevent duplicate execution when allFrames: true
 * injects the same script into multiple CRM iframes.
 * Returns true if the lock was acquired; false if already held by another frame.
 */
export function acquireToggleLock(ms = 1000): boolean {
  const ds = getSharedDataset();
  if (ds[STATE_KEYS.toggleLock]) return false;
  ds[STATE_KEYS.toggleLock] = '1';
  setTimeout(() => { delete ds[STATE_KEYS.toggleLock]; }, ms);
  return true;
}

export function readJsonArray(key: StateKey): string[] {
  const raw = getSharedDataset()[STATE_KEYS[key]];
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

export function writeJsonArray(key: StateKey, arr: string[]): void {
  getSharedDataset()[STATE_KEYS[key]] = JSON.stringify(arr);
}
