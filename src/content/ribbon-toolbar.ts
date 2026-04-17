// Auto-injected floating toolbar for CRM pages (ISOLATED world).
// Does NOT touch Xrm — delegates injection to background via sendMessage.

const TOOLBAR_ID = 'crm-tools-ribbon-toolbar';
const STYLE_ID   = 'crm-tools-ribbon-style';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#crm-tools-ribbon-toolbar {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #1e64c8;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.28);
  padding: 6px 8px 8px;
  font-family: Segoe UI, Arial, sans-serif;
  font-size: 12px;
  min-width: 130px;
  user-select: none;
}
#crm-tools-ribbon-toolbar .crt-label {
  color: rgba(255,255,255,0.75);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-align: center;
  margin-bottom: 6px;
}
#crm-tools-ribbon-toolbar .crt-btn {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-family: Segoe UI, Arial, sans-serif;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: background 0.15s;
}
#crm-tools-ribbon-toolbar .crt-btn:hover {
  background: rgba(255,255,255,0.28);
}
  `;
  document.head.appendChild(style);
}

function buildToolbar(): void {
  // Idempotent: skip if already present (e.g. soft navigation without full page unload)
  if (document.getElementById(TOOLBAR_ID)) return;

  injectStyles();

  const toolbar = document.createElement('div');
  toolbar.id = TOOLBAR_ID;

  const label = document.createElement('div');
  label.className = 'crt-label';
  label.textContent = 'CRM Tools';

  const allFieldsBtn = document.createElement('button');
  allFieldsBtn.className = 'crt-btn';
  allFieldsBtn.textContent = '📋 All Fields';
  allFieldsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'injectAllFields' });
  });

  const optionSetsBtn = document.createElement('button');
  optionSetsBtn.className = 'crt-btn';
  optionSetsBtn.textContent = '🔘 Option Sets';
  optionSetsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'injectOptionSets' });
  });

  toolbar.appendChild(label);
  toolbar.appendChild(allFieldsBtn);
  toolbar.appendChild(optionSetsBtn);
  document.body.appendChild(toolbar);
}

buildToolbar();
