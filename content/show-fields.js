(function () {
  const PANEL_ID = 'crm-tools-fields-panel';

  // Toggle: remove panel if already open
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
    return;
  }

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

  if (typeof Xrm === 'undefined' || !Xrm.Page) {
    body.innerHTML = '<div class="cfp-error">⚠️ Xrm is not available on this page.<br>Navigate to a Dynamics CRM entity form and try again.</div>';
    panel.appendChild(body);
    document.body.appendChild(panel);
    return;
  }

  // ── Entity info subheader ─────────────────────────────────────
  const entityName = Xrm.Page.data.entity.getEntityName();
  const entityId   = Xrm.Page.data.entity.getId();

  const subheader = document.createElement('div');
  subheader.className = 'cfp-subheader';
  subheader.textContent = `Entity: ${entityName}  |  ID: ${entityId || '(new record)'}`;
  panel.insertBefore(subheader, body);

  // ── Build label map from controls ────────────────────────────
  const labelMap = {};
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

  const attributes = Xrm.Page.data.entity.attributes.get();
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
