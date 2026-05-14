// Shared panel shell for DynamicsCat content scripts.
// Provides the common chrome (container, header, close, drag, keyboard isolation)
// so each feature script only builds its own body content.

import { debounce, makeDraggable, copyToClipboard } from './shared';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PanelShellConfig {
  panelId: string;
  styleId: string;
  title: string;
  variant?: 'sidebar' | 'dialog';
  /** Additional CSS appended after the base panel stylesheet. */
  extraCss?: string;
}

export interface PanelShell {
  panel: HTMLDivElement;
  header: HTMLDivElement;
  closeBtn: HTMLButtonElement;
  body: HTMLDivElement;
}

export interface SearchBar {
  container: HTMLDivElement;
  input: HTMLInputElement;
  /** Re-run the current filter (e.g. after refreshing table data). */
  triggerFilter: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Idempotent style injection — only inserts once per styleId. */
export function injectStylesheet(styleId: string, css: string): void {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

/** Prevent the CRM host page from swallowing keyboard events inside injected panels. */
export function isolateKeyboard(el: HTMLElement): void {
  el.addEventListener('keydown', (e) => e.stopPropagation());
  el.addEventListener('keyup', (e) => e.stopPropagation());
}

/** Click-to-copy span with brief flash feedback. */
export function createCopySpan(display: string, copyValue: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'dcat-copy-val';
  span.textContent = display;
  span.title = `Click to copy: ${copyValue}`;
  span.addEventListener('click', () => {
    copyToClipboard(copyValue);
    span.classList.add('dcat-copied');
    setTimeout(() => span.classList.remove('dcat-copied'), 1200);
  });
  return span;
}

/** Creates a search bar with debounced filter callback.
 *  Insert the returned container into the panel between header/subheader and body. */
export function createSearchBar(opts: {
  placeholder: string;
  onFilter: (query: string) => void;
  debounceMs?: number;
}): SearchBar {
  const container = document.createElement('div');
  container.className = 'dcat-search';
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = opts.placeholder;
  isolateKeyboard(input);

  const handler = debounce(() => {
    opts.onFilter(input.value.toLowerCase().trim());
  }, opts.debounceMs ?? 100);

  input.addEventListener('input', handler);
  container.appendChild(input);

  return {
    container,
    input,
    triggerFilter: () => input.dispatchEvent(new Event('input')),
  };
}

// ── Base CSS ─────────────────────────────────────────────────────────────────

function baseCss(id: string, variant: 'sidebar' | 'dialog'): string {
  const containerCss = variant === 'dialog'
    ? `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: visible;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;`
    : `position: fixed; top: 0; right: 0; width: auto; min-width: 550px; max-width: 90vw; max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8;
       box-shadow: -4px 0 16px rgba(0,0,0,0.18);
       z-index: 2147483647; display: flex; flex-direction: column;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;`;

  const bodyCss = variant === 'dialog'
    ? `padding: 14px; display: flex; flex-direction: column; gap: 10px;`
    : `overflow-y: auto; overflow-x: auto; flex: 1;`;

  return `
#${id} { ${containerCss} }
#${id} .dcat-header {
  display: flex; align-items: center; gap: 6px;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#${id} .dcat-title { font-size: 14px; font-weight: 600; flex: 1; }
#${id} .dcat-close {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#${id} .dcat-close:hover { opacity: 1; }
#${id} .dcat-body { ${bodyCss} }
#${id} .dcat-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#${id} .dcat-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#${id} .dcat-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#${id} .dcat-search input:focus { border-color: #1e64c8; }
#${id} .dcat-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8; transition: background 0.15s;
}
#${id} .dcat-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#${id} .dcat-copy-val.dcat-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#${id} .dcat-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
`;
}

// ── Panel shell ──────────────────────────────────────────────────────────────

/**
 * Creates the common panel chrome (toggle, style injection, header, drag, close).
 * Returns null when the panel was toggled OFF (already existed and was removed).
 * Callers populate the returned `body` element with feature-specific content.
 */
export function createPanelShell(config: PanelShellConfig): PanelShell | null {
  // Toggle: remove if already present
  const existing = document.getElementById(config.panelId);
  if (existing) { existing.remove(); return null; }

  const variant = config.variant ?? 'sidebar';
  injectStylesheet(config.styleId, baseCss(config.panelId, variant) + (config.extraCss ?? ''));

  const panel = document.createElement('div');
  panel.id = config.panelId;

  const header = document.createElement('div');
  header.className = 'dcat-header';

  const titleEl = document.createElement('span');
  titleEl.className = 'dcat-title';
  titleEl.textContent = config.title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'dcat-close';
  closeBtn.title = 'Close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());

  header.append(titleEl, closeBtn);

  const body = document.createElement('div');
  body.className = 'dcat-body';

  panel.append(header, body);
  document.body.appendChild(panel);
  makeDraggable(panel, header, closeBtn);

  return { panel, header, closeBtn, body };
}
