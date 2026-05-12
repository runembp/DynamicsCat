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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hhcmVkLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L3BhbmVsLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L29wdGlvbi1zZXRzL29wdGlvbi1zZXRzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaGFyZWQgdXRpbGl0aWVzIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIEJ1bmRsZWQgaW5saW5lIGludG8gZWFjaCBzY3JpcHQgYnkgZXNidWlsZCBcdTIwMTQgbm8gc2VwYXJhdGUgb3V0cHV0IGZpbGUgbmVlZGVkLlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlPFQgZXh0ZW5kcyB1bmtub3duW10+KGZuOiAoLi4uYXJnczogVCkgPT4gdm9pZCwgbXM6IG51bWJlcik6ICguLi5hcmdzOiBUKSA9PiB2b2lkIHtcclxuICBsZXQgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+O1xyXG4gIHJldHVybiAoLi4uYXJnczogVCkgPT4ge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBmbiguLi5hcmdzKSwgbXMpO1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZExhYmVsTWFwKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xyXG4gIGNvbnN0IGxhYmVsTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgWHJtLlBhZ2UudWkuY29udHJvbHMuZm9yRWFjaCgoY3RybCkgPT4ge1xyXG4gICAgY29uc3QgbmFtZSA9IGN0cmwuZ2V0TmFtZSgpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsYWJlbE1hcFtuYW1lXSA9IChjdHJsIGFzIFhybS5Db250cm9scy5TdGFuZGFyZENvbnRyb2wpLmdldExhYmVsKCkgfHwgbmFtZTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgbGFiZWxNYXBbbmFtZV0gPSBuYW1lO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxhYmVsTWFwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZURyYWdnYWJsZShwYW5lbDogSFRNTEVsZW1lbnQsIGhhbmRsZTogSFRNTEVsZW1lbnQsIGNsb3NlQnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCByZWN0ID0gcGFuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBwYW5lbC5zdHlsZS5sZWZ0ICAgICAgPSByZWN0LmxlZnQgKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICAgICAgID0gcmVjdC50b3AgICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnJpZ2h0ICAgICA9ICcnO1xyXG4gICAgcGFuZWwuc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgfSk7XHJcblxyXG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xyXG4gIGxldCBvZmZzZXRYID0gMDtcclxuICBsZXQgb2Zmc2V0WSA9IDA7XHJcblxyXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcclxuICAgIGNvbnN0IHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlLmNsaWVudFggLSBvZmZzZXRYLCB3aW5kb3cuaW5uZXJXaWR0aCAgLSBwYW5lbC5vZmZzZXRXaWR0aCkpO1xyXG4gICAgY29uc3QgeSA9IE1hdGgubWF4KDAsIE1hdGgubWluKGUuY2xpZW50WSAtIG9mZnNldFksIHdpbmRvdy5pbm5lckhlaWdodCAtIHBhbmVsLm9mZnNldEhlaWdodCkpO1xyXG4gICAgcGFuZWwuc3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICA9IHkgKyAncHgnO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uTW91c2VVcCA9ICgpID0+IHsgZHJhZ2dpbmcgPSBmYWxzZTsgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdtb3ZlJzsgfTtcclxuXHJcbiAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7XHJcbiAgICBpZiAoY2xvc2VCdG4uY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHJldHVybjtcclxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcclxuICAgIG9mZnNldFggID0gZS5jbGllbnRYIC0gcGFuZWwub2Zmc2V0TGVmdDtcclxuICAgIG9mZnNldFkgID0gZS5jbGllbnRZIC0gcGFuZWwub2Zmc2V0VG9wO1xyXG4gICAgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgICBvbk1vdXNlVXApO1xyXG5cclxuICBuZXcgTXV0YXRpb25PYnNlcnZlcigoXywgb2JzKSA9PiB7XHJcbiAgICBpZiAoIWRvY3VtZW50LmNvbnRhaW5zKHBhbmVsKSkge1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XHJcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAgIG9uTW91c2VVcCk7XHJcbiAgICAgIG9icy5kaXNjb25uZWN0KCk7XHJcbiAgICB9XHJcbiAgfSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXhlY0NvbW1hbmRDb3B5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xyXG4gIGNvbnN0IHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcclxuICB0YS52YWx1ZSA9IHRleHQ7XHJcbiAgdGEuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpmaXhlZDtvcGFjaXR5OjA7cG9pbnRlci1ldmVudHM6bm9uZSc7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7XHJcbiAgdGEuc2VsZWN0KCk7XHJcbiAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcclxuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlUb0NsaXBib2FyZCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZD8ud3JpdGVUZXh0KSB7XHJcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KS5jYXRjaCgoKSA9PiBleGVjQ29tbWFuZENvcHkodGV4dCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBleGVjQ29tbWFuZENvcHkodGV4dCk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBUT0FTVF9DT05UQUlORVJfSUQgPSAnY3JtLXRvb2xzLXRvYXN0LWNvbnRhaW5lcic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvd1RvYXN0KG1lc3NhZ2U6IHN0cmluZywgdHlwZTogJ2luZm8nIHwgJ3dhcm4nID0gJ2luZm8nKTogdm9pZCB7XHJcbiAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFRPQVNUX0NPTlRBSU5FUl9JRCk7XHJcbiAgaWYgKCFjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgY29udGFpbmVyLmlkID0gVE9BU1RfQ09OVEFJTkVSX0lEO1xyXG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAgICdwb3NpdGlvbjogZml4ZWQnLCAnYm90dG9tOiAyNHB4JywgJ3JpZ2h0OiAyNHB4JyxcclxuICAgICAgJ3otaW5kZXg6IDIxNDc0ODM2NDcnLCAnZGlzcGxheTogZmxleCcsICdmbGV4LWRpcmVjdGlvbjogY29sdW1uJywgJ2dhcDogOHB4JyxcclxuICAgICAgJ3BvaW50ZXItZXZlbnRzOiBub25lJyxcclxuICAgIF0uam9pbignOyAnKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgdG9hc3Quc3R5bGUuY3NzVGV4dCA9IFtcclxuICAgICdiYWNrZ3JvdW5kOiAnICsgKHR5cGUgPT09ICd3YXJuJyA/ICcjZTY1MTAwJyA6ICcjMzIzMjMyJyksXHJcbiAgICAnY29sb3I6ICNmZmYnLFxyXG4gICAgJ2ZvbnQtZmFtaWx5OiBcIkdvb2dsZSBTYW5zXCIsIFJvYm90bywgXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZicsXHJcbiAgICAnZm9udC1zaXplOiAxM3B4JyxcclxuICAgICdwYWRkaW5nOiAxMHB4IDE2cHgnLFxyXG4gICAgJ2JvcmRlci1yYWRpdXM6IDZweCcsXHJcbiAgICAnYm94LXNoYWRvdzogMCAycHggOHB4IHJnYmEoMCwwLDAsMC4yNSknLFxyXG4gICAgJ3BvaW50ZXItZXZlbnRzOiBhdXRvJyxcclxuICAgICdvcGFjaXR5OiAxJyxcclxuICAgICd0cmFuc2l0aW9uOiBvcGFjaXR5IDAuM3MgZWFzZScsXHJcbiAgXS5qb2luKCc7ICcpO1xyXG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpO1xyXG5cclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIHRvYXN0LnN0eWxlLm9wYWNpdHkgPSAnMCc7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRvYXN0LnJlbW92ZSgpLCAzNTApO1xyXG4gIH0sIDM1MDApO1xyXG59XHJcbiIsICIvLyBTaGFyZWQgcGFuZWwgc2hlbGwgZm9yIER5bmFtaWNzQ2F0IGNvbnRlbnQgc2NyaXB0cy5cclxuLy8gUHJvdmlkZXMgdGhlIGNvbW1vbiBjaHJvbWUgKGNvbnRhaW5lciwgaGVhZGVyLCBjbG9zZSwgZHJhZywga2V5Ym9hcmQgaXNvbGF0aW9uKVxyXG4vLyBzbyBlYWNoIGZlYXR1cmUgc2NyaXB0IG9ubHkgYnVpbGRzIGl0cyBvd24gYm9keSBjb250ZW50LlxyXG5cclxuaW1wb3J0IHsgZGVib3VuY2UsIG1ha2VEcmFnZ2FibGUsIGNvcHlUb0NsaXBib2FyZCB9IGZyb20gJy4vc2hhcmVkJztcclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBUeXBlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZWxTaGVsbENvbmZpZyB7XHJcbiAgcGFuZWxJZDogc3RyaW5nO1xyXG4gIHN0eWxlSWQ6IHN0cmluZztcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIHZhcmlhbnQ/OiAnc2lkZWJhcicgfCAnZGlhbG9nJztcclxuICAvKiogQWRkaXRpb25hbCBDU1MgYXBwZW5kZWQgYWZ0ZXIgdGhlIGJhc2UgcGFuZWwgc3R5bGVzaGVldC4gKi9cclxuICBleHRyYUNzcz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lbFNoZWxsIHtcclxuICBwYW5lbDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgaGVhZGVyOiBIVE1MRGl2RWxlbWVudDtcclxuICBjbG9zZUJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgYm9keTogSFRNTERpdkVsZW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoQmFyIHtcclxuICBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIC8qKiBSZS1ydW4gdGhlIGN1cnJlbnQgZmlsdGVyIChlLmcuIGFmdGVyIHJlZnJlc2hpbmcgdGFibGUgZGF0YSkuICovXHJcbiAgdHJpZ2dlckZpbHRlcjogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKiogSWRlbXBvdGVudCBzdHlsZSBpbmplY3Rpb24gXHUyMDE0IG9ubHkgaW5zZXJ0cyBvbmNlIHBlciBzdHlsZUlkLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0U3R5bGVzaGVldChzdHlsZUlkOiBzdHJpbmcsIGNzczogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0eWxlSWQpKSByZXR1cm47XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLmlkID0gc3R5bGVJZDtcclxuICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcztcclxuICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcclxufVxyXG5cclxuLyoqIFByZXZlbnQgdGhlIENSTSBob3N0IHBhZ2UgZnJvbSBzd2FsbG93aW5nIGtleWJvYXJkIGV2ZW50cyBpbnNpZGUgaW5qZWN0ZWQgcGFuZWxzLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNvbGF0ZUtleWJvYXJkKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbn1cclxuXHJcbi8qKiBDbGljay10by1jb3B5IHNwYW4gd2l0aCBicmllZiBmbGFzaCBmZWVkYmFjay4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvcHlTcGFuKGRpc3BsYXk6IHN0cmluZywgY29weVZhbHVlOiBzdHJpbmcpOiBIVE1MU3BhbkVsZW1lbnQge1xyXG4gIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgc3Bhbi5jbGFzc05hbWUgPSAnZGNhdC1jb3B5LXZhbCc7XHJcbiAgc3Bhbi50ZXh0Q29udGVudCA9IGRpc3BsYXk7XHJcbiAgc3Bhbi50aXRsZSA9IGBDbGljayB0byBjb3B5OiAke2NvcHlWYWx1ZX1gO1xyXG4gIHNwYW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBjb3B5VG9DbGlwYm9hcmQoY29weVZhbHVlKTtcclxuICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZGNhdC1jb3BpZWQnKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gc3Bhbi5jbGFzc0xpc3QucmVtb3ZlKCdkY2F0LWNvcGllZCcpLCAxMjAwKTtcclxuICB9KTtcclxuICByZXR1cm4gc3BhbjtcclxufVxyXG5cclxuLyoqIENyZWF0ZXMgYSBzZWFyY2ggYmFyIHdpdGggZGVib3VuY2VkIGZpbHRlciBjYWxsYmFjay5cclxuICogIEluc2VydCB0aGUgcmV0dXJuZWQgY29udGFpbmVyIGludG8gdGhlIHBhbmVsIGJldHdlZW4gaGVhZGVyL3N1YmhlYWRlciBhbmQgYm9keS4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlYXJjaEJhcihvcHRzOiB7XHJcbiAgcGxhY2Vob2xkZXI6IHN0cmluZztcclxuICBvbkZpbHRlcjogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgZGVib3VuY2VNcz86IG51bWJlcjtcclxufSk6IFNlYXJjaEJhciB7XHJcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdkY2F0LXNlYXJjaCc7XHJcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gIGlucHV0LnR5cGUgPSAnc2VhcmNoJztcclxuICBpbnB1dC5wbGFjZWhvbGRlciA9IG9wdHMucGxhY2Vob2xkZXI7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKGlucHV0KTtcclxuXHJcbiAgY29uc3QgaGFuZGxlciA9IGRlYm91bmNlKCgpID0+IHtcclxuICAgIG9wdHMub25GaWx0ZXIoaW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCkpO1xyXG4gIH0sIG9wdHMuZGVib3VuY2VNcyA/PyAxMDApO1xyXG5cclxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZXIpO1xyXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnB1dCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBjb250YWluZXIsXHJcbiAgICBpbnB1dCxcclxuICAgIHRyaWdnZXJGaWx0ZXI6ICgpID0+IGlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcpKSxcclxuICB9O1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgQmFzZSBDU1MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG5mdW5jdGlvbiBiYXNlQ3NzKGlkOiBzdHJpbmcsIHZhcmlhbnQ6ICdzaWRlYmFyJyB8ICdkaWFsb2cnKTogc3RyaW5nIHtcclxuICBjb25zdCBjb250YWluZXJDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcG9zaXRpb246IGZpeGVkOyB0b3A6IDUwJTsgbGVmdDogNTAlOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTsgd2lkdGg6IDM4MHB4O1xyXG4gICAgICAgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAycHggc29saWQgIzFlNjRjODsgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgICAgYm94LXNoYWRvdzogMCA0cHggMjRweCByZ2JhKDAsMCwwLDAuMik7XHJcbiAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ3OyBvdmVyZmxvdzogaGlkZGVuO1xyXG4gICAgICAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzIyMjtgXHJcbiAgICA6IGBwb3NpdGlvbjogZml4ZWQ7IHRvcDogMDsgcmlnaHQ6IDA7IHdpZHRoOiBhdXRvOyBtaW4td2lkdGg6IDU1MHB4OyBtYXgtd2lkdGg6IDkwdnc7IG1heC1oZWlnaHQ6IDkwdmg7XHJcbiAgICAgICBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDJweCBzb2xpZCAjMWU2NGM4O1xyXG4gICAgICAgYm94LXNoYWRvdzogLTRweCAwIDE2cHggcmdiYSgwLDAsMCwwLjE4KTtcclxuICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICAgICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjMjIyO2A7XHJcblxyXG4gIGNvbnN0IGJvZHlDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcGFkZGluZzogMTRweDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxMHB4O2BcclxuICAgIDogYG92ZXJmbG93LXk6IGF1dG87IG92ZXJmbG93LXg6IGF1dG87IGZsZXg6IDE7YDtcclxuXHJcbiAgcmV0dXJuIGBcclxuIyR7aWR9IHsgJHtjb250YWluZXJDc3N9IH1cclxuIyR7aWR9IC5kY2F0LWhlYWRlciB7XHJcbiAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA2cHg7XHJcbiAgYmFja2dyb3VuZDogIzFlNjRjODsgY29sb3I6ICNmZmY7IHBhZGRpbmc6IDEwcHggMTRweDsgZmxleC1zaHJpbms6IDA7XHJcbiAgY3Vyc29yOiBtb3ZlOyB1c2VyLXNlbGVjdDogbm9uZTtcclxufVxyXG4jJHtpZH0gLmRjYXQtdGl0bGUgeyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGZsZXg6IDE7IH1cclxuIyR7aWR9IC5kY2F0LWNsb3NlIHtcclxuICBiYWNrZ3JvdW5kOiBub25lOyBib3JkZXI6IG5vbmU7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE4cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDE7IGN1cnNvcjogcG9pbnRlcjsgcGFkZGluZzogMCAycHg7IG9wYWNpdHk6IDAuODU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LWNsb3NlOmhvdmVyIHsgb3BhY2l0eTogMTsgfVxyXG4jJHtpZH0gLmRjYXQtYm9keSB7ICR7Ym9keUNzc30gfVxyXG4jJHtpZH0gLmRjYXQtc3ViaGVhZGVyIHtcclxuICBwYWRkaW5nOiA2cHggMTRweDsgYmFja2dyb3VuZDogI2U4ZjBmZTsgZm9udC1zaXplOiAxMnB4O1xyXG4gIGNvbG9yOiAjMWU2NGM4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M1ZDhmYjsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCB7XHJcbiAgcGFkZGluZzogOHB4IDE0cHg7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzVkOGZiOyBmbGV4LXNocmluazogMDtcclxufVxyXG4jJHtpZH0gLmRjYXQtc2VhcmNoIGlucHV0IHtcclxuICB3aWR0aDogMTAwJTsgYm94LXNpemluZzogYm9yZGVyLWJveDsgcGFkZGluZzogNXB4IDEwcHg7XHJcbiAgYm9yZGVyOiAxcHggc29saWQgI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogNHB4OyBmb250LXNpemU6IDEzcHg7XHJcbiAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgY29sb3I6ICMyMjI7IG91dGxpbmU6IG5vbmU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCBpbnB1dDpmb2N1cyB7IGJvcmRlci1jb2xvcjogIzFlNjRjODsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwge1xyXG4gIGN1cnNvcjogcG9pbnRlcjsgYm9yZGVyLWJvdHRvbTogMXB4IGRhc2hlZCAjMWU2NGM4OyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzO1xyXG59XHJcbiMke2lkfSAuZGNhdC1jb3B5LXZhbDpob3ZlciB7IGJhY2tncm91bmQ6ICNjNWQ4ZmI7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwuZGNhdC1jb3BpZWQgeyBiYWNrZ3JvdW5kOiAjYjdmMGM4OyBib3JkZXItYm90dG9tLWNvbG9yOiAjMmE5YzUyOyBib3JkZXItcmFkaXVzOiAzcHg7IH1cclxuIyR7aWR9IC5kY2F0LW5vLXJlc3VsdHMge1xyXG4gIHBhZGRpbmc6IDE2cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYztcclxufVxyXG5gO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgUGFuZWwgc2hlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgY29tbW9uIHBhbmVsIGNocm9tZSAodG9nZ2xlLCBzdHlsZSBpbmplY3Rpb24sIGhlYWRlciwgZHJhZywgY2xvc2UpLlxyXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgcGFuZWwgd2FzIHRvZ2dsZWQgT0ZGIChhbHJlYWR5IGV4aXN0ZWQgYW5kIHdhcyByZW1vdmVkKS5cclxuICogQ2FsbGVycyBwb3B1bGF0ZSB0aGUgcmV0dXJuZWQgYGJvZHlgIGVsZW1lbnQgd2l0aCBmZWF0dXJlLXNwZWNpZmljIGNvbnRlbnQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGFuZWxTaGVsbChjb25maWc6IFBhbmVsU2hlbGxDb25maWcpOiBQYW5lbFNoZWxsIHwgbnVsbCB7XHJcbiAgLy8gVG9nZ2xlOiByZW1vdmUgaWYgYWxyZWFkeSBwcmVzZW50XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb25maWcucGFuZWxJZCk7XHJcbiAgaWYgKGV4aXN0aW5nKSB7IGV4aXN0aW5nLnJlbW92ZSgpOyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICBjb25zdCB2YXJpYW50ID0gY29uZmlnLnZhcmlhbnQgPz8gJ3NpZGViYXInO1xyXG4gIGluamVjdFN0eWxlc2hlZXQoY29uZmlnLnN0eWxlSWQsIGJhc2VDc3MoY29uZmlnLnBhbmVsSWQsIHZhcmlhbnQpICsgKGNvbmZpZy5leHRyYUNzcyA/PyAnJykpO1xyXG5cclxuICBjb25zdCBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHBhbmVsLmlkID0gY29uZmlnLnBhbmVsSWQ7XHJcblxyXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGhlYWRlci5jbGFzc05hbWUgPSAnZGNhdC1oZWFkZXInO1xyXG5cclxuICBjb25zdCB0aXRsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHRpdGxlRWwuY2xhc3NOYW1lID0gJ2RjYXQtdGl0bGUnO1xyXG4gIHRpdGxlRWwudGV4dENvbnRlbnQgPSBjb25maWcudGl0bGU7XHJcblxyXG4gIGNvbnN0IGNsb3NlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgY2xvc2VCdG4uY2xhc3NOYW1lID0gJ2RjYXQtY2xvc2UnO1xyXG4gIGNsb3NlQnRuLnRpdGxlID0gJ0Nsb3NlJztcclxuICBjbG9zZUJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTUnO1xyXG4gIGNsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gcGFuZWwucmVtb3ZlKCkpO1xyXG5cclxuICBoZWFkZXIuYXBwZW5kKHRpdGxlRWwsIGNsb3NlQnRuKTtcclxuXHJcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGJvZHkuY2xhc3NOYW1lID0gJ2RjYXQtYm9keSc7XHJcblxyXG4gIHBhbmVsLmFwcGVuZChoZWFkZXIsIGJvZHkpO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFuZWwpO1xyXG4gIG1ha2VEcmFnZ2FibGUocGFuZWwsIGhlYWRlciwgY2xvc2VCdG4pO1xyXG5cclxuICByZXR1cm4geyBwYW5lbCwgaGVhZGVyLCBjbG9zZUJ0biwgYm9keSB9O1xyXG59XHJcbiIsICIvLyBJbmplY3RlZCBpbnRvIENSTSBmb3JtIGZyYW1lcyB2aWEgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0LlxyXG4vLyBSZWFkcyBhbGwgb3B0aW9uc2V0L211bHRpc2VsZWN0b3B0aW9uc2V0IGF0dHJpYnV0ZXMgYW5kIHJlbmRlcnMgYSBzaWRlLXBhbmVsLlxyXG5cclxuaW1wb3J0IHsgYnVpbGRMYWJlbE1hcCB9IGZyb20gJy4uL3NoYXJlZCc7XHJcbmltcG9ydCB7IGNyZWF0ZVBhbmVsU2hlbGwsIGNyZWF0ZVNlYXJjaEJhciwgY3JlYXRlQ29weVNwYW4sIGlzb2xhdGVLZXlib2FyZCB9IGZyb20gJy4uL3BhbmVsJztcclxuXHJcbmNvbnN0IFBBTkVMX0lEID0gJ2NybS10b29scy1vcHRpb25zZXRzLXBhbmVsJztcclxuY29uc3QgU1RZTEVfSUQgPSAnY3JtLXRvb2xzLW9wdGlvbnNldHMtc3R5bGUnO1xyXG5cclxuY29uc3QgRVhUUkFfQ1NTID0gYFxyXG4jJHtQQU5FTF9JRH0gdGFibGUgeyB3aWR0aDogMTAwJTsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgfVxyXG4jJHtQQU5FTF9JRH0gdGhlYWQgdGgge1xyXG4gIHBvc2l0aW9uOiBzdGlja3k7IHRvcDogMDsgYmFja2dyb3VuZDogI2YwZjRmZjtcclxuICBib3JkZXItYm90dG9tOiAycHggc29saWQgIzFlNjRjODsgcGFkZGluZzogN3B4IDEwcHg7IHRleHQtYWxpZ246IGxlZnQ7XHJcbiAgZm9udC1zaXplOiAxMXB4OyBmb250LXdlaWdodDogNzAwOyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gIGxldHRlci1zcGFjaW5nOiAwLjRweDsgY29sb3I6ICM0NDQ7IHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuIyR7UEFORUxfSUR9IHRib2R5IHRyOm50aC1jaGlsZChldmVuKSB7IGJhY2tncm91bmQ6ICNmOGY5ZmY7IH1cclxuIyR7UEFORUxfSUR9IHRib2R5IHRyOmhvdmVyIHsgYmFja2dyb3VuZDogI2RjZWFmZTsgfVxyXG4jJHtQQU5FTF9JRH0gdGQge1xyXG4gIHBhZGRpbmc6IDVweCAxMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U4ZThlODsgdmVydGljYWwtYWxpZ246IHRvcDtcclxufVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDEpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDEpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDIpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDIpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDMpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDMpIHsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDQpLCAjJHtQQU5FTF9JRH0gdGg6bnRoLWNoaWxkKDQpIHsgbWluLXdpZHRoOiAxODBweDsgbWF4LXdpZHRoOiAzNjBweDsgd29yZC1icmVhazogYnJlYWstd29yZDsgfVxyXG4jJHtQQU5FTF9JRH0gdGQ6bnRoLWNoaWxkKDIpIHtcclxuICBmb250LWZhbWlseTogQ29uc29sYXMsIG1vbm9zcGFjZTsgZm9udC1zaXplOiAxMnB4OyBjb2xvcjogIzU1NTtcclxufVxyXG4jJHtQQU5FTF9JRH0gLmNvcC1udWxsIHsgY29sb3I6ICNhYWE7IGZvbnQtc3R5bGU6IGl0YWxpYzsgfVxyXG4jJHtQQU5FTF9JRH0gLmNvcC1vcHRpb25zLWxpc3Qge1xyXG4gIG1hcmdpbjogMDsgcGFkZGluZzogMCAwIDAgMTRweDsgZm9udC1zaXplOiAxMXB4OyBjb2xvcjogIzY2NjsgbGlzdC1zdHlsZTogZGlzYztcclxufVxyXG4jJHtQQU5FTF9JRH0gLmNvcC1vcHRpb25zLWxpc3QgbGkgeyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbmA7XHJcblxyXG5mdW5jdGlvbiBtYWluKCk6IHZvaWQge1xyXG4gIC8vIFhybSBpcyBvbmx5IGF2YWlsYWJsZSBpbiB0aGUgQ1JNIGZvcm0gaWZyYW1lIFx1MjAxNCBzaWxlbnRseSBza2lwIG90aGVyIGZyYW1lc1xyXG4gIGlmICh0eXBlb2YgWHJtID09PSAndW5kZWZpbmVkJyB8fCAhWHJtLlBhZ2UgfHwgIVhybS5QYWdlLnVpIHx8ICFYcm0uUGFnZS5kYXRhKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzaGVsbCA9IGNyZWF0ZVBhbmVsU2hlbGwoe1xyXG4gICAgcGFuZWxJZDogUEFORUxfSUQsXHJcbiAgICBzdHlsZUlkOiBTVFlMRV9JRCxcclxuICAgIHRpdGxlOiAnXHVEODNEXHVERDE4IE9wdGlvbiBTZXRzJyxcclxuICAgIGV4dHJhQ3NzOiBFWFRSQV9DU1MsXHJcbiAgfSk7XHJcbiAgaWYgKCFzaGVsbCkgcmV0dXJuOyAvLyB0b2dnbGVkIG9mZlxyXG5cclxuICBjb25zdCB7IHBhbmVsLCBib2R5IH0gPSBzaGVsbDtcclxuXHJcbiAgY29uc3QgbGFiZWxNYXAgPSBidWlsZExhYmVsTWFwKCk7XHJcblxyXG4gIC8vIEZpbHRlciB0byBvbmx5IG9wdGlvbnNldCAvIG11bHRpc2VsZWN0b3B0aW9uc2V0IGF0dHJpYnV0ZXNcclxuICBjb25zdCBhdHRycyA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmF0dHJpYnV0ZXMuZ2V0KCkuZmlsdGVyKFxyXG4gICAgKGEpID0+IGEuZ2V0QXR0cmlidXRlVHlwZSgpID09PSAnb3B0aW9uc2V0JyB8fCBhLmdldEF0dHJpYnV0ZVR5cGUoKSA9PT0gJ211bHRpc2VsZWN0b3B0aW9uc2V0JyxcclxuICApO1xyXG4gIGNvbnN0IHNvcnRlZEF0dHJzID0gWy4uLmF0dHJzXS5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICBjb25zdCBsYSA9IChsYWJlbE1hcFthLmdldE5hbWUoKV0gfHwgYS5nZXROYW1lKCkpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBjb25zdCBsYiA9IChsYWJlbE1hcFtiLmdldE5hbWUoKV0gfHwgYi5nZXROYW1lKCkpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICByZXR1cm4gbGEubG9jYWxlQ29tcGFyZShsYik7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEVudGl0eSBpbmZvIHN1YmhlYWRlclxyXG4gIGNvbnN0IGVudGl0eU5hbWUgPSBYcm0uUGFnZS5kYXRhLmVudGl0eS5nZXRFbnRpdHlOYW1lKCk7XHJcbiAgY29uc3QgZW50aXR5SWQgICA9IFhybS5QYWdlLmRhdGEuZW50aXR5LmdldElkKCk7XHJcbiAgY29uc3Qgc3ViaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgc3ViaGVhZGVyLmNsYXNzTmFtZSA9ICdkY2F0LXN1YmhlYWRlcic7XHJcbiAgc3ViaGVhZGVyLmFwcGVuZCgnRW50aXR5OiAnKTtcclxuICBzdWJoZWFkZXIuYXBwZW5kQ2hpbGQoY3JlYXRlQ29weVNwYW4oZW50aXR5TmFtZSwgZW50aXR5TmFtZSkpO1xyXG4gIHN1YmhlYWRlci5hcHBlbmQoJyAgfCAgSUQ6ICcpO1xyXG4gIGlmIChlbnRpdHlJZCkge1xyXG4gICAgY29uc3QgY2xlYW5JZCA9IGVudGl0eUlkLnJlcGxhY2UoL15cXHt8XFx9JC9nLCAnJyk7XHJcbiAgICBzdWJoZWFkZXIuYXBwZW5kQ2hpbGQoY3JlYXRlQ29weVNwYW4oZW50aXR5SWQsIGNsZWFuSWQpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgc3ViaGVhZGVyLmFwcGVuZCgnKG5ldyByZWNvcmQpJyk7XHJcbiAgfVxyXG4gIHN1YmhlYWRlci5hcHBlbmQoYCAgfCAgJHtzb3J0ZWRBdHRycy5sZW5ndGh9IG9wdGlvbiBzZXQgZmllbGQocylgKTtcclxuICBwYW5lbC5pbnNlcnRCZWZvcmUoc3ViaGVhZGVyLCBib2R5KTtcclxuXHJcbiAgLy8gVGFibGVcclxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XHJcbiAgY29uc3QgdGhlYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpO1xyXG4gIHRoZWFkLmlubmVySFRNTCA9ICc8dHI+PHRoPkxhYmVsPC90aD48dGg+U2NoZW1hIE5hbWU8L3RoPjx0aD5DdXJyZW50IFZhbHVlPC90aD48dGg+QWxsIE9wdGlvbnM8L3RoPjwvdHI+JztcclxuICB0YWJsZS5hcHBlbmRDaGlsZCh0aGVhZCk7XHJcbiAgY29uc3QgdGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpO1xyXG5cclxuICBzb3J0ZWRBdHRycy5mb3JFYWNoKChhdHRyKSA9PiB7XHJcbiAgICBjb25zdCBuYW1lICA9IGF0dHIuZ2V0TmFtZSgpO1xyXG4gICAgY29uc3QgbGFiZWwgPSBsYWJlbE1hcFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgY29uc3QgY3VycmVudFRleHQgPSAoYXR0ciBhcyBYcm0uQXR0cmlidXRlcy5PcHRpb25TZXRBdHRyaWJ1dGUpLmdldFRleHQ/LigpID8/IG51bGw7XHJcblxyXG4gICAgbGV0IG9wdGlvbnM6IEFycmF5PHsgdGV4dDogc3RyaW5nOyB2YWx1ZTogbnVtYmVyIH0+ID0gW107XHJcbiAgICB0cnkge1xyXG4gICAgICBvcHRpb25zID0gKGF0dHIgYXMgWHJtLkF0dHJpYnV0ZXMuT3B0aW9uU2V0QXR0cmlidXRlKS5nZXRPcHRpb25zKCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgb3B0aW9ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuICAgIHRyLmRhdGFzZXQuc2VhcmNoTGFiZWwgID0gbGFiZWwudG9Mb3dlckNhc2UoKTtcclxuICAgIHRyLmRhdGFzZXQuc2VhcmNoU2NoZW1hID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGNvbnN0IHRkTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgdGRMYWJlbC50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG5cclxuICAgIGNvbnN0IHRkU2NoZW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgIHRkU2NoZW1hLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICBjb25zdCB0ZEN1cnJlbnRWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICBpZiAoY3VycmVudFRleHQgPT09IG51bGwpIHtcclxuICAgICAgY29uc3QgbnVsbFNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgIG51bGxTcGFuLmNsYXNzTmFtZSA9ICdjb3AtbnVsbCc7XHJcbiAgICAgIG51bGxTcGFuLnRleHRDb250ZW50ID0gJ251bGwnO1xyXG4gICAgICB0ZEN1cnJlbnRWYWx1ZS5hcHBlbmRDaGlsZChudWxsU3Bhbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0ZEN1cnJlbnRWYWx1ZS50ZXh0Q29udGVudCA9IGN1cnJlbnRUZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRkT3B0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XHJcbiAgICB1bC5jbGFzc05hbWUgPSAnY29wLW9wdGlvbnMtbGlzdCc7XHJcbiAgICBvcHRpb25zLmZvckVhY2goKG9wdCkgPT4ge1xyXG4gICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICAgIGxpLmFwcGVuZENoaWxkKGNyZWF0ZUNvcHlTcGFuKFN0cmluZyhvcHQudmFsdWUpLCBTdHJpbmcob3B0LnZhbHVlKSkpO1xyXG4gICAgICBsaS5hcHBlbmQoYDogJHtvcHQudGV4dH1gKTtcclxuICAgICAgdWwuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgfSk7XHJcbiAgICB0ZE9wdGlvbnMuYXBwZW5kQ2hpbGQodWwpO1xyXG5cclxuICAgIHRyLmFwcGVuZENoaWxkKHRkTGFiZWwpO1xyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRTY2hlbWEpO1xyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRDdXJyZW50VmFsdWUpO1xyXG4gICAgdHIuYXBwZW5kQ2hpbGQodGRPcHRpb25zKTtcclxuICAgIHRib2R5LmFwcGVuZENoaWxkKHRyKTtcclxuICB9KTtcclxuXHJcbiAgdGFibGUuYXBwZW5kQ2hpbGQodGJvZHkpO1xyXG5cclxuICBjb25zdCBub1Jlc3VsdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBub1Jlc3VsdHMuY2xhc3NOYW1lID0gJ2RjYXQtbm8tcmVzdWx0cyc7XHJcbiAgbm9SZXN1bHRzLnRleHRDb250ZW50ID0gJ05vIG1hdGNoaW5nIGZpZWxkcy4nO1xyXG4gIG5vUmVzdWx0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cclxuICAvLyBTZWFyY2ggYmFyXHJcbiAgY29uc3Qgc2VhcmNoID0gY3JlYXRlU2VhcmNoQmFyKHtcclxuICAgIHBsYWNlaG9sZGVyOiAnU2VhcmNoIGJ5IGxhYmVsIG9yIHNjaGVtYSBuYW1lXHUyMDI2JyxcclxuICAgIG9uRmlsdGVyOiAocSkgPT4ge1xyXG4gICAgICBsZXQgdmlzaWJsZSA9IDA7XHJcbiAgICAgIHRib2R5LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRhYmxlUm93RWxlbWVudD4oJ3RyJykuZm9yRWFjaCgocm93KSA9PiB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSAhcVxyXG4gICAgICAgICAgfHwgcm93LmRhdGFzZXQuc2VhcmNoTGFiZWwhLmluY2x1ZGVzKHEpXHJcbiAgICAgICAgICB8fCByb3cuZGF0YXNldC5zZWFyY2hTY2hlbWEhLmluY2x1ZGVzKHEpO1xyXG4gICAgICAgIHJvdy5zdHlsZS5kaXNwbGF5ID0gbWF0Y2ggPyAnJyA6ICdub25lJztcclxuICAgICAgICBpZiAobWF0Y2gpIHZpc2libGUrKztcclxuICAgICAgfSk7XHJcbiAgICAgIG5vUmVzdWx0cy5zdHlsZS5kaXNwbGF5ID0gdmlzaWJsZSA9PT0gMCA/ICcnIDogJ25vbmUnO1xyXG4gICAgfSxcclxuICB9KTtcclxuICBpc29sYXRlS2V5Ym9hcmQoc2VhcmNoLmlucHV0KTtcclxuICBwYW5lbC5pbnNlcnRCZWZvcmUoc2VhcmNoLmNvbnRhaW5lciwgYm9keSk7XHJcblxyXG4gIGJvZHkuYXBwZW5kQ2hpbGQodGFibGUpO1xyXG4gIGJvZHkuYXBwZW5kQ2hpbGQobm9SZXN1bHRzKTtcclxuXHJcbiAgLy8gU2l6ZSB0aGUgcGFuZWwgdG8gZml0IHRoZSB0YWJsZSdzIG5hdHVyYWwgd2lkdGhcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgY29uc3QgdGFibGVXaWR0aCA9IHRhYmxlLm9mZnNldFdpZHRoO1xyXG4gICAgcGFuZWwuc3R5bGUud2lkdGggPSBNYXRoLm1pbihNYXRoLm1heCh0YWJsZVdpZHRoLCA0MjApLCB3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOSkgKyAncHgnO1xyXG4gIH0pO1xyXG59XHJcblxyXG5tYWluKCk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQUdPLFdBQVMsU0FBOEIsSUFBMEIsSUFBa0M7QUFDeEcsUUFBSTtBQUNKLFdBQU8sSUFBSSxTQUFZO0FBQ3JCLG1CQUFhLEtBQUs7QUFDbEIsY0FBUSxXQUFXLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBRU8sV0FBUyxnQkFBd0M7QUFDdEQsVUFBTSxXQUFtQyxDQUFDO0FBQzFDLFFBQUksS0FBSyxHQUFHLFNBQVMsUUFBUSxDQUFDLFNBQVM7QUFDckMsWUFBTSxPQUFPLEtBQUssUUFBUTtBQUMxQixVQUFJLE1BQU07QUFDUixZQUFJO0FBQ0YsbUJBQVMsSUFBSSxJQUFLLEtBQXNDLFNBQVMsS0FBSztBQUFBLFFBQ3hFLFFBQVE7QUFDTixtQkFBUyxJQUFJLElBQUk7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFDRCxXQUFPO0FBQUEsRUFDVDtBQUVPLFdBQVMsY0FBYyxPQUFvQixRQUFxQixVQUE2QjtBQUNsRywwQkFBc0IsTUFBTTtBQUMxQixZQUFNLE9BQU8sTUFBTSxzQkFBc0I7QUFDekMsWUFBTSxNQUFNLE9BQVksS0FBSyxPQUFPO0FBQ3BDLFlBQU0sTUFBTSxN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
