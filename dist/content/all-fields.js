"use strict";
(() => {
  // src/content/shared.ts
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  function buildLabelMap() {
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
    return labelMap;
  }
  function makeDraggable(panel, handle, closeBtn) {
    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      panel.style.right = "";
      panel.style.transform = "";
    });
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const onMouseMove = (e) => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - panel.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - panel.offsetHeight));
      panel.style.left = x + "px";
      panel.style.top = y + "px";
    };
    const onMouseUp = () => {
      dragging = false;
      handle.style.cursor = "move";
    };
    handle.addEventListener("mousedown", (e) => {
      if (closeBtn.contains(e.target)) return;
      dragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      handle.style.cursor = "grabbing";
      e.preventDefault();
    });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    new MutationObserver((_, obs) => {
      if (!document.contains(panel)) {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        obs.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  function execCommandCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => execCommandCopy(text));
    } else {
      execCommandCopy(text);
    }
  }

  // src/content/panel.ts
  function injectStylesheet(styleId, css) {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
  function isolateKeyboard(el) {
    el.addEventListener("keydown", (e) => e.stopPropagation());
    el.addEventListener("keyup", (e) => e.stopPropagation());
  }
  function createCopySpan(display, copyValue) {
    const span = document.createElement("span");
    span.className = "dcat-copy-val";
    span.textContent = display;
    span.title = `Click to copy: ${copyValue}`;
    span.addEventListener("click", () => {
      copyToClipboard(copyValue);
      span.classList.add("dcat-copied");
      setTimeout(() => span.classList.remove("dcat-copied"), 1200);
    });
    return span;
  }
  function createSearchBar(opts) {
    const container = document.createElement("div");
    container.className = "dcat-search";
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = opts.placeholder;
    isolateKeyboard(input);
    const handler = debounce(() => {
      opts.onFilter(input.value.toLowerCase().trim());
    }, opts.debounceMs ?? 100);
    input.addEventListener("input", handler);
    container.appendChild(input);
    return {
      container,
      input,
      triggerFilter: () => input.dispatchEvent(new Event("input"))
    };
  }
  function baseCss(id, variant) {
    const containerCss = variant === "dialog" ? `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: hidden;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;` : `position: fixed; top: 0; right: 0; width: auto; min-width: 550px; max-width: 90vw; max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8;
       box-shadow: -4px 0 16px rgba(0,0,0,0.18);
       z-index: 2147483647; display: flex; flex-direction: column;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;`;
    const bodyCss = variant === "dialog" ? `padding: 14px; display: flex; flex-direction: column; gap: 10px;` : `overflow-y: auto; overflow-x: auto; flex: 1;`;
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
  function createPanelShell(config) {
    const existing = document.getElementById(config.panelId);
    if (existing) {
      existing.remove();
      return null;
    }
    const variant = config.variant ?? "sidebar";
    injectStylesheet(config.styleId, baseCss(config.panelId, variant) + (config.extraCss ?? ""));
    const panel = document.createElement("div");
    panel.id = config.panelId;
    const header = document.createElement("div");
    header.className = "dcat-header";
    const titleEl = document.createElement("span");
    titleEl.className = "dcat-title";
    titleEl.textContent = config.title;
    const closeBtn = document.createElement("button");
    closeBtn.className = "dcat-close";
    closeBtn.title = "Close";
    closeBtn.textContent = "\u2715";
    closeBtn.addEventListener("click", () => panel.remove());
    header.append(titleEl, closeBtn);
    const body = document.createElement("div");
    body.className = "dcat-body";
    panel.append(header, body);
    document.body.appendChild(panel);
    makeDraggable(panel, header, closeBtn);
    return { panel, header, closeBtn, body };
  }

  // src/content/all-fields/all-fields.ts
  var PANEL_ID = "crm-tools-fields-panel";
  var STYLE_ID = "crm-tools-fields-style";
  var EXTRA_CSS = `
#${PANEL_ID} .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 16px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85; margin-right: 4px;
}
#${PANEL_ID} .cfp-refresh:hover { opacity: 1; }
#${PANEL_ID} .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#${PANEL_ID} .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#${PANEL_ID} table { width: 100%; border-collapse: collapse; }
#${PANEL_ID} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${PANEL_ID} tbody tr:nth-child(even) { background: #f8f9ff; }
#${PANEL_ID} tbody tr:hover { background: #dceafe; }
#${PANEL_ID} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${PANEL_ID} td:nth-child(1), #${PANEL_ID} th:nth-child(1) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(2), #${PANEL_ID} th:nth-child(2) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(3), #${PANEL_ID} th:nth-child(3) { white-space: nowrap; }
#${PANEL_ID} td:nth-child(4), #${PANEL_ID} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${PANEL_ID} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${PANEL_ID} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${PANEL_ID} .cfp-null { color: #aaa; font-style: italic; }
`;
  function main() {
    if (typeof Xrm === "undefined" || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
      return;
    }
    const shell = createPanelShell({
      panelId: PANEL_ID,
      styleId: STYLE_ID,
      title: "\u{1F4CB} All Fields",
      extraCss: EXTRA_CSS
    });
    if (!shell) return;
    const { panel, header, closeBtn, body } = shell;
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "cfp-refresh";
    refreshBtn.title = "Refresh form data";
    refreshBtn.textContent = "\u21BB";
    header.insertBefore(refreshBtn, closeBtn);
    const entityName = Xrm.Page.data.entity.getEntityName();
    const entityId = Xrm.Page.data.entity.getId();
    const subheader = document.createElement("div");
    subheader.className = "dcat-subheader";
    subheader.append("Entity: ");
    subheader.appendChild(createCopySpan(entityName, entityName));
    subheader.append("  |  ID: ");
    if (entityId) {
      const cleanId = entityId.replace(/^\{|\}$/g, "");
      subheader.appendChild(createCopySpan(entityId, cleanId));
    } else {
      subheader.append("(new record)");
    }
    panel.insertBefore(subheader, body);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    const noResults = document.createElement("div");
    noResults.className = "dcat-no-results";
    noResults.textContent = "No matching fields.";
    noResults.style.display = "none";
    const filterRows = (q) => {
      let visible = 0;
      tbody.querySelectorAll("tr").forEach((row) => {
        const match = !q || row.dataset.searchLabel.includes(q) || row.dataset.searchSchema.includes(q) || row.dataset.searchValue.includes(q);
        row.style.display = match ? "" : "none";
        if (match) visible++;
      });
      noResults.style.display = visible === 0 ? "" : "none";
    };
    const search = createSearchBar({
      placeholder: "Search by label, schema name or value\u2026",
      onFilter: filterRows
    });
    isolateKeyboard(search.input);
    panel.insertBefore(search.container, body);
    const attributes = Xrm.Page.data.entity.attributes.get();
    const labelMap = buildLabelMap();
    populateTbody(tbody, attributes, labelMap);
    refreshBtn.addEventListener("click", () => {
      refreshBtn.disabled = true;
      refreshBtn.classList.add("cfp-spinning");
      Xrm.Page.data.refresh(false).then(
        () => {
          populateTbody(tbody, Xrm.Page.data.entity.attributes.get(), buildLabelMap());
          search.triggerFilter();
          refreshBtn.classList.remove("cfp-spinning");
          refreshBtn.disabled = false;
        },
        (err) => {
          console.error("[DynamicsCat] Refresh failed:", err);
          refreshBtn.classList.remove("cfp-spinning");
          refreshBtn.disabled = false;
        }
      );
    });
    body.appendChild(table);
    body.appendChild(noResults);
    requestAnimationFrame(() => {
      const tableWidth = table.offsetWidth;
      panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + "px";
    });
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
  function populateTbody(tbody, attributes, labelMap) {
    tbody.innerHTML = "";
    const sortedAttrs = [...attributes].sort((a, b) => {
      const la = (labelMap[a.getName()] || a.getName()).toLowerCase();
      const lb = (labelMap[b.getName()] || b.getName()).toLowerCase();
      return la.localeCompare(lb);
    });
    sortedAttrs.forEach((attr) => {
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
      tr.dataset.searchLabel = label.toLowerCase();
      tr.dataset.searchSchema = name.toLowerCase();
      tr.dataset.searchValue = (rawValue ?? "null").toLowerCase();
      tr.appendChild(tdLabel);
      tr.appendChild(tdSchema);
      tr.appendChild(tdType);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });
  }
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hhcmVkLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L3BhbmVsLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L2FsbC1maWVsZHMvYWxsLWZpZWxkcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gU2hhcmVkIHV0aWxpdGllcyBmb3IgRHluYW1pY3NDYXQgY29udGVudCBzY3JpcHRzLlxyXG4vLyBCdW5kbGVkIGlubGluZSBpbnRvIGVhY2ggc2NyaXB0IGJ5IGVzYnVpbGQgXHUyMDE0IG5vIHNlcGFyYXRlIG91dHB1dCBmaWxlIG5lZWRlZC5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWJvdW5jZTxUIGV4dGVuZHMgdW5rbm93bltdPihmbjogKC4uLmFyZ3M6IFQpID0+IHZvaWQsIG1zOiBudW1iZXIpOiAoLi4uYXJnczogVCkgPT4gdm9pZCB7XHJcbiAgbGV0IHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PjtcclxuICByZXR1cm4gKC4uLmFyZ3M6IFQpID0+IHtcclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIG1zKTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRMYWJlbE1hcCgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcclxuICBjb25zdCBsYWJlbE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xyXG4gIFhybS5QYWdlLnVpLmNvbnRyb2xzLmZvckVhY2goKGN0cmwpID0+IHtcclxuICAgIGNvbnN0IG5hbWUgPSBjdHJsLmdldE5hbWUoKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbGFiZWxNYXBbbmFtZV0gPSAoY3RybCBhcyBYcm0uQ29udHJvbHMuU3RhbmRhcmRDb250cm9sKS5nZXRMYWJlbCgpIHx8IG5hbWU7XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGxhYmVsTWFwW25hbWVdID0gbmFtZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBsYWJlbE1hcDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VEcmFnZ2FibGUocGFuZWw6IEhUTUxFbGVtZW50LCBoYW5kbGU6IEhUTUxFbGVtZW50LCBjbG9zZUJ0bjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgY29uc3QgcmVjdCA9IHBhbmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgcGFuZWwuc3R5bGUubGVmdCAgICAgID0gcmVjdC5sZWZ0ICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnRvcCAgICAgICA9IHJlY3QudG9wICArICdweCc7XHJcbiAgICBwYW5lbC5zdHlsZS5yaWdodCAgICAgPSAnJztcclxuICAgIHBhbmVsLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xyXG4gIH0pO1xyXG5cclxuICBsZXQgZHJhZ2dpbmcgPSBmYWxzZTtcclxuICBsZXQgb2Zmc2V0WCA9IDA7XHJcbiAgbGV0IG9mZnNldFkgPSAwO1xyXG5cclxuICBjb25zdCBvbk1vdXNlTW92ZSA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XHJcbiAgICBjb25zdCB4ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZS5jbGllbnRYIC0gb2Zmc2V0WCwgd2luZG93LmlubmVyV2lkdGggIC0gcGFuZWwub2Zmc2V0V2lkdGgpKTtcclxuICAgIGNvbnN0IHkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlLmNsaWVudFkgLSBvZmZzZXRZLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBwYW5lbC5vZmZzZXRIZWlnaHQpKTtcclxuICAgIHBhbmVsLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnRvcCAgPSB5ICsgJ3B4JztcclxuICB9O1xyXG5cclxuICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7IGRyYWdnaW5nID0gZmFsc2U7IGhhbmRsZS5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7IH07XHJcblxyXG4gIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xyXG4gICAgaWYgKGNsb3NlQnRuLmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSByZXR1cm47XHJcbiAgICBkcmFnZ2luZyA9IHRydWU7XHJcbiAgICBvZmZzZXRYICA9IGUuY2xpZW50WCAtIHBhbmVsLm9mZnNldExlZnQ7XHJcbiAgICBvZmZzZXRZICA9IGUuY2xpZW50WSAtIHBhbmVsLm9mZnNldFRvcDtcclxuICAgIGhhbmRsZS5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH0pO1xyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICAgb25Nb3VzZVVwKTtcclxuXHJcbiAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKF8sIG9icykgPT4ge1xyXG4gICAgaWYgKCFkb2N1bWVudC5jb250YWlucyhwYW5lbCkpIHtcclxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgICBvbk1vdXNlVXApO1xyXG4gICAgICBvYnMuZGlzY29ubmVjdCgpO1xyXG4gICAgfVxyXG4gIH0pLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4ZWNDb21tYW5kQ29weSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBjb25zdCB0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XHJcbiAgdGEudmFsdWUgPSB0ZXh0O1xyXG4gIHRhLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246Zml4ZWQ7b3BhY2l0eTowO3BvaW50ZXItZXZlbnRzOm5vbmUnO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGEpO1xyXG4gIHRhLnNlbGVjdCgpO1xyXG4gIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XHJcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb3B5VG9DbGlwYm9hcmQodGV4dDogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQ/LndyaXRlVGV4dCkge1xyXG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCkuY2F0Y2goKCkgPT4gZXhlY0NvbW1hbmRDb3B5KHRleHQpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgZXhlY0NvbW1hbmRDb3B5KHRleHQpO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgVE9BU1RfQ09OVEFJTkVSX0lEID0gJ2NybS10b29scy10b2FzdC1jb250YWluZXInO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dUb2FzdChtZXNzYWdlOiBzdHJpbmcsIHR5cGU6ICdpbmZvJyB8ICd3YXJuJyA9ICdpbmZvJyk6IHZvaWQge1xyXG4gIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChUT0FTVF9DT05UQUlORVJfSUQpO1xyXG4gIGlmICghY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGNvbnRhaW5lci5pZCA9IFRPQVNUX0NPTlRBSU5FUl9JRDtcclxuICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gW1xyXG4gICAgICAncG9zaXRpb246IGZpeGVkJywgJ2JvdHRvbTogMjRweCcsICdyaWdodDogMjRweCcsXHJcbiAgICAgICd6LWluZGV4OiAyMTQ3NDgzNjQ3JywgJ2Rpc3BsYXk6IGZsZXgnLCAnZmxleC1kaXJlY3Rpb246IGNvbHVtbicsICdnYXA6IDhweCcsXHJcbiAgICAgICdwb2ludGVyLWV2ZW50czogbm9uZScsXHJcbiAgICBdLmpvaW4oJzsgJyk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHRvYXN0LnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAnYmFja2dyb3VuZDogJyArICh0eXBlID09PSAnd2FybicgPyAnI2U2NTEwMCcgOiAnIzMyMzIzMicpLFxyXG4gICAgJ2NvbG9yOiAjZmZmJyxcclxuICAgICdmb250LWZhbWlseTogXCJHb29nbGUgU2Fuc1wiLCBSb2JvdG8sIFwiU2Vnb2UgVUlcIiwgQXJpYWwsIHNhbnMtc2VyaWYnLFxyXG4gICAgJ2ZvbnQtc2l6ZTogMTNweCcsXHJcbiAgICAncGFkZGluZzogMTBweCAxNnB4JyxcclxuICAgICdib3JkZXItcmFkaXVzOiA2cHgnLFxyXG4gICAgJ2JveC1zaGFkb3c6IDAgMnB4IDhweCByZ2JhKDAsMCwwLDAuMjUpJyxcclxuICAgICdwb2ludGVyLWV2ZW50czogYXV0bycsXHJcbiAgICAnb3BhY2l0eTogMScsXHJcbiAgICAndHJhbnNpdGlvbjogb3BhY2l0eSAwLjNzIGVhc2UnLFxyXG4gIF0uam9pbignOyAnKTtcclxuICB0b2FzdC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XHJcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRvYXN0KTtcclxuXHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICB0b2FzdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0b2FzdC5yZW1vdmUoKSwgMzUwKTtcclxuICB9LCAzNTAwKTtcclxufVxyXG4iLCAiLy8gU2hhcmVkIHBhbmVsIHNoZWxsIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIFByb3ZpZGVzIHRoZSBjb21tb24gY2hyb21lIChjb250YWluZXIsIGhlYWRlciwgY2xvc2UsIGRyYWcsIGtleWJvYXJkIGlzb2xhdGlvbilcclxuLy8gc28gZWFjaCBmZWF0dXJlIHNjcmlwdCBvbmx5IGJ1aWxkcyBpdHMgb3duIGJvZHkgY29udGVudC5cclxuXHJcbmltcG9ydCB7IGRlYm91bmNlLCBtYWtlRHJhZ2dhYmxlLCBjb3B5VG9DbGlwYm9hcmQgfSBmcm9tICcuL3NoYXJlZCc7XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgVHlwZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVsU2hlbGxDb25maWcge1xyXG4gIHBhbmVsSWQ6IHN0cmluZztcclxuICBzdHlsZUlkOiBzdHJpbmc7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICB2YXJpYW50PzogJ3NpZGViYXInIHwgJ2RpYWxvZyc7XHJcbiAgLyoqIEFkZGl0aW9uYWwgQ1NTIGFwcGVuZGVkIGFmdGVyIHRoZSBiYXNlIHBhbmVsIHN0eWxlc2hlZXQuICovXHJcbiAgZXh0cmFDc3M/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZWxTaGVsbCB7XHJcbiAgcGFuZWw6IEhUTUxEaXZFbGVtZW50O1xyXG4gIGhlYWRlcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgY2xvc2VCdG46IEhUTUxCdXR0b25FbGVtZW50O1xyXG4gIGJvZHk6IEhUTUxEaXZFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaEJhciB7XHJcbiAgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICBpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuICAvKiogUmUtcnVuIHRoZSBjdXJyZW50IGZpbHRlciAoZS5nLiBhZnRlciByZWZyZXNoaW5nIHRhYmxlIGRhdGEpLiAqL1xyXG4gIHRyaWdnZXJGaWx0ZXI6ICgpID0+IHZvaWQ7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5cclxuLyoqIElkZW1wb3RlbnQgc3R5bGUgaW5qZWN0aW9uIFx1MjAxNCBvbmx5IGluc2VydHMgb25jZSBwZXIgc3R5bGVJZC4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFN0eWxlc2hlZXQoc3R5bGVJZDogc3RyaW5nLCBjc3M6IHN0cmluZyk6IHZvaWQge1xyXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHlsZUlkKSkgcmV0dXJuO1xyXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICBzdHlsZS5pZCA9IHN0eWxlSWQ7XHJcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBjc3M7XHJcbiAgKGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzdHlsZSk7XHJcbn1cclxuXHJcbi8qKiBQcmV2ZW50IHRoZSBDUk0gaG9zdCBwYWdlIGZyb20gc3dhbGxvd2luZyBrZXlib2FyZCBldmVudHMgaW5zaWRlIGluamVjdGVkIHBhbmVscy4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzb2xhdGVLZXlib2FyZChlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCkpO1xyXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCkpO1xyXG59XHJcblxyXG4vKiogQ2xpY2stdG8tY29weSBzcGFuIHdpdGggYnJpZWYgZmxhc2ggZmVlZGJhY2suICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb3B5U3BhbihkaXNwbGF5OiBzdHJpbmcsIGNvcHlWYWx1ZTogc3RyaW5nKTogSFRNTFNwYW5FbGVtZW50IHtcclxuICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHNwYW4uY2xhc3NOYW1lID0gJ2RjYXQtY29weS12YWwnO1xyXG4gIHNwYW4udGV4dENvbnRlbnQgPSBkaXNwbGF5O1xyXG4gIHNwYW4udGl0bGUgPSBgQ2xpY2sgdG8gY29weTogJHtjb3B5VmFsdWV9YDtcclxuICBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgY29weVRvQ2xpcGJvYXJkKGNvcHlWYWx1ZSk7XHJcbiAgICBzcGFuLmNsYXNzTGlzdC5hZGQoJ2RjYXQtY29waWVkJyk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHNwYW4uY2xhc3NMaXN0LnJlbW92ZSgnZGNhdC1jb3BpZWQnKSwgMTIwMCk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHNwYW47XHJcbn1cclxuXHJcbi8qKiBDcmVhdGVzIGEgc2VhcmNoIGJhciB3aXRoIGRlYm91bmNlZCBmaWx0ZXIgY2FsbGJhY2suXHJcbiAqICBJbnNlcnQgdGhlIHJldHVybmVkIGNvbnRhaW5lciBpbnRvIHRoZSBwYW5lbCBiZXR3ZWVuIGhlYWRlci9zdWJoZWFkZXIgYW5kIGJvZHkuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWFyY2hCYXIob3B0czoge1xyXG4gIHBsYWNlaG9sZGVyOiBzdHJpbmc7XHJcbiAgb25GaWx0ZXI6IChxdWVyeTogc3RyaW5nKSA9PiB2b2lkO1xyXG4gIGRlYm91bmNlTXM/OiBudW1iZXI7XHJcbn0pOiBTZWFyY2hCYXIge1xyXG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSAnZGNhdC1zZWFyY2gnO1xyXG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICBpbnB1dC50eXBlID0gJ3NlYXJjaCc7XHJcbiAgaW5wdXQucGxhY2Vob2xkZXIgPSBvcHRzLnBsYWNlaG9sZGVyO1xyXG4gIGlzb2xhdGVLZXlib2FyZChpbnB1dCk7XHJcblxyXG4gIGNvbnN0IGhhbmRsZXIgPSBkZWJvdW5jZSgoKSA9PiB7XHJcbiAgICBvcHRzLm9uRmlsdGVyKGlucHV0LnZhbHVlLnRvTG93ZXJDYXNlKCkudHJpbSgpKTtcclxuICB9LCBvcHRzLmRlYm91bmNlTXMgPz8gMTAwKTtcclxuXHJcbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBoYW5kbGVyKTtcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY29udGFpbmVyLFxyXG4gICAgaW5wdXQsXHJcbiAgICB0cmlnZ2VyRmlsdGVyOiAoKSA9PiBpbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnKSksXHJcbiAgfTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIEJhc2UgQ1NTIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5cclxuZnVuY3Rpb24gYmFzZUNzcyhpZDogc3RyaW5nLCB2YXJpYW50OiAnc2lkZWJhcicgfCAnZGlhbG9nJyk6IHN0cmluZyB7XHJcbiAgY29uc3QgY29udGFpbmVyQ3NzID0gdmFyaWFudCA9PT0gJ2RpYWxvZydcclxuICAgID8gYHBvc2l0aW9uOiBmaXhlZDsgdG9wOiA1MCU7IGxlZnQ6IDUwJTsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7IHdpZHRoOiAzODBweDtcclxuICAgICAgIGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMnB4IHNvbGlkICMxZTY0Yzg7IGJvcmRlci1yYWRpdXM6IDhweDtcclxuICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDI0cHggcmdiYSgwLDAsMCwwLjIpO1xyXG4gICAgICAgei1pbmRleDogMjE0NzQ4MzY0Nzsgb3ZlcmZsb3c6IGhpZGRlbjtcclxuICAgICAgIGZvbnQtZmFtaWx5OiBTZWdvZSBVSSwgQXJpYWwsIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMTNweDsgY29sb3I6ICMyMjI7YFxyXG4gICAgOiBgcG9zaXRpb246IGZpeGVkOyB0b3A6IDA7IHJpZ2h0OiAwOyB3aWR0aDogYXV0bzsgbWluLXdpZHRoOiA1NTBweDsgbWF4LXdpZHRoOiA5MHZ3OyBtYXgtaGVpZ2h0OiA5MHZoO1xyXG4gICAgICAgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAycHggc29saWQgIzFlNjRjODtcclxuICAgICAgIGJveC1zaGFkb3c6IC00cHggMCAxNnB4IHJnYmEoMCwwLDAsMC4xOCk7XHJcbiAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ3OyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gICAgICAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzIyMjtgO1xyXG5cclxuICBjb25zdCBib2R5Q3NzID0gdmFyaWFudCA9PT0gJ2RpYWxvZydcclxuICAgID8gYHBhZGRpbmc6IDE0cHg7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMTBweDtgXHJcbiAgICA6IGBvdmVyZmxvdy15OiBhdXRvOyBvdmVyZmxvdy14OiBhdXRvOyBmbGV4OiAxO2A7XHJcblxyXG4gIHJldHVybiBgXHJcbiMke2lkfSB7ICR7Y29udGFpbmVyQ3NzfSB9XHJcbiMke2lkfSAuZGNhdC1oZWFkZXIge1xyXG4gIGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogNnB4O1xyXG4gIGJhY2tncm91bmQ6ICMxZTY0Yzg7IGNvbG9yOiAjZmZmOyBwYWRkaW5nOiAxMHB4IDE0cHg7IGZsZXgtc2hyaW5rOiAwO1xyXG4gIGN1cnNvcjogbW92ZTsgdXNlci1zZWxlY3Q6IG5vbmU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXRpdGxlIHsgZm9udC1zaXplOiAxNHB4OyBmb250LXdlaWdodDogNjAwOyBmbGV4OiAxOyB9XHJcbiMke2lkfSAuZGNhdC1jbG9zZSB7XHJcbiAgYmFja2dyb3VuZDogbm9uZTsgYm9yZGVyOiBub25lOyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiAxOHB4O1xyXG4gIGxpbmUtaGVpZ2h0OiAxOyBjdXJzb3I6IHBvaW50ZXI7IHBhZGRpbmc6IDAgMnB4OyBvcGFjaXR5OiAwLjg1O1xyXG59XHJcbiMke2lkfSAuZGNhdC1jbG9zZTpob3ZlciB7IG9wYWNpdHk6IDE7IH1cclxuIyR7aWR9IC5kY2F0LWJvZHkgeyAke2JvZHlDc3N9IH1cclxuIyR7aWR9IC5kY2F0LXN1YmhlYWRlciB7XHJcbiAgcGFkZGluZzogNnB4IDE0cHg7IGJhY2tncm91bmQ6ICNlOGYwZmU7IGZvbnQtc2l6ZTogMTJweDtcclxuICBjb2xvcjogIzFlNjRjODsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjNWQ4ZmI7IGZsZXgtc2hyaW5rOiAwO1xyXG59XHJcbiMke2lkfSAuZGNhdC1zZWFyY2gge1xyXG4gIHBhZGRpbmc6IDhweCAxNHB4OyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M1ZDhmYjsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCBpbnB1dCB7XHJcbiAgd2lkdGg6IDEwMCU7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IHBhZGRpbmc6IDVweCAxMHB4O1xyXG4gIGJvcmRlcjogMXB4IHNvbGlkICNjNWQ4ZmI7IGJvcmRlci1yYWRpdXM6IDRweDsgZm9udC1zaXplOiAxM3B4O1xyXG4gIGZvbnQtZmFtaWx5OiBTZWdvZSBVSSwgQXJpYWwsIHNhbnMtc2VyaWY7IGNvbG9yOiAjMjIyOyBvdXRsaW5lOiBub25lO1xyXG59XHJcbiMke2lkfSAuZGNhdC1zZWFyY2ggaW5wdXQ6Zm9jdXMgeyBib3JkZXItY29sb3I6ICMxZTY0Yzg7IH1cclxuIyR7aWR9IC5kY2F0LWNvcHktdmFsIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7IGJvcmRlci1ib3R0b206IDFweCBkYXNoZWQgIzFlNjRjODsgdHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjE1cztcclxufVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWw6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjYzVkOGZiOyBib3JkZXItcmFkaXVzOiAzcHg7IH1cclxuIyR7aWR9IC5kY2F0LWNvcHktdmFsLmRjYXQtY29waWVkIHsgYmFja2dyb3VuZDogI2I3ZjBjODsgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzJhOWM1MjsgYm9yZGVyLXJhZGl1czogM3B4OyB9XHJcbiMke2lkfSAuZGNhdC1uby1yZXN1bHRzIHtcclxuICBwYWRkaW5nOiAxNnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjODg4OyBmb250LXN0eWxlOiBpdGFsaWM7XHJcbn1cclxuYDtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIFBhbmVsIHNoZWxsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGNvbW1vbiBwYW5lbCBjaHJvbWUgKHRvZ2dsZSwgc3R5bGUgaW5qZWN0aW9uLCBoZWFkZXIsIGRyYWcsIGNsb3NlKS5cclxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIHBhbmVsIHdhcyB0b2dnbGVkIE9GRiAoYWxyZWFkeSBleGlzdGVkIGFuZCB3YXMgcmVtb3ZlZCkuXHJcbiAqIENhbGxlcnMgcG9wdWxhdGUgdGhlIHJldHVybmVkIGBib2R5YCBlbGVtZW50IHdpdGggZmVhdHVyZS1zcGVjaWZpYyBjb250ZW50LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhbmVsU2hlbGwoY29uZmlnOiBQYW5lbFNoZWxsQ29uZmlnKTogUGFuZWxTaGVsbCB8IG51bGwge1xyXG4gIC8vIFRvZ2dsZTogcmVtb3ZlIGlmIGFscmVhZHkgcHJlc2VudFxyXG4gIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29uZmlnLnBhbmVsSWQpO1xyXG4gIGlmIChleGlzdGluZykgeyBleGlzdGluZy5yZW1vdmUoKTsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgY29uc3QgdmFyaWFudCA9IGNvbmZpZy52YXJpYW50ID8/ICdzaWRlYmFyJztcclxuICBpbmplY3RTdHlsZXNoZWV0KGNvbmZpZy5zdHlsZUlkLCBiYXNlQ3NzKGNvbmZpZy5wYW5lbElkLCB2YXJpYW50KSArIChjb25maWcuZXh0cmFDc3MgPz8gJycpKTtcclxuXHJcbiAgY29uc3QgcGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwYW5lbC5pZCA9IGNvbmZpZy5wYW5lbElkO1xyXG5cclxuICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBoZWFkZXIuY2xhc3NOYW1lID0gJ2RjYXQtaGVhZGVyJztcclxuXHJcbiAgY29uc3QgdGl0bGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICB0aXRsZUVsLmNsYXNzTmFtZSA9ICdkY2F0LXRpdGxlJztcclxuICB0aXRsZUVsLnRleHRDb250ZW50ID0gY29uZmlnLnRpdGxlO1xyXG5cclxuICBjb25zdCBjbG9zZUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gIGNsb3NlQnRuLmNsYXNzTmFtZSA9ICdkY2F0LWNsb3NlJztcclxuICBjbG9zZUJ0bi50aXRsZSA9ICdDbG9zZSc7XHJcbiAgY2xvc2VCdG4udGV4dENvbnRlbnQgPSAnXHUyNzE1JztcclxuICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHBhbmVsLnJlbW92ZSgpKTtcclxuXHJcbiAgaGVhZGVyLmFwcGVuZCh0aXRsZUVsLCBjbG9zZUJ0bik7XHJcblxyXG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBib2R5LmNsYXNzTmFtZSA9ICdkY2F0LWJvZHknO1xyXG5cclxuICBwYW5lbC5hcHBlbmQoaGVhZGVyLCBib2R5KTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBhbmVsKTtcclxuICBtYWtlRHJhZ2dhYmxlKHBhbmVsLCBoZWFkZXIsIGNsb3NlQnRuKTtcclxuXHJcbiAgcmV0dXJuIHsgcGFuZWwsIGhlYWRlciwgY2xvc2VCdG4sIGJvZHkgfTtcclxufVxyXG4iLCAiLy8gSW5qZWN0ZWQgaW50byBDUk0gZm9ybSBmcmFtZXMgdmlhIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdC5cclxuLy8gUmVhZHMgYWxsIFhybSBhdHRyaWJ1dGVzIGFuZCByZW5kZXJzIGEgc2lkZS1wYW5lbCB3aXRoIGEgc29ydGFibGUgdGFibGUuXHJcblxyXG5pbXBvcnQgeyBidWlsZExhYmVsTWFwIH0gZnJvbSAnLi4vc2hhcmVkJztcclxuaW1wb3J0IHsgY3JlYXRlUGFuZWxTaGVsbCwgY3JlYXRlU2VhcmNoQmFyLCBjcmVhdGVDb3B5U3BhbiwgaXNvbGF0ZUtleWJvYXJkIH0gZnJvbSAnLi4vcGFuZWwnO1xyXG5cclxuY29uc3QgUEFORUxfSUQgPSAnY3JtLXRvb2xzLWZpZWxkcy1wYW5lbCc7XHJcbmNvbnN0IFNUWUxFX0lEID0gJ2NybS10b29scy1maWVsZHMtc3R5bGUnO1xyXG5cclxuY29uc3QgRVhUUkFfQ1NTID0gYFxyXG4jJHtQQU5FTF9JRH0gLmNmcC1yZWZyZXNoIHtcclxuICBiYWNrZ3JvdW5kOiBub25lOyBib3JkZXI6IG5vbmU7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE2cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDE7IGN1cnNvcjogcG9pbnRlcjsgcGFkZGluZzogMCAycHg7IG9wYWNpdHk6IDAuODU7IG1hcmdpbi1yaWdodDogNHB4O1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY2ZwLXJlZnJlc2g6aG92ZXIgeyBvcGFjaXR5OiAxOyB9XHJcbiMke1BBTkVMX0lEfSAuY2ZwLXJlZnJlc2g6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjU7IGN1cnNvcjogZGVmYXVsdDsgfVxyXG5Aa2V5ZnJhbWVzIGNmcC1zcGluIHsgdG8geyB0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyB9IH1cclxuIyR7UEFORUxfSUR9IC5jZnAtcmVmcmVzaC5jZnAtc3Bpbm5pbmcgeyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGFuaW1hdGlvbjogY2ZwLXNwaW4gMC44cyBsaW5lYXIgaW5maW5pdGU7IH1cclxuIyR7UEFORUxfSUR9IHRhYmxlIHsgd2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IH1cclxuIyR7UEFORUxfSUR9IHRoZWFkIHRoIHtcclxuICBwb3NpdGlvbjogc3RpY2t5OyB0b3A6IDA7IGJhY2tncm91bmQ6ICNmMGY0ZmY7XHJcbiAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICMxZTY0Yzg7IHBhZGRpbmc6IDdweCAxMHB4OyB0ZXh0LWFsaWduOiBsZWZ0O1xyXG4gIGZvbnQtc2l6ZTogMTFweDsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcclxuICBsZXR0ZXItc3BhY2luZzogMC40cHg7IGNvbG9yOiAjNDQ0OyB3aGl0ZS1zcGFjZTogbm93cmFwO1xyXG59XHJcbiMke1BBTkVMX0lEfSB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbikgeyBiYWNrZ3JvdW5kOiAjZjhmOWZmOyB9XHJcbiMke1BBTkVMX0lEfSB0Ym9keSB0cjpob3ZlciB7IGJhY2tncm91bmQ6ICNkY2VhZmU7IH1cclxuIyR7UEFORUxfSUR9IHRkIHtcclxuICBwYWRkaW5nOiA1cHggMTBweDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlOGU4ZTg7IHZlcnRpY2FsLWFsaWduOiB0b3A7XHJcbn1cclxuIyR7UEFORUxfSUR9IHRkOm50aC1jaGlsZCgxKSwgIyR7UEFORUxfSUR9IHRoOm50aC1jaGlsZCgxKSB7IHdoaXRlLXNwYWNlOiBub3dyYXA7IH1cclxuIyR7UEFORUxfSUR9IHRkOm50aC1jaGlsZCgyKSwgIyR7UEFORUxfSUR9IHRoOm50aC1jaGlsZCgyKSB7IHdoaXRlLXNwYWNlOiBub3dyYXA7IH1cclxuIyR7UEFORUxfSUR9IHRkOm50aC1jaGlsZCgzKSwgIyR7UEFORUxfSUR9IHRoOm50aC1jaGlsZCgzKSB7IHdoaXRlLXNwYWNlOiBub3dyYXA7IH1cclxuIyR7UEFORUxfSUR9IHRkOm50aC1jaGlsZCg0KSwgIyR7UEFORUxfSUR9IHRoOm50aC1jaGlsZCg0KSB7IG1pbi13aWR0aDogMTgwcHg7IG1heC13aWR0aDogMzYwcHg7IHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7IH1cclxuIyR7UEFORUxfSUR9IHRkOm50aC1jaGlsZCgyKSB7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBtb25vc3BhY2U7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM1NTU7XHJcbn1cclxuIyR7UEFORUxfSUR9IC5jZnAtdHlwZSB7XHJcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiAxcHggNnB4OyBib3JkZXItcmFkaXVzOiAxMHB4O1xyXG4gIGZvbnQtc2l6ZTogMTFweDsgYmFja2dyb3VuZDogI2U4ZThlODsgY29sb3I6ICM0NDQ7XHJcbn1cclxuIyR7UEFORUxfSUR9IC5jZnAtbnVsbCB7IGNvbG9yOiAjYWFhOyBmb250LXN0eWxlOiBpdGFsaWM7IH1cclxuYDtcclxuXHJcbmZ1bmN0aW9uIG1haW4oKTogdm9pZCB7XHJcbiAgLy8gWHJtIGlzIG9ubHkgYXZhaWxhYmxlIGluIHRoZSBDUk0gZm9ybSBpZnJhbWUgXHUyMDE0IHNpbGVudGx5IHNraXAgb3RoZXIgZnJhbWVzXHJcbiAgaWYgKHR5cGVvZiBYcm0gPT09ICd1bmRlZmluZWQnIHx8ICFYcm0uUGFnZSB8fCAhWHJtLlBhZ2UudWkgfHwgIVhybS5QYWdlLmRhdGEpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNoZWxsID0gY3JlYXRlUGFuZWxTaGVsbCh7XHJcbiAgICBwYW5lbElkOiBQQU5FTF9JRCxcclxuICAgIHN0eWxlSWQ6IFNUWUxFX0lELFxyXG4gICAgdGl0bGU6ICdcdUQ4M0RcdURDQ0IgQWxsIEZpZWxkcycsXHJcbiAgICBleHRyYUNzczogRVhUUkFfQ1NTLFxyXG4gIH0pO1xyXG4gIGlmICghc2hlbGwpIHJldHVybjsgLy8gdG9nZ2xlZCBvZmZcclxuXHJcbiAgY29uc3QgeyBwYW5lbCwgaGVhZGVyLCBjbG9zZUJ0biwgYm9keSB9ID0gc2hlbGw7XHJcblxyXG4gIC8vIFJlZnJlc2ggYnV0dG9uIFx1MjAxNCBpbnNlcnRlZCBiZWZvcmUgY2xvc2VcclxuICBjb25zdCByZWZyZXNoQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgcmVmcmVzaEJ0bi5jbGFzc05hbWUgPSAnY2ZwLXJlZnJlc2gnO1xyXG4gIHJlZnJlc2hCdG4udGl0bGUgPSAnUmVmcmVzaCBmb3JtIGRhdGEnO1xyXG4gIHJlZnJlc2hCdG4udGV4dENvbnRlbnQgPSAnXHUyMUJCJztcclxuICBoZWFkZXIuaW5zZXJ0QmVmb3JlKHJlZnJlc2hCdG4sIGNsb3NlQnRuKTtcclxuXHJcbiAgLy8gRW50aXR5IGluZm8gc3ViaGVhZGVyXHJcbiAgY29uc3QgZW50aXR5TmFtZSA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmdldEVudGl0eU5hbWUoKTtcclxuICBjb25zdCBlbnRpdHlJZCAgID0gWHJtLlBhZ2UuZGF0YS5lbnRpdHkuZ2V0SWQoKTtcclxuICBjb25zdCBzdWJoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBzdWJoZWFkZXIuY2xhc3NOYW1lID0gJ2RjYXQtc3ViaGVhZGVyJztcclxuICBzdWJoZWFkZXIuYXBwZW5kKCdFbnRpdHk6ICcpO1xyXG4gIHN1YmhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVDb3B5U3BhbihlbnRpdHlOYW1lLCBlbnRpdHlOYW1lKSk7XHJcbiAgc3ViaGVhZGVyLmFwcGVuZCgnICB8ICBJRDogJyk7XHJcbiAgaWYgKGVudGl0eUlkKSB7XHJcbiAgICBjb25zdCBjbGVhbklkID0gZW50aXR5SWQucmVwbGFjZSgvXlxce3xcXH0kL2csICcnKTtcclxuICAgIHN1YmhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVDb3B5U3BhbihlbnRpdHlJZCwgY2xlYW5JZCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdWJoZWFkZXIuYXBwZW5kKCcobmV3IHJlY29yZCknKTtcclxuICB9XHJcbiAgcGFuZWwuaW5zZXJ0QmVmb3JlKHN1YmhlYWRlciwgYm9keSk7XHJcblxyXG4gIC8vIFRhYmxlXHJcbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpO1xyXG4gIGNvbnN0IHRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKTtcclxuICB0aGVhZC5pbm5lckhUTUwgPSAnPHRyPjx0aD5MYWJlbDwvdGg+PHRoPlNjaGVtYSBOYW1lPC90aD48dGg+VHlwZTwvdGg+PHRoPlZhbHVlPC90aD48L3RyPic7XHJcbiAgdGFibGUuYXBwZW5kQ2hpbGQodGhlYWQpO1xyXG4gIGNvbnN0IHRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGJvZHknKTtcclxuICB0YWJsZS5hcHBlbmRDaGlsZCh0Ym9keSk7XHJcblxyXG4gIGNvbnN0IG5vUmVzdWx0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIG5vUmVzdWx0cy5jbGFzc05hbWUgPSAnZGNhdC1uby1yZXN1bHRzJztcclxuICBub1Jlc3VsdHMudGV4dENvbnRlbnQgPSAnTm8gbWF0Y2hpbmcgZmllbGRzLic7XHJcbiAgbm9SZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gIC8vIFNlYXJjaCBiYXJcclxuICBjb25zdCBmaWx0ZXJSb3dzID0gKHE6IHN0cmluZykgPT4ge1xyXG4gICAgbGV0IHZpc2libGUgPSAwO1xyXG4gICAgdGJvZHkucXVlcnlTZWxlY3RvckFsbDxIVE1MVGFibGVSb3dFbGVtZW50PigndHInKS5mb3JFYWNoKChyb3cpID0+IHtcclxuICAgICAgY29uc3QgbWF0Y2ggPSAhcVxyXG4gICAgICAgIHx8IHJvdy5kYXRhc2V0LnNlYXJjaExhYmVsIS5pbmNsdWRlcyhxKVxyXG4gICAgICAgIHx8IHJvdy5kYXRhc2V0LnNlYXJjaFNjaGVtYSEuaW5jbHVkZXMocSlcclxuICAgICAgICB8fCByb3cuZGF0YXNldC5zZWFyY2hWYWx1ZSEuaW5jbHVkZXMocSk7XHJcbiAgICAgIHJvdy5zdHlsZS5kaXNwbGF5ID0gbWF0Y2ggPyAnJyA6ICdub25lJztcclxuICAgICAgaWYgKG1hdGNoKSB2aXNpYmxlKys7XHJcbiAgICB9KTtcclxuICAgIG5vUmVzdWx0cy5zdHlsZS5kaXNwbGF5ID0gdmlzaWJsZSA9PT0gMCA/ICcnIDogJ25vbmUnO1xyXG4gIH07XHJcbiAgY29uc3Qgc2VhcmNoID0gY3JlYXRlU2VhcmNoQmFyKHtcclxuICAgIHBsYWNlaG9sZGVyOiAnU2VhcmNoIGJ5IGxhYmVsLCBzY2hlbWEgbmFtZSBvciB2YWx1ZVx1MjAyNicsXHJcbiAgICBvbkZpbHRlcjogZmlsdGVyUm93cyxcclxuICB9KTtcclxuICBpc29sYXRlS2V5Ym9hcmQoc2VhcmNoLmlucHV0KTtcclxuICBwYW5lbC5pbnNlcnRCZWZvcmUoc2VhcmNoLmNvbnRhaW5lciwgYm9keSk7XHJcblxyXG4gIC8vIEluaXRpYWwgZGF0YVxyXG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBYcm0uUGFnZS5kYXRhLmVudGl0eS5hdHRyaWJ1dGVzLmdldCgpO1xyXG4gIGNvbnN0IGxhYmVsTWFwICAgPSBidWlsZExhYmVsTWFwKCk7XHJcbiAgcG9wdWxhdGVUYm9keSh0Ym9keSwgYXR0cmlidXRlcywgbGFiZWxNYXApO1xyXG5cclxuICAvLyBSZWZyZXNoIGhhbmRsZXJcclxuICByZWZyZXNoQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICByZWZyZXNoQnRuLmNsYXNzTGlzdC5hZGQoJ2NmcC1zcGlubmluZycpO1xyXG4gICAgWHJtLlBhZ2UuZGF0YS5yZWZyZXNoKGZhbHNlKS50aGVuKFxyXG4gICAgICAoKSA9PiB7XHJcbiAgICAgICAgcG9wdWxhdGVUYm9keSh0Ym9keSwgWHJtLlBhZ2UuZGF0YS5lbnRpdHkuYXR0cmlidXRlcy5nZXQoKSwgYnVpbGRMYWJlbE1hcCgpKTtcclxuICAgICAgICBzZWFyY2gudHJpZ2dlckZpbHRlcigpO1xyXG4gICAgICAgIHJlZnJlc2hCdG4uY2xhc3NMaXN0LnJlbW92ZSgnY2ZwLXNwaW5uaW5nJyk7XHJcbiAgICAgICAgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICAoZXJyOiB1bmtub3duKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignW0R5bmFtaWNzQ2F0XSBSZWZyZXNoIGZhaWxlZDonLCBlcnIpO1xyXG4gICAgICAgIHJlZnJlc2hCdG4uY2xhc3NMaXN0LnJlbW92ZSgnY2ZwLXNwaW5uaW5nJyk7XHJcbiAgICAgICAgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgKTtcclxuICB9KTtcclxuXHJcbiAgYm9keS5hcHBlbmRDaGlsZCh0YWJsZSk7XHJcbiAgYm9keS5hcHBlbmRDaGlsZChub1Jlc3VsdHMpO1xyXG5cclxuICAvLyBTaXplIHRoZSBwYW5lbCB0byBmaXQgdGhlIHRhYmxlJ3MgbmF0dXJhbCB3aWR0aFxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCB0YWJsZVdpZHRoID0gdGFibGUub2Zmc2V0V2lkdGg7XHJcbiAgICBwYW5lbC5zdHlsZS53aWR0aCA9IE1hdGgubWluKE1hdGgubWF4KHRhYmxlV2lkdGgsIDQyMCksIHdpbmRvdy5pbm5lcldpZHRoICogMC45KSArICdweCc7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGF0dHI6IFhybS5BdHRyaWJ1dGVzLkF0dHJpYnV0ZSk6IHN0cmluZyB8IG51bGwge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB2YWwgPSBhdHRyLmdldFZhbHVlKCkgYXMgdW5rbm93bjtcclxuICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHJldHVybiBudWxsO1xyXG5cclxuICAgIGNvbnN0IHR5cGUgPSBhdHRyLmdldEF0dHJpYnV0ZVR5cGUgPyBhdHRyLmdldEF0dHJpYnV0ZVR5cGUoKSA6IHR5cGVvZiB2YWw7XHJcblxyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgIGNhc2UgJ2xvb2t1cCc6IHtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsKSkgcmV0dXJuIFN0cmluZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiAodmFsIGFzIFhybS5Mb29rdXBWYWx1ZVtdKS5tYXAoKHYpID0+IHYubmFtZSB8fCB2LmlkKS5qb2luKCcsICcpO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ29wdGlvbnNldCc6XHJcbiAgICAgIGNhc2UgJ211bHRpc2VsZWN0b3B0aW9uc2V0Jzoge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSAoYXR0ciBhcyBYcm0uQXR0cmlidXRlcy5PcHRpb25TZXRBdHRyaWJ1dGUpLmdldFRleHQ/LigpO1xyXG4gICAgICAgIHJldHVybiB0ZXh0ICE9IG51bGwgPyBTdHJpbmcodGV4dCkgOiBTdHJpbmcodmFsKTtcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdkYXRldGltZSc6IHtcclxuICAgICAgICByZXR1cm4gdmFsIGluc3RhbmNlb2YgRGF0ZSA/IHZhbC50b0xvY2FsZVN0cmluZygpIDogU3RyaW5nKHZhbCk7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnYm9vbGVhbic6IHtcclxuICAgICAgICByZXR1cm4gdmFsID8gJ1llcycgOiAnTm8nO1xyXG4gICAgICB9XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIFN0cmluZyh2YWwpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuICcoZXJyb3IgcmVhZGluZyB2YWx1ZSknO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcG9wdWxhdGVUYm9keShcclxuICB0Ym9keTogSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQsXHJcbiAgYXR0cmlidXRlczogWHJtLkF0dHJpYnV0ZXMuQXR0cmlidXRlW10sXHJcbiAgbGFiZWxNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXHJcbik6IHZvaWQge1xyXG4gIHRib2R5LmlubmVySFRNTCA9ICcnO1xyXG4gIGNvbnN0IHNvcnRlZEF0dHJzID0gWy4uLmF0dHJpYnV0ZXNdLnNvcnQoKGEsIGIpID0+IHtcclxuICAgIGNvbnN0IGxhID0gKGxhYmVsTWFwW2EuZ2V0TmFtZSgpXSB8fCBhLmdldE5hbWUoKSkudG9Mb3dlckNhc2UoKTtcclxuICAgIGNvbnN0IGxiID0gKGxhYmVsTWFwW2IuZ2V0TmFtZSgpXSB8fCBiLmdldE5hbWUoKSkudG9Mb3dlckNhc2UoKTtcclxuICAgIHJldHVybiBsYS5sb2NhbGVDb21wYXJlKGxiKTtcclxuICB9KTtcclxuICBzb3J0ZWRBdHRycy5mb3JFYWNoKChhdHRyKSA9PiB7XHJcbiAgICBjb25zdCBuYW1lICAgICA9IGF0dHIuZ2V0TmFtZSgpO1xyXG4gICAgY29uc3QgbGFiZWwgICAgPSBsYWJlbE1hcFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgY29uc3QgdHlwZSAgICAgPSBhdHRyLmdldEF0dHJpYnV0ZVR5cGUgPyBhdHRyLmdldEF0dHJpYnV0ZVR5cGUoKSA6ICdcdTIwMTQnO1xyXG4gICAgY29uc3QgcmF3VmFsdWUgPSBmb3JtYXRWYWx1ZShhdHRyKTtcclxuXHJcbiAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XHJcblxyXG4gICAgY29uc3QgdGRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICB0ZExhYmVsLnRleHRDb250ZW50ID0gbGFiZWw7XHJcblxyXG4gICAgY29uc3QgdGRTY2hlbWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgdGRTY2hlbWEudGV4dENvbnRlbnQgPSBuYW1lO1xyXG5cclxuICAgIGNvbnN0IHRkVHlwZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICBjb25zdCB0eXBlQmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0eXBlQmFkZ2UuY2xhc3NOYW1lID0gJ2NmcC10eXBlJztcclxuICAgIHR5cGVCYWRnZS50ZXh0Q29udGVudCA9IHR5cGU7XHJcbiAgICB0ZFR5cGUuYXBwZW5kQ2hpbGQodHlwZUJhZGdlKTtcclxuXHJcbiAgICBjb25zdCB0ZFZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIGlmIChyYXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICBjb25zdCBudWxsU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgbnVsbFNwYW4uY2xhc3NOYW1lID0gJ2NmcC1udWxsJztcclxuICAgICAgbnVsbFNwYW4udGV4dENvbnRlbnQgPSAnbnVsbCc7XHJcbiAgICAgIHRkVmFsdWUuYXBwZW5kQ2hpbGQobnVsbFNwYW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGRWYWx1ZS50ZXh0Q29udGVudCA9IHJhd1ZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRyLmRhdGFzZXQuc2VhcmNoTGFiZWwgID0gbGFiZWwudG9Mb3dlckNhc2UoKTtcclxuICAgIHRyLmRhdGFzZXQuc2VhcmNoU2NoZW1hID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgdHIuZGF0YXNldC5zZWFyY2hWYWx1ZSAgPSAocmF3VmFsdWUgPz8gJ251bGwnKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRMYWJlbCk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZFNjaGVtYSk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZFR5cGUpO1xyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRWYWx1ZSk7XHJcbiAgICB0Ym9keS5hcHBlbmRDaGlsZCh0cik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbm1haW4oKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBR08sV0FBUyxTQUE4QixJQUEwQixJQUFrQztBQUN4RyxRQUFJO0FBQ0osV0FBTyxJQUFJLFNBQVk7QUFDckIsbUJBQWEsS0FBSztBQUNsQixjQUFRLFdBQVcsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFF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
