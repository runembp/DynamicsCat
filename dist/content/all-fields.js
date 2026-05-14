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
       max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: visible;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hhcmVkLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L3BhbmVsLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L2FsbC1maWVsZHMvYWxsLWZpZWxkcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gU2hhcmVkIHV0aWxpdGllcyBmb3IgRHluYW1pY3NDYXQgY29udGVudCBzY3JpcHRzLlxyXG4vLyBCdW5kbGVkIGlubGluZSBpbnRvIGVhY2ggc2NyaXB0IGJ5IGVzYnVpbGQgXHUyMDE0IG5vIHNlcGFyYXRlIG91dHB1dCBmaWxlIG5lZWRlZC5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWJvdW5jZTxUIGV4dGVuZHMgdW5rbm93bltdPihmbjogKC4uLmFyZ3M6IFQpID0+IHZvaWQsIG1zOiBudW1iZXIpOiAoLi4uYXJnczogVCkgPT4gdm9pZCB7XHJcbiAgbGV0IHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PjtcclxuICByZXR1cm4gKC4uLmFyZ3M6IFQpID0+IHtcclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gZm4oLi4uYXJncyksIG1zKTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRMYWJlbE1hcCgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcclxuICBjb25zdCBsYWJlbE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xyXG4gIFhybS5QYWdlLnVpLmNvbnRyb2xzLmZvckVhY2goKGN0cmwpID0+IHtcclxuICAgIGNvbnN0IG5hbWUgPSBjdHJsLmdldE5hbWUoKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbGFiZWxNYXBbbmFtZV0gPSAoY3RybCBhcyBYcm0uQ29udHJvbHMuU3RhbmRhcmRDb250cm9sKS5nZXRMYWJlbCgpIHx8IG5hbWU7XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGxhYmVsTWFwW25hbWVdID0gbmFtZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBsYWJlbE1hcDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VEcmFnZ2FibGUocGFuZWw6IEhUTUxFbGVtZW50LCBoYW5kbGU6IEhUTUxFbGVtZW50LCBjbG9zZUJ0bjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgY29uc3QgcmVjdCA9IHBhbmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgcGFuZWwuc3R5bGUubGVmdCAgICAgID0gcmVjdC5sZWZ0ICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnRvcCAgICAgICA9IHJlY3QudG9wICArICdweCc7XHJcbiAgICBwYW5lbC5zdHlsZS5yaWdodCAgICAgPSAnJztcclxuICAgIHBhbmVsLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xyXG4gIH0pO1xyXG5cclxuICBsZXQgZHJhZ2dpbmcgPSBmYWxzZTtcclxuICBsZXQgb2Zmc2V0WCA9IDA7XHJcbiAgbGV0IG9mZnNldFkgPSAwO1xyXG5cclxuICBjb25zdCBvbk1vdXNlTW92ZSA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAoIWRyYWdnaW5nKSByZXR1cm47XHJcbiAgICBjb25zdCB4ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZS5jbGllbnRYIC0gb2Zmc2V0WCwgd2luZG93LmlubmVyV2lkdGggIC0gcGFuZWwub2Zmc2V0V2lkdGgpKTtcclxuICAgIGNvbnN0IHkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlLmNsaWVudFkgLSBvZmZzZXRZLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBwYW5lbC5vZmZzZXRIZWlnaHQpKTtcclxuICAgIHBhbmVsLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnRvcCAgPSB5ICsgJ3B4JztcclxuICB9O1xyXG5cclxuICBjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7IGRyYWdnaW5nID0gZmFsc2U7IGhhbmRsZS5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7IH07XHJcblxyXG4gIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xyXG4gICAgaWYgKGNsb3NlQnRuLmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSByZXR1cm47XHJcbiAgICBkcmFnZ2luZyA9IHRydWU7XHJcbiAgICBvZmZzZXRYICA9IGUuY2xpZW50WCAtIHBhbmVsLm9mZnNldExlZnQ7XHJcbiAgICBvZmZzZXRZICA9IGUuY2xpZW50WSAtIHBhbmVsLm9mZnNldFRvcDtcclxuICAgIGhhbmRsZS5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH0pO1xyXG5cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICAgb25Nb3VzZVVwKTtcclxuXHJcbiAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKF8sIG9icykgPT4ge1xyXG4gICAgaWYgKCFkb2N1bWVudC5jb250YWlucyhwYW5lbCkpIHtcclxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgICBvbk1vdXNlVXApO1xyXG4gICAgICBvYnMuZGlzY29ubmVjdCgpO1xyXG4gICAgfVxyXG4gIH0pLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4ZWNDb21tYW5kQ29weSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBjb25zdCB0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XHJcbiAgdGEudmFsdWUgPSB0ZXh0O1xyXG4gIHRhLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246Zml4ZWQ7b3BhY2l0eTowO3BvaW50ZXItZXZlbnRzOm5vbmUnO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGEpO1xyXG4gIHRhLnNlbGVjdCgpO1xyXG4gIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XHJcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb3B5VG9DbGlwYm9hcmQodGV4dDogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQ/LndyaXRlVGV4dCkge1xyXG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCkuY2F0Y2goKCkgPT4gZXhlY0NvbW1hbmRDb3B5KHRleHQpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgZXhlY0NvbW1hbmRDb3B5KHRleHQpO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgVE9BU1RfQ09OVEFJTkVSX0lEID0gJ2NybS10b29scy10b2FzdC1jb250YWluZXInO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dUb2FzdChtZXNzYWdlOiBzdHJpbmcsIHR5cGU6ICdpbmZvJyB8ICd3YXJuJyA9ICdpbmZvJyk6IHZvaWQge1xyXG4gIGxldCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChUT0FTVF9DT05UQUlORVJfSUQpO1xyXG4gIGlmICghY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGNvbnRhaW5lci5pZCA9IFRPQVNUX0NPTlRBSU5FUl9JRDtcclxuICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gW1xyXG4gICAgICAncG9zaXRpb246IGZpeGVkJywgJ2JvdHRvbTogMjRweCcsICdyaWdodDogMjRweCcsXHJcbiAgICAgICd6LWluZGV4OiAyMTQ3NDgzNjQ3JywgJ2Rpc3BsYXk6IGZsZXgnLCAnZmxleC1kaXJlY3Rpb246IGNvbHVtbicsICdnYXA6IDhweCcsXHJcbiAgICAgICdwb2ludGVyLWV2ZW50czogbm9uZScsXHJcbiAgICBdLmpvaW4oJzsgJyk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcbiAgfVxyXG5cclxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHRvYXN0LnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAnYmFja2dyb3VuZDogJyArICh0eXBlID09PSAnd2FybicgPyAnI2U2NTEwMCcgOiAnIzMyMzIzMicpLFxyXG4gICAgJ2NvbG9yOiAjZmZmJyxcclxuICAgICdmb250LWZhbWlseTogXCJHb29nbGUgU2Fuc1wiLCBSb2JvdG8sIFwiU2Vnb2UgVUlcIiwgQXJpYWwsIHNhbnMtc2VyaWYnLFxyXG4gICAgJ2ZvbnQtc2l6ZTogMTNweCcsXHJcbiAgICAncGFkZGluZzogMTBweCAxNnB4JyxcclxuICAgICdib3JkZXItcmFkaXVzOiA2cHgnLFxyXG4gICAgJ2JveC1zaGFkb3c6IDAgMnB4IDhweCByZ2JhKDAsMCwwLDAuMjUpJyxcclxuICAgICdwb2ludGVyLWV2ZW50czogYXV0bycsXHJcbiAgICAnb3BhY2l0eTogMScsXHJcbiAgICAndHJhbnNpdGlvbjogb3BhY2l0eSAwLjNzIGVhc2UnLFxyXG4gIF0uam9pbignOyAnKTtcclxuICB0b2FzdC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XHJcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRvYXN0KTtcclxuXHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICB0b2FzdC5zdHlsZS5vcGFjaXR5ID0gJzAnO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0b2FzdC5yZW1vdmUoKSwgMzUwKTtcclxuICB9LCAzNTAwKTtcclxufVxyXG4iLCAiLy8gU2hhcmVkIHBhbmVsIHNoZWxsIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIFByb3ZpZGVzIHRoZSBjb21tb24gY2hyb21lIChjb250YWluZXIsIGhlYWRlciwgY2xvc2UsIGRyYWcsIGtleWJvYXJkIGlzb2xhdGlvbilcclxuLy8gc28gZWFjaCBmZWF0dXJlIHNjcmlwdCBvbmx5IGJ1aWxkcyBpdHMgb3duIGJvZHkgY29udGVudC5cclxuXHJcbmltcG9ydCB7IGRlYm91bmNlLCBtYWtlRHJhZ2dhYmxlLCBjb3B5VG9DbGlwYm9hcmQgfSBmcm9tICcuL3NoYXJlZCc7XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgVHlwZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVsU2hlbGxDb25maWcge1xyXG4gIHBhbmVsSWQ6IHN0cmluZztcclxuICBzdHlsZUlkOiBzdHJpbmc7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICB2YXJpYW50PzogJ3NpZGViYXInIHwgJ2RpYWxvZyc7XHJcbiAgLyoqIEFkZGl0aW9uYWwgQ1NTIGFwcGVuZGVkIGFmdGVyIHRoZSBiYXNlIHBhbmVsIHN0eWxlc2hlZXQuICovXHJcbiAgZXh0cmFDc3M/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZWxTaGVsbCB7XHJcbiAgcGFuZWw6IEhUTUxEaXZFbGVtZW50O1xyXG4gIGhlYWRlcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgY2xvc2VCdG46IEhUTUxCdXR0b25FbGVtZW50O1xyXG4gIGJvZHk6IEhUTUxEaXZFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaEJhciB7XHJcbiAgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICBpbnB1dDogSFRNTElucHV0RWxlbWVudDtcclxuICAvKiogUmUtcnVuIHRoZSBjdXJyZW50IGZpbHRlciAoZS5nLiBhZnRlciByZWZyZXNoaW5nIHRhYmxlIGRhdGEpLiAqL1xyXG4gIHRyaWdnZXJGaWx0ZXI6ICgpID0+IHZvaWQ7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5cclxuLyoqIElkZW1wb3RlbnQgc3R5bGUgaW5qZWN0aW9uIFx1MjAxNCBvbmx5IGluc2VydHMgb25jZSBwZXIgc3R5bGVJZC4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFN0eWxlc2hlZXQoc3R5bGVJZDogc3RyaW5nLCBjc3M6IHN0cmluZyk6IHZvaWQge1xyXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdHlsZUlkKSkgcmV0dXJuO1xyXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICBzdHlsZS5pZCA9IHN0eWxlSWQ7XHJcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBjc3M7XHJcbiAgKGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzdHlsZSk7XHJcbn1cclxuXHJcbi8qKiBQcmV2ZW50IHRoZSBDUk0gaG9zdCBwYWdlIGZyb20gc3dhbGxvd2luZyBrZXlib2FyZCBldmVudHMgaW5zaWRlIGluamVjdGVkIHBhbmVscy4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzb2xhdGVLZXlib2FyZChlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCkpO1xyXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCkpO1xyXG59XHJcblxyXG4vKiogQ2xpY2stdG8tY29weSBzcGFuIHdpdGggYnJpZWYgZmxhc2ggZmVlZGJhY2suICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb3B5U3BhbihkaXNwbGF5OiBzdHJpbmcsIGNvcHlWYWx1ZTogc3RyaW5nKTogSFRNTFNwYW5FbGVtZW50IHtcclxuICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHNwYW4uY2xhc3NOYW1lID0gJ2RjYXQtY29weS12YWwnO1xyXG4gIHNwYW4udGV4dENvbnRlbnQgPSBkaXNwbGF5O1xyXG4gIHNwYW4udGl0bGUgPSBgQ2xpY2sgdG8gY29weTogJHtjb3B5VmFsdWV9YDtcclxuICBzcGFuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgY29weVRvQ2xpcGJvYXJkKGNvcHlWYWx1ZSk7XHJcbiAgICBzcGFuLmNsYXNzTGlzdC5hZGQoJ2RjYXQtY29waWVkJyk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHNwYW4uY2xhc3NMaXN0LnJlbW92ZSgnZGNhdC1jb3BpZWQnKSwgMTIwMCk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHNwYW47XHJcbn1cclxuXHJcbi8qKiBDcmVhdGVzIGEgc2VhcmNoIGJhciB3aXRoIGRlYm91bmNlZCBmaWx0ZXIgY2FsbGJhY2suXHJcbiAqICBJbnNlcnQgdGhlIHJldHVybmVkIGNvbnRhaW5lciBpbnRvIHRoZSBwYW5lbCBiZXR3ZWVuIGhlYWRlci9zdWJoZWFkZXIgYW5kIGJvZHkuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWFyY2hCYXIob3B0czoge1xyXG4gIHBsYWNlaG9sZGVyOiBzdHJpbmc7XHJcbiAgb25GaWx0ZXI6IChxdWVyeTogc3RyaW5nKSA9PiB2b2lkO1xyXG4gIGRlYm91bmNlTXM/OiBudW1iZXI7XHJcbn0pOiBTZWFyY2hCYXIge1xyXG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSAnZGNhdC1zZWFyY2gnO1xyXG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICBpbnB1dC50eXBlID0gJ3NlYXJjaCc7XHJcbiAgaW5wdXQucGxhY2Vob2xkZXIgPSBvcHRzLnBsYWNlaG9sZGVyO1xyXG4gIGlzb2xhdGVLZXlib2FyZChpbnB1dCk7XHJcblxyXG4gIGNvbnN0IGhhbmRsZXIgPSBkZWJvdW5jZSgoKSA9PiB7XHJcbiAgICBvcHRzLm9uRmlsdGVyKGlucHV0LnZhbHVlLnRvTG93ZXJDYXNlKCkudHJpbSgpKTtcclxuICB9LCBvcHRzLmRlYm91bmNlTXMgPz8gMTAwKTtcclxuXHJcbiAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBoYW5kbGVyKTtcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY29udGFpbmVyLFxyXG4gICAgaW5wdXQsXHJcbiAgICB0cmlnZ2VyRmlsdGVyOiAoKSA9PiBpbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnKSksXHJcbiAgfTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIEJhc2UgQ1NTIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG5cclxuZnVuY3Rpb24gYmFzZUNzcyhpZDogc3RyaW5nLCB2YXJpYW50OiAnc2lkZWJhcicgfCAnZGlhbG9nJyk6IHN0cmluZyB7XHJcbiAgY29uc3QgY29udGFpbmVyQ3NzID0gdmFyaWFudCA9PT0gJ2RpYWxvZydcclxuICAgID8gYHBvc2l0aW9uOiBmaXhlZDsgdG9wOiA1MCU7IGxlZnQ6IDUwJTsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7IHdpZHRoOiAzODBweDtcclxuICAgICAgIG1heC1oZWlnaHQ6IDkwdmg7XHJcbiAgICAgICBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDJweCBzb2xpZCAjMWU2NGM4OyBib3JkZXItcmFkaXVzOiA4cHg7XHJcbiAgICAgICBib3gtc2hhZG93OiAwIDRweCAyNHB4IHJnYmEoMCwwLDAsMC4yKTtcclxuICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7IG92ZXJmbG93OiB2aXNpYmxlO1xyXG4gICAgICAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzIyMjtgXHJcbiAgICA6IGBwb3NpdGlvbjogZml4ZWQ7IHRvcDogMDsgcmlnaHQ6IDA7IHdpZHRoOiBhdXRvOyBtaW4td2lkdGg6IDU1MHB4OyBtYXgtd2lkdGg6IDkwdnc7IG1heC1oZWlnaHQ6IDkwdmg7XHJcbiAgICAgICBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDJweCBzb2xpZCAjMWU2NGM4O1xyXG4gICAgICAgYm94LXNoYWRvdzogLTRweCAwIDE2cHggcmdiYSgwLDAsMCwwLjE4KTtcclxuICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICAgICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjMjIyO2A7XHJcblxyXG4gIGNvbnN0IGJvZHlDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcGFkZGluZzogMTRweDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxMHB4O2BcclxuICAgIDogYG92ZXJmbG93LXk6IGF1dG87IG92ZXJmbG93LXg6IGF1dG87IGZsZXg6IDE7YDtcclxuXHJcbiAgcmV0dXJuIGBcclxuIyR7aWR9IHsgJHtjb250YWluZXJDc3N9IH1cclxuIyR7aWR9IC5kY2F0LWhlYWRlciB7XHJcbiAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA2cHg7XHJcbiAgYmFja2dyb3VuZDogIzFlNjRjODsgY29sb3I6ICNmZmY7IHBhZGRpbmc6IDEwcHggMTRweDsgZmxleC1zaHJpbms6IDA7XHJcbiAgY3Vyc29yOiBtb3ZlOyB1c2VyLXNlbGVjdDogbm9uZTtcclxufVxyXG4jJHtpZH0gLmRjYXQtdGl0bGUgeyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGZsZXg6IDE7IH1cclxuIyR7aWR9IC5kY2F0LWNsb3NlIHtcclxuICBiYWNrZ3JvdW5kOiBub25lOyBib3JkZXI6IG5vbmU7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE4cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDE7IGN1cnNvcjogcG9pbnRlcjsgcGFkZGluZzogMCAycHg7IG9wYWNpdHk6IDAuODU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LWNsb3NlOmhvdmVyIHsgb3BhY2l0eTogMTsgfVxyXG4jJHtpZH0gLmRjYXQtYm9keSB7ICR7Ym9keUNzc30gfVxyXG4jJHtpZH0gLmRjYXQtc3ViaGVhZGVyIHtcclxuICBwYWRkaW5nOiA2cHggMTRweDsgYmFja2dyb3VuZDogI2U4ZjBmZTsgZm9udC1zaXplOiAxMnB4O1xyXG4gIGNvbG9yOiAjMWU2NGM4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M1ZDhmYjsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCB7XHJcbiAgcGFkZGluZzogOHB4IDE0cHg7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzVkOGZiOyBmbGV4LXNocmluazogMDtcclxufVxyXG4jJHtpZH0gLmRjYXQtc2VhcmNoIGlucHV0IHtcclxuICB3aWR0aDogMTAwJTsgYm94LXNpemluZzogYm9yZGVyLWJveDsgcGFkZGluZzogNXB4IDEwcHg7XHJcbiAgYm9yZGVyOiAxcHggc29saWQgI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogNHB4OyBmb250LXNpemU6IDEzcHg7XHJcbiAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgY29sb3I6ICMyMjI7IG91dGxpbmU6IG5vbmU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCBpbnB1dDpmb2N1cyB7IGJvcmRlci1jb2xvcjogIzFlNjRjODsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwge1xyXG4gIGN1cnNvcjogcG9pbnRlcjsgYm9yZGVyLWJvdHRvbTogMXB4IGRhc2hlZCAjMWU2NGM4OyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzO1xyXG59XHJcbiMke2lkfSAuZGNhdC1jb3B5LXZhbDpob3ZlciB7IGJhY2tncm91bmQ6ICNjNWQ4ZmI7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwuZGNhdC1jb3BpZWQgeyBiYWNrZ3JvdW5kOiAjYjdmMGM4OyBib3JkZXItYm90dG9tLWNvbG9yOiAjMmE5YzUyOyBib3JkZXItcmFkaXVzOiAzcHg7IH1cclxuIyR7aWR9IC5kY2F0LW5vLXJlc3VsdHMge1xyXG4gIHBhZGRpbmc6IDE2cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYztcclxufVxyXG5gO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgUGFuZWwgc2hlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgY29tbW9uIHBhbmVsIGNocm9tZSAodG9nZ2xlLCBzdHlsZSBpbmplY3Rpb24sIGhlYWRlciwgZHJhZywgY2xvc2UpLlxyXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgcGFuZWwgd2FzIHRvZ2dsZWQgT0ZGIChhbHJlYWR5IGV4aXN0ZWQgYW5kIHdhcyByZW1vdmVkKS5cclxuICogQ2FsbGVycyBwb3B1bGF0ZSB0aGUgcmV0dXJuZWQgYGJvZHlgIGVsZW1lbnQgd2l0aCBmZWF0dXJlLXNwZWNpZmljIGNvbnRlbnQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGFuZWxTaGVsbChjb25maWc6IFBhbmVsU2hlbGxDb25maWcpOiBQYW5lbFNoZWxsIHwgbnVsbCB7XHJcbiAgLy8gVG9nZ2xlOiByZW1vdmUgaWYgYWxyZWFkeSBwcmVzZW50XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb25maWcucGFuZWxJZCk7XHJcbiAgaWYgKGV4aXN0aW5nKSB7IGV4aXN0aW5nLnJlbW92ZSgpOyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICBjb25zdCB2YXJpYW50ID0gY29uZmlnLnZhcmlhbnQgPz8gJ3NpZGViYXInO1xyXG4gIGluamVjdFN0eWxlc2hlZXQoY29uZmlnLnN0eWxlSWQsIGJhc2VDc3MoY29uZmlnLnBhbmVsSWQsIHZhcmlhbnQpICsgKGNvbmZpZy5leHRyYUNzcyA/PyAnJykpO1xyXG5cclxuICBjb25zdCBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHBhbmVsLmlkID0gY29uZmlnLnBhbmVsSWQ7XHJcblxyXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGhlYWRlci5jbGFzc05hbWUgPSAnZGNhdC1oZWFkZXInO1xyXG5cclxuICBjb25zdCB0aXRsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHRpdGxlRWwuY2xhc3NOYW1lID0gJ2RjYXQtdGl0bGUnO1xyXG4gIHRpdGxlRWwudGV4dENvbnRlbnQgPSBjb25maWcudGl0bGU7XHJcblxyXG4gIGNvbnN0IGNsb3NlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgY2xvc2VCdG4uY2xhc3NOYW1lID0gJ2RjYXQtY2xvc2UnO1xyXG4gIGNsb3NlQnRuLnRpdGxlID0gJ0Nsb3NlJztcclxuICBjbG9zZUJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTUnO1xyXG4gIGNsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gcGFuZWwucmVtb3ZlKCkpO1xyXG5cclxuICBoZWFkZXIuYXBwZW5kKHRpdGxlRWwsIGNsb3NlQnRuKTtcclxuXHJcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGJvZHkuY2xhc3NOYW1lID0gJ2RjYXQtYm9keSc7XHJcblxyXG4gIHBhbmVsLmFwcGVuZChoZWFkZXIsIGJvZHkpO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFuZWwpO1xyXG4gIG1ha2VEcmFnZ2FibGUocGFuZWwsIGhlYWRlciwgY2xvc2VCdG4pO1xyXG5cclxuICByZXR1cm4geyBwYW5lbCwgaGVhZGVyLCBjbG9zZUJ0biwgYm9keSB9O1xyXG59XHJcbiIsICIvLyBJbmplY3RlZCBpbnRvIENSTSBmb3JtIGZyYW1lcyB2aWEgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0LlxyXG4vLyBSZWFkcyBhbGwgWHJtIGF0dHJpYnV0ZXMgYW5kIHJlbmRlcnMgYSBzaWRlLXBhbmVsIHdpdGggYSBzb3J0YWJsZSB0YWJsZS5cclxuXHJcbmltcG9ydCB7IGJ1aWxkTGFiZWxNYXAgfSBmcm9tICcuLi9zaGFyZWQnO1xyXG5pbXBvcnQgeyBjcmVhdGVQYW5lbFNoZWxsLCBjcmVhdGVTZWFyY2hCYXIsIGNyZWF0ZUNvcHlTcGFuLCBpc29sYXRlS2V5Ym9hcmQgfSBmcm9tICcuLi9wYW5lbCc7XHJcblxyXG5jb25zdCBQQU5FTF9JRCA9ICdjcm0tdG9vbHMtZmllbGRzLXBhbmVsJztcclxuY29uc3QgU1RZTEVfSUQgPSAnY3JtLXRvb2xzLWZpZWxkcy1zdHlsZSc7XHJcblxyXG5jb25zdCBFWFRSQV9DU1MgPSBgXHJcbiMke1BBTkVMX0lEfSAuY2ZwLXJlZnJlc2gge1xyXG4gIGJhY2tncm91bmQ6IG5vbmU7IGJvcmRlcjogbm9uZTsgY29sb3I6ICNmZmY7IGZvbnQtc2l6ZTogMTZweDtcclxuICBsaW5lLWhlaWdodDogMTsgY3Vyc29yOiBwb2ludGVyOyBwYWRkaW5nOiAwIDJweDsgb3BhY2l0eTogMC44NTsgbWFyZ2luLXJpZ2h0OiA0cHg7XHJcbn1cclxuIyR7UEFORUxfSUR9IC5jZnAtcmVmcmVzaDpob3ZlciB7IG9wYWNpdHk6IDE7IH1cclxuIyR7UEFORUxfSUR9IC5jZnAtcmVmcmVzaDpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNTsgY3Vyc29yOiBkZWZhdWx0OyB9XHJcbkBrZXlmcmFtZXMgY2ZwLXNwaW4geyB0byB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfVxyXG4jJHtQQU5FTF9JRH0gLmNmcC1yZWZyZXNoLmNmcC1zcGlubmluZyB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgYW5pbWF0aW9uOiBjZnAtc3BpbiAwLjhzIGxpbmVhciBpbmZpbml0ZTsgfVxyXG4jJHtQQU5FTF9JRH0gdGFibGUgeyB3aWR0aDogMTAwJTsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgfVxyXG4jJHtQQU5FTF9JRH0gdGhlYWQgdGgge1xyXG4gIHBvc2l0aW9uOiBzdGlja3k7IHRvcDogMDsgYmFja2dyb3VuZDogI2YwZjRmZjtcclxuICBib3JkZXItYm90dG9tOiAycHggc29saWQgIzFlNjRjODsgcGFkZGluZzogN3B4IDEwcHg7IHRleHQtYWxpZ246IGxlZnQ7XHJcbiAgZm9udC1zaXplOiAxMXB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gIGxldHRlci1zcGFjaW5nOiAwLjRweDsgY29sb3I6ICM0NDQ7IHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuIyR7UEFORUxfSUR9IHRib2R5IHRyOm50aC1jaGlsZChldmVuKSB7IGJhY2tncm91bmQ6ICNmOGY5ZmY7IH1cclxuIyR7UEFORUxfSUR9IHRib2R5IHRyOmhvdmVyIHsgYmFja2dyb3VuZDogI2RjZWFmZTsgfVxyXG4jJHtQQU5FTF9JRH0gdGQge1xyXG4gIHBhZGRpbmc6IDVweCAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZThlODsgdmVydGljYWwtYWxpZ246IHRvcDtcclxufVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDEpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDEpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDIpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDIpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDMpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDMpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDQpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDQpIHsgbWluLXdpZHRoOiAxODBweDsgbWF4LXdpZHRoOiAzNjBweDsgd29yZC1icmVhazogYnJlYWstd29yZDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDIpIHtcclxuICBmb250LWZhbWlseTogQ29uc29sYXMsIG1vbm9zcGFjZTsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzU1NTtcclxufVxyXG4jJHtQQU5FTF9JRH0gLmNmcC10eXBlIHtcclxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHBhZGRpbmc6IDFweCA2cHg7IGJvcmRlci1yYWRpdXM6IDEwcHg7XHJcbiAgZm9udC1zaXplOiAxMXB4OyBiYWNrZ3JvdW5kOiAjZThlOGU4OyBjb2xvcjogIzQ0NDtcclxufVxyXG4jJHtQQU5FTF9JRH0gLmNmcC1udWxsIHsgY29sb3I6ICNhYWE7IGZvbnQtc3R5bGU6IGl0YWxpYzsgfVxyXG5gO1xyXG5cclxuZnVuY3Rpb24gbWFpbigpOiB2b2lkIHtcclxuICAvLyBYcm0gaXMgb25seSBhdmFpbGFibGUgaW4gdGhlIENSTSBmb3JtIGlmcmFtZSBcdTIwMTQgc2lsZW50bHkgc2tpcCBvdGhlciBmcmFtZXNcclxuICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlIHx8ICFYcm0uUGFnZS51aSB8fCAhWHJtLlBhZ2UuZGF0YSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc2hlbGwgPSBjcmVhdGVQYW5lbFNoZWxsKHtcclxuICAgIHBhbmVsSWQ6IFBBTkVMX0lELFxyXG4gICAgc3R5bGVJZDogU1RZTEVfSUQsXHJcbiAgICB0aXRsZTogJ1x1RDgzRFx1RENDQiBBbGwgRmllbGRzJyxcclxuICAgIGV4dHJhQ3NzOiBFWFRSQV9DU1MsXHJcbiAgfSk7XHJcbiAgaWYgKCFzaGVsbCkgcmV0dXJuOyAvLyB0b2dnbGVkIG9mZlxyXG5cclxuICBjb25zdCB7IHBhbmVsLCBoZWFkZXIsIGNsb3NlQnRuLCBib2R5IH0gPSBzaGVsbDtcclxuXHJcbiAgLy8gUmVmcmVzaCBidXR0b24gXHUyMDE0IGluc2VydGVkIGJlZm9yZSBjbG9zZVxyXG4gIGNvbnN0IHJlZnJlc2hCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICByZWZyZXNoQnRuLmNsYXNzTmFtZSA9ICdjZnAtcmVmcmVzaCc7XHJcbiAgcmVmcmVzaEJ0bi50aXRsZSA9ICdSZWZyZXNoIGZvcm0gZGF0YSc7XHJcbiAgcmVmcmVzaEJ0bi50ZXh0Q29udGVudCA9ICdcdTIxQkInO1xyXG4gIGhlYWRlci5pbnNlcnRCZWZvcmUocmVmcmVzaEJ0biwgY2xvc2VCdG4pO1xyXG5cclxuICAvLyBFbnRpdHkgaW5mbyBzdWJoZWFkZXJcclxuICBjb25zdCBlbnRpdHlOYW1lID0gWHJtLlBhZ2UuZGF0YS5lbnRpdHkuZ2V0RW50aXR5TmFtZSgpO1xyXG4gIGNvbnN0IGVudGl0eUlkICAgPSBYcm0uUGFnZS5kYXRhLmVudGl0eS5nZXRJZCgpO1xyXG4gIGNvbnN0IHN1YmhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHN1YmhlYWRlci5jbGFzc05hbWUgPSAnZGNhdC1zdWJoZWFkZXInO1xyXG4gIHN1YmhlYWRlci5hcHBlbmQoJ0VudGl0eTogJyk7XHJcbiAgc3ViaGVhZGVyLmFwcGVuZENoaWxkKGNyZWF0ZUNvcHlTcGFuKGVudGl0eU5hbWUsIGVudGl0eU5hbWUpKTtcclxuICBzdWJoZWFkZXIuYXBwZW5kKCcgIHwgIElEOiAnKTtcclxuICBpZiAoZW50aXR5SWQpIHtcclxuICAgIGNvbnN0IGNsZWFuSWQgPSBlbnRpdHlJZC5yZXBsYWNlKC9eXFx7fFxcfSQvZywgJycpO1xyXG4gICAgc3ViaGVhZGVyLmFwcGVuZENoaWxkKGNyZWF0ZUNvcHlTcGFuKGVudGl0eUlkLCBjbGVhbklkKSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHN1YmhlYWRlci5hcHBlbmQoJyhuZXcgcmVjb3JkKScpO1xyXG4gIH1cclxuICBwYW5lbC5pbnNlcnRCZWZvcmUoc3ViaGVhZGVyLCBib2R5KTtcclxuXHJcbiAgLy8gVGFibGVcclxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XHJcbiAgY29uc3QgdGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpO1xyXG4gIHRoZWFkLmlubmVySFRNTCA9ICc8dHI+PHRoPkxhYmVsPC90aD48dGg+U2NoZW1hIE5hbWU8L3RoPjx0aD5UeXBlPC90aD48dGg+VmFsdWU8L3RoPjwvdHI+JztcclxuICB0YWJsZS5hcHBlbmRDaGlsZCh0aGVhZCk7XHJcbiAgY29uc3QgdGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xyXG4gIHRhYmxlLmFwcGVuZENoaWxkKHRib2R5KTtcclxuXHJcbiAgY29uc3Qgbm9SZXN1bHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgbm9SZXN1bHRzLmNsYXNzTmFtZSA9ICdkY2F0LW5vLXJlc3VsdHMnO1xyXG4gIG5vUmVzdWx0cy50ZXh0Q29udGVudCA9ICdObyBtYXRjaGluZyBmaWVsZHMuJztcclxuICBub1Jlc3VsdHMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgLy8gU2VhcmNoIGJhclxyXG4gIGNvbnN0IGZpbHRlclJvd3MgPSAocTogc3RyaW5nKSA9PiB7XHJcbiAgICBsZXQgdmlzaWJsZSA9IDA7XHJcbiAgICB0Ym9keS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUYWJsZVJvd0VsZW1lbnQ+KCd0cicpLmZvckVhY2goKHJvdykgPT4ge1xyXG4gICAgICBjb25zdCBtYXRjaCA9ICFxXHJcbiAgICAgICAgfHwgcm93LmRhdGFzZXQuc2VhcmNoTGFiZWwhLmluY2x1ZGVzKHEpXHJcbiAgICAgICAgfHwgcm93LmRhdGFzZXQuc2VhcmNoU2NoZW1hIS5pbmNsdWRlcyhxKVxyXG4gICAgICAgIHx8IHJvdy5kYXRhc2V0LnNlYXJjaFZhbHVlIS5pbmNsdWRlcyhxKTtcclxuICAgICAgcm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/ICcnIDogJ25vbmUnO1xyXG4gICAgICBpZiAobWF0Y2gpIHZpc2libGUrKztcclxuICAgIH0pO1xyXG4gICAgbm9SZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSB2aXNpYmxlID09PSAwID8gJycgOiAnbm9uZSc7XHJcbiAgfTtcclxuICBjb25zdCBzZWFyY2ggPSBjcmVhdGVTZWFyY2hCYXIoe1xyXG4gICAgcGxhY2Vob2xkZXI6ICdTZWFyY2ggYnkgbGFiZWwsIHNjaGVtYSBuYW1lIG9yIHZhbHVlXHUyMDI2JyxcclxuICAgIG9uRmlsdGVyOiBmaWx0ZXJSb3dzLFxyXG4gIH0pO1xyXG4gIGlzb2xhdGVLZXlib2FyZChzZWFyY2guaW5wdXQpO1xyXG4gIHBhbmVsLmluc2VydEJlZm9yZShzZWFyY2guY29udGFpbmVyLCBib2R5KTtcclxuXHJcbiAgLy8gSW5pdGlhbCBkYXRhXHJcbiAgY29uc3QgYXR0cmlidXRlcyA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmF0dHJpYnV0ZXMuZ2V0KCk7XHJcbiAgY29uc3QgbGFiZWxNYXAgICA9IGJ1aWxkTGFiZWxNYXAoKTtcclxuICBwb3B1bGF0ZVRib2R5KHRib2R5LCBhdHRyaWJ1dGVzLCBsYWJlbE1hcCk7XHJcblxyXG4gIC8vIFJlZnJlc2ggaGFuZGxlclxyXG4gIHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICByZWZyZXNoQnRuLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIHJlZnJlc2hCdG4uY2xhc3NMaXN0LmFkZCgnY2ZwLXNwaW5uaW5nJyk7XHJcbiAgICBYcm0uUGFnZS5kYXRhLnJlZnJlc2goZmFsc2UpLnRoZW4oXHJcbiAgICAgICgpID0+IHtcclxuICAgICAgICBwb3B1bGF0ZVRib2R5KHRib2R5LCBYcm0uUGFnZS5kYXRhLmVudGl0eS5hdHRyaWJ1dGVzLmdldCgpLCBidWlsZExhYmVsTWFwKCkpO1xyXG4gICAgICAgIHNlYXJjaC50cmlnZ2VyRmlsdGVyKCk7XHJcbiAgICAgICAgcmVmcmVzaEJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdjZnAtc3Bpbm5pbmcnKTtcclxuICAgICAgICByZWZyZXNoQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlcnI6IHVua25vd24pID0+IHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbRHluYW1pY3NDYXRdIFJlZnJlc2ggZmFpbGVkOicsIGVycik7XHJcbiAgICAgICAgcmVmcmVzaEJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdjZnAtc3Bpbm5pbmcnKTtcclxuICAgICAgICByZWZyZXNoQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICApO1xyXG4gIH0pO1xyXG5cclxuICBib2R5LmFwcGVuZENoaWxkKHRhYmxlKTtcclxuICBib2R5LmFwcGVuZENoaWxkKG5vUmVzdWx0cyk7XHJcblxyXG4gIC8vIFNpemUgdGhlIHBhbmVsIHRvIGZpdCB0aGUgdGFibGUncyBuYXR1cmFsIHdpZHRoXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgIGNvbnN0IHRhYmxlV2lkdGggPSB0YWJsZS5vZmZzZXRXaWR0aDtcclxuICAgIHBhbmVsLnN0eWxlLndpZHRoID0gTWF0aC5taW4oTWF0aC5tYXgodGFibGVXaWR0aCwgNDIwKSwgd2luZG93LmlubmVyV2lkdGggKiAwLjkpICsgJ3B4JztcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoYXR0cjogWHJtLkF0dHJpYnV0ZXMuQXR0cmlidXRlKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHZhbCA9IGF0dHIuZ2V0VmFsdWUoKSBhcyB1bmtub3duO1xyXG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgY29uc3QgdHlwZSA9IGF0dHIuZ2V0QXR0cmlidXRlVHlwZSA/IGF0dHIuZ2V0QXR0cmlidXRlVHlwZSgpIDogdHlwZW9mIHZhbDtcclxuXHJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgY2FzZSAnbG9va3VwJzoge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWwpKSByZXR1cm4gU3RyaW5nKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuICh2YWwgYXMgWHJtLkxvb2t1cFZhbHVlW10pLm1hcCgodikgPT4gdi5uYW1lIHx8IHYuaWQpLmpvaW4oJywgJyk7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnb3B0aW9uc2V0JzpcclxuICAgICAgY2FzZSAnbXVsdGlzZWxlY3RvcHRpb25zZXQnOiB7XHJcbiAgICAgICAgY29uc3QgdGV4dCA9IChhdHRyIGFzIFhybS5BdHRyaWJ1dGVzLk9wdGlvblNldEF0dHJpYnV0ZSkuZ2V0VGV4dD8uKCk7XHJcbiAgICAgICAgcmV0dXJuIHRleHQgIT0gbnVsbCA/IFN0cmluZyh0ZXh0KSA6IFN0cmluZyh2YWwpO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2RhdGV0aW1lJzoge1xyXG4gICAgICAgIHJldHVybiB2YWwgaW5zdGFuY2VvZiBEYXRlID8gdmFsLnRvTG9jYWxlU3RyaW5nKCkgOiBTdHJpbmcodmFsKTtcclxuICAgICAgfVxyXG4gICAgICBjYXNlICdib29sZWFuJzoge1xyXG4gICAgICAgIHJldHVybiB2YWwgPyAnWWVzJyA6ICdObyc7XHJcbiAgICAgIH1cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gU3RyaW5nKHZhbCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gJyhlcnJvciByZWFkaW5nIHZhbHVlKSc7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwb3B1bGF0ZVRib2R5KFxyXG4gIHRib2R5OiBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCxcclxuICBhdHRyaWJ1dGVzOiBYcm0uQXR0cmlidXRlcy5BdHRyaWJ1dGVbXSxcclxuICBsYWJlbE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcclxuKTogdm9pZCB7XHJcbiAgdGJvZHkuaW5uZXJIVE1MID0gJyc7XHJcbiAgY29uc3Qgc29ydGVkQXR0cnMgPSBbLi4uYXR0cmlidXRlc10uc29ydCgoYSwgYikgPT4ge1xyXG4gICAgY29uc3QgbGEgPSAobGFiZWxNYXBbYS5nZXROYW1lKCldIHx8IGEuZ2V0TmFtZSgpKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgY29uc3QgbGIgPSAobGFiZWxNYXBbYi5nZXROYW1lKCldIHx8IGIuZ2V0TmFtZSgpKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgcmV0dXJuIGxhLmxvY2FsZUNvbXBhcmUobGIpO1xyXG4gIH0pO1xyXG4gIHNvcnRlZEF0dHJzLmZvckVhY2goKGF0dHIpID0+IHtcclxuICAgIGNvbnN0IG5hbWUgICAgID0gYXR0ci5nZXROYW1lKCk7XHJcbiAgICBjb25zdCBsYWJlbCAgICA9IGxhYmVsTWFwW25hbWVdIHx8IG5hbWU7XHJcbiAgICBjb25zdCB0eXBlICAgICA9IGF0dHIuZ2V0QXR0cmlidXRlVHlwZSA/IGF0dHIuZ2V0QXR0cmlidXRlVHlwZSgpIDogJ1x1MjAxNCc7XHJcbiAgICBjb25zdCByYXdWYWx1ZSA9IGZvcm1hdFZhbHVlKGF0dHIpO1xyXG5cclxuICAgIGNvbnN0IHRyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuXHJcbiAgICBjb25zdCB0ZExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIHRkTGFiZWwudGV4dENvbnRlbnQgPSBsYWJlbDtcclxuXHJcbiAgICBjb25zdCB0ZFNjaGVtYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICB0ZFNjaGVtYS50ZXh0Q29udGVudCA9IG5hbWU7XHJcblxyXG4gICAgY29uc3QgdGRUeXBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIGNvbnN0IHR5cGVCYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHR5cGVCYWRnZS5jbGFzc05hbWUgPSAnY2ZwLXR5cGUnO1xyXG4gICAgdHlwZUJhZGdlLnRleHRDb250ZW50ID0gdHlwZTtcclxuICAgIHRkVHlwZS5hcHBlbmRDaGlsZCh0eXBlQmFkZ2UpO1xyXG5cclxuICAgIGNvbnN0IHRkVmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgaWYgKHJhd1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IG51bGxTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICBudWxsU3Bhbi5jbGFzc05hbWUgPSAnY2ZwLW51bGwnO1xyXG4gICAgICBudWxsU3Bhbi50ZXh0Q29udGVudCA9ICdudWxsJztcclxuICAgICAgdGRWYWx1ZS5hcHBlbmRDaGlsZChudWxsU3Bhbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0ZFZhbHVlLnRleHRDb250ZW50ID0gcmF3VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgdHIuZGF0YXNldC5zZWFyY2hMYWJlbCAgPSBsYWJlbC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgdHIuZGF0YXNldC5zZWFyY2hTY2hlbWEgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB0ci5kYXRhc2V0LnNlYXJjaFZhbHVlICA9IChyYXdWYWx1ZSA/PyAnbnVsbCcpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZExhYmVsKTtcclxuICAgIHRyLmFwcGVuZENoaWxkKHRkU2NoZW1hKTtcclxuICAgIHRyLmFwcGVuZENoaWxkKHRkVHlwZSk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZFZhbHVlKTtcclxuICAgIHRib2R5LmFwcGVuZENoaWxkKHRyKTtcclxuICB9KTtcclxufVxyXG5cclxubWFpbigpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFHTyxXQUFTLFNBQThCLElBQTBCLElBQWtDO0FBQ3hHLFFBQUk7QUFDSixXQUFPLElBQUksU0FBWTtBQUNyQixtQkFBYSxLQUFLO0FBQ2xCLGNBQVEsV0FBVyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUFBLElBQzFDO0FBQUEsRUFDRjtBQUVPLFdBQVMsZ0JBQXdDO0FBQ3RELFVBQU0sV0FBbUMsQ0FBQztBQUMxQyxRQUFJLEtBQUssR0FBRyxTQUFTLFFBQVEsQ0FBQyxTQUFTO0FBQ3JDLFlBQU0sT0FBTyxLQUFLLFFBQVE7QUFDMUIsVUFBSSxNQUFNO0FBQ1IsWUFBSTtBQUNGLG1CQUFTLElBQUksSUFBSyxLQUFzQyxTQUFTLEtBQUs7QUFBQSxRQUN4RSxRQUFRO0FBQ04sbUJBQVMsSUFBSSxJQUFJO0FBQUEsUUFDbkI7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFFTyxXQUFTLGNBQWMsT0FBb0IsUUFBcUIsVUFBNkI7QUFDbEcsMEJBQXNCLE1BQU07QUFDMUIsWUFBTSxPQUFPLE1BQU0sc0JBQXNCO0FBQ3pDLFlBQU0sTUFBTSxPQUFZLEtBQUssT0FBTztBQUNwQyxZQUFNLE1BQU0sTUFBWSxLQUFLLE1BQU87QUFDcEMsWUFBTSxNQUFNLFFBQVk7QUFDeEIsWUFBTSxNQUFNLFlBQVk7QUFBQSxJQUMxQixDQUFDO0FBRUQsUUFBSSxXQUFXO0FBQ2YsUUFBSSxVQUFVO0FBQ2QsUUFBSSxVQUFVO0FBRWQsVUFBTSxjQUFjLENBQUMsTUFBa0I7QUFDckMsVUFBSSxDQUFDLFNBQVU7QUFDZixZQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsVUFBVSxTQUFTLE9BQU8sYUFBYyxNQUFNLFdBQVcsQ0FBQztBQUMzRixZQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsVUFBVSxTQUFTLE9BQU8sY0FBYyxNQUFNLFlBQVksQ0FBQztBQUM1RixZQUFNLE1BQU0sT0FBTyxJQUFJO0FBQ3ZCLFlBQU0sTUFBTSxNQUFPLElBQUk7QUFBQSxJQUN6QjtBQUVBLFVBQU0sWUFBWSxNQUFNO0FBQUUsaUJBQVc7QUFBTyxhQUFPLE1BQU0sU0FBUztBQUFBLElBQVE7QUFFMUUsV0FBTyxpQkFBaUIsYUFBYSxDQUFDLE1BQU07QUFDMUMsVUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFjLEVBQUc7QUFDekMsaUJBQVc7QUFDWCxnQkFBVyxFQUFFLFVBQVUsTUFBTTtBQUM3QixnQkFBVyxFQUFFLFVBQVUsTUFBTTtBQUM3QixhQUFPLE1BQU0sU0FBUztBQUN0QixRQUFFLGVBQWU7QUFBQSxJQUNuQixDQUFDO0FBRUQsYUFBUyxpQkFBaUIsYUFBYSxXQUFXO0FBQ2xELGFBQVMsaUJBQWlCLFdBQWEsU0FBUztBQUVoRCxRQUFJLGlCQUFpQixDQUFDLEdBQUcsUUFBUTtBQUMvQixVQUFJLENBQUMsU0FBUyxTQUFTLEtBQUssR0FBRztBQUM3QixpQkFBUyxvQkFBb0IsYUFBYSxXQUFXO0FBQ3JELGlCQUFTLG9CQUFvQixXQUFhLFNBQVM7QUFDbkQsWUFBSSxXQUFXO0FBQUEsTUFDakI7QUFBQSxJQUNGLENBQUMsRUFBRSxRQUFRLFNBQVMsTUFBTSxFQUFFLFdBQVcsTUFBTSxTQUFTLEtBQUssQ0FBQztBQUFBLEVBQzlEO0FBRUEsV0FBUyxnQkFBZ0IsTUFBb0I7QUFDM0MsVUFBTSxLQUFLLFNBQVMsY0FBYyxVQUFVO0FBQzVDLE9BQUcsUUFBUTtBQUNYLE9BQUcsTUFBTSxVQUFVO0FBQ25CLGFBQVMsS0FBSyxZQUFZLEVBQUU7QUFDNUIsT0FBRyxPQUFPO0FBQ1YsYUFBUyxZQUFZLE1BQU07QUFDM0IsYUFBUyxLQUFLLFlBQVksRUFBRTtBQUFBLEVBQzlCO0FBRU8sV0FBUyxnQkFBZ0IsTUFBb0I7QUFDbEQsUUFBSSxVQUFVLFdBQVcsV0FBVztBQUNsQyxnQkFBVSxVQUFVLFVBQVUsSUFBSSxFQUFFLE1BQU0sTUFBTSxnQkFBZ0IsSUFBSSxDQUFDO0FBQUEsSUFDdkUsT0FBTztBQUNMLHNCQUFnQixJQUFJO0FBQUEsSUFDdEI7QUFBQSxFQUNGOzs7QUNwRE8sV0FBUyxpQkFBaUIsU0FBaUIsS0FBbUI7QUFDbkUsUUFBSSxTQUFTLGVBQWUsT0FBTyxFQUFHO0FBQ3RDLFVBQU0sUUFBUSxTQUFTLGNBQWMsT0FBTztBQUM1QyxVQUFNLEtBQUs7QUFDWCxVQUFNLGNBQWM7QUFDcEIsS0FBQyxTQUFTLFFBQVEsU0FBUyxpQkFBaUIsWUFBWSxLQUFLO0FBQUEsRUFDL0Q7QUFHTyxXQUFTLGdCQUFnQixJQUF1QjtBQUNyRCxPQUFHLGlCQUFpQixXQUFXLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDO0FBQ3pELE9BQUcsaUJBQWlCLFNBQVMsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUM7QUFBQSxFQUN6RDtBQUdPLFdBQVMsZUFBZSxTQUFpQixXQUFvQztBQUNsRixVQUFNLE9BQU8sU0FBUyxjQUFjLE1BQU07QUFDMUMsU0FBSyxZQUFZO0FBQ2pCLFNBQUssY0FBYztBQUNuQixTQUFLLFFBQVEsa0JBQWtCLFNBQVM7QUFDeEMsU0FBSyxpQkFBaUIsU0FBUyxNQUFNO0FBQ25DLHNCQUFnQixTQUFTO0FBQ3pCLFdBQUssVUFBVSxJQUFJLGFBQWE7QUFDaEMsaUJBQVcsTUFBTSxLQUFLLFVBQVUsT0FBTyxhQUFhLEdBQUcsSUFBSTtBQUFBLElBQzdELENBQUM7QUFDRCxXQUFPO0FBQUEsRUFDVDtBQUlPLFdBQVMsZ0JBQWdCLE1BSWxCO0FBQ1osVUFBTSxZQUFZLFNBQVMsY0FBYyxLQUFLO0FBQzlDLGNBQVUsWUFBWTtBQUN0QixVQUFNLFFBQVEsU0FBUyxjQUFjLE9BQU87QUFDNUMsVUFBTSxPQUFPO0FBQ2IsVUFBTSxjQUFjLEtBQUs7QUFDekIsb0JBQWdCLEtBQUs7QUFFckIsVUFBTSxVQUFVLFNBQVMsTUFBTTtBQUM3QixXQUFLLFNBQVMsTUFBTSxNQUFNLFlBQVksRUFBRSxLQUFLLENBQUM7QUFBQSxJQUNoRCxHQUFHLEtBQUssY0FBYyxHQUFHO0FBRXpCLFVBQU0saUJBQWlCLFNBQVMsT0FBTztBQUN2QyxjQUFVLFlBQVksS0FBSztBQUUzQixXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLGVBQWUsTUFBTSxNQUFNLGNBQWMsSUFBSSxNQUFNLE9BQU8sQ0FBQztBQUFBLElBQzdEO0FBQUEsRUFDRjtBQUlBLFdBQVMsUUFBUSxJQUFZLFNBQXVDO0FBQ2xFLFVBQU0sZUFBZSxZQUFZLFdBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrRkFNQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTUosVUFBTSxVQUFVLFlBQVksV0FDeEIscUVBQ0E7QUFFSixXQUFPO0FBQUEsR0FDTixFQUFFLE1BQU0sWUFBWTtBQUFBLEdBQ3BCLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBS0YsRUFBRTtBQUFBLEdBQ0YsRUFBRTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBSUYsRUFBRTtBQUFBLEdBQ0YsRUFBRSxpQkFBaUIsT0FBTztBQUFBLEdBQzFCLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQSxHQUlGLEVBQUU7QUFBQTtBQUFBO0FBQUEsR0FHRixFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHQUtGLEVBQUU7QUFBQSxHQUNGLEVBQUU7QUFBQTtBQUFBO0FBQUEsR0FHRixFQUFFO0FBQUEsR0FDRixFQUFFO0FBQUEsR0FDRixFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJTDtBQVNPLFdBQVMsaUJBQWlCLFFBQTZDO0FBRTVFLFVBQU0sV0FBVyxTQUFTLGVBQWUsT0FBTyxPQUFPO0FBQ3ZELFFBQUksVUFBVTtBQUFFLGVBQVMsT0FBTztBQUFHLGFBQU87QUFBQSxJQUFNO0FBRWhELFVBQU0sVUFBVSxPQUFPLFdBQVc7QUFDbEMscUJBQWlCLE9BQU8sU0FBUyxRQUFRLE9BQU8sU0FBUyxPQUFPLEtBQUssT0FBTyxZQUFZLEdBQUc7QUFFM0YsVUFBTSxRQUFRLFNBQVMsY0FBYyxLQUFLO0FBQzFDLFVBQU0sS0FBSyxPQUFPO0FBRWxCLFVBQU0sU0FBUyxTQUFTLGNBQWMsS0FBSztBQUMzQyxXQUFPLFlBQVk7QUFFbkIsVUFBTSxVQUFVLFNBQVMsY0FBYyxNQUFNO0FBQzdDLFlBQVEsWUFBWTtBQUNwQixZQUFRLGNBQWMsT0FBTztBQUU3QixVQUFNLFdBQVcsU0FBUyxjQUFjLFFBQVE7QUFDaEQsYUFBUyxZQUFZO0FBQ3JCLGFBQVMsUUFBUTtBQUNqQixhQUFTLGNBQWM7QUFDdkIsYUFBUyxpQkFBaUIsU0FBUyxNQUFNLE1BQU0sT0FBTyxDQUFDO0FBRXZELFdBQU8sT0FBTyxTQUFTLFFBQVE7QUFFL0IsVUFBTSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBQ3pDLFNBQUssWUFBWTtBQUVqQixVQUFNLE9BQU8sUUFBUSxJQUFJO0FBQ3pCLGFBQVMsS0FBSyxZQUFZLEtBQUs7QUFDL0Isa0JBQWMsT0FBTyxRQUFRLFFBQVE7QUFFckMsV0FBTyxFQUFFLE9BQU8sUUFBUSxVQUFVLEtBQUs7QUFBQSxFQUN6Qzs7O0FDdkxBLE1BQU0sV0FBVztBQUNqQixNQUFNLFdBQVc7QUFFakIsTUFBTSxZQUFZO0FBQUEsR0FDZixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FJUixRQUFRO0FBQUEsR0FDUixRQUFRO0FBQUE7QUFBQSxHQUVSLFFBQVE7QUFBQSxHQUNSLFFBQVE7QUFBQSxHQUNSLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FNUixRQUFRO0FBQUEsR0FDUixRQUFRO0FBQUEsR0FDUixRQUFRO0FBQUE7QUFBQTtBQUFBLEdBR1IsUUFBUSxzQkFBc0IsUUFBUTtBQUFBLEdBQ3RDLFFBQVEsc0JBQXNCLFFBQVE7QUFBQSxHQUN0QyxRQUFRLHNCQUFzQixRQUFRO0FBQUEsR0FDdEMsUUFBUSxzQkFBc0IsUUFBUTtBQUFBLEdBQ3RDLFFBQVE7QUFBQTtBQUFBO0FBQUEsR0FHUixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FJUixRQUFRO0FBQUE7QUFHWCxXQUFTLE9BQWE7QUFFcEIsUUFBSSxPQUFPLFFBQVEsZUFBZSxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU07QUFDN0U7QUFBQSxJQUNGO0FBRUEsVUFBTSxRQUFRLGlCQUFpQjtBQUFBLE1BQzdCLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFDRCxRQUFJLENBQUMsTUFBTztBQUVaLFVBQU0sRUFBRSxPQUFPLFFBQVEsVUFBVSxLQUFLLElBQUk7QUFHMUMsVUFBTSxhQUFhLFNBQVMsY0FBYyxRQUFRO0FBQ2xELGVBQVcsWUFBWTtBQUN2QixlQUFXLFFBQVE7QUFDbkIsZUFBVyxjQUFjO0FBQ3pCLFdBQU8sYUFBYSxZQUFZLFFBQVE7QUFHeEMsVUFBTSxhQUFhLElBQUksS0FBSyxLQUFLLE9BQU8sY0FBYztBQUN0RCxVQUFNLFdBQWEsSUFBSSxLQUFLLEtBQUssT0FBTyxNQUFNO0FBQzlDLFVBQU0sWUFBWSxTQUFTLGNBQWMsS0FBSztBQUM5QyxjQUFVLFlBQVk7QUFDdEIsY0FBVSxPQUFPLFVBQVU7QUFDM0IsY0FBVSxZQUFZLGVBQWUsWUFBWSxVQUFVLENBQUM7QUFDNUQsY0FBVSxPQUFPLFdBQVc7QUFDNUIsUUFBSSxVQUFVO0FBQ1osWUFBTSxVQUFVLFNBQVMsUUFBUSxZQUFZLEVBQUU7QUFDL0MsZ0JBQVUsWUFBWSxlQUFlLFVBQVUsT0FBTyxDQUFDO0FBQUEsSUFDekQsT0FBTztBQUNMLGdCQUFVLE9BQU8sY0FBYztBQUFBLElBQ2pDO0FBQ0EsVUFBTSxhQUFhLFdBQVcsSUFBSTtBQUdsQyxVQUFNLFFBQVEsU0FBUyxjQUFjLE9BQU87QUFDNUMsVUFBTSxRQUFRLFNBQVMsY0FBYyxPQUFPO0FBQzVDLFVBQU0sWUFBWTtBQUNsQixVQUFNLFlBQVksS0FBSztBQUN2QixVQUFNLFFBQVEsU0FBUyxjQUFjLE9BQU87QUFDNUMsVUFBTSxZQUFZLEtBQUs7QUFFdkIsVUFBTSxZQUFZLFNBQVMsY0FBYyxLQUFLO0FBQzlDLGNBQVUsWUFBWTtBQUN0QixjQUFVLGNBQWM7QUFDeEIsY0FBVSxNQUFNLFVBQVU7QUFHMUIsVUFBTSxhQUFhLENBQUMsTUFBYztBQUNoQyxVQUFJLFVBQVU7QUFDZCxZQUFNLGlCQUFzQyxJQUFJLEVBQUUsUUFBUSxDQUFDLFFBQVE7QUFDakUsY0FBTSxRQUFRLENBQUMsS0FDVixJQUFJLFFBQVEsWUFBYSxTQUFTLENBQUMsS0FDbkMsSUFBSSxRQUFRLGFBQWMsU0FBUyxDQUFDLEtBQ3BDLElBQUksUUFBUSxZQUFhLFNBQVMsQ0FBQztBQUN4QyxZQUFJLE1BQU0sVUFBVSxRQUFRLEtBQUs7QUFDakMsWUFBSSxNQUFPO0FBQUEsTUFDYixDQUFDO0FBQ0QsZ0JBQVUsTUFBTSxVQUFVLFlBQVksSUFBSSxLQUFLO0FBQUEsSUFDakQ7QUFDQSxVQUFNLFNBQVMsZ0JBQWdCO0FBQUEsTUFDN0IsYUFBYTtBQUFBLE1BQ2IsVUFBVTtBQUFBLElBQ1osQ0FBQztBQUNELG9CQUFnQixPQUFPLEtBQUs7QUFDNUIsVUFBTSxhQUFhLE9BQU8sV0FBVyxJQUFJO0FBR3pDLFVBQU0sYUFBYSxJQUFJLEtBQUssS0FBSyxPQUFPLFdBQVcsSUFBSTtBQUN2RCxVQUFNLFdBQWEsY0FBYztBQUNqQyxrQkFBYyxPQUFPLFlBQVksUUFBUTtBQUd6QyxlQUFXLGlCQUFpQixTQUFTLE1BQU07QUFDekMsaUJBQVcsV0FBVztBQUN0QixpQkFBVyxVQUFVLElBQUksY0FBYztBQUN2QyxVQUFJLEtBQUssS0FBSyxRQUFRLEtBQUssRUFBRTtBQUFBLFFBQzNCLE1BQU07QUFDSix3QkFBYyxPQUFPLElBQUksS0FBSyxLQUFLLE9BQU8sV0FBVyxJQUFJLEdBQUcsY0FBYyxDQUFDO0FBQzNFLGlCQUFPLGNBQWM7QUFDckIscUJBQVcsVUFBVSxPQUFPLGNBQWM7QUFDMUMscUJBQVcsV0FBVztBQUFBLFFBQ3hCO0FBQUEsUUFDQSxDQUFDLFFBQWlCO0FBQ2hCLGtCQUFRLE1BQU0saUNBQWlDLEdBQUc7QUFDbEQscUJBQVcsVUFBVSxPQUFPLGNBQWM7QUFDMUMscUJBQVcsV0FBVztBQUFBLFFBQ3hCO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssWUFBWSxLQUFLO0FBQ3RCLFNBQUssWUFBWSxTQUFTO0FBRzFCLDBCQUFzQixNQUFNO0FBQzFCLFlBQU0sYUFBYSxNQUFNO0FBQ3pCLFlBQU0sTUFBTSxRQUFRLEtBQUssSUFBSSxLQUFLLElBQUksWUFBWSxHQUFHLEdBQUcsT0FBTyxhQUFhLEdBQUcsSUFBSTtBQUFBLElBQ3JGLENBQUM7QUFBQSxFQUNIO0FBRUEsV0FBUyxZQUFZLE1BQStDO0FBQ2xFLFFBQUk7QUFDRixZQUFNLE1BQU0sS0FBSyxTQUFTO0FBQzFCLFVBQUksUUFBUSxRQUFRLFFBQVEsT0FBVyxRQUFPO0FBRTlDLFlBQU0sT0FBTyxLQUFLLG1CQUFtQixLQUFLLGlCQUFpQixJQUFJLE9BQU87QUFFdEUsY0FBUSxNQUFNO0FBQUEsUUFDWixLQUFLLFVBQVU7QUFDYixjQUFJLENBQUMsTUFBTSxRQUFRLEdBQUcsRUFBRyxRQUFPLE9BQU8sR0FBRztBQUMxQyxpQkFBUSxJQUEwQixJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxJQUFJO0FBQUEsUUFDeEU7QUFBQSxRQUNBLEtBQUs7QUFBQSxRQUNMLEtBQUssd0JBQXdCO0FBQzNCLGdCQUFNLE9BQVEsS0FBMkMsVUFBVTtBQUNuRSxpQkFBTyxRQUFRLE9BQU8sT0FBTyxJQUFJLElBQUksT0FBTyxHQUFHO0FBQUEsUUFDakQ7QUFBQSxRQUNBLEtBQUssWUFBWTtBQUNmLGlCQUFPLGVBQWUsT0FBTyxJQUFJLGVBQWUsSUFBSSxPQUFPLEdBQUc7QUFBQSxRQUNoRTtBQUFBLFFBQ0EsS0FBSyxXQUFXO0FBQ2QsaUJBQU8sTUFBTSxRQUFRO0FBQUEsUUFDdkI7QUFBQSxRQUNBO0FBQ0UsaUJBQU8sT0FBTyxHQUFHO0FBQUEsTUFDckI7QUFBQSxJQUNGLFFBQVE7QUFDTixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGNBQ1AsT0FDQSxZQUNBLFVBQ007QUFDTixVQUFNLFlBQVk7QUFDbEIsVUFBTSxjQUFjLENBQUMsR0FBRyxVQUFVLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTTtBQUNqRCxZQUFNLE1BQU0sU0FBUyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxHQUFHLFlBQVk7QUFDOUQsWUFBTSxNQUFNLFNBQVMsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsR0FBRyxZQUFZO0FBQzlELGFBQU8sR0FBRyxjQUFjLEVBQUU7QUFBQSxJQUM1QixDQUFDO0FBQ0QsZ0JBQVksUUFBUSxDQUFDLFNBQVM7QUFDNUIsWUFBTSxPQUFXLEtBQUssUUFBUTtBQUM5QixZQUFNLFFBQVcsU0FBUyxJQUFJLEtBQUs7QUFDbkMsWUFBTSxPQUFXLEtBQUssbUJBQW1CLEtBQUssaUJBQWlCLElBQUk7QUFDbkUsWUFBTSxXQUFXLFlBQVksSUFBSTtBQUVqQyxZQUFNLEtBQUssU0FBUyxjQUFjLElBQUk7QUFFdEMsWUFBTSxVQUFVLFNBQVMsY0FBYyxJQUFJO0FBQzNDLGNBQVEsY0FBYztBQUV0QixZQUFNLFdBQVcsU0FBUyxjQUFjLElBQUk7QUFDNUMsZUFBUyxjQUFjO0FBRXZCLFlBQU0sU0FBUyxTQUFTLGNBQWMsSUFBSTtBQUMxQyxZQUFNLFlBQVksU0FBUyxjQUFjLE1BQU07QUFDL0MsZ0JBQVUsWUFBWTtBQUN0QixnQkFBVSxjQUFjO0FBQ3hCLGFBQU8sWUFBWSxTQUFTO0FBRTVCLFlBQU0sVUFBVSxTQUFTLGNBQWMsSUFBSTtBQUMzQyxVQUFJLGFBQWEsTUFBTTtBQUNyQixjQUFNLFdBQVcsU0FBUyxjQUFjLE1BQU07QUFDOUMsaUJBQVMsWUFBWTtBQUNyQixpQkFBUyxjQUFjO0FBQ3ZCLGdCQUFRLFlBQVksUUFBUTtBQUFBLE1BQzlCLE9BQU87QUFDTCxnQkFBUSxjQUFjO0FBQUEsTUFDeEI7QUFFQSxTQUFHLFFBQVEsY0FBZSxNQUFNLFlBQVk7QUFDNUMsU0FBRyxRQUFRLGVBQWUsS0FBSyxZQUFZO0FBQzNDLFNBQUcsUUFBUSxlQUFnQixZQUFZLFFBQVEsWUFBWTtBQUMzRCxTQUFHLFlBQVksT0FBTztBQUN0QixTQUFHLFlBQVksUUFBUTtBQUN2QixTQUFHLFlBQVksTUFBTTtBQUNyQixTQUFHLFlBQVksT0FBTztBQUN0QixZQUFNLFlBQVksRUFBRTtBQUFBLElBQ3RCLENBQUM7QUFBQSxFQUNIO0FBRUEsT0FBSzsiLAogICJuYW1lcyI6IFtdCn0K
