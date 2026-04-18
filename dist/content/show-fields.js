"use strict";
(() => {
  // src/content/show-fields.ts
  var PANEL_ID = "crm-tools-fields-panel";
  var STYLE_ID = "crm-tools-fields-style";
  var LOG = (msg) => console.log("[CRM Tools]", msg);
  function main() {
    LOG("show-fields.ts running in: " + window.location.href);
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      LOG("Panel already open \u2014 closing.");
      existing.remove();
      return;
    }
    LOG("Xrm available: " + (typeof Xrm !== "undefined"));
    if (typeof Xrm === "undefined" || !Xrm.Page) {
      LOG("Xrm.Page not found in this frame \u2014 skipping.");
      return;
    }
    LOG("Xrm.Page found! Reading attributes\u2026");
    const attributes = Xrm.Page.data.entity.attributes.get();
    const labelMap = {};
    Xrm.Page.ui.controls.forEach((ctrl) => {
      const name = ctrl.getName();
      if (name) {
        try {
          labelMap[name] = ctrl.getLabel() || name;
        } catch {
          labelMap[name] = name;
        }
      }
    });
    LOG(`Entity: ${Xrm.Page.data.entity.getEntityName()} \u2014 ${attributes.length} attribute(s)`);
    attributes.forEach((attr) => {
      const name = attr.getName();
      const type = attr.getAttributeType ? attr.getAttributeType() : "?";
      const label = labelMap[name] || name;
      let val;
      try {
        val = attr.getValue();
      } catch {
        val = "(error)";
      }
      console.log(`  [${type}] ${label} (${name}) =`, val);
    });
    injectStyles();
    buildPanel(attributes, labelMap);
  }
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
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
  function formatValue(attr) {
    try {
      const val = attr.getValue();
      if (val === null || val === void 0) return null;
      const type = attr.getAttributeType ? attr.getAttributeType() : typeof val;
      switch (type) {
        case "lookup": {
          if (!Array.isArray(val)) return String(val);
          return val.map((v) => v.name || v.id).join(", ");
        }
        case "optionset":
        case "multiselectoptionset": {
          const text = attr.getText?.();
          return text != null ? String(text) : String(val);
        }
        case "datetime": {
          return val instanceof Date ? val.toLocaleString() : String(val);
        }
        case "boolean": {
          return val ? "Yes" : "No";
        }
        default:
          return String(val);
      }
    } catch {
      return "(error reading value)";
    }
  }
  function buildPanel(attributes, labelMap) {
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    const header = document.createElement("div");
    header.className = "cfp-header";
    const title = document.createElement("span");
    title.className = "cfp-header-title";
    title.textContent = "\u{1F4CB} All Fields";
    const closeBtn = document.createElement("button");
    closeBtn.className = "cfp-close";
    closeBtn.title = "Close";
    closeBtn.textContent = "\u2715";
    closeBtn.addEventListener("click", () => panel.remove());
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    const entityName = Xrm.Page.data.entity.getEntityName();
    const entityId = Xrm.Page.data.entity.getId();
    const subheader = document.createElement("div");
    subheader.className = "cfp-subheader";
    subheader.textContent = `Entity: ${entityName}  |  ID: ${entityId || "(new record)"}`;
    panel.appendChild(subheader);
    const body = document.createElement("div");
    body.className = "cfp-body";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    attributes.forEach((attr) => {
      const name = attr.getName();
      const label = labelMap[name] || name;
      const type = attr.getAttributeType ? attr.getAttributeType() : "\u2014";
      const rawValue = formatValue(attr);
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td");
      tdLabel.textContent = label;
      const tdSchema = document.createElement("td");
      tdSchema.textContent = name;
      const tdType = document.createElement("td");
      const typeBadge = document.createElement("span");
      typeBadge.className = "cfp-type";
      typeBadge.textContent = type;
      tdType.appendChild(typeBadge);
      const tdValue = document.createElement("td");
      if (rawValue === null) {
        const nullSpan = document.createElement("span");
        nullSpan.className = "cfp-null";
        nullSpan.textContent = "null";
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
  }
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hvdy1maWVsZHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEluamVjdGVkIGludG8gQ1JNIGZvcm0gZnJhbWVzIHZpYSBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQuXHJcbi8vIFJlYWRzIGFsbCBYcm0gYXR0cmlidXRlcyBhbmQgcmVuZGVycyBhIHNpZGUtcGFuZWwgd2l0aCBhIHNvcnRhYmxlIHRhYmxlLlxyXG5cclxuY29uc3QgUEFORUxfSUQgPSAnY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCc7XHJcbmNvbnN0IFNUWUxFX0lEID0gJ2NybS10b29scy1maWVsZHMtc3R5bGUnO1xyXG5jb25zdCBMT0cgPSAobXNnOiBzdHJpbmcpID0+IGNvbnNvbGUubG9nKCdbQ1JNIFRvb2xzXScsIG1zZyk7XHJcblxyXG5mdW5jdGlvbiBtYWluKCk6IHZvaWQge1xyXG4gIExPRygnc2hvdy1maWVsZHMudHMgcnVubmluZyBpbjogJyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbiAgLy8gVG9nZ2xlOiByZW1vdmUgcGFuZWwgaWYgYWxyZWFkeSBvcGVuXHJcbiAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChQQU5FTF9JRCk7XHJcbiAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICBMT0coJ1BhbmVsIGFscmVhZHkgb3BlbiBcdTIwMTQgY2xvc2luZy4nKTtcclxuICAgIGV4aXN0aW5nLnJlbW92ZSgpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gWHJtIGlzIG9ubHkgYXZhaWxhYmxlIGluIHRoZSBDUk0gZm9ybSBpZnJhbWUgXHUyMDE0IHNpbGVudGx5IHNraXAgb3RoZXIgZnJhbWVzXHJcbiAgTE9HKCdYcm0gYXZhaWxhYmxlOiAnICsgKHR5cGVvZiBYcm0gIT09ICd1bmRlZmluZWQnKSk7XHJcbiAgaWYgKHR5cGVvZiBYcm0gPT09ICd1bmRlZmluZWQnIHx8ICFYcm0uUGFnZSkge1xyXG4gICAgTE9HKCdYcm0uUGFnZSBub3QgZm91bmQgaW4gdGhpcyBmcmFtZSBcdTIwMTQgc2tpcHBpbmcuJyk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBMT0coJ1hybS5QYWdlIGZvdW5kISBSZWFkaW5nIGF0dHJpYnV0ZXNcdTIwMjYnKTtcclxuXHJcbiAgY29uc3QgYXR0cmlidXRlcyA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmF0dHJpYnV0ZXMuZ2V0KCk7XHJcblxyXG4gIC8vIEJ1aWxkIGxhYmVsIG1hcCBmcm9tIFVJIGNvbnRyb2xzXHJcbiAgY29uc3QgbGFiZWxNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuICBYcm0uUGFnZS51aS5jb250cm9scy5mb3JFYWNoKChjdHJsKSA9PiB7XHJcbiAgICBjb25zdCBuYW1lID0gY3RybC5nZXROYW1lKCk7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGxhYmVsTWFwW25hbWVdID0gKGN0cmwgYXMgWHJtLkNvbnRyb2xzLlN0YW5kYXJkQ29udHJvbCkuZ2V0TGFiZWwoKSB8fCBuYW1lO1xyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICBsYWJlbE1hcFtuYW1lXSA9IG5hbWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgTE9HKGBFbnRpdHk6ICR7WHJtLlBhZ2UuZGF0YS5lbnRpdHkuZ2V0RW50aXR5TmFtZSgpfSBcdTIwMTQgJHthdHRyaWJ1dGVzLmxlbmd0aH0gYXR0cmlidXRlKHMpYCk7XHJcbiAgYXR0cmlidXRlcy5mb3JFYWNoKChhdHRyKSA9PiB7XHJcbiAgICBjb25zdCBuYW1lICA9IGF0dHIuZ2V0TmFtZSgpO1xyXG4gICAgY29uc3QgdHlwZSAgPSBhdHRyLmdldEF0dHJpYnV0ZVR5cGUgPyBhdHRyLmdldEF0dHJpYnV0ZVR5cGUoKSA6ICc/JztcclxuICAgIGNvbnN0IGxhYmVsID0gbGFiZWxNYXBbbmFtZV0gfHwgbmFtZTtcclxuICAgIGxldCB2YWw6IHVua25vd247XHJcbiAgICB0cnkgeyB2YWwgPSBhdHRyLmdldFZhbHVlKCk7IH0gY2F0Y2ggeyB2YWwgPSAnKGVycm9yKSc7IH1cclxuICAgIGNvbnNvbGUubG9nKGAgIFske3R5cGV9XSAke2xhYmVsfSAoJHtuYW1lfSkgPWAsIHZhbCk7XHJcbiAgfSk7XHJcblxyXG4gIGluamVjdFN0eWxlcygpO1xyXG4gIGJ1aWxkUGFuZWwoYXR0cmlidXRlcywgbGFiZWxNYXApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbmplY3RTdHlsZXMoKTogdm9pZCB7XHJcbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFNUWUxFX0lEKSkgcmV0dXJuO1xyXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICBzdHlsZS5pZCA9IFNUWUxFX0lEO1xyXG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxyXG4jY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCB7XHJcbiAgcG9zaXRpb246IGZpeGVkOyB0b3A6IDA7IHJpZ2h0OiAwOyB3aWR0aDogNTgwcHg7IGhlaWdodDogMTAwdmg7XHJcbiAgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyLWxlZnQ6IDJweCBzb2xpZCAjMWU2NGM4O1xyXG4gIGJveC1zaGFkb3c6IC00cHggMCAxNnB4IHJnYmEoMCwwLDAsMC4xOCk7XHJcbiAgei1pbmRleDogMjE0NzQ4MzY0NzsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjMjIyO1xyXG59XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIC5jZnAtaGVhZGVyIHtcclxuICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XHJcbiAgYmFja2dyb3VuZDogIzFlNjRjODsgY29sb3I6ICNmZmY7IHBhZGRpbmc6IDEwcHggMTRweDsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgLmNmcC1oZWFkZXItdGl0bGUgeyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IH1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgLmNmcC1jbG9zZSB7XHJcbiAgYmFja2dyb3VuZDogbm9uZTsgYm9yZGVyOiBub25lOyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiAxOHB4O1xyXG4gIGxpbmUtaGVpZ2h0OiAxOyBjdXJzb3I6IHBvaW50ZXI7IHBhZGRpbmc6IDAgMnB4OyBvcGFjaXR5OiAwLjg1O1xyXG59XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIC5jZnAtY2xvc2U6aG92ZXIgeyBvcGFjaXR5OiAxOyB9XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIC5jZnAtc3ViaGVhZGVyIHtcclxuICBwYWRkaW5nOiA2cHggMTRweDsgYmFja2dyb3VuZDogI2U4ZjBmZTsgZm9udC1zaXplOiAxMnB4O1xyXG4gIGNvbG9yOiAjMWU2NGM4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M1ZDhmYjsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgLmNmcC1ib2R5IHsgb3ZlcmZsb3cteTogYXV0bzsgZmxleDogMTsgfVxyXG4jY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCB0YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyB9XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRoZWFkIHRoIHtcclxuICBwb3NpdGlvbjogc3RpY2t5OyB0b3A6IDA7IGJhY2tncm91bmQ6ICNmMGY0ZmY7XHJcbiAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICMxZTY0Yzg7IHBhZGRpbmc6IDdweCAxMHB4OyB0ZXh0LWFsaWduOiBsZWZ0O1xyXG4gIGZvbnQtc2l6ZTogMTFweDsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcclxuICBsZXR0ZXItc3BhY2luZzogMC40cHg7IGNvbG9yOiAjNDQ0OyB3aGl0ZS1zcGFjZTogbm93cmFwO1xyXG59XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRib2R5IHRyOm50aC1jaGlsZChldmVuKSB7IGJhY2tncm91bmQ6ICNmOGY5ZmY7IH1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgdGJvZHkgdHI6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjZGNlYWZlOyB9XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRkIHtcclxuICBwYWRkaW5nOiA1cHggMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlOGU4ZTg7XHJcbiAgdmVydGljYWwtYWxpZ246IHRvcDsgd29yZC1icmVhazogYnJlYWstd29yZDtcclxufVxyXG4jY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCB0ZDpudGgtY2hpbGQoMSksICNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRoOm50aC1jaGlsZCgxKSB7IHdpZHRoOiAyNiU7IH1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgdGQ6bnRoLWNoaWxkKDIpLCAjY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCB0aDpudGgtY2hpbGQoMikgeyB3aWR0aDogMjYlOyB9XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRkOm50aC1jaGlsZCgzKSwgI2NybS10b29scy1maWVsZHMtcGFuZWwgdGg6bnRoLWNoaWxkKDMpIHsgd2lkdGg6IDE0JTsgfVxyXG4jY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCB0ZDpudGgtY2hpbGQoNCksICNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIHRoOm50aC1jaGlsZCg0KSB7IHdpZHRoOiAzNCU7IH1cclxuI2NybS10b29scy1maWVsZHMtcGFuZWwgdGQ6bnRoLWNoaWxkKDIpIHtcclxuICBmb250LWZhbWlseTogQ29uc29sYXMsIG1vbm9zcGFjZTsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzU1NTtcclxufVxyXG4jY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCAuY2ZwLXR5cGUge1xyXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jazsgcGFkZGluZzogMXB4IDZweDsgYm9yZGVyLXJhZGl1czogMTBweDtcclxuICBmb250LXNpemU6IDExcHg7IGJhY2tncm91bmQ6ICNlOGU4ZTg7IGNvbG9yOiAjNDQ0O1xyXG59XHJcbiNjcm0tdG9vbHMtZmllbGRzLXBhbmVsIC5jZnAtbnVsbCB7IGNvbG9yOiAjYWFhOyBmb250LXN0eWxlOiBpdGFsaWM7IH1cclxuICBgO1xyXG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShhdHRyOiBYcm0uQXR0cmlidXRlcy5BdHRyaWJ1dGUpOiBzdHJpbmcgfCBudWxsIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgdmFsID0gYXR0ci5nZXRWYWx1ZSgpIGFzIHVua25vd247XHJcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBjb25zdCB0eXBlID0gYXR0ci5nZXRBdHRyaWJ1dGVUeXBlID8gYXR0ci5nZXRBdHRyaWJ1dGVUeXBlKCkgOiB0eXBlb2YgdmFsO1xyXG5cclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICBjYXNlICdsb29rdXAnOiB7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbCkpIHJldHVybiBTdHJpbmcodmFsKTtcclxuICAgICAgICByZXR1cm4gKHZhbCBhcyBYcm0uTG9va3VwVmFsdWVbXSkubWFwKCh2KSA9PiB2Lm5hbWUgfHwgdi5pZCkuam9pbignLCAnKTtcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdvcHRpb25zZXQnOlxyXG4gICAgICBjYXNlICdtdWx0aXNlbGVjdG9wdGlvbnNldCc6IHtcclxuICAgICAgICBjb25zdCB0ZXh0ID0gKGF0dHIgYXMgWHJtLkF0dHJpYnV0ZXMuT3B0aW9uU2V0QXR0cmlidXRlKS5nZXRUZXh0Py4oKTtcclxuICAgICAgICByZXR1cm4gdGV4dCAhPSBudWxsID8gU3RyaW5nKHRleHQpIDogU3RyaW5nKHZhbCk7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnZGF0ZXRpbWUnOiB7XHJcbiAgICAgICAgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIERhdGUgPyB2YWwudG9Mb2NhbGVTdHJpbmcoKSA6IFN0cmluZyh2YWwpO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOiB7XHJcbiAgICAgICAgcmV0dXJuIHZhbCA/ICdZZXMnIDogJ05vJztcclxuICAgICAgfVxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBTdHJpbmcodmFsKTtcclxuICAgIH1cclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiAnKGVycm9yIHJlYWRpbmcgdmFsdWUpJztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkUGFuZWwoXHJcbiAgYXR0cmlidXRlczogWHJtLkF0dHJpYnV0ZXMuQXR0cmlidXRlW10sXHJcbiAgbGFiZWxNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgcGFuZWwuaWQgPSBQQU5FTF9JRDtcclxuXHJcbiAgLy8gSGVhZGVyXHJcbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgaGVhZGVyLmNsYXNzTmFtZSA9ICdjZnAtaGVhZGVyJztcclxuXHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgdGl0bGUuY2xhc3NOYW1lID0gJ2NmcC1oZWFkZXItdGl0bGUnO1xyXG4gIHRpdGxlLnRleHRDb250ZW50ID0gJ1x1RDgzRFx1RENDQiBBbGwgRmllbGRzJztcclxuXHJcbiAgY29uc3QgY2xvc2VCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICBjbG9zZUJ0bi5jbGFzc05hbWUgPSAnY2ZwLWNsb3NlJztcclxuICBjbG9zZUJ0bi50aXRsZSA9ICdDbG9zZSc7XHJcbiAgY2xvc2VCdG4udGV4dENvbnRlbnQgPSAnXHUyNzE1JztcclxuICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHBhbmVsLnJlbW92ZSgpKTtcclxuXHJcbiAgaGVhZGVyLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuICBoZWFkZXIuYXBwZW5kQ2hpbGQoY2xvc2VCdG4pO1xyXG4gIHBhbmVsLmFwcGVuZENoaWxkKGhlYWRlcik7XHJcblxyXG4gIC8vIEVudGl0eSBpbmZvIHN1YmhlYWRlclxyXG4gIGNvbnN0IGVudGl0eU5hbWUgPSBYcm0uUGFnZS5kYXRhLmVudGl0eS5nZXRFbnRpdHlOYW1lKCk7XHJcbiAgY29uc3QgZW50aXR5SWQgICA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmdldElkKCk7XHJcblxyXG4gIGNvbnN0IHN1YmhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHN1YmhlYWRlci5jbGFzc05hbWUgPSAnY2ZwLXN1YmhlYWRlcic7XHJcbiAgc3ViaGVhZGVyLnRleHRDb250ZW50ID0gYEVudGl0eTogJHtlbnRpdHlOYW1lfSAgfCAgSUQ6ICR7ZW50aXR5SWQgfHwgJyhuZXcgcmVjb3JkKSd9YDtcclxuICBwYW5lbC5hcHBlbmRDaGlsZChzdWJoZWFkZXIpO1xyXG5cclxuICAvLyBTY3JvbGxhYmxlIGJvZHkgd2l0aCB0YWJsZVxyXG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBib2R5LmNsYXNzTmFtZSA9ICdjZnAtYm9keSc7XHJcblxyXG4gIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKTtcclxuICBjb25zdCB0aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyk7XHJcbiAgdGhlYWQuaW5uZXJIVE1MID0gJzx0cj48dGg+TGFiZWw8L3RoPjx0aD5TY2hlbWEgTmFtZTwvdGg+PHRoPlR5cGU8L3RoPjx0aD5WYWx1ZTwvdGg+PC90cj4nO1xyXG4gIHRhYmxlLmFwcGVuZENoaWxkKHRoZWFkKTtcclxuXHJcbiAgY29uc3QgdGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xyXG4gIGF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cikgPT4ge1xyXG4gICAgY29uc3QgbmFtZSAgICAgPSBhdHRyLmdldE5hbWUoKTtcclxuICAgIGNvbnN0IGxhYmVsICAgID0gbGFiZWxNYXBbbmFtZV0gfHwgbmFtZTtcclxuICAgIGNvbnN0IHR5cGUgICAgID0gYXR0ci5nZXRBdHRyaWJ1dGVUeXBlID8gYXR0ci5nZXRBdHRyaWJ1dGVUeXBlKCkgOiAnXHUyMDE0JztcclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gZm9ybWF0VmFsdWUoYXR0cik7XHJcblxyXG4gICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG5cclxuICAgIGNvbnN0IHRkTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgdGRMYWJlbC50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG5cclxuICAgIGNvbnN0IHRkU2NoZW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIHRkU2NoZW1hLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICBjb25zdCB0ZFR5cGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgY29uc3QgdHlwZUJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgdHlwZUJhZGdlLmNsYXNzTmFtZSA9ICdjZnAtdHlwZSc7XHJcbiAgICB0eXBlQmFkZ2UudGV4dENvbnRlbnQgPSB0eXBlO1xyXG4gICAgdGRUeXBlLmFwcGVuZENoaWxkKHR5cGVCYWRnZSk7XHJcblxyXG4gICAgY29uc3QgdGRWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICBpZiAocmF3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgY29uc3QgbnVsbFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgIG51bGxTcGFuLmNsYXNzTmFtZSA9ICdjZnAtbnVsbCc7XHJcbiAgICAgIG51bGxTcGFuLnRleHRDb250ZW50ID0gJ251bGwnO1xyXG4gICAgICB0ZFZhbHVlLmFwcGVuZENoaWxkKG51bGxTcGFuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRkVmFsdWUudGV4dENvbnRlbnQgPSByYXdWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZExhYmVsKTtcclxuICAgIHRyLmFwcGVuZENoaWxkKHRkU2NoZW1hKTtcclxuICAgIHRyLmFwcGVuZENoaWxkKHRkVHlwZSk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZFZhbHVlKTtcclxuICAgIHRib2R5LmFwcGVuZENoaWxkKHRyKTtcclxuICB9KTtcclxuXHJcbiAgdGFibGUuYXBwZW5kQ2hpbGQodGJvZHkpO1xyXG4gIGJvZHkuYXBwZW5kQ2hpbGQodGFibGUpO1xyXG4gIHBhbmVsLmFwcGVuZENoaWxkKGJvZHkpO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFuZWwpO1xyXG59XHJcblxyXG5tYWluKCk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQUdBLE1BQU0sV0FBVztBQUNqQixNQUFNLFdBQVc7QUFDakIsTUFBTSxNQUFNLENBQUMsUUFBZ0IsUUFBUSxJQUFJLGVBQWUsR0FBRztBQUUzRCxXQUFTLE9BQWE7QUFDcEIsUUFBSSxnQ0FBZ0MsT0FBTyxTQUFTLElBQUk7QUFHeEQsVUFBTSxXQUFXLFNBQVMsZUFBZSxRQUFR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
