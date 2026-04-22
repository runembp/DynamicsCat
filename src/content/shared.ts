// Shared utilities for DynamicsCat content scripts.
// Bundled inline into each script by esbuild — no separate output file needed.

export function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function buildLabelMap(): Record<string, string> {
  const labelMap: Record<string, string> = {};
  Xrm.Page.ui.controls.forEach((ctrl) => {
    const name = ctrl.getName();
    if (name) {
      try {
        labelMap[name] = (ctrl as Xrm.Controls.StandardControl).getLabel() || name;
      } catch {
        labelMap[name] = name;
      }
    }
  });
  return labelMap;
}

export function makeDraggable(panel: HTMLElement, handle: HTMLElement, closeBtn: HTMLElement): void {
  requestAnimationFrame(() => {
    const rect = panel.getBoundingClientRect();
    panel.style.left      = rect.left + 'px';
    panel.style.top       = rect.top  + 'px';
    panel.style.right     = '';
    panel.style.transform = '';
  });

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth  - panel.offsetWidth));
    const y = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - panel.offsetHeight));
    panel.style.left = x + 'px';
    panel.style.top  = y + 'px';
  };

  const onMouseUp = () => { dragging = false; handle.style.cursor = 'move'; };

  handle.addEventListener('mousedown', (e) => {
    if (closeBtn.contains(e.target as Node)) return;
    dragging = true;
    offsetX  = e.clientX - panel.offsetLeft;
    offsetY  = e.clientY - panel.offsetTop;
    handle.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);

  new MutationObserver((_, obs) => {
    if (!document.contains(panel)) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      obs.disconnect();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function execCommandCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => execCommandCopy(text));
  } else {
    execCommandCopy(text);
  }
}

const TOAST_CONTAINER_ID = 'crm-tools-toast-container';

export function showToast(message: string, type: 'info' | 'warn' = 'info'): void {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.cssText = [
      'position: fixed', 'bottom: 24px', 'right: 24px',
      'z-index: 2147483647', 'display: flex', 'flex-direction: column', 'gap: 8px',
      'pointer-events: none',
    ].join('; ');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = [
    'background: ' + (type === 'warn' ? '#e65100' : '#323232'),
    'color: #fff',
    'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',
    'font-size: 13px',
    'padding: 10px 16px',
    'border-radius: 6px',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
    'pointer-events: auto',
    'opacity: 1',
    'transition: opacity 0.3s ease',
  ].join('; ');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
