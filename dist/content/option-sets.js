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

  // src/content/option-sets/option-sets.ts
  var PANEL_ID = "crm-tools-optionsets-panel";
  var STYLE_ID = "crm-tools-optionsets-style";
  var EXTRA_CSS = `
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
#${PANEL_ID} .cop-null { color: #aaa; font-style: italic; }
#${PANEL_ID} .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#${PANEL_ID} .cop-options-list li { white-space: nowrap; }
`;
  function main() {
    if (typeof Xrm === "undefined" || !Xrm.Page || !Xrm.Page.ui || !Xrm.Page.data) {
      return;
    }
    const shell = createPanelShell({
      panelId: PANEL_ID,
      styleId: STYLE_ID,
      title: "\u{1F518} Option Sets",
      extraCss: EXTRA_CSS
    });
    if (!shell) return;
    const { panel, body } = shell;
    const labelMap = buildLabelMap();
    const attrs = Xrm.Page.data.entity.attributes.get().filter(
      (a) => a.getAttributeType() === "optionset" || a.getAttributeType() === "multiselectoptionset"
    );
    const sortedAttrs = [...attrs].sort((a, b) => {
      const la = (labelMap[a.getName()] || a.getName()).toLowerCase();
      const lb = (labelMap[b.getName()] || b.getName()).toLowerCase();
      return la.localeCompare(lb);
    });
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
    subheader.append(`  |  ${sortedAttrs.length} option set field(s)`);
    panel.insertBefore(subheader, body);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    sortedAttrs.forEach((attr) => {
      const name = attr.getName();
      const label = labelMap[name] || name;
      const currentText = attr.getText?.() ?? null;
      let options = [];
      try {
        options = attr.getOptions();
      } catch {
        options = [];
      }
      const tr = document.createElement("tr");
      tr.dataset.searchLabel = label.toLowerCase();
      tr.dataset.searchSchema = name.toLowerCase();
      const tdLabel = document.createElement("td");
      tdLabel.textContent = label;
      const tdSchema = document.createElement("td");
      tdSchema.textContent = name;
      const tdCurrentValue = document.createElement("td");
      if (currentText === null) {
        const nullSpan = document.createElement("span");
        nullSpan.className = "cop-null";
        nullSpan.textContent = "null";
        tdCurrentValue.appendChild(nullSpan);
      } else {
        tdCurrentValue.textContent = currentText;
      }
      const tdOptions = document.createElement("td");
      const ul = document.createElement("ul");
      ul.className = "cop-options-list";
      options.forEach((opt) => {
        const li = document.createElement("li");
        li.appendChild(createCopySpan(String(opt.value), String(opt.value)));
        li.append(`: ${opt.text}`);
        ul.appendChild(li);
      });
      tdOptions.appendChild(ul);
      tr.appendChild(tdLabel);
      tr.appendChild(tdSchema);
      tr.appendChild(tdCurrentValue);
      tr.appendChild(tdOptions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const noResults = document.createElement("div");
    noResults.className = "dcat-no-results";
    noResults.textContent = "No matching fields.";
    noResults.style.display = "none";
    const search = createSearchBar({
      placeholder: "Search by label or schema name\u2026",
      onFilter: (q) => {
        let visible = 0;
        tbody.querySelectorAll("tr").forEach((row) => {
          const match = !q || row.dataset.searchLabel.includes(q) || row.dataset.searchSchema.includes(q);
          row.style.display = match ? "" : "none";
          if (match) visible++;
        });
        noResults.style.display = visible === 0 ? "" : "none";
      }
    });
    isolateKeyboard(search.input);
    panel.insertBefore(search.container, body);
    body.appendChild(table);
    body.appendChild(noResults);
    requestAnimationFrame(() => {
      const tableWidth = table.offsetWidth;
      panel.style.width = Math.min(Math.max(tableWidth, 420), window.innerWidth * 0.9) + "px";
    });
  }
  main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hhcmVkLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L3BhbmVsLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L29wdGlvbi1zZXRzL29wdGlvbi1zZXRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaGFyZWQgdXRpbGl0aWVzIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIEJ1bmRsZWQgaW5saW5lIGludG8gZWFjaCBzY3JpcHQgYnkgZXNidWlsZCBcdTIwMTQgbm8gc2VwYXJhdGUgb3V0cHV0IGZpbGUgbmVlZGVkLlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlPFQgZXh0ZW5kcyB1bmtub3duW10+KGZuOiAoLi4uYXJnczogVCkgPT4gdm9pZCwgbXM6IG51bWJlcik6ICguLi5hcmdzOiBUKSA9PiB2b2lkIHtcclxuICBsZXQgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+O1xyXG4gIHJldHVybiAoLi4uYXJnczogVCkgPT4ge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBmbiguLi5hcmdzKSwgbXMpO1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZExhYmVsTWFwKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xyXG4gIGNvbnN0IGxhYmVsTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgWHJtLlBhZ2UudWkuY29udHJvbHMuZm9yRWFjaCgoY3RybCkgPT4ge1xyXG4gICAgY29uc3QgbmFtZSA9IGN0cmwuZ2V0TmFtZSgpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsYWJlbE1hcFtuYW1lXSA9IChjdHJsIGFzIFhybS5Db250cm9scy5TdGFuZGFyZENvbnRyb2wpLmdldExhYmVsKCkgfHwgbmFtZTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgbGFiZWxNYXBbbmFtZV0gPSBuYW1lO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxhYmVsTWFwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZURyYWdnYWJsZShwYW5lbDogSFRNTEVsZW1lbnQsIGhhbmRsZTogSFRNTEVsZW1lbnQsIGNsb3NlQnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCByZWN0ID0gcGFuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBwYW5lbC5zdHlsZS5sZWZ0ICAgICAgPSByZWN0LmxlZnQgKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICAgICAgID0gcmVjdC50b3AgICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnJpZ2h0ICAgICA9ICcnO1xyXG4gICAgcGFuZWwuc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgfSk7XHJcblxyXG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xyXG4gIGxldCBvZmZzZXRYID0gMDtcclxuICBsZXQgb2Zmc2V0WSA9IDA7XHJcblxyXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcclxuICAgIGNvbnN0IHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlLmNsaWVudFggLSBvZmZzZXRYLCB3aW5kb3cuaW5uZXJXaWR0aCAgLSBwYW5lbC5vZmZzZXRXaWR0aCkpO1xyXG4gICAgY29uc3QgeSA9IE1hdGgubWF4KDAsIE1hdGgubWluKGUuY2xpZW50WSAtIG9mZnNldFksIHdpbmRvdy5pbm5lckhlaWdodCAtIHBhbmVsLm9mZnNldEhlaWdodCkpO1xyXG4gICAgcGFuZWwuc3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICA9IHkgKyAncHgnO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uTW91c2VVcCA9ICgpID0+IHsgZHJhZ2dpbmcgPSBmYWxzZTsgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdtb3ZlJzsgfTtcclxuXHJcbiAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7XHJcbiAgICBpZiAoY2xvc2VCdG4uY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHJldHVybjtcclxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcclxuICAgIG9mZnNldFggID0gZS5jbGllbnRYIC0gcGFuZWwub2Zmc2V0TGVmdDtcclxuICAgIG9mZnNldFkgID0gZS5jbGllbnRZIC0gcGFuZWwub2Zmc2V0VG9wO1xyXG4gICAgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgICBvbk1vdXNlVXApO1xyXG5cclxuICBuZXcgTXV0YXRpb25PYnNlcnZlcigoXywgb2JzKSA9PiB7XHJcbiAgICBpZiAoIWRvY3VtZW50LmNvbnRhaW5zKHBhbmVsKSkge1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XHJcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAgIG9uTW91c2VVcCk7XHJcbiAgICAgIG9icy5kaXNjb25uZWN0KCk7XHJcbiAgICB9XHJcbiAgfSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXhlY0NvbW1hbmRDb3B5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xyXG4gIGNvbnN0IHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcclxuICB0YS52YWx1ZSA9IHRleHQ7XHJcbiAgdGEuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpmaXhlZDtvcGFjaXR5OjA7cG9pbnRlci1ldmVudHM6bm9uZSc7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7XHJcbiAgdGEuc2VsZWN0KCk7XHJcbiAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcclxuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlUb0NsaXBib2FyZCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZD8ud3JpdGVUZXh0KSB7XHJcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KS5jYXRjaCgoKSA9PiBleGVjQ29tbWFuZENvcHkodGV4dCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBleGVjQ29tbWFuZENvcHkodGV4dCk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBUT0FTVF9DT05UQUlORVJfSUQgPSAnY3JtLXRvb2xzLXRvYXN0LWNvbnRhaW5lcic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvd1RvYXN0KG1lc3NhZ2U6IHN0cmluZywgdHlwZTogJ2luZm8nIHwgJ3dhcm4nID0gJ2luZm8nKTogdm9pZCB7XHJcbiAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFRPQVNUX0NPTlRBSU5FUl9JRCk7XHJcbiAgaWYgKCFjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgY29udGFpbmVyLmlkID0gVE9BU1RfQ09OVEFJTkVSX0lEO1xyXG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAgICdwb3NpdGlvbjogZml4ZWQnLCAnYm90dG9tOiAyNHB4JywgJ3JpZ2h0OiAyNHB4JyxcclxuICAgICAgJ3otaW5kZXg6IDIxNDc0ODM2NDcnLCAnZGlzcGxheTogZmxleCcsICdmbGV4LWRpcmVjdGlvbjogY29sdW1uJywgJ2dhcDogOHB4JyxcclxuICAgICAgJ3BvaW50ZXItZXZlbnRzOiBub25lJyxcclxuICAgIF0uam9pbignOyAnKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgdG9hc3Quc3R5bGUuY3NzVGV4dCA9IFtcclxuICAgICdiYWNrZ3JvdW5kOiAnICsgKHR5cGUgPT09ICd3YXJuJyA/ICcjZTY1MTAwJyA6ICcjMzIzMjMyJyksXHJcbiAgICAnY29sb3I6ICNmZmYnLFxyXG4gICAgJ2ZvbnQtZmFtaWx5OiBcIkdvb2dsZSBTYW5zXCIsIFJvYm90bywgXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZicsXHJcbiAgICAnZm9udC1zaXplOiAxM3B4JyxcclxuICAgICdwYWRkaW5nOiAxMHB4IDE2cHgnLFxyXG4gICAgJ2JvcmRlci1yYWRpdXM6IDZweCcsXHJcbiAgICAnYm94LXNoYWRvdzogMCAycHggOHB4IHJnYmEoMCwwLDAsMC4yNSknLFxyXG4gICAgJ3BvaW50ZXItZXZlbnRzOiBhdXRvJyxcclxuICAgICdvcGFjaXR5OiAxJyxcclxuICAgICd0cmFuc2l0aW9uOiBvcGFjaXR5IDAuM3MgZWFzZScsXHJcbiAgXS5qb2luKCc7ICcpO1xyXG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpO1xyXG5cclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIHRvYXN0LnN0eWxlLm9wYWNpdHkgPSAnMCc7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRvYXN0LnJlbW92ZSgpLCAzNTApO1xyXG4gIH0sIDM1MDApO1xyXG59XHJcbiIsICIvLyBTaGFyZWQgcGFuZWwgc2hlbGwgZm9yIER5bmFtaWNzQ2F0IGNvbnRlbnQgc2NyaXB0cy5cclxuLy8gUHJvdmlkZXMgdGhlIGNvbW1vbiBjaHJvbWUgKGNvbnRhaW5lciwgaGVhZGVyLCBjbG9zZSwgZHJhZywga2V5Ym9hcmQgaXNvbGF0aW9uKVxyXG4vLyBzbyBlYWNoIGZlYXR1cmUgc2NyaXB0IG9ubHkgYnVpbGRzIGl0cyBvd24gYm9keSBjb250ZW50LlxyXG5cclxuaW1wb3J0IHsgZGVib3VuY2UsIG1ha2VEcmFnZ2FibGUsIGNvcHlUb0NsaXBib2FyZCB9IGZyb20gJy4vc2hhcmVkJztcclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBUeXBlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZWxTaGVsbENvbmZpZyB7XHJcbiAgcGFuZWxJZDogc3RyaW5nO1xyXG4gIHN0eWxlSWQ6IHN0cmluZztcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIHZhcmlhbnQ/OiAnc2lkZWJhcicgfCAnZGlhbG9nJztcclxuICAvKiogQWRkaXRpb25hbCBDU1MgYXBwZW5kZWQgYWZ0ZXIgdGhlIGJhc2UgcGFuZWwgc3R5bGVzaGVldC4gKi9cclxuICBleHRyYUNzcz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lbFNoZWxsIHtcclxuICBwYW5lbDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgaGVhZGVyOiBIVE1MRGl2RWxlbWVudDtcclxuICBjbG9zZUJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgYm9keTogSFRNTERpdkVsZW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoQmFyIHtcclxuICBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIC8qKiBSZS1ydW4gdGhlIGN1cnJlbnQgZmlsdGVyIChlLmcuIGFmdGVyIHJlZnJlc2hpbmcgdGFibGUgZGF0YSkuICovXHJcbiAgdHJpZ2dlckZpbHRlcjogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKiogSWRlbXBvdGVudCBzdHlsZSBpbmplY3Rpb24gXHUyMDE0IG9ubHkgaW5zZXJ0cyBvbmNlIHBlciBzdHlsZUlkLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0U3R5bGVzaGVldChzdHlsZUlkOiBzdHJpbmcsIGNzczogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0eWxlSWQpKSByZXR1cm47XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLmlkID0gc3R5bGVJZDtcclxuICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcztcclxuICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcclxufVxyXG5cclxuLyoqIFByZXZlbnQgdGhlIENSTSBob3N0IHBhZ2UgZnJvbSBzd2FsbG93aW5nIGtleWJvYXJkIGV2ZW50cyBpbnNpZGUgaW5qZWN0ZWQgcGFuZWxzLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNvbGF0ZUtleWJvYXJkKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbn1cclxuXHJcbi8qKiBDbGljay10by1jb3B5IHNwYW4gd2l0aCBicmllZiBmbGFzaCBmZWVkYmFjay4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvcHlTcGFuKGRpc3BsYXk6IHN0cmluZywgY29weVZhbHVlOiBzdHJpbmcpOiBIVE1MU3BhbkVsZW1lbnQge1xyXG4gIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgc3Bhbi5jbGFzc05hbWUgPSAnZGNhdC1jb3B5LXZhbCc7XHJcbiAgc3Bhbi50ZXh0Q29udGVudCA9IGRpc3BsYXk7XHJcbiAgc3Bhbi50aXRsZSA9IGBDbGljayB0byBjb3B5OiAke2NvcHlWYWx1ZX1gO1xyXG4gIHNwYW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBjb3B5VG9DbGlwYm9hcmQoY29weVZhbHVlKTtcclxuICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZGNhdC1jb3BpZWQnKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gc3Bhbi5jbGFzc0xpc3QucmVtb3ZlKCdkY2F0LWNvcGllZCcpLCAxMjAwKTtcclxuICB9KTtcclxuICByZXR1cm4gc3BhbjtcclxufVxyXG5cclxuLyoqIENyZWF0ZXMgYSBzZWFyY2ggYmFyIHdpdGggZGVib3VuY2VkIGZpbHRlciBjYWxsYmFjay5cclxuICogIEluc2VydCB0aGUgcmV0dXJuZWQgY29udGFpbmVyIGludG8gdGhlIHBhbmVsIGJldHdlZW4gaGVhZGVyL3N1YmhlYWRlciBhbmQgYm9keS4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlYXJjaEJhcihvcHRzOiB7XHJcbiAgcGxhY2Vob2xkZXI6IHN0cmluZztcclxuICBvbkZpbHRlcjogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgZGVib3VuY2VNcz86IG51bWJlcjtcclxufSk6IFNlYXJjaEJhciB7XHJcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdkY2F0LXNlYXJjaCc7XHJcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gIGlucHV0LnR5cGUgPSAnc2VhcmNoJztcclxuICBpbnB1dC5wbGFjZWhvbGRlciA9IG9wdHMucGxhY2Vob2xkZXI7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKGlucHV0KTtcclxuXHJcbiAgY29uc3QgaGFuZGxlciA9IGRlYm91bmNlKCgpID0+IHtcclxuICAgIG9wdHMub25GaWx0ZXIoaW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCkpO1xyXG4gIH0sIG9wdHMuZGVib3VuY2VNcyA/PyAxMDApO1xyXG5cclxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZXIpO1xyXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnB1dCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBjb250YWluZXIsXHJcbiAgICBpbnB1dCxcclxuICAgIHRyaWdnZXJGaWx0ZXI6ICgpID0+IGlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcpKSxcclxuICB9O1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgQmFzZSBDU1MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG5mdW5jdGlvbiBiYXNlQ3NzKGlkOiBzdHJpbmcsIHZhcmlhbnQ6ICdzaWRlYmFyJyB8ICdkaWFsb2cnKTogc3RyaW5nIHtcclxuICBjb25zdCBjb250YWluZXJDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcG9zaXRpb246IGZpeGVkOyB0b3A6IDUwJTsgbGVmdDogNTAlOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTsgd2lkdGg6IDM4MHB4O1xyXG4gICAgICAgbWF4LWhlaWdodDogOTB2aDtcclxuICAgICAgIGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMnB4IHNvbGlkICMxZTY0Yzg7IGJvcmRlci1yYWRpdXM6IDhweDtcclxuICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDI0cHggcmdiYSgwLDAsMCwwLjIpO1xyXG4gICAgICAgei1pbmRleDogMjE0NzQ4MzY0Nzsgb3ZlcmZsb3c6IHZpc2libGU7XHJcbiAgICAgICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjMjIyO2BcclxuICAgIDogYHBvc2l0aW9uOiBmaXhlZDsgdG9wOiAwOyByaWdodDogMDsgd2lkdGg6IGF1dG87IG1pbi13aWR0aDogNTUwcHg7IG1heC13aWR0aDogOTB2dzsgbWF4LWhlaWdodDogOTB2aDtcclxuICAgICAgIGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMnB4IHNvbGlkICMxZTY0Yzg7XHJcbiAgICAgICBib3gtc2hhZG93OiAtNHB4IDAgMTZweCByZ2JhKDAsMCwwLDAuMTgpO1xyXG4gICAgICAgei1pbmRleDogMjE0NzQ4MzY0NzsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgICAgIGZvbnQtZmFtaWx5OiBTZWdvZSBVSSwgQXJpYWwsIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMTNweDsgY29sb3I6ICMyMjI7YDtcclxuXHJcbiAgY29uc3QgYm9keUNzcyA9IHZhcmlhbnQgPT09ICdkaWFsb2cnXHJcbiAgICA/IGBwYWRkaW5nOiAxNHB4OyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDEwcHg7YFxyXG4gICAgOiBgb3ZlcmZsb3cteTogYXV0bzsgb3ZlcmZsb3cteDogYXV0bzsgZmxleDogMTtgO1xyXG5cclxuICByZXR1cm4gYFxyXG4jJHtpZH0geyAke2NvbnRhaW5lckNzc30gfVxyXG4jJHtpZH0gLmRjYXQtaGVhZGVyIHtcclxuICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDZweDtcclxuICBiYWNrZ3JvdW5kOiAjMWU2NGM4OyBjb2xvcjogI2ZmZjsgcGFkZGluZzogMTBweCAxNHB4OyBmbGV4LXNocmluazogMDtcclxuICBjdXJzb3I6IG1vdmU7IHVzZXItc2VsZWN0OiBub25lO1xyXG59XHJcbiMke2lkfSAuZGNhdC10aXRsZSB7IGZvbnQtc2l6ZTogMTRweDsgZm9udC13ZWlnaHQ6IDYwMDsgZmxleDogMTsgfVxyXG4jJHtpZH0gLmRjYXQtY2xvc2Uge1xyXG4gIGJhY2tncm91bmQ6IG5vbmU7IGJvcmRlcjogbm9uZTsgY29sb3I6ICNmZmY7IGZvbnQtc2l6ZTogMThweDtcclxuICBsaW5lLWhlaWdodDogMTsgY3Vyc29yOiBwb2ludGVyOyBwYWRkaW5nOiAwIDJweDsgb3BhY2l0eTogMC44NTtcclxufVxyXG4jJHtpZH0gLmRjYXQtY2xvc2U6aG92ZXIgeyBvcGFjaXR5OiAxOyB9XHJcbiMke2lkfSAuZGNhdC1ib2R5IHsgJHtib2R5Q3NzfSB9XHJcbiMke2lkfSAuZGNhdC1zdWJoZWFkZXIge1xyXG4gIHBhZGRpbmc6IDZweCAxNHB4OyBiYWNrZ3JvdW5kOiAjZThmMGZlOyBmb250LXNpemU6IDEycHg7XHJcbiAgY29sb3I6ICMxZTY0Yzg7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzVkOGZiOyBmbGV4LXNocmluazogMDtcclxufVxyXG4jJHtpZH0gLmRjYXQtc2VhcmNoIHtcclxuICBwYWRkaW5nOiA4cHggMTRweDsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjNWQ4ZmI7IGZsZXgtc2hyaW5rOiAwO1xyXG59XHJcbiMke2lkfSAuZGNhdC1zZWFyY2ggaW5wdXQge1xyXG4gIHdpZHRoOiAxMDAlOyBib3gtc2l6aW5nOiBib3JkZXItYm94OyBwYWRkaW5nOiA1cHggMTBweDtcclxuICBib3JkZXI6IDFweCBzb2xpZCAjYzVkOGZiOyBib3JkZXItcmFkaXVzOiA0cHg7IGZvbnQtc2l6ZTogMTNweDtcclxuICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBjb2xvcjogIzIyMjsgb3V0bGluZTogbm9uZTtcclxufVxyXG4jJHtpZH0gLmRjYXQtc2VhcmNoIGlucHV0OmZvY3VzIHsgYm9yZGVyLWNvbG9yOiAjMWU2NGM4OyB9XHJcbiMke2lkfSAuZGNhdC1jb3B5LXZhbCB7XHJcbiAgY3Vyc29yOiBwb2ludGVyOyBib3JkZXItYm90dG9tOiAxcHggZGFzaGVkICMxZTY0Yzg7IHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXM7XHJcbn1cclxuIyR7aWR9IC5kY2F0LWNvcHktdmFsOmhvdmVyIHsgYmFja2dyb3VuZDogI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogM3B4OyB9XHJcbiMke2lkfSAuZGNhdC1jb3B5LXZhbC5kY2F0LWNvcGllZCB7IGJhY2tncm91bmQ6ICNiN2YwYzg7IGJvcmRlci1ib3R0b20tY29sb3I6ICMyYTljNTI7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxyXG4jJHtpZH0gLmRjYXQtbm8tcmVzdWx0cyB7XHJcbiAgcGFkZGluZzogMTZweDsgdGV4dC1hbGlnbjogY2VudGVyOyBjb2xvcjogIzg4ODsgZm9udC1zdHlsZTogaXRhbGljO1xyXG59XHJcbmA7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBQYW5lbCBzaGVsbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBjb21tb24gcGFuZWwgY2hyb21lICh0b2dnbGUsIHN0eWxlIGluamVjdGlvbiwgaGVhZGVyLCBkcmFnLCBjbG9zZSkuXHJcbiAqIFJldHVybnMgbnVsbCB3aGVuIHRoZSBwYW5lbCB3YXMgdG9nZ2xlZCBPRkYgKGFscmVhZHkgZXhpc3RlZCBhbmQgd2FzIHJlbW92ZWQpLlxyXG4gKiBDYWxsZXJzIHBvcHVsYXRlIHRoZSByZXR1cm5lZCBgYm9keWAgZWxlbWVudCB3aXRoIGZlYXR1cmUtc3BlY2lmaWMgY29udGVudC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYW5lbFNoZWxsKGNvbmZpZzogUGFuZWxTaGVsbENvbmZpZyk6IFBhbmVsU2hlbGwgfCBudWxsIHtcclxuICAvLyBUb2dnbGU6IHJlbW92ZSBpZiBhbHJlYWR5IHByZXNlbnRcclxuICBjb25zdCBleGlzdGluZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbmZpZy5wYW5lbElkKTtcclxuICBpZiAoZXhpc3RpbmcpIHsgZXhpc3RpbmcucmVtb3ZlKCk7IHJldHVybiBudWxsOyB9XHJcblxyXG4gIGNvbnN0IHZhcmlhbnQgPSBjb25maWcudmFyaWFudCA/PyAnc2lkZWJhcic7XHJcbiAgaW5qZWN0U3R5bGVzaGVldChjb25maWcuc3R5bGVJZCwgYmFzZUNzcyhjb25maWcucGFuZWxJZCwgdmFyaWFudCkgKyAoY29uZmlnLmV4dHJhQ3NzID8/ICcnKSk7XHJcblxyXG4gIGNvbnN0IHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgcGFuZWwuaWQgPSBjb25maWcucGFuZWxJZDtcclxuXHJcbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgaGVhZGVyLmNsYXNzTmFtZSA9ICdkY2F0LWhlYWRlcic7XHJcblxyXG4gIGNvbnN0IHRpdGxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgdGl0bGVFbC5jbGFzc05hbWUgPSAnZGNhdC10aXRsZSc7XHJcbiAgdGl0bGVFbC50ZXh0Q29udGVudCA9IGNvbmZpZy50aXRsZTtcclxuXHJcbiAgY29uc3QgY2xvc2VCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICBjbG9zZUJ0bi5jbGFzc05hbWUgPSAnZGNhdC1jbG9zZSc7XHJcbiAgY2xvc2VCdG4udGl0bGUgPSAnQ2xvc2UnO1xyXG4gIGNsb3NlQnRuLnRleHRDb250ZW50ID0gJ1x1MjcxNSc7XHJcbiAgY2xvc2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBwYW5lbC5yZW1vdmUoKSk7XHJcblxyXG4gIGhlYWRlci5hcHBlbmQodGl0bGVFbCwgY2xvc2VCdG4pO1xyXG5cclxuICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgYm9keS5jbGFzc05hbWUgPSAnZGNhdC1ib2R5JztcclxuXHJcbiAgcGFuZWwuYXBwZW5kKGhlYWRlciwgYm9keSk7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwYW5lbCk7XHJcbiAgbWFrZURyYWdnYWJsZShwYW5lbCwgaGVhZGVyLCBjbG9zZUJ0bik7XHJcblxyXG4gIHJldHVybiB7IHBhbmVsLCBoZWFkZXIsIGNsb3NlQnRuLCBib2R5IH07XHJcbn1cclxuIiwgIi8vIEluamVjdGVkIGludG8gQ1JNIGZvcm0gZnJhbWVzIHZpYSBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQuXHJcbi8vIFJlYWRzIGFsbCBvcHRpb25zZXQvbXVsdGlzZWxlY3RvcHRpb25zZXQgYXR0cmlidXRlcyBhbmQgcmVuZGVycyBhIHNpZGUtcGFuZWwuXHJcblxyXG5pbXBvcnQgeyBidWlsZExhYmVsTWFwIH0gZnJvbSAnLi4vc2hhcmVkJztcclxuaW1wb3J0IHsgY3JlYXRlUGFuZWxTaGVsbCwgY3JlYXRlU2VhcmNoQmFyLCBjcmVhdGVDb3B5U3BhbiwgaXNvbGF0ZUtleWJvYXJkIH0gZnJvbSAnLi4vcGFuZWwnO1xyXG5cclxuY29uc3QgUEFORUxfSUQgPSAnY3JtLXRvb2xzLW9wdGlvbnNldHMtcGFuZWwnO1xyXG5jb25zdCBTVFlMRV9JRCA9ICdjcm0tdG9vbHMtb3B0aW9uc2V0cy1zdHlsZSc7XHJcblxyXG5jb25zdCBFWFRSQV9DU1MgPSBgXHJcbiMke1BBTkVMX0lEfSB0YWJsZSB7IHdpZHRoOiAxMDAlOyBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlOyB9XHJcbiMke1BBTkVMX0lEfSB0aGVhZCB0aCB7XHJcbiAgcG9zaXRpb246IHN0aWNreTsgdG9wOiAwOyBiYWNrZ3JvdW5kOiAjZjBmNGZmO1xyXG4gIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCAjMWU2NGM4OyBwYWRkaW5nOiA3cHggMTBweDsgdGV4dC1hbGlnbjogbGVmdDtcclxuICBmb250LXNpemU6IDExcHg7IGZvbnQtd2VpZ2h0OiA3MDA7IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XHJcbiAgbGV0dGVyLXNwYWNpbmc6IDAuNHB4OyBjb2xvcjogIzQ0NDsgd2hpdGUtc3BhY2U6IG5vd3JhcDtcclxufVxyXG4jJHtQQU5FTF9JRH0gdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pIHsgYmFja2dyb3VuZDogI2Y4ZjlmZjsgfVxyXG4jJHtQQU5FTF9JRH0gdGJvZHkgdHI6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjZGNlYWZlOyB9XHJcbiMke1BBTkVMX0lEfSB0ZCB7XHJcbiAgcGFkZGluZzogNXB4IDEwcHg7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZThlOGU4OyB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xyXG59XHJcbiMke1BBTkVMX0lEfSB0ZDpudGgtY2hpbGQoMSksICMke1BBTkVMX0lEfSB0aDpudGgtY2hpbGQoMSkgeyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbiMke1BBTkVMX0lEfSB0ZDpudGgtY2hpbGQoMiksICMke1BBTkVMX0lEfSB0aDpudGgtY2hpbGQoMikgeyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbiMke1BBTkVMX0lEfSB0ZDpudGgtY2hpbGQoMyksICMke1BBTkVMX0lEfSB0aDpudGgtY2hpbGQoMykgeyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbiMke1BBTkVMX0lEfSB0ZDpudGgtY2hpbGQoNCksICMke1BBTkVMX0lEfSB0aDpudGgtY2hpbGQoNCkgeyBtaW4td2lkdGg6IDE4MHB4OyBtYXgtd2lkdGg6IDM2MHB4OyB3b3JkLWJyZWFrOiBicmVhay13b3JkOyB9XHJcbiMke1BBTkVMX0lEfSB0ZDpudGgtY2hpbGQoMikge1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgbW9ub3NwYWNlOyBmb250LXNpemU6IDEycHg7IGNvbG9yOiAjNTU1O1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY29wLW51bGwgeyBjb2xvcjogI2FhYTsgZm9udC1zdHlsZTogaXRhbGljOyB9XHJcbiMke1BBTkVMX0lEfSAuY29wLW9wdGlvbnMtbGlzdCB7XHJcbiAgbWFyZ2luOiAwOyBwYWRkaW5nOiAwIDAgMCAxNHB4OyBmb250LXNpemU6IDExcHg7IGNvbG9yOiAjNjY2OyBsaXN0LXN0eWxlOiBkaXNjO1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY29wLW9wdGlvbnMtbGlzdCBsaSB7IHdoaXRlLXNwYWNlOiBub3dyYXA7IH1cclxuYDtcclxuXHJcbmZ1bmN0aW9uIG1haW4oKTogdm9pZCB7XHJcbiAgLy8gWHJtIGlzIG9ubHkgYXZhaWxhYmxlIGluIHRoZSBDUk0gZm9ybSBpZnJhbWUgXHUyMDE0IHNpbGVudGx5IHNraXAgb3RoZXIgZnJhbWVzXHJcbiAgaWYgKHR5cGVvZiBYcm0gPT09ICd1bmRlZmluZWQnIHx8ICFYcm0uUGFnZSB8fCAhWHJtLlBhZ2UudWkgfHwgIVhybS5QYWdlLmRhdGEpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNoZWxsID0gY3JlYXRlUGFuZWxTaGVsbCh7XHJcbiAgICBwYW5lbElkOiBQQU5FTF9JRCxcclxuICAgIHN0eWxlSWQ6IFNUWUxFX0lELFxyXG4gICAgdGl0bGU6ICdcdUQ4M0RcdUREMTggT3B0aW9uIFNldHMnLFxyXG4gICAgZXh0cmFDc3M6IEVYVFJBX0NTUyxcclxuICB9KTtcclxuICBpZiAoIXNoZWxsKSByZXR1cm47IC8vIHRvZ2dsZWQgb2ZmXHJcblxyXG4gIGNvbnN0IHsgcGFuZWwsIGJvZHkgfSA9IHNoZWxsO1xyXG5cclxuICBjb25zdCBsYWJlbE1hcCA9IGJ1aWxkTGFiZWxNYXAoKTtcclxuXHJcbiAgLy8gRmlsdGVyIHRvIG9ubHkgb3B0aW9uc2V0IC8gbXVsdGlzZWxlY3RvcHRpb25zZXQgYXR0cmlidXRlc1xyXG4gIGNvbnN0IGF0dHJzID0gWHJtLlBhZ2UuZGF0YS5lbnRpdHkuYXR0cmlidXRlcy5nZXQoKS5maWx0ZXIoXHJcbiAgICAoYSkgPT4gYS5nZXRBdHRyaWJ1dGVUeXBlKCkgPT09ICdvcHRpb25zZXQnIHx8IGEuZ2V0QXR0cmlidXRlVHlwZSgpID09PSAnbXVsdGlzZWxlY3RvcHRpb25zZXQnLFxyXG4gICk7XHJcbiAgY29uc3Qgc29ydGVkQXR0cnMgPSBbLi4uYXR0cnNdLnNvcnQoKGEsIGIpID0+IHtcclxuICAgIGNvbnN0IGxhID0gKGxhYmVsTWFwW2EuZ2V0TmFtZSgpXSB8fCBhLmdldE5hbWUoKSkudG9Mb3dlckNhc2UoKTtcclxuICAgIGNvbnN0IGxiID0gKGxhYmVsTWFwW2IuZ2V0TmFtZSgpXSB8fCBiLmdldE5hbWUoKSkudG9Mb3dlckNhc2UoKTtcclxuICAgIHJldHVybiBsYS5sb2NhbGVDb21wYXJlKGxiKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRW50aXR5IGluZm8gc3ViaGVhZGVyXHJcbiAgY29uc3QgZW50aXR5TmFtZSA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmdldEVudGl0eU5hbWUoKTtcclxuICBjb25zdCBlbnRpdHlJZCAgID0gWHJtLlBhZ2UuZGF0YS5lbnRpdHkuZ2V0SWQoKTtcclxuICBjb25zdCBzdWJoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBzdWJoZWFkZXIuY2xhc3NOYW1lID0gJ2RjYXQtc3ViaGVhZGVyJztcclxuICBzdWJoZWFkZXIuYXBwZW5kKCdFbnRpdHk6ICcpO1xyXG4gIHN1YmhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVDb3B5U3BhbihlbnRpdHlOYW1lLCBlbnRpdHlOYW1lKSk7XHJcbiAgc3ViaGVhZGVyLmFwcGVuZCgnICB8ICBJRDogJyk7XHJcbiAgaWYgKGVudGl0eUlkKSB7XHJcbiAgICBjb25zdCBjbGVhbklkID0gZW50aXR5SWQucmVwbGFjZSgvXlxce3xcXH0kL2csICcnKTtcclxuICAgIHN1YmhlYWRlci5hcHBlbmRDaGlsZChjcmVhdGVDb3B5U3BhbihlbnRpdHlJZCwgY2xlYW5JZCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdWJoZWFkZXIuYXBwZW5kKCcobmV3IHJlY29yZCknKTtcclxuICB9XHJcbiAgc3ViaGVhZGVyLmFwcGVuZChgICB8ICAke3NvcnRlZEF0dHJzLmxlbmd0aH0gb3B0aW9uIHNldCBmaWVsZChzKWApO1xyXG4gIHBhbmVsLmluc2VydEJlZm9yZShzdWJoZWFkZXIsIGJvZHkpO1xyXG5cclxuICAvLyBUYWJsZVxyXG4gIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKTtcclxuICBjb25zdCB0aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyk7XHJcbiAgdGhlYWQuaW5uZXJIVE1MID0gJzx0cj48dGg+TGFiZWw8L3RoPjx0aD5TY2hlbWEgTmFtZTwvdGg+PHRoPkN1cnJlbnQgVmFsdWU8L3RoPjx0aD5BbGwgT3B0aW9uczwvdGg+PC90cj4nO1xyXG4gIHRhYmxlLmFwcGVuZENoaWxkKHRoZWFkKTtcclxuICBjb25zdCB0Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rib2R5Jyk7XHJcblxyXG4gIHNvcnRlZEF0dHJzLmZvckVhY2goKGF0dHIpID0+IHtcclxuICAgIGNvbnN0IG5hbWUgID0gYXR0ci5nZXROYW1lKCk7XHJcbiAgICBjb25zdCBsYWJlbCA9IGxhYmVsTWFwW25hbWVdIHx8IG5hbWU7XHJcbiAgICBjb25zdCBjdXJyZW50VGV4dCA9IChhdHRyIGFzIFhybS5BdHRyaWJ1dGVzLk9wdGlvblNldEF0dHJpYnV0ZSkuZ2V0VGV4dD8uKCkgPz8gbnVsbDtcclxuXHJcbiAgICBsZXQgb3B0aW9uczogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IHZhbHVlOiBudW1iZXIgfT4gPSBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIG9wdGlvbnMgPSAoYXR0ciBhcyBYcm0uQXR0cmlidXRlcy5PcHRpb25TZXRBdHRyaWJ1dGUpLmdldE9wdGlvbnMoKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBvcHRpb25zID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG4gICAgdHIuZGF0YXNldC5zZWFyY2hMYWJlbCAgPSBsYWJlbC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgdHIuZGF0YXNldC5zZWFyY2hTY2hlbWEgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgY29uc3QgdGRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICB0ZExhYmVsLnRleHRDb250ZW50ID0gbGFiZWw7XHJcblxyXG4gICAgY29uc3QgdGRTY2hlbWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgdGRTY2hlbWEudGV4dENvbnRlbnQgPSBuYW1lO1xyXG5cclxuICAgIGNvbnN0IHRkQ3VycmVudFZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIGlmIChjdXJyZW50VGV4dCA9PT0gbnVsbCkge1xyXG4gICAgICBjb25zdCBudWxsU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgbnVsbFNwYW4uY2xhc3NOYW1lID0gJ2NvcC1udWxsJztcclxuICAgICAgbnVsbFNwYW4udGV4dENvbnRlbnQgPSAnbnVsbCc7XHJcbiAgICAgIHRkQ3VycmVudFZhbHVlLmFwcGVuZENoaWxkKG51bGxTcGFuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRkQ3VycmVudFZhbHVlLnRleHRDb250ZW50ID0gY3VycmVudFRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGRPcHRpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcclxuICAgIHVsLmNsYXNzTmFtZSA9ICdjb3Atb3B0aW9ucy1saXN0JztcclxuICAgIG9wdGlvbnMuZm9yRWFjaCgob3B0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgbGkuYXBwZW5kQ2hpbGQoY3JlYXRlQ29weVNwYW4oU3RyaW5nKG9wdC52YWx1ZSksIFN0cmluZyhvcHQudmFsdWUpKSk7XHJcbiAgICAgIGxpLmFwcGVuZChgOiAke29wdC50ZXh0fWApO1xyXG4gICAgICB1bC5hcHBlbmRDaGlsZChsaSk7XHJcbiAgICB9KTtcclxuICAgIHRkT3B0aW9ucy5hcHBlbmRDaGlsZCh1bCk7XHJcblxyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRMYWJlbCk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZFNjaGVtYSk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZEN1cnJlbnRWYWx1ZSk7XHJcbiAgICB0ci5hcHBlbmRDaGlsZCh0ZE9wdGlvbnMpO1xyXG4gICAgdGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xyXG4gIH0pO1xyXG5cclxuICB0YWJsZS5hcHBlbmRDaGlsZCh0Ym9keSk7XHJcblxyXG4gIGNvbnN0IG5vUmVzdWx0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIG5vUmVzdWx0cy5jbGFzc05hbWUgPSAnZGNhdC1uby1yZXN1bHRzJztcclxuICBub1Jlc3VsdHMudGV4dENvbnRlbnQgPSAnTm8gbWF0Y2hpbmcgZmllbGRzLic7XHJcbiAgbm9SZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gIC8vIFNlYXJjaCBiYXJcclxuICBjb25zdCBzZWFyY2ggPSBjcmVhdGVTZWFyY2hCYXIoe1xyXG4gICAgcGxhY2Vob2xkZXI6ICdTZWFyY2ggYnkgbGFiZWwgb3Igc2NoZW1hIG5hbWVcdTIwMjYnLFxyXG4gICAgb25GaWx0ZXI6IChxKSA9PiB7XHJcbiAgICAgIGxldCB2aXNpYmxlID0gMDtcclxuICAgICAgdGJvZHkucXVlcnlTZWxlY3RvckFsbDxIVE1MVGFibGVSb3dFbGVtZW50PigndHInKS5mb3JFYWNoKChyb3cpID0+IHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9ICFxXHJcbiAgICAgICAgICB8fCByb3cuZGF0YXNldC5zZWFyY2hMYWJlbCEuaW5jbHVkZXMocSlcclxuICAgICAgICAgIHx8IHJvdy5kYXRhc2V0LnNlYXJjaFNjaGVtYSEuaW5jbHVkZXMocSk7XHJcbiAgICAgICAgcm93LnN0eWxlLmRpc3BsYXkgPSBtYXRjaCA/ICcnIDogJ25vbmUnO1xyXG4gICAgICAgIGlmIChtYXRjaCkgdmlzaWJsZSsrO1xyXG4gICAgICB9KTtcclxuICAgICAgbm9SZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSB2aXNpYmxlID09PSAwID8gJycgOiAnbm9uZSc7XHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIGlzb2xhdGVLZXlib2FyZChzZWFyY2guaW5wdXQpO1xyXG4gIHBhbmVsLmluc2VydEJlZm9yZShzZWFyY2guY29udGFpbmVyLCBib2R5KTtcclxuXHJcbiAgYm9keS5hcHBlbmRDaGlsZCh0YWJsZSk7XHJcbiAgYm9keS5hcHBlbmRDaGlsZChub1Jlc3VsdHMpO1xyXG5cclxuICAvLyBTaXplIHRoZSBwYW5lbCB0byBmaXQgdGhlIHRhYmxlJ3MgbmF0dXJhbCB3aWR0aFxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCB0YWJsZVdpZHRoID0gdGFibGUub2Zmc2V0V2lkdGg7XHJcbiAgICBwYW5lbC5zdHlsZS53aWR0aCA9IE1hdGgubWluKE1hdGgubWF4KHRhYmxlV2lkdGgsIDQyMCksIHdpbmRvdy5pbm5lcldpZHRoICogMC45KSArICdweCc7XHJcbiAgfSk7XHJcbn1cclxuXHJcbm1haW4oKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBR08sV0FBUyxTQUE4QixJQUEwQixJQUFrQztBQUN4RyxRQUFJO0FBQ0osV0FBTyxJQUFJLFNBQVk7QUFDckIsbUJBQWEsS0FBSztBQUNsQixjQUFRLFdBQVcsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFFTyxXQUFTLGdCQUF3QztBQUN0RCxVQUFNLFdBQW1DLENBQUM7QUFDMUMsUUFBSSxLQUFLLEdBQUcsU0FBUyxRQUFRLENBQUMsU0FBUztBQUNyQyxZQUFNLE9BQU8sS0FBSyxRQUFRO0FBQzFCLFVBQUksTUFBTTtBQUNSLFlBQUk7QUFDRixtQkFBUyxJQUFJLElBQUssS0FBc0MsU0FBUyxLQUFLO0FBQUEsUUFDeEUsUUFBUTtBQUNOLG1CQUFTLElBQUksSUFBSTtBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUNELFdBQU87QUFBQSxFQUNUO0FBRU8sV0FBUyxjQUFjLE9BQW9CLFFBQXFCLFVBQTZCO0FBQ2xHLDBCQUFzQixNQUFNO0FBQzFCLFlBQU0sT0FBTyxNQUFNLHNCQUFzQjtBQUN6QyxZQUFNLE1BQU0sT0FB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
