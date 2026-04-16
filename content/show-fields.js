(function () {
  const PANEL_ID = 'crm-tools-fields-panel';
  const STYLE_ID = 'crm-tools-fields-style';
  const LOG = (msg) => console.log('[CRM Tools]', msg);

  LOG('show-fields.js running in: ' + window.location.href);

  // Toggle: remove panel if already open
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    LOG('Panel already open — closing.');
    existing.remove();
    return;
  }

  // Xrm is only available in the CRM form iframe — silently skip other frames
  LOG('Xrm available: ' + (typeof Xrm !== 'undefined'));
  if (typeof Xrm === 'undefined' || !Xrm.Page) {
    LOG('Xrm.Page not found in this frame — skipping.');
    return;
  }

  LOG('Xrm.Page found! Reading attributes…');

  // ── Console output of all fields ─────────────────────────────
  const attributes = Xrm.Page.data.entity.attributes.get();
  const labelMap = {};
  Xrm.Page.ui.controls.forEach((ctrl) => {
    const name = ctrl.getName();
    if (name) {
      try { labelMap[name] = ctrl.getLabel() || name; } catch (e) { labelMap[name] = name; }
    }
  });

  LOG(`Entity: ${Xrm.Page.data.entity.getEntityName()} — ${attributes.length} attribute(s)`);
  attributes.forEach((attr) => {
    const name  = attr.getName();
    const type  = attr.getAttributeType ? attr.getAttributeType() : '?';
    const label = labelMap[name] || name;
    let val;
    try { val = attr.getValue(); } catch (e) { val = '(error)'; }
    console.log(`  [${type}] ${label} (${name}) =`, val);
  });

  // ── Inject styles ─────────────────────────────────────────────
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#crm-tools-fields-panel {
  position: fixed; top: 0; right: 0; width: 580px; height: 100vh;
  background: #fff; border-left: 2px solid #1e64c8;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18);
  z-index: 2147483647; display: flex; flex-direction: column;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#crm-tools-fields-panel .cfp-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-header-title { font-size: 14px; font-weight: 600; }
#crm-tools-fields-panel .cfp-close {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#crm-tools-fields-panel .cfp-close:hover { opacity: 1; }
#crm-tools-fields-panel .cfp-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-body { overflow-y: auto; flex: 1; }
#crm-tools-fields-panel table { width: 100%; border-collapse: collapse; }
#crm-tools-fields-panel thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#crm-tools-fields-panel tbody tr:nth-child(even) { background: #f8f9ff; }
#crm-tools-fields-panel tbody tr:hover { background: #dceafe; }
#crm-tools-fields-panel td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8;
  vertical-align: top; word-break: break-word;
}
#crm-tools-fields-panel td:nth-child(1), #crm-tools-fields-panel th:nth-child(1) { width: 26%; }
#crm-tools-fields-panel td:nth-child(2), #crm-tools-fields-panel th:nth-child(2) { width: 26%; }
#crm-tools-fields-panel td:nth-child(3), #crm-tools-fields-panel th:nth-child(3) { width: 14%; }
#crm-tools-fields-panel td:nth-child(4), #crm-tools-fields-panel th:nth-child(4) { width: 34%; }
#crm-tools-fields-panel td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#crm-tools-fields-panel .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#crm-tools-fields-panel .cfp-null { color: #aaa; font-style: italic; }
    `;
    document.head.appendChild(style);
  }

  // ── Build panel ───────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // ── Header ────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'cfp-header';

  const title = document.createElement('span');
  title.className = 'cfp-header-title';
  title.textContent = '📋 All Fields';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'cfp-close';
  closeBtn.title = 'Close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // ── Body ──────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'cfp-body';

  // ── Entity info subheader ─────────────────────────────────────
  const entityName = Xrm.Page.data.entity.getEntityName();
  const entityId   = Xrm.Page.data.entity.getId();

  const subheader = document.createElement('div');
  subheader.className = 'cfp-subheader';
  subheader.textContent = `Entity: ${entityName}  |  ID: ${entityId || '(new record)'}`;
  panel.appendChild(subheader);

  // ── Build label map from controls (reuse from above) ─────────
  Xrm.Page.ui.controls.forEach((ctrl) => {
    const name = ctrl.getName();
    if (name) {
      try { labelMap[name] = ctrl.getLabel() || name; } catch (e) { labelMap[name] = name; }
    }
  });

  // ── Format value by attribute type ───────────────────────────
  function formatValue(attr) {
    try {
      const val = attr.getValue();
      if (val === null || val === undefined) return null;

      const type = attr.getAttributeType ? attr.getAttributeType() : typeof val;

      switch (type) {
        case 'lookup': {
          if (!Array.isArray(val)) return String(val);
          return val.map((v) => v.name || v.id).join(', ');
        }
        case 'optionset':
        case 'multiselectoptionset': {
          const text = attr.getText ? attr.getText() : null;
          return text !== null && text !== undefined ? String(text) : String(val);
        }
        case 'datetime': {
          return val instanceof Date ? val.toLocaleString() : String(val);
        }
        case 'boolean': {
          return val ? 'Yes' : 'No';
        }
        default:
          return String(val);
      }
    } catch (e) {
      return '(error reading value)';
    }
  }

  // ── Build table ───────────────────────────────────────────────
  const table = document.createElement('table');

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  attributes.forEach((attr) => {
    const name  = attr.getName();
    const label = labelMap[name] || name;
    const type  = attr.getAttributeType ? attr.getAttributeType() : '—';
    const rawValue = formatValue(attr);

    const tr = document.createElement('tr');

    const tdLabel = document.createElement('td');
    tdLabel.textContent = label;

    const tdSchema = document.createElement('td');
    tdSchema.textContent = name;

    const tdType = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = 'cfp-type';
    typeBadge.textContent = type;
    tdType.appendChild(typeBadge);

    const tdValue = document.createElement('td');
    if (rawValue === null) {
      const nullSpan = document.createElement('span');
      nullSpan.className = 'cfp-null';
      nullSpan.textContent = 'null';
      tdValue.appendChild(nullSpan);
    } else {
      tdValue.textContent = rawValue;
    }

    tr.appendChild(tdLabel);
    tr.appendChild(tdSchema);
    tr.appendChild(tdType);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  body.appendChild(table);
  panel.appendChild(body);
  document.body.appendChild(panel);
})();
