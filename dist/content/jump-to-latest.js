"use strict";
(() => {
  // src/content/shared.ts
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
  var TOAST_CONTAINER_ID = "crm-tools-toast-container";
  function showToast(message, type = "info") {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = TOAST_CONTAINER_ID;
      container.style.cssText = [
        "position: fixed",
        "bottom: 24px",
        "right: 24px",
        "z-index: 2147483647",
        "display: flex",
        "flex-direction: column",
        "gap: 8px",
        "pointer-events: none"
      ].join("; ");
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.cssText = [
      "background: " + (type === "warn" ? "#e65100" : "#323232"),
      "color: #fff",
      'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',
      "font-size: 13px",
      "padding: 10px 16px",
      "border-radius: 6px",
      "box-shadow: 0 2px 8px rgba(0,0,0,0.25)",
      "pointer-events: auto",
      "opacity: 1",
      "transition: opacity 0.3s ease"
    ].join("; ");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 350);
    }, 3500);
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

  // src/content/jump-to-latest/jump-to-latest.ts
  var PANEL_ID = "crm-tools-newest-modified-panel";
  var STYLE_ID = "crm-tools-newest-modified-style";
  var LIST_ID = "crm-tools-newest-modified-list";
  var CACHE_KEY = "__dynamicscat_entity_cache";
  var LAST_ENTITY_KEY = "__dynamicscat_last_entity";
  var TTL_MS = 7 * 24 * 60 * 60 * 1e3;
  var GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var EXTRA_CSS = `
#${PANEL_ID} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${PANEL_ID} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${PANEL_ID} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${PANEL_ID} .cnm-input:focus { border-color: #1e64c8; }
#${PANEL_ID} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${PANEL_ID} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${PANEL_ID} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${PANEL_ID} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#${PANEL_ID} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${PANEL_ID} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${PANEL_ID} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${PANEL_ID} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${PANEL_ID} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${PANEL_ID} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${PANEL_ID} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${PANEL_ID} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${PANEL_ID} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${PANEL_ID} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;
  function apiVersionFromCrmVersion(crmVersion) {
    const major = parseInt(crmVersion.split(".")[0] ?? "8", 10);
    return major >= 9 ? "v9.0" : "v8.2";
  }
  function getDisplayName(meta) {
    return meta.DisplayName?.UserLocalizedLabel?.Label ?? meta.LogicalName;
  }
  function loadCachedEntities(clientUrl) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (cache.clientUrl !== clientUrl) return null;
      if (Date.now() - cache.timestamp >= TTL_MS) return null;
      return cache.entities;
    } catch {
      return null;
    }
  }
  function saveCachedEntities(clientUrl, entities) {
    try {
      const cache = { clientUrl, entities, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
    }
  }
  async function main() {
    if (typeof Xrm === "undefined" || !Xrm.Page?.context) return;
    const shell = createPanelShell({
      panelId: PANEL_ID,
      styleId: STYLE_ID,
      title: "\u{1F550} Jump to Latest",
      variant: "dialog",
      extraCss: EXTRA_CSS
    });
    if (!shell) return;
    const { panel, body } = shell;
    const clientUrl = Xrm.Page.context.getClientUrl();
    const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());
    const entityRow = document.createElement("div");
    entityRow.className = "cnm-row";
    const entityLabel = document.createElement("label");
    entityLabel.className = "cnm-label";
    entityLabel.textContent = "Entity";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "cnm-input";
    input.placeholder = "Loading\u2026";
    input.disabled = true;
    input.setAttribute("list", LIST_ID);
    input.setAttribute("autocomplete", "off");
    const datalist = document.createElement("datalist");
    datalist.id = LIST_ID;
    isolateKeyboard(input);
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "cnm-refresh-btn";
    refreshBtn.textContent = "\u{1F504}";
    refreshBtn.title = "Refresh entity list";
    entityRow.append(entityLabel, input, refreshBtn, datalist);
    const guidRow = document.createElement("div");
    guidRow.className = "cnm-row";
    const guidLabel = document.createElement("label");
    guidLabel.className = "cnm-label";
    guidLabel.textContent = "Record ID";
    const guidInput = document.createElement("input");
    guidInput.type = "text";
    guidInput.className = "cnm-input";
    guidInput.placeholder = "Optional GUID\u2026";
    isolateKeyboard(guidInput);
    guidInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void openRecord();
    });
    guidRow.append(guidLabel, guidInput);
    let sortField = "modifiedon";
    const sortRow = document.createElement("div");
    sortRow.className = "cnm-row";
    const sortLabel = document.createElement("span");
    sortLabel.className = "cnm-label";
    sortLabel.textContent = "Sort by";
    const sortBtns = [];
    const makeSortBtn = (text, field) => {
      const btn = document.createElement("button");
      btn.className = "cnm-sort-btn" + (field === sortField ? " cnm-sort-active" : "");
      btn.textContent = text;
      sortBtns.push(btn);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        sortField = field;
        sortBtns.forEach((b) => b.classList.remove("cnm-sort-active"));
        btn.classList.add("cnm-sort-active");
      });
      return btn;
    };
    sortRow.append(sortLabel, makeSortBtn("Newest Modified", "modifiedon"), makeSortBtn("Newest Created", "createdon"));
    const actionRow = document.createElement("div");
    actionRow.className = "cnm-row cnm-action-row";
    const openBtn = document.createElement("button");
    openBtn.className = "cnm-open-btn";
    openBtn.textContent = "Open Record";
    openBtn.disabled = true;
    const withinInput = document.createElement("input");
    withinInput.type = "number";
    withinInput.className = "cnm-within-input";
    withinInput.min = "1";
    withinInput.value = "14";
    withinInput.title = "Limit search to last N days (leave empty for all time)";
    isolateKeyboard(withinInput);
    actionRow.append(withinInput, openBtn);
    guidInput.addEventListener("input", () => {
      const isGuid = GUID_RE.test(guidInput.value.trim());
      sortBtns.forEach((b) => {
        b.disabled = isGuid;
      });
    });
    body.append(entityRow, guidRow, sortRow, actionRow);
    let allEntities = [];
    async function fetchEntities(bypassCache = false) {
      if (!bypassCache) {
        const cached = loadCachedEntities(clientUrl);
        if (cached) {
          allEntities = cached;
          return true;
        }
      }
      try {
        const res = await fetch(
          `${clientUrl}/api/data/${apiVersion}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`
        );
        const json = await res.json();
        allEntities = json.value.filter((e) => e.EntitySetName).sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
        saveCachedEntities(clientUrl, allEntities);
        return true;
      } catch {
        return false;
      }
    }
    function populateDatalist() {
      datalist.innerHTML = "";
      for (const e of allEntities) {
        const opt = document.createElement("option");
        opt.value = getDisplayName(e);
        opt.label = e.LogicalName;
        datalist.appendChild(opt);
      }
    }
    input.placeholder = "Loading\u2026";
    input.disabled = true;
    if (await fetchEntities()) {
      populateDatalist();
      input.placeholder = "Type entity name\u2026";
      input.disabled = false;
      openBtn.disabled = false;
      const lastEntity = localStorage.getItem(LAST_ENTITY_KEY);
      if (lastEntity) input.value = lastEntity;
      input.focus();
    } else {
      input.placeholder = "Failed to load entities";
      showToast("Could not load entity list.", "warn");
      return;
    }
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.classList.add("cnm-spinning");
      input.disabled = true;
      input.placeholder = "Refreshing\u2026";
      localStorage.removeItem(CACHE_KEY);
      if (await fetchEntities(true)) {
        populateDatalist();
        input.placeholder = "Type entity name\u2026";
        input.disabled = false;
      } else {
        input.placeholder = "Refresh failed";
        showToast("Could not refresh entity list.", "warn");
        input.disabled = false;
      }
      refreshBtn.classList.remove("cnm-spinning");
    });
    const openRecord = async () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        showToast("Enter an entity name.", "warn");
        return;
      }
      const meta = allEntities.find(
        (e) => getDisplayName(e).toLowerCase() === query || e.LogicalName.toLowerCase() === query
      );
      if (!meta) {
        showToast(`Entity "${input.value.trim()}" not found.`, "warn");
        return;
      }
      localStorage.setItem(LAST_ENTITY_KEY, input.value.trim());
      const guidValue = guidInput.value.trim();
      if (GUID_RE.test(guidValue)) {
        const cleanId = guidValue.replace(/^\{|\}$/g, "");
        window.open(
          `${clientUrl}/main.aspx?pagetype=entityrecord&etn=${meta.LogicalName}&id=%7B${cleanId}%7D`,
          "_blank"
        );
        panel.remove();
        return;
      }
      const withinDays = withinInput.value ? parseInt(withinInput.value, 10) : null;
      let filterClause = "";
      if (withinDays !== null) {
        const since = new Date(Date.now() - withinDays * 864e5).toISOString();
        filterClause = `&$filter=${sortField}%20ge%20${since}`;
      }
      openBtn.disabled = true;
      openBtn.textContent = "Opening\u2026";
      try {
        const recordUrl = `${clientUrl}/api/data/${apiVersion}/${meta.EntitySetName}?$select=${meta.PrimaryIdAttribute}&$orderby=${sortField}%20desc&$top=1${filterClause}`;
        console.log("[DynamicsCat] OData query:", recordUrl);
        const res = await fetch(recordUrl, {
          headers: {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
          }
        });
        const json = await res.json();
        if (!json.value?.length) {
          showToast(`No records found for "${getDisplayName(meta)}".`, "warn");
          return;
        }
        const rawId = json.value[0][meta.PrimaryIdAttribute] ?? "";
        const cleanId = rawId.replace(/^\{|\}$/g, "");
        if (!cleanId) {
          showToast("Could not determine record ID.", "warn");
          return;
        }
        window.open(
          `${clientUrl}/main.aspx?pagetype=entityrecord&etn=${meta.LogicalName}&id=%7B${cleanId}%7D`,
          "_blank"
        );
        panel.remove();
      } catch {
        showToast("Failed to fetch record.", "warn");
      } finally {
        openBtn.disabled = false;
        openBtn.textContent = "Open Record";
      }
    };
    openBtn.addEventListener("click", () => {
      void openRecord();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void openRecord();
    });
  }
  void main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvbnRlbnQvc2hhcmVkLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L3BhbmVsLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50L2p1bXAtdG8tbGF0ZXN0L2p1bXAtdG8tbGF0ZXN0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaGFyZWQgdXRpbGl0aWVzIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIEJ1bmRsZWQgaW5saW5lIGludG8gZWFjaCBzY3JpcHQgYnkgZXNidWlsZCBcdTIwMTQgbm8gc2VwYXJhdGUgb3V0cHV0IGZpbGUgbmVlZGVkLlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlYm91bmNlPFQgZXh0ZW5kcyB1bmtub3duW10+KGZuOiAoLi4uYXJnczogVCkgPT4gdm9pZCwgbXM6IG51bWJlcik6ICguLi5hcmdzOiBUKSA9PiB2b2lkIHtcclxuICBsZXQgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+O1xyXG4gIHJldHVybiAoLi4uYXJnczogVCkgPT4ge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBmbiguLi5hcmdzKSwgbXMpO1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBidWlsZExhYmVsTWFwKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xyXG4gIGNvbnN0IGxhYmVsTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgWHJtLlBhZ2UudWkuY29udHJvbHMuZm9yRWFjaCgoY3RybCkgPT4ge1xyXG4gICAgY29uc3QgbmFtZSA9IGN0cmwuZ2V0TmFtZSgpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsYWJlbE1hcFtuYW1lXSA9IChjdHJsIGFzIFhybS5Db250cm9scy5TdGFuZGFyZENvbnRyb2wpLmdldExhYmVsKCkgfHwgbmFtZTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgbGFiZWxNYXBbbmFtZV0gPSBuYW1lO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxhYmVsTWFwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZURyYWdnYWJsZShwYW5lbDogSFRNTEVsZW1lbnQsIGhhbmRsZTogSFRNTEVsZW1lbnQsIGNsb3NlQnRuOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCByZWN0ID0gcGFuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBwYW5lbC5zdHlsZS5sZWZ0ICAgICAgPSByZWN0LmxlZnQgKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICAgICAgID0gcmVjdC50b3AgICsgJ3B4JztcclxuICAgIHBhbmVsLnN0eWxlLnJpZ2h0ICAgICA9ICcnO1xyXG4gICAgcGFuZWwuc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgfSk7XHJcblxyXG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xyXG4gIGxldCBvZmZzZXRYID0gMDtcclxuICBsZXQgb2Zmc2V0WSA9IDA7XHJcblxyXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIGlmICghZHJhZ2dpbmcpIHJldHVybjtcclxuICAgIGNvbnN0IHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihlLmNsaWVudFggLSBvZmZzZXRYLCB3aW5kb3cuaW5uZXJXaWR0aCAgLSBwYW5lbC5vZmZzZXRXaWR0aCkpO1xyXG4gICAgY29uc3QgeSA9IE1hdGgubWF4KDAsIE1hdGgubWluKGUuY2xpZW50WSAtIG9mZnNldFksIHdpbmRvdy5pbm5lckhlaWdodCAtIHBhbmVsLm9mZnNldEhlaWdodCkpO1xyXG4gICAgcGFuZWwuc3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG4gICAgcGFuZWwuc3R5bGUudG9wICA9IHkgKyAncHgnO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uTW91c2VVcCA9ICgpID0+IHsgZHJhZ2dpbmcgPSBmYWxzZTsgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdtb3ZlJzsgfTtcclxuXHJcbiAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7XHJcbiAgICBpZiAoY2xvc2VCdG4uY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHJldHVybjtcclxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcclxuICAgIG9mZnNldFggID0gZS5jbGllbnRYIC0gcGFuZWwub2Zmc2V0TGVmdDtcclxuICAgIG9mZnNldFkgID0gZS5jbGllbnRZIC0gcGFuZWwub2Zmc2V0VG9wO1xyXG4gICAgaGFuZGxlLnN0eWxlLmN1cnNvciA9ICdncmFiYmluZyc7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgICBvbk1vdXNlVXApO1xyXG5cclxuICBuZXcgTXV0YXRpb25PYnNlcnZlcigoXywgb2JzKSA9PiB7XHJcbiAgICBpZiAoIWRvY3VtZW50LmNvbnRhaW5zKHBhbmVsKSkge1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSk7XHJcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAgIG9uTW91c2VVcCk7XHJcbiAgICAgIG9icy5kaXNjb25uZWN0KCk7XHJcbiAgICB9XHJcbiAgfSkub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXhlY0NvbW1hbmRDb3B5KHRleHQ6IHN0cmluZyk6IHZvaWQge1xyXG4gIGNvbnN0IHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcclxuICB0YS52YWx1ZSA9IHRleHQ7XHJcbiAgdGEuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjpmaXhlZDtvcGFjaXR5OjA7cG9pbnRlci1ldmVudHM6bm9uZSc7XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7XHJcbiAgdGEuc2VsZWN0KCk7XHJcbiAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcclxuICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlUb0NsaXBib2FyZCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBpZiAobmF2aWdhdG9yLmNsaXBib2FyZD8ud3JpdGVUZXh0KSB7XHJcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KS5jYXRjaCgoKSA9PiBleGVjQ29tbWFuZENvcHkodGV4dCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBleGVjQ29tbWFuZENvcHkodGV4dCk7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBUT0FTVF9DT05UQUlORVJfSUQgPSAnY3JtLXRvb2xzLXRvYXN0LWNvbnRhaW5lcic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvd1RvYXN0KG1lc3NhZ2U6IHN0cmluZywgdHlwZTogJ2luZm8nIHwgJ3dhcm4nID0gJ2luZm8nKTogdm9pZCB7XHJcbiAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFRPQVNUX0NPTlRBSU5FUl9JRCk7XHJcbiAgaWYgKCFjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgY29udGFpbmVyLmlkID0gVE9BU1RfQ09OVEFJTkVSX0lEO1xyXG4gICAgY29udGFpbmVyLnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAgICdwb3NpdGlvbjogZml4ZWQnLCAnYm90dG9tOiAyNHB4JywgJ3JpZ2h0OiAyNHB4JyxcclxuICAgICAgJ3otaW5kZXg6IDIxNDc0ODM2NDcnLCAnZGlzcGxheTogZmxleCcsICdmbGV4LWRpcmVjdGlvbjogY29sdW1uJywgJ2dhcDogOHB4JyxcclxuICAgICAgJ3BvaW50ZXItZXZlbnRzOiBub25lJyxcclxuICAgIF0uam9pbignOyAnKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgdG9hc3Quc3R5bGUuY3NzVGV4dCA9IFtcclxuICAgICdiYWNrZ3JvdW5kOiAnICsgKHR5cGUgPT09ICd3YXJuJyA/ICcjZTY1MTAwJyA6ICcjMzIzMjMyJyksXHJcbiAgICAnY29sb3I6ICNmZmYnLFxyXG4gICAgJ2ZvbnQtZmFtaWx5OiBcIkdvb2dsZSBTYW5zXCIsIFJvYm90bywgXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZicsXHJcbiAgICAnZm9udC1zaXplOiAxM3B4JyxcclxuICAgICdwYWRkaW5nOiAxMHB4IDE2cHgnLFxyXG4gICAgJ2JvcmRlci1yYWRpdXM6IDZweCcsXHJcbiAgICAnYm94LXNoYWRvdzogMCAycHggOHB4IHJnYmEoMCwwLDAsMC4yNSknLFxyXG4gICAgJ3BvaW50ZXItZXZlbnRzOiBhdXRvJyxcclxuICAgICdvcGFjaXR5OiAxJyxcclxuICAgICd0cmFuc2l0aW9uOiBvcGFjaXR5IDAuM3MgZWFzZScsXHJcbiAgXS5qb2luKCc7ICcpO1xyXG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpO1xyXG5cclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIHRvYXN0LnN0eWxlLm9wYWNpdHkgPSAnMCc7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRvYXN0LnJlbW92ZSgpLCAzNTApO1xyXG4gIH0sIDM1MDApO1xyXG59XHJcbiIsICIvLyBTaGFyZWQgcGFuZWwgc2hlbGwgZm9yIER5bmFtaWNzQ2F0IGNvbnRlbnQgc2NyaXB0cy5cclxuLy8gUHJvdmlkZXMgdGhlIGNvbW1vbiBjaHJvbWUgKGNvbnRhaW5lciwgaGVhZGVyLCBjbG9zZSwgZHJhZywga2V5Ym9hcmQgaXNvbGF0aW9uKVxyXG4vLyBzbyBlYWNoIGZlYXR1cmUgc2NyaXB0IG9ubHkgYnVpbGRzIGl0cyBvd24gYm9keSBjb250ZW50LlxyXG5cclxuaW1wb3J0IHsgZGVib3VuY2UsIG1ha2VEcmFnZ2FibGUsIGNvcHlUb0NsaXBib2FyZCB9IGZyb20gJy4vc2hhcmVkJztcclxuXHJcbi8vIFx1MjUwMFx1MjUwMCBUeXBlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZWxTaGVsbENvbmZpZyB7XHJcbiAgcGFuZWxJZDogc3RyaW5nO1xyXG4gIHN0eWxlSWQ6IHN0cmluZztcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIHZhcmlhbnQ/OiAnc2lkZWJhcicgfCAnZGlhbG9nJztcclxuICAvKiogQWRkaXRpb25hbCBDU1MgYXBwZW5kZWQgYWZ0ZXIgdGhlIGJhc2UgcGFuZWwgc3R5bGVzaGVldC4gKi9cclxuICBleHRyYUNzcz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lbFNoZWxsIHtcclxuICBwYW5lbDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgaGVhZGVyOiBIVE1MRGl2RWxlbWVudDtcclxuICBjbG9zZUJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgYm9keTogSFRNTERpdkVsZW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoQmFyIHtcclxuICBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50O1xyXG4gIC8qKiBSZS1ydW4gdGhlIGN1cnJlbnQgZmlsdGVyIChlLmcuIGFmdGVyIHJlZnJlc2hpbmcgdGFibGUgZGF0YSkuICovXHJcbiAgdHJpZ2dlckZpbHRlcjogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKiogSWRlbXBvdGVudCBzdHlsZSBpbmplY3Rpb24gXHUyMDE0IG9ubHkgaW5zZXJ0cyBvbmNlIHBlciBzdHlsZUlkLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0U3R5bGVzaGVldChzdHlsZUlkOiBzdHJpbmcsIGNzczogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0eWxlSWQpKSByZXR1cm47XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLmlkID0gc3R5bGVJZDtcclxuICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcztcclxuICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcclxufVxyXG5cclxuLyoqIFByZXZlbnQgdGhlIENSTSBob3N0IHBhZ2UgZnJvbSBzd2FsbG93aW5nIGtleWJvYXJkIGV2ZW50cyBpbnNpZGUgaW5qZWN0ZWQgcGFuZWxzLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNvbGF0ZUtleWJvYXJkKGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbn1cclxuXHJcbi8qKiBDbGljay10by1jb3B5IHNwYW4gd2l0aCBicmllZiBmbGFzaCBmZWVkYmFjay4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvcHlTcGFuKGRpc3BsYXk6IHN0cmluZywgY29weVZhbHVlOiBzdHJpbmcpOiBIVE1MU3BhbkVsZW1lbnQge1xyXG4gIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgc3Bhbi5jbGFzc05hbWUgPSAnZGNhdC1jb3B5LXZhbCc7XHJcbiAgc3Bhbi50ZXh0Q29udGVudCA9IGRpc3BsYXk7XHJcbiAgc3Bhbi50aXRsZSA9IGBDbGljayB0byBjb3B5OiAke2NvcHlWYWx1ZX1gO1xyXG4gIHNwYW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBjb3B5VG9DbGlwYm9hcmQoY29weVZhbHVlKTtcclxuICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZGNhdC1jb3BpZWQnKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gc3Bhbi5jbGFzc0xpc3QucmVtb3ZlKCdkY2F0LWNvcGllZCcpLCAxMjAwKTtcclxuICB9KTtcclxuICByZXR1cm4gc3BhbjtcclxufVxyXG5cclxuLyoqIENyZWF0ZXMgYSBzZWFyY2ggYmFyIHdpdGggZGVib3VuY2VkIGZpbHRlciBjYWxsYmFjay5cclxuICogIEluc2VydCB0aGUgcmV0dXJuZWQgY29udGFpbmVyIGludG8gdGhlIHBhbmVsIGJldHdlZW4gaGVhZGVyL3N1YmhlYWRlciBhbmQgYm9keS4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlYXJjaEJhcihvcHRzOiB7XHJcbiAgcGxhY2Vob2xkZXI6IHN0cmluZztcclxuICBvbkZpbHRlcjogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgZGVib3VuY2VNcz86IG51bWJlcjtcclxufSk6IFNlYXJjaEJhciB7XHJcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdkY2F0LXNlYXJjaCc7XHJcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gIGlucHV0LnR5cGUgPSAnc2VhcmNoJztcclxuICBpbnB1dC5wbGFjZWhvbGRlciA9IG9wdHMucGxhY2Vob2xkZXI7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKGlucHV0KTtcclxuXHJcbiAgY29uc3QgaGFuZGxlciA9IGRlYm91bmNlKCgpID0+IHtcclxuICAgIG9wdHMub25GaWx0ZXIoaW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCkpO1xyXG4gIH0sIG9wdHMuZGVib3VuY2VNcyA/PyAxMDApO1xyXG5cclxuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZXIpO1xyXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnB1dCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBjb250YWluZXIsXHJcbiAgICBpbnB1dCxcclxuICAgIHRyaWdnZXJGaWx0ZXI6ICgpID0+IGlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcpKSxcclxuICB9O1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgQmFzZSBDU1MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG5mdW5jdGlvbiBiYXNlQ3NzKGlkOiBzdHJpbmcsIHZhcmlhbnQ6ICdzaWRlYmFyJyB8ICdkaWFsb2cnKTogc3RyaW5nIHtcclxuICBjb25zdCBjb250YWluZXJDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcG9zaXRpb246IGZpeGVkOyB0b3A6IDUwJTsgbGVmdDogNTAlOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTsgd2lkdGg6IDM4MHB4O1xyXG4gICAgICAgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAycHggc29saWQgIzFlNjRjODsgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgICAgYm94LXNoYWRvdzogMCA0cHggMjRweCByZ2JhKDAsMCwwLDAuMik7XHJcbiAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ3OyBvdmVyZmxvdzogaGlkZGVuO1xyXG4gICAgICAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzIyMjtgXHJcbiAgICA6IGBwb3NpdGlvbjogZml4ZWQ7IHRvcDogMDsgcmlnaHQ6IDA7IHdpZHRoOiBhdXRvOyBtaW4td2lkdGg6IDU1MHB4OyBtYXgtd2lkdGg6IDkwdnc7IG1heC1oZWlnaHQ6IDkwdmg7XHJcbiAgICAgICBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDJweCBzb2xpZCAjMWU2NGM4O1xyXG4gICAgICAgYm94LXNoYWRvdzogLTRweCAwIDE2cHggcmdiYSgwLDAsMCwwLjE4KTtcclxuICAgICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgICAgICBmb250LWZhbWlseTogU2Vnb2UgVUksIEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjMjIyO2A7XHJcblxyXG4gIGNvbnN0IGJvZHlDc3MgPSB2YXJpYW50ID09PSAnZGlhbG9nJ1xyXG4gICAgPyBgcGFkZGluZzogMTRweDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxMHB4O2BcclxuICAgIDogYG92ZXJmbG93LXk6IGF1dG87IG92ZXJmbG93LXg6IGF1dG87IGZsZXg6IDE7YDtcclxuXHJcbiAgcmV0dXJuIGBcclxuIyR7aWR9IHsgJHtjb250YWluZXJDc3N9IH1cclxuIyR7aWR9IC5kY2F0LWhlYWRlciB7XHJcbiAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA2cHg7XHJcbiAgYmFja2dyb3VuZDogIzFlNjRjODsgY29sb3I6ICNmZmY7IHBhZGRpbmc6IDEwcHggMTRweDsgZmxleC1zaHJpbms6IDA7XHJcbiAgY3Vyc29yOiBtb3ZlOyB1c2VyLXNlbGVjdDogbm9uZTtcclxufVxyXG4jJHtpZH0gLmRjYXQtdGl0bGUgeyBmb250LXNpemU6IDE0cHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGZsZXg6IDE7IH1cclxuIyR7aWR9IC5kY2F0LWNsb3NlIHtcclxuICBiYWNrZ3JvdW5kOiBub25lOyBib3JkZXI6IG5vbmU7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE4cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDE7IGN1cnNvcjogcG9pbnRlcjsgcGFkZGluZzogMCAycHg7IG9wYWNpdHk6IDAuODU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LWNsb3NlOmhvdmVyIHsgb3BhY2l0eTogMTsgfVxyXG4jJHtpZH0gLmRjYXQtYm9keSB7ICR7Ym9keUNzc30gfVxyXG4jJHtpZH0gLmRjYXQtc3ViaGVhZGVyIHtcclxuICBwYWRkaW5nOiA2cHggMTRweDsgYmFja2dyb3VuZDogI2U4ZjBmZTsgZm9udC1zaXplOiAxMnB4O1xyXG4gIGNvbG9yOiAjMWU2NGM4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M1ZDhmYjsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCB7XHJcbiAgcGFkZGluZzogOHB4IDE0cHg7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzVkOGZiOyBmbGV4LXNocmluazogMDtcclxufVxyXG4jJHtpZH0gLmRjYXQtc2VhcmNoIGlucHV0IHtcclxuICB3aWR0aDogMTAwJTsgYm94LXNpemluZzogYm9yZGVyLWJveDsgcGFkZGluZzogNXB4IDEwcHg7XHJcbiAgYm9yZGVyOiAxcHggc29saWQgI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogNHB4OyBmb250LXNpemU6IDEzcHg7XHJcbiAgZm9udC1mYW1pbHk6IFNlZ29lIFVJLCBBcmlhbCwgc2Fucy1zZXJpZjsgY29sb3I6ICMyMjI7IG91dGxpbmU6IG5vbmU7XHJcbn1cclxuIyR7aWR9IC5kY2F0LXNlYXJjaCBpbnB1dDpmb2N1cyB7IGJvcmRlci1jb2xvcjogIzFlNjRjODsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwge1xyXG4gIGN1cnNvcjogcG9pbnRlcjsgYm9yZGVyLWJvdHRvbTogMXB4IGRhc2hlZCAjMWU2NGM4OyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzO1xyXG59XHJcbiMke2lkfSAuZGNhdC1jb3B5LXZhbDpob3ZlciB7IGJhY2tncm91bmQ6ICNjNWQ4ZmI7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxyXG4jJHtpZH0gLmRjYXQtY29weS12YWwuZGNhdC1jb3BpZWQgeyBiYWNrZ3JvdW5kOiAjYjdmMGM4OyBib3JkZXItYm90dG9tLWNvbG9yOiAjMmE5YzUyOyBib3JkZXItcmFkaXVzOiAzcHg7IH1cclxuIyR7aWR9IC5kY2F0LW5vLXJlc3VsdHMge1xyXG4gIHBhZGRpbmc6IDE2cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYztcclxufVxyXG5gO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDAgUGFuZWwgc2hlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgY29tbW9uIHBhbmVsIGNocm9tZSAodG9nZ2xlLCBzdHlsZSBpbmplY3Rpb24sIGhlYWRlciwgZHJhZywgY2xvc2UpLlxyXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgcGFuZWwgd2FzIHRvZ2dsZWQgT0ZGIChhbHJlYWR5IGV4aXN0ZWQgYW5kIHdhcyByZW1vdmVkKS5cclxuICogQ2FsbGVycyBwb3B1bGF0ZSB0aGUgcmV0dXJuZWQgYGJvZHlgIGVsZW1lbnQgd2l0aCBmZWF0dXJlLXNwZWNpZmljIGNvbnRlbnQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGFuZWxTaGVsbChjb25maWc6IFBhbmVsU2hlbGxDb25maWcpOiBQYW5lbFNoZWxsIHwgbnVsbCB7XHJcbiAgLy8gVG9nZ2xlOiByZW1vdmUgaWYgYWxyZWFkeSBwcmVzZW50XHJcbiAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb25maWcucGFuZWxJZCk7XHJcbiAgaWYgKGV4aXN0aW5nKSB7IGV4aXN0aW5nLnJlbW92ZSgpOyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICBjb25zdCB2YXJpYW50ID0gY29uZmlnLnZhcmlhbnQgPz8gJ3NpZGViYXInO1xyXG4gIGluamVjdFN0eWxlc2hlZXQoY29uZmlnLnN0eWxlSWQsIGJhc2VDc3MoY29uZmlnLnBhbmVsSWQsIHZhcmlhbnQpICsgKGNvbmZpZy5leHRyYUNzcyA/PyAnJykpO1xyXG5cclxuICBjb25zdCBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHBhbmVsLmlkID0gY29uZmlnLnBhbmVsSWQ7XHJcblxyXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGhlYWRlci5jbGFzc05hbWUgPSAnZGNhdC1oZWFkZXInO1xyXG5cclxuICBjb25zdCB0aXRsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHRpdGxlRWwuY2xhc3NOYW1lID0gJ2RjYXQtdGl0bGUnO1xyXG4gIHRpdGxlRWwudGV4dENvbnRlbnQgPSBjb25maWcudGl0bGU7XHJcblxyXG4gIGNvbnN0IGNsb3NlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgY2xvc2VCdG4uY2xhc3NOYW1lID0gJ2RjYXQtY2xvc2UnO1xyXG4gIGNsb3NlQnRuLnRpdGxlID0gJ0Nsb3NlJztcclxuICBjbG9zZUJ0bi50ZXh0Q29udGVudCA9ICdcdTI3MTUnO1xyXG4gIGNsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gcGFuZWwucmVtb3ZlKCkpO1xyXG5cclxuICBoZWFkZXIuYXBwZW5kKHRpdGxlRWwsIGNsb3NlQnRuKTtcclxuXHJcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGJvZHkuY2xhc3NOYW1lID0gJ2RjYXQtYm9keSc7XHJcblxyXG4gIHBhbmVsLmFwcGVuZChoZWFkZXIsIGJvZHkpO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGFuZWwpO1xyXG4gIG1ha2VEcmFnZ2FibGUocGFuZWwsIGhlYWRlciwgY2xvc2VCdG4pO1xyXG5cclxuICByZXR1cm4geyBwYW5lbCwgaGVhZGVyLCBjbG9zZUJ0biwgYm9keSB9O1xyXG59XHJcbiIsICJpbXBvcnQgeyBzaG93VG9hc3QgfSBmcm9tICcuLi9zaGFyZWQnO1xyXG5pbXBvcnQgeyBjcmVhdGVQYW5lbFNoZWxsLCBpc29sYXRlS2V5Ym9hcmQgfSBmcm9tICcuLi9wYW5lbCc7XHJcblxyXG5jb25zdCBQQU5FTF9JRCAgID0gJ2NybS10b29scy1uZXdlc3QtbW9kaWZpZWQtcGFuZWwnO1xyXG5jb25zdCBTVFlMRV9JRCAgID0gJ2NybS10b29scy1uZXdlc3QtbW9kaWZpZWQtc3R5bGUnO1xyXG5jb25zdCBMSVNUX0lEICAgID0gJ2NybS10b29scy1uZXdlc3QtbW9kaWZpZWQtbGlzdCc7XHJcbmNvbnN0IENBQ0hFX0tFWSAgICAgICA9ICdfX2R5bmFtaWNzY2F0X2VudGl0eV9jYWNoZSc7XHJcbmNvbnN0IExBU1RfRU5USVRZX0tFWSA9ICdfX2R5bmFtaWNzY2F0X2xhc3RfZW50aXR5JztcclxuY29uc3QgVFRMX01TICAgICAgICAgID0gNyAqIDI0ICogNjAgKiA2MCAqIDEwMDA7IC8vIDcgZGF5c1xyXG5jb25zdCBHVUlEX1JFICAgID0gL15bMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXsxMn0kL2k7XHJcblxyXG5pbnRlcmZhY2UgRW50aXR5TWV0YSB7XHJcbiAgTG9naWNhbE5hbWU6IHN0cmluZztcclxuICBEaXNwbGF5TmFtZTogeyBVc2VyTG9jYWxpemVkTGFiZWw6IHsgTGFiZWw6IHN0cmluZyB9IHwgbnVsbCB9IHwgbnVsbDtcclxuICBFbnRpdHlTZXROYW1lOiBzdHJpbmc7XHJcbiAgUHJpbWFyeUlkQXR0cmlidXRlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBFbnRpdHlDYWNoZSB7XHJcbiAgY2xpZW50VXJsOiBzdHJpbmc7XHJcbiAgZW50aXRpZXM6IEVudGl0eU1ldGFbXTtcclxuICB0aW1lc3RhbXA6IG51bWJlcjtcclxufVxyXG5cclxuY29uc3QgRVhUUkFfQ1NTID0gYFxyXG4jJHtQQU5FTF9JRH0gLmNubS1yb3cgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhweDsgfVxyXG4jJHtQQU5FTF9JRH0gLmNubS1sYWJlbCB7XHJcbiAgZm9udC1zaXplOiAxMXB4OyBmb250LXdlaWdodDogNjAwOyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gIGxldHRlci1zcGFjaW5nOiAwLjVweDsgY29sb3I6ICM4MDg2OGI7IG1pbi13aWR0aDogNTRweDsgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuIyR7UEFORUxfSUR9IC5jbm0taW5wdXQge1xyXG4gIGZsZXg6IDE7IG1pbi13aWR0aDogMDsgcGFkZGluZzogNnB4IDEwcHg7XHJcbiAgYm9yZGVyOiAxcHggc29saWQgI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogNHB4O1xyXG4gIGZvbnQtc2l6ZTogMTNweDsgZm9udC1mYW1pbHk6IGluaGVyaXQ7IGNvbG9yOiAjMjIyOyBvdXRsaW5lOiBub25lO1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY25tLWlucHV0OmZvY3VzIHsgYm9yZGVyLWNvbG9yOiAjMWU2NGM4OyB9XHJcbiMke1BBTkVMX0lEfSAuY25tLWlucHV0OmRpc2FibGVkIHsgYmFja2dyb3VuZDogI2Y1ZjVmNTsgY29sb3I6ICNhYWE7IH1cclxuIyR7UEFORUxfSUR9IC5jbm0tcmVmcmVzaC1idG4ge1xyXG4gIGJhY2tncm91bmQ6IG5vbmU7IGJvcmRlcjogMXB4IHNvbGlkICNjNWQ4ZmI7IGJvcmRlci1yYWRpdXM6IDRweDtcclxuICBjdXJzb3I6IHBvaW50ZXI7IGZvbnQtc2l6ZTogMTRweDsgcGFkZGluZzogNHB4IDZweDsgbGluZS1oZWlnaHQ6IDE7XHJcbiAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjE1cztcclxufVxyXG4jJHtQQU5FTF9JRH0gLmNubS1yZWZyZXNoLWJ0bjpob3ZlciB7IGJhY2tncm91bmQ6ICNlOGYwZmU7IH1cclxuIyR7UEFORUxfSUR9IC5jbm0tcmVmcmVzaC1idG4uY25tLXNwaW5uaW5nIHsgYW5pbWF0aW9uOiBjbm0tc3BpbiAwLjhzIGxpbmVhciBpbmZpbml0ZTsgfVxyXG5Aa2V5ZnJhbWVzIGNubS1zcGluIHsgZnJvbSB7IHRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9IHRvIHsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgfSB9XHJcbiMke1BBTkVMX0lEfSAuY25tLXNvcnQtYnRuIHtcclxuICBmbGV4OiAxOyBwYWRkaW5nOiA0cHggMTBweDsgYm9yZGVyOiAxcHggc29saWQgI2M1ZDhmYjsgYm9yZGVyLXJhZGl1czogNHB4O1xyXG4gIGJhY2tncm91bmQ6ICNmZmY7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IGluaGVyaXQ7IGNvbG9yOiAjNTU1OyBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDsgdGV4dC1hbGlnbjogY2VudGVyO1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY25tLXNvcnQtYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHsgYmFja2dyb3VuZDogI2U4ZjBmZTsgfVxyXG4jJHtQQU5FTF9JRH0gLmNubS1zb3J0LWJ0bi5jbm0tc29ydC1hY3RpdmUgeyBiYWNrZ3JvdW5kOiAjMWU2NGM4OyBjb2xvcjogI2ZmZjsgYm9yZGVyLWNvbG9yOiAjMWU2NGM4OyB9XHJcbiMke1BBTkVMX0lEfSAuY25tLXNvcnQtYnRuOmRpc2FibGVkIHsgb3BhY2l0eTogMC40OyBjdXJzb3I6IGRlZmF1bHQ7IH1cclxuIyR7UEFORUxfSUR9IC5jbm0tYWN0aW9uLXJvdyB7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgYWxpZ24taXRlbXM6IGNlbnRlcjsgcGFkZGluZy10b3A6IDRweDsgfVxyXG4jJHtQQU5FTF9JRH0gLmNubS13aXRoaW4taW5wdXQge1xyXG4gIHdpZHRoOiA0NHB4OyBwYWRkaW5nOiAzcHggNXB4OyBib3JkZXI6IDFweCBzb2xpZCAjZTBlMGUwOyBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgZm9udC1zaXplOiAxMXB4OyBmb250LWZhbWlseTogaW5oZXJpdDsgY29sb3I6ICNhYWE7IHRleHQtYWxpZ246IGNlbnRlcjtcclxuICBiYWNrZ3JvdW5kOiAjZmFmYWZhOyBvdXRsaW5lOiBub25lO1xyXG59XHJcbiMke1BBTkVMX0lEfSAuY25tLXdpdGhpbi1pbnB1dDpmb2N1cyB7IGJvcmRlci1jb2xvcjogI2M1ZDhmYjsgY29sb3I6ICM1NTU7IH1cclxuIyR7UEFORUxfSUR9IC5jbm0tb3Blbi1idG4ge1xyXG4gIGZsZXg6IDE7IHBhZGRpbmc6IDdweCAyMHB4OyBiYWNrZ3JvdW5kOiAjMWU2NGM4OyBjb2xvcjogI2ZmZjsgYm9yZGVyOiBub25lO1xyXG4gIGJvcmRlci1yYWRpdXM6IDRweDsgZm9udC1zaXplOiAxM3B4OyBmb250LWZhbWlseTogaW5oZXJpdDsgZm9udC13ZWlnaHQ6IDYwMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7IHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXM7IHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuIyR7UEFORUxfSUR9IC5jbm0tb3Blbi1idG46aG92ZXI6bm90KDpkaXNhYmxlZCkgeyBiYWNrZ3JvdW5kOiAjMTU1N2IwOyB9XHJcbiMke1BBTkVMX0lEfSAuY25tLW9wZW4tYnRuOmRpc2FibGVkIHsgb3BhY2l0eTogMC41OyBjdXJzb3I6IGRlZmF1bHQ7IH1cclxuYDtcclxuXHJcbmZ1bmN0aW9uIGFwaVZlcnNpb25Gcm9tQ3JtVmVyc2lvbihjcm1WZXJzaW9uOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIGNvbnN0IG1ham9yID0gcGFyc2VJbnQoY3JtVmVyc2lvbi5zcGxpdCgnLicpWzBdID8/ICc4JywgMTApO1xyXG4gIHJldHVybiBtYWpvciA+PSA5ID8gJ3Y5LjAnIDogJ3Y4LjInO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREaXNwbGF5TmFtZShtZXRhOiBFbnRpdHlNZXRhKTogc3RyaW5nIHtcclxuICByZXR1cm4gbWV0YS5EaXNwbGF5TmFtZT8uVXNlckxvY2FsaXplZExhYmVsPy5MYWJlbCA/PyBtZXRhLkxvZ2ljYWxOYW1lO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkQ2FjaGVkRW50aXRpZXMoY2xpZW50VXJsOiBzdHJpbmcpOiBFbnRpdHlNZXRhW10gfCBudWxsIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmF3ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oQ0FDSEVfS0VZKTtcclxuICAgIGlmICghcmF3KSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IGNhY2hlID0gSlNPTi5wYXJzZShyYXcpIGFzIEVudGl0eUNhY2hlO1xyXG4gICAgaWYgKGNhY2hlLmNsaWVudFVybCAhPT0gY2xpZW50VXJsKSByZXR1cm4gbnVsbDtcclxuICAgIGlmIChEYXRlLm5vdygpIC0gY2FjaGUudGltZXN0YW1wID49IFRUTF9NUykgcmV0dXJuIG51bGw7XHJcbiAgICByZXR1cm4gY2FjaGUuZW50aXRpZXM7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmVDYWNoZWRFbnRpdGllcyhjbGllbnRVcmw6IHN0cmluZywgZW50aXRpZXM6IEVudGl0eU1ldGFbXSk6IHZvaWQge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjYWNoZTogRW50aXR5Q2FjaGUgPSB7IGNsaWVudFVybCwgZW50aXRpZXMsIHRpbWVzdGFtcDogRGF0ZS5ub3coKSB9O1xyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0FDSEVfS0VZLCBKU09OLnN0cmluZ2lmeShjYWNoZSkpO1xyXG4gIH0gY2F0Y2ggeyAvKiBzdG9yYWdlIGZ1bGwgXHUyMDE0IGlnbm9yZSAqLyB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG1haW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKHR5cGVvZiBYcm0gPT09ICd1bmRlZmluZWQnIHx8ICFYcm0uUGFnZT8uY29udGV4dCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBzaGVsbCA9IGNyZWF0ZVBhbmVsU2hlbGwoe1xyXG4gICAgcGFuZWxJZDogUEFORUxfSUQsXHJcbiAgICBzdHlsZUlkOiBTVFlMRV9JRCxcclxuICAgIHRpdGxlOiAnXHVEODNEXHVERDUwIEp1bXAgdG8gTGF0ZXN0JyxcclxuICAgIHZhcmlhbnQ6ICdkaWFsb2cnLFxyXG4gICAgZXh0cmFDc3M6IEVYVFJBX0NTUyxcclxuICB9KTtcclxuICBpZiAoIXNoZWxsKSByZXR1cm47IC8vIHRvZ2dsZWQgb2ZmXHJcblxyXG4gIGNvbnN0IHsgcGFuZWwsIGJvZHkgfSA9IHNoZWxsO1xyXG5cclxuICBjb25zdCBjbGllbnRVcmwgID0gWHJtLlBhZ2UuY29udGV4dC5nZXRDbGllbnRVcmwoKTtcclxuICBjb25zdCBhcGlWZXJzaW9uID0gYXBpVmVyc2lvbkZyb21Dcm1WZXJzaW9uKFhybS5QYWdlLmNvbnRleHQuZ2V0VmVyc2lvbigpKTtcclxuXHJcbiAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gY29udGVudCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuXHJcbiAgLy8gRW50aXR5IGlucHV0IHJvd1xyXG4gIGNvbnN0IGVudGl0eVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGVudGl0eVJvdy5jbGFzc05hbWUgPSAnY25tLXJvdyc7XHJcbiAgY29uc3QgZW50aXR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xyXG4gIGVudGl0eUxhYmVsLmNsYXNzTmFtZSA9ICdjbm0tbGFiZWwnO1xyXG4gIGVudGl0eUxhYmVsLnRleHRDb250ZW50ID0gJ0VudGl0eSc7XHJcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gIGlucHV0LnR5cGUgPSAndGV4dCc7XHJcbiAgaW5wdXQuY2xhc3NOYW1lID0gJ2NubS1pbnB1dCc7XHJcbiAgaW5wdXQucGxhY2Vob2xkZXIgPSAnTG9hZGluZ1x1MjAyNic7XHJcbiAgaW5wdXQuZGlzYWJsZWQgPSB0cnVlO1xyXG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnbGlzdCcsIExJU1RfSUQpO1xyXG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xyXG4gIGNvbnN0IGRhdGFsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGF0YWxpc3QnKTtcclxuICBkYXRhbGlzdC5pZCA9IExJU1RfSUQ7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKGlucHV0KTtcclxuICBjb25zdCByZWZyZXNoQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgcmVmcmVzaEJ0bi5jbGFzc05hbWUgPSAnY25tLXJlZnJlc2gtYnRuJztcclxuICByZWZyZXNoQnRuLnRleHRDb250ZW50ID0gJ1x1RDgzRFx1REQwNCc7XHJcbiAgcmVmcmVzaEJ0bi50aXRsZSA9ICdSZWZyZXNoIGVudGl0eSBsaXN0JztcclxuICBlbnRpdHlSb3cuYXBwZW5kKGVudGl0eUxhYmVsLCBpbnB1dCwgcmVmcmVzaEJ0biwgZGF0YWxpc3QpO1xyXG5cclxuICAvLyBHVUlEIHJvd1xyXG4gIGNvbnN0IGd1aWRSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBndWlkUm93LmNsYXNzTmFtZSA9ICdjbm0tcm93JztcclxuICBjb25zdCBndWlkTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xyXG4gIGd1aWRMYWJlbC5jbGFzc05hbWUgPSAnY25tLWxhYmVsJztcclxuICBndWlkTGFiZWwudGV4dENvbnRlbnQgPSAnUmVjb3JkIElEJztcclxuICBjb25zdCBndWlkSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gIGd1aWRJbnB1dC50eXBlID0gJ3RleHQnO1xyXG4gIGd1aWRJbnB1dC5jbGFzc05hbWUgPSAnY25tLWlucHV0JztcclxuICBndWlkSW5wdXQucGxhY2Vob2xkZXIgPSAnT3B0aW9uYWwgR1VJRFx1MjAyNic7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKGd1aWRJbnB1dCk7XHJcbiAgZ3VpZElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB2b2lkIG9wZW5SZWNvcmQoKTtcclxuICB9KTtcclxuICBndWlkUm93LmFwcGVuZChndWlkTGFiZWwsIGd1aWRJbnB1dCk7XHJcblxyXG4gIC8vIFNvcnQtYnkgcm93XHJcbiAgbGV0IHNvcnRGaWVsZDogJ21vZGlmaWVkb24nIHwgJ2NyZWF0ZWRvbicgPSAnbW9kaWZpZWRvbic7XHJcbiAgY29uc3Qgc29ydFJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHNvcnRSb3cuY2xhc3NOYW1lID0gJ2NubS1yb3cnO1xyXG4gIGNvbnN0IHNvcnRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICBzb3J0TGFiZWwuY2xhc3NOYW1lID0gJ2NubS1sYWJlbCc7XHJcbiAgc29ydExhYmVsLnRleHRDb250ZW50ID0gJ1NvcnQgYnknO1xyXG5cclxuICBjb25zdCBzb3J0QnRuczogSFRNTEJ1dHRvbkVsZW1lbnRbXSA9IFtdO1xyXG4gIGNvbnN0IG1ha2VTb3J0QnRuID0gKHRleHQ6IHN0cmluZywgZmllbGQ6IHR5cGVvZiBzb3J0RmllbGQpID0+IHtcclxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gICAgYnRuLmNsYXNzTmFtZSA9ICdjbm0tc29ydC1idG4nICsgKGZpZWxkID09PSBzb3J0RmllbGQgPyAnIGNubS1zb3J0LWFjdGl2ZScgOiAnJyk7XHJcbiAgICBidG4udGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgc29ydEJ0bnMucHVzaChidG4pO1xyXG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICBpZiAoYnRuLmRpc2FibGVkKSByZXR1cm47XHJcbiAgICAgIHNvcnRGaWVsZCA9IGZpZWxkO1xyXG4gICAgICBzb3J0QnRucy5mb3JFYWNoKGIgPT4gYi5jbGFzc0xpc3QucmVtb3ZlKCdjbm0tc29ydC1hY3RpdmUnKSk7XHJcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKCdjbm0tc29ydC1hY3RpdmUnKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGJ0bjtcclxuICB9O1xyXG4gIHNvcnRSb3cuYXBwZW5kKHNvcnRMYWJlbCwgbWFrZVNvcnRCdG4oJ05ld2VzdCBNb2RpZmllZCcsICdtb2RpZmllZG9uJyksIG1ha2VTb3J0QnRuKCdOZXdlc3QgQ3JlYXRlZCcsICdjcmVhdGVkb24nKSk7XHJcblxyXG4gIC8vIEFjdGlvbiByb3cgXHUyMDE0IG9wZW4gYnV0dG9uIGxlZnQsIHN1YnRsZSBkYXlzLWxpbWl0IGlucHV0IHJpZ2h0XHJcbiAgY29uc3QgYWN0aW9uUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgYWN0aW9uUm93LmNsYXNzTmFtZSA9ICdjbm0tcm93IGNubS1hY3Rpb24tcm93JztcclxuICBjb25zdCBvcGVuQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgb3BlbkJ0bi5jbGFzc05hbWUgPSAnY25tLW9wZW4tYnRuJztcclxuICBvcGVuQnRuLnRleHRDb250ZW50ID0gJ09wZW4gUmVjb3JkJztcclxuICBvcGVuQnRuLmRpc2FibGVkID0gdHJ1ZTtcclxuICBjb25zdCB3aXRoaW5JbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgd2l0aGluSW5wdXQudHlwZSA9ICdudW1iZXInO1xyXG4gIHdpdGhpbklucHV0LmNsYXNzTmFtZSA9ICdjbm0td2l0aGluLWlucHV0JztcclxuICB3aXRoaW5JbnB1dC5taW4gPSAnMSc7XHJcbiAgd2l0aGluSW5wdXQudmFsdWUgPSAnMTQnO1xyXG4gIHdpdGhpbklucHV0LnRpdGxlID0gJ0xpbWl0IHNlYXJjaCB0byBsYXN0IE4gZGF5cyAobGVhdmUgZW1wdHkgZm9yIGFsbCB0aW1lKSc7XHJcbiAgaXNvbGF0ZUtleWJvYXJkKHdpdGhpbklucHV0KTtcclxuICBhY3Rpb25Sb3cuYXBwZW5kKHdpdGhpbklucHV0LCBvcGVuQnRuKTtcclxuXHJcbiAgLy8gRGlzYWJsZSBzb3J0IHdoZW4gYSBHVUlEIGlzIGVudGVyZWRcclxuICBndWlkSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBpc0d1aWQgPSBHVUlEX1JFLnRlc3QoZ3VpZElucHV0LnZhbHVlLnRyaW0oKSk7XHJcbiAgICBzb3J0QnRucy5mb3JFYWNoKGIgPT4geyBiLmRpc2FibGVkID0gaXNHdWlkOyB9KTtcclxuICB9KTtcclxuXHJcbiAgYm9keS5hcHBlbmQoZW50aXR5Um93LCBndWlkUm93LCBzb3J0Um93LCBhY3Rpb25Sb3cpO1xyXG5cclxuICAvLyBcdTI1MDBcdTI1MDAgRmV0Y2ggZW50aXR5IGxpc3QgKGxvY2FsU3RvcmFnZSBjYWNoZWQgd2l0aCBUVEwpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gIGxldCBhbGxFbnRpdGllczogRW50aXR5TWV0YVtdID0gW107XHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIGZldGNoRW50aXRpZXMoYnlwYXNzQ2FjaGUgPSBmYWxzZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgaWYgKCFieXBhc3NDYWNoZSkge1xyXG4gICAgICBjb25zdCBjYWNoZWQgPSBsb2FkQ2FjaGVkRW50aXRpZXMoY2xpZW50VXJsKTtcclxuICAgICAgaWYgKGNhY2hlZCkgeyBhbGxFbnRpdGllcyA9IGNhY2hlZDsgcmV0dXJuIHRydWU7IH1cclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFxyXG4gICAgICAgIGAke2NsaWVudFVybH0vYXBpL2RhdGEvJHthcGlWZXJzaW9ufS9FbnRpdHlEZWZpbml0aW9uc2AgK1xyXG4gICAgICAgIGA/JHNlbGVjdD1Mb2dpY2FsTmFtZSxEaXNwbGF5TmFtZSxFbnRpdHlTZXROYW1lLFByaW1hcnlJZEF0dHJpYnV0ZWAsXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpIGFzIHsgdmFsdWU6IEVudGl0eU1ldGFbXSB9O1xyXG4gICAgICBhbGxFbnRpdGllcyA9IGpzb24udmFsdWVcclxuICAgICAgICAuZmlsdGVyKGUgPT4gZS5FbnRpdHlTZXROYW1lKVxyXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBnZXREaXNwbGF5TmFtZShhKS5sb2NhbGVDb21wYXJlKGdldERpc3BsYXlOYW1lKGIpKSk7XHJcbiAgICAgIHNhdmVDYWNoZWRFbnRpdGllcyhjbGllbnRVcmwsIGFsbEVudGl0aWVzKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcG9wdWxhdGVEYXRhbGlzdCgpOiB2b2lkIHtcclxuICAgIGRhdGFsaXN0LmlubmVySFRNTCA9ICcnO1xyXG4gICAgZm9yIChjb25zdCBlIG9mIGFsbEVudGl0aWVzKSB7XHJcbiAgICAgIGNvbnN0IG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICBvcHQudmFsdWUgPSBnZXREaXNwbGF5TmFtZShlKTtcclxuICAgICAgb3B0LmxhYmVsID0gZS5Mb2dpY2FsTmFtZTtcclxuICAgICAgZGF0YWxpc3QuYXBwZW5kQ2hpbGQob3B0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEluaXRpYWwgbG9hZFxyXG4gIGlucHV0LnBsYWNlaG9sZGVyID0gJ0xvYWRpbmdcdTIwMjYnO1xyXG4gIGlucHV0LmRpc2FibGVkID0gdHJ1ZTtcclxuICBpZiAoYXdhaXQgZmV0Y2hFbnRpdGllcygpKSB7XHJcbiAgICBwb3B1bGF0ZURhdGFsaXN0KCk7XHJcbiAgICBpbnB1dC5wbGFjZWhvbGRlciA9ICdUeXBlIGVudGl0eSBuYW1lXHUyMDI2JztcclxuICAgIGlucHV0LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBvcGVuQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBjb25zdCBsYXN0RW50aXR5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oTEFTVF9FTlRJVFlfS0VZKTtcclxuICAgIGlmIChsYXN0RW50aXR5KSBpbnB1dC52YWx1ZSA9IGxhc3RFbnRpdHk7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpbnB1dC5wbGFjZWhvbGRlciA9ICdGYWlsZWQgdG8gbG9hZCBlbnRpdGllcyc7XHJcbiAgICBzaG93VG9hc3QoJ0NvdWxkIG5vdCBsb2FkIGVudGl0eSBsaXN0LicsICd3YXJuJyk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBSZWZyZXNoIGJ1dHRvbiBoYW5kbGVyXHJcbiAgcmVmcmVzaEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcclxuICAgIHJlZnJlc2hCdG4uY2xhc3NMaXN0LmFkZCgnY25tLXNwaW5uaW5nJyk7XHJcbiAgICBpbnB1dC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBpbnB1dC5wbGFjZWhvbGRlciA9ICdSZWZyZXNoaW5nXHUyMDI2JztcclxuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKENBQ0hFX0tFWSk7XHJcbiAgICBpZiAoYXdhaXQgZmV0Y2hFbnRpdGllcyh0cnVlKSkge1xyXG4gICAgICBwb3B1bGF0ZURhdGFsaXN0KCk7XHJcbiAgICAgIGlucHV0LnBsYWNlaG9sZGVyID0gJ1R5cGUgZW50aXR5IG5hbWVcdTIwMjYnO1xyXG4gICAgICBpbnB1dC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5wdXQucGxhY2Vob2xkZXIgPSAnUmVmcmVzaCBmYWlsZWQnO1xyXG4gICAgICBzaG93VG9hc3QoJ0NvdWxkIG5vdCByZWZyZXNoIGVudGl0eSBsaXN0LicsICd3YXJuJyk7XHJcbiAgICAgIGlucHV0LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZWZyZXNoQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2NubS1zcGlubmluZycpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBcdTI1MDBcdTI1MDAgT3BlbiBoYW5kbGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gIGNvbnN0IG9wZW5SZWNvcmQgPSBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBxdWVyeSA9IGlucHV0LnZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFxdWVyeSkgeyBzaG93VG9hc3QoJ0VudGVyIGFuIGVudGl0eSBuYW1lLicsICd3YXJuJyk7IHJldHVybjsgfVxyXG5cclxuICAgIGNvbnN0IG1ldGEgPSBhbGxFbnRpdGllcy5maW5kKGUgPT5cclxuICAgICAgZ2V0RGlzcGxheU5hbWUoZSkudG9Mb3dlckNhc2UoKSA9PT0gcXVlcnkgfHxcclxuICAgICAgZS5Mb2dpY2FsTmFtZS50b0xvd2VyQ2FzZSgpICAgICAgPT09IHF1ZXJ5LFxyXG4gICAgKTtcclxuICAgIGlmICghbWV0YSkge1xyXG4gICAgICBzaG93VG9hc3QoYEVudGl0eSBcIiR7aW5wdXQudmFsdWUudHJpbSgpfVwiIG5vdCBmb3VuZC5gLCAnd2FybicpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTEFTVF9FTlRJVFlfS0VZLCBpbnB1dC52YWx1ZS50cmltKCkpO1xyXG5cclxuICAgIGNvbnN0IGd1aWRWYWx1ZSA9IGd1aWRJbnB1dC52YWx1ZS50cmltKCk7XHJcbiAgICBpZiAoR1VJRF9SRS50ZXN0KGd1aWRWYWx1ZSkpIHtcclxuICAgICAgY29uc3QgY2xlYW5JZCA9IGd1aWRWYWx1ZS5yZXBsYWNlKC9eXFx7fFxcfSQvZywgJycpO1xyXG4gICAgICB3aW5kb3cub3BlbihcclxuICAgICAgICBgJHtjbGllbnRVcmx9L21haW4uYXNweD9wYWdldHlwZT1lbnRpdHlyZWNvcmQmZXRuPSR7bWV0YS5Mb2dpY2FsTmFtZX0maWQ9JTdCJHtjbGVhbklkfSU3RGAsXHJcbiAgICAgICAgJ19ibGFuaycsXHJcbiAgICAgICk7XHJcbiAgICAgIHBhbmVsLnJlbW92ZSgpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgd2l0aGluRGF5cyA9IHdpdGhpbklucHV0LnZhbHVlID8gcGFyc2VJbnQod2l0aGluSW5wdXQudmFsdWUsIDEwKSA6IG51bGw7XHJcbiAgICBsZXQgZmlsdGVyQ2xhdXNlID0gJyc7XHJcbiAgICBpZiAod2l0aGluRGF5cyAhPT0gbnVsbCkge1xyXG4gICAgICBjb25zdCBzaW5jZSA9IG5ldyBEYXRlKERhdGUubm93KCkgLSB3aXRoaW5EYXlzICogODZfNDAwXzAwMCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgZmlsdGVyQ2xhdXNlID0gYCYkZmlsdGVyPSR7c29ydEZpZWxkfSUyMGdlJTIwJHtzaW5jZX1gO1xyXG4gICAgfVxyXG5cclxuICAgIG9wZW5CdG4uZGlzYWJsZWQgICAgPSB0cnVlO1xyXG4gICAgb3BlbkJ0bi50ZXh0Q29udGVudCA9ICdPcGVuaW5nXHUyMDI2JztcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlY29yZFVybCA9IGAke2NsaWVudFVybH0vYXBpL2RhdGEvJHthcGlWZXJzaW9ufS8ke21ldGEuRW50aXR5U2V0TmFtZX1gICtcclxuICAgICAgICBgPyRzZWxlY3Q9JHttZXRhLlByaW1hcnlJZEF0dHJpYnV0ZX0mJG9yZGVyYnk9JHtzb3J0RmllbGR9JTIwZGVzYyYkdG9wPTEke2ZpbHRlckNsYXVzZX1gO1xyXG4gICAgICBjb25zb2xlLmxvZygnW0R5bmFtaWNzQ2F0XSBPRGF0YSBxdWVyeTonLCByZWNvcmRVcmwpO1xyXG4gICAgICBjb25zdCByZXMgID0gYXdhaXQgZmV0Y2gocmVjb3JkVXJsLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICdPRGF0YS1NYXhWZXJzaW9uJzogJzQuMCcsXHJcbiAgICAgICAgICAnT0RhdGEtVmVyc2lvbic6ICc0LjAnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKSBhcyB7IHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10gfTtcclxuXHJcbiAgICAgIGlmICghanNvbi52YWx1ZT8ubGVuZ3RoKSB7XHJcbiAgICAgICAgc2hvd1RvYXN0KGBObyByZWNvcmRzIGZvdW5kIGZvciBcIiR7Z2V0RGlzcGxheU5hbWUobWV0YSl9XCIuYCwgJ3dhcm4nKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJhd0lkICAgPSBqc29uLnZhbHVlWzBdW21ldGEuUHJpbWFyeUlkQXR0cmlidXRlXSA/PyAnJztcclxuICAgICAgY29uc3QgY2xlYW5JZCA9IHJhd0lkLnJlcGxhY2UoL15cXHt8XFx9JC9nLCAnJyk7XHJcbiAgICAgIGlmICghY2xlYW5JZCkgeyBzaG93VG9hc3QoJ0NvdWxkIG5vdCBkZXRlcm1pbmUgcmVjb3JkIElELicsICd3YXJuJyk7IHJldHVybjsgfVxyXG5cclxuICAgICAgd2luZG93Lm9wZW4oXHJcbiAgICAgICAgYCR7Y2xpZW50VXJsfS9tYWluLmFzcHg/cGFnZXR5cGU9ZW50aXR5cmVjb3JkJmV0bj0ke21ldGEuTG9naWNhbE5hbWV9JmlkPSU3QiR7Y2xlYW5JZH0lN0RgLFxyXG4gICAgICAgICdfYmxhbmsnLFxyXG4gICAgICApO1xyXG4gICAgICBwYW5lbC5yZW1vdmUoKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBzaG93VG9hc3QoJ0ZhaWxlZCB0byBmZXRjaCByZWNvcmQuJywgJ3dhcm4nKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIG9wZW5CdG4uZGlzYWJsZWQgICAgPSBmYWxzZTtcclxuICAgICAgb3BlbkJ0bi50ZXh0Q29udGVudCA9ICdPcGVuIFJlY29yZCc7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgb3BlbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgdm9pZCBvcGVuUmVjb3JkKCk7IH0pO1xyXG4gIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB2b2lkIG9wZW5SZWNvcmQoKTtcclxuICB9KTtcclxufVxyXG5cclxudm9pZCBtYWluKCk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQTBCTyxXQUFTLGNBQWMsT0FBb0IsUUFBcUIsVUFBNkI7QUFDbEcsMEJBQXNCLE1BQU07QUFDMUIsWUFBTSxPQUFPLE1BQU0sc0JBQXNCO0FBQ3pDLFlBQU0sTUFBTSxPQUFZLEtBQUssT0FBTztBQUNwQyxZQUFNLE1BQU0sTUFBWSxLQUFLLE1BQU87QUFDcEMsWUFBTSxNQUFNLFFBQVk7QUFDeEIsWUFBTSxNQUFNLFlBQVk7QUFBQSxJQUMxQixDQUFDO0FBRUQsUUFBSSxXQUFXO0FBQ2YsUUFBSSxVQUFVO0FBQ2QsUUFBSSxVQUFVO0FBRWQsVUFBTSxjQUFjLENBQUMsTUFBa0I7QUFDckMsVUFBSSxDQUFDLFNBQVU7QUFDZixZQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsVUFBVSxTQUFTLE9BQU8sYUFBYyxNQUFNLFdBQVcsQ0FBQztBQUMzRixZQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsVUFBVSxTQUFTLE9BQU8sY0FBYyxNQUFNLFlBQVksQ0FBQztBQUM1RixZQUFNLE1BQU0sT0FBTyxJQUFJO0FBQ3ZCLFlBQU0sTUFBTSxNQUFPLElBQUk7QUFBQSxJQUN6QjtBQUVBLFVBQU0sWUFBWSxNQUFNO0FBQUUsaUJBQVc7QUFBTyxhQUFPLE1BQU0sU0FBUztBQUFBLElBQVE7QUFFMUUsV0FBTyxpQkFBaUIsYUFBYSxDQUFDLE1BQU07QUFDMUMsVUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFjLEVBQUc7QUFDekMsaUJBQVc7QUFDWCxnQkFBVyxFQUFFLFVBQVUsTUFBTTtBQUM3QixnQkFBVyxFQUFFLFVBQVUsTUFBTTtBQUM3QixhQUFPLE1BQU0sU0FBUztBQUN0QixRQUFFLGVBQWU7QUFBQSxJQUNuQixDQUFDO0FBRUQsYUFBUyxpQkFBaUIsYUFBYSxXQUFXO0FBQ2xELGFBQVMs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
