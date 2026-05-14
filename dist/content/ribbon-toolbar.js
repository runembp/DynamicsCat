"use strict";
(() => {
  // src/actions.ts
  var ACTIONS = [
    { action: "injectAllFields", file: "content/all-fields.js", label: "All Fields", icon: "\u{1F4CB}", popupBtnId: "btn-all-fields" },
    { action: "injectOptionSets", file: "content/option-sets.js", label: "Option Sets", icon: "\u{1F518}", popupBtnId: "btn-show-option-sets" },
    { action: "injectShowHiddenFields", file: "content/show-hidden-fields.js", label: "Hidden Fields", icon: "\u{1F441}", popupBtnId: "btn-show-hidden-fields" },
    { action: "injectDirtyFields", file: "content/dirty-fields.js", label: "Dirty Fields", icon: "\u270F\uFE0F", popupBtnId: "btn-dirty-fields" },
    { action: "injectOverrideReadonly", file: "content/override-readonly.js", label: "Override Readonly", icon: "\u{1F513}", popupBtnId: "btn-override-readonly" },
    { action: "injectLookupsOpener", file: "content/lookups-opener.js", label: "Lookups Opener", icon: "\u{1FA9F}", popupBtnId: "btn-lookups-opener" },
    { action: "openOnApi", file: "content/open-on-api.js", label: "Open on API", icon: "\u{1F517}", popupBtnId: "btn-open-on-api" },
    { action: "jumpToLatest", file: "content/jump-to-latest.js", label: "Jump to Latest", icon: "\u{1F550}", popupBtnId: "btn-jump-to-latest", allFrames: false },
    { action: "jumpToLatestQuick", file: "content/jump-to-latest-quick.js", label: "Jump to Latest (Quick)", icon: "\u26A1", allFrames: false },
    { action: "activateActivity", file: "content/activate-activity.js", label: "Activate", icon: "\u{1F513}", popupBtnId: "btn-activate-activity", conditional: "activatable" }
  ];
  var ACTION_MAP = Object.fromEntries(
    ACTIONS.map((a) => [a.action, { file: a.file, allFrames: a.allFrames ?? true }])
  );

  // src/content/state.ts
  var STATE_KEYS = {
    hiddenActive: "dynamicsCatHiddenActive",
    dirtyActive: "dynamicsCatDirtyActive",
    readonlyOverrideActive: "dynamicsCatReadonlyOverrideActive",
    readonlySilentInject: "dynamicsCatReadonlySilentInject",
    readonlyShortcut: "dynamicsCatReadonlyShortcut",
    lookupsOpenerActive: "dynamicsCatLookupsOpenerActive",
    lookupsOpenerSilentInject: "dynamicsCatLookupsOpenerSilentInject",
    lookupsOpenerShortcut: "dynamicsCatLookupsOpenerShortcut",
    revealedNames: "dynamicsCatRevealedNames",
    toggleLock: "dynamicsCatToggleLock",
    activatable: "dynamicsCatActivatable"
  };
  function getSharedDataset() {
    try {
      return (window.top ?? window).document.documentElement.dataset;
    } catch {
      return document.documentElement.dataset;
    }
  }
  function writeFlag(key, value) {
    getSharedDataset()[STATE_KEYS[key]] = value;
  }

  // src/ribbon/ribbon-toolbar/ribbon-toolbar.ts
  var TOOLBAR_ID = "crm-tools-ribbon-toolbar";
  var STYLE_ID = "crm-tools-ribbon-style";
  var DROPDOWN_ID = "crm-tools-ribbon-dropdown";
  var CTX_BANNER_ID = "crm-tools-ctx-banner";
  var DEFAULT_READONLY_SHORTCUT = "alt";
  var DEFAULT_LOOKUPS_OPENER_SHORTCUT = "ctrl";
  function createShortcutSelect() {
    const select = document.createElement("select");
    select.className = "crt-readonly-settings-select";
    const options = [
      { value: "alt+shift", label: "Alt+Shift+Click" },
      { value: "alt", label: "Alt+Click" },
      { value: "shift", label: "Shift+Click" },
      { value: "ctrl", label: "Ctrl+Click" },
      { value: "ctrl+shift", label: "Ctrl+Shift+Click" }
    ];
    for (const option of options) {
      const optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      select.appendChild(optionEl);
    }
    return select;
  }
  function loadShortcutSettings(callback) {
    try {
      chrome.storage.local.get(["readonlyShortcut", "lookupsOpenerShortcut"], (result) => {
        callback(result);
      });
    } catch {
      showContextInvalidatedBanner();
    }
  }
  function stopKeyPropagation(element) {
    for (const eventName of ["keydown", "keyup"]) {
      element.addEventListener(eventName, (e) => {
        e.stopPropagation();
      });
    }
  }
  var conditionalButtons = {};
  var outsideClickHandler = null;
  function showContextInvalidatedBanner() {
    if (document.getElementById(CTX_BANNER_ID)) return;
    const banner = document.createElement("div");
    banner.id = CTX_BANNER_ID;
    banner.style.cssText = [
      "position: fixed",
      "top: 0",
      "left: 0",
      "right: 0",
      "z-index: 2147483647",
      "background: #c0392b",
      "color: #fff",
      "font-family: Segoe UI, Arial, sans-serif",
      "font-size: 13px",
      "padding: 8px 16px",
      "text-align: center"
    ].join("; ");
    banner.textContent = "\u26A0\uFE0F DynamicsCat was reloaded \u2014 please refresh this tab to restore the toolbar.";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "\u2715";
    closeBtn.style.cssText = "margin-left: 12px; background: transparent; border: none; color: #fff; cursor: pointer; font-size: 15px;";
    closeBtn.addEventListener("click", () => banner.remove());
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
  }
  function sendAction(action) {
    try {
      chrome.runtime.sendMessage({ action });
    } catch {
      showContextInvalidatedBanner();
    }
  }
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#crm-tools-ribbon-toolbar .navTabButtonLink { cursor: pointer; text-decoration: none; }
.crt-dropdown-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; height: 40px; padding: 0 16px;
  background: transparent; border: none;
  color: #1f1f1f; font-size: 13px; font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif;
  cursor: pointer; text-align: left; white-space: nowrap;
}
.crt-dropdown-btn:hover { background: #f1f3f4; }
.crt-dropdown-btn:active { background: #e8eaed; }
.crt-dropdown-btn.crt-active { background: rgba(46,125,50,0.08); }
.crt-dropdown-btn.crt-active:hover { background: rgba(46,125,50,0.14); }
.crt-btn-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.crt-btn-active-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e7d32; margin-left: auto; flex-shrink: 0; display: none; }
.crt-dropdown-btn.crt-active .crt-btn-active-dot { display: block; }
.crt-readonly-settings-wrap { display: flex; flex-direction: column; }
.crt-readonly-settings-row {
  display: flex; align-items: center;
}
.crt-readonly-settings-row .crt-dropdown-btn {
  flex: 1 1 auto; width: auto; min-width: 0;
}
.crt-readonly-settings-gear {
  background: transparent; border: none; cursor: pointer;
  font-size: 14px; padding: 2px 4px; margin-right: 16px; border-radius: 4px; opacity: 0.6;
  flex-shrink: 0;
}
.crt-readonly-settings-gear:hover { opacity: 1; background: #f1f3f4; }
.crt-readonly-settings-panel {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #5f6368;
  padding: 0 16px 8px 48px;
}
.crt-readonly-settings-panel[hidden] { display: none; }
.crt-readonly-settings-select {
  font-family: inherit; font-size: 12px; padding: 2px 4px;
  border: 1px solid #dadce0; border-radius: 4px; background: #fff; color: #1f1f1f;
}
   `;
    (document.head || document.documentElement).appendChild(style);
  }
  function setButtonActive(btn, active) {
    btn.classList.toggle("crt-active", active);
  }
  function buildToolbar() {
    if (document.getElementById(TOOLBAR_ID)) return;
    const staleDropdown = document.getElementById(DROPDOWN_ID);
    if (staleDropdown) staleDropdown.remove();
    injectStyles();
    const wrapper = document.createElement("span");
    wrapper.className = "navTabButton";
    wrapper.id = TOOLBAR_ID;
    wrapper.title = "DynamicsCat";
    const link = document.createElement("a");
    link.className = "navTabButtonLink";
    link.role = "button";
    link.tabIndex = 0;
    link.title = "";
    const imgContainer = document.createElement("span");
    imgContainer.className = "navTabButtonImageContainer";
    const icon = document.createElement("img");
    let iconSrc = "";
    try {
      iconSrc = chrome.runtime.getURL("icons/icon32.png");
    } catch {
    }
    icon.src = iconSrc;
    icon.alt = "DynamicsCat";
    icon.style.cssText = "width:24px;height:24px;display:block;";
    imgContainer.appendChild(icon);
    link.appendChild(imgContainer);
    wrapper.appendChild(link);
    const dropdown = document.createElement("div");
    dropdown.id = DROPDOWN_ID;
    dropdown.style.cssText = [
      "position: fixed",
      "z-index: 2147483647",
      "background: #fff",
      "border-radius: 8px",
      "box-shadow: 0 2px 10px rgba(0,0,0,0.18)",
      "padding: 8px 0",
      "min-width: 400px",
      "display: none",
      "grid-template-columns: 1fr 1fr"
    ].join("; ");
    function makeDropdownBtn(icon2, label) {
      const btn = document.createElement("button");
      btn.className = "crt-dropdown-btn";
      const iconEl = document.createElement("span");
      iconEl.className = "crt-btn-icon";
      iconEl.textContent = icon2;
      const labelEl = document.createElement("span");
      labelEl.textContent = label;
      const dot = document.createElement("span");
      dot.className = "crt-btn-active-dot";
      btn.appendChild(iconEl);
      btn.appendChild(labelEl);
      btn.appendChild(dot);
      return btn;
    }
    const colLeft = document.createElement("div");
    const colRight = document.createElement("div");
    colRight.style.cssText = "border-left: 1px solid #e8eaed;";
    const LEFT_ACTIONS = /* @__PURE__ */ new Set([
      "injectAllFields",
      "injectOptionSets",
      "injectShowHiddenFields",
      "injectDirtyFields",
      "injectOverrideReadonly",
      "injectLookupsOpener"
    ]);
    const activeButtons = {};
    let readonlyShortcutSelect = null;
    let lookupsOpenerShortcutSelect = null;
    const bindShortcutSelect = (select, storageKey, otherStorageKey, otherToolLabel, defaultValue) => {
      let previousValue = defaultValue;
      select.addEventListener("focus", () => {
        previousValue = select.value;
      });
      select.addEventListener("change", () => {
        const nextValue = select.value;
        loadShortcutSettings((settings) => {
          const otherValue = settings[otherStorageKey] || (otherStorageKey === "readonlyShortcut" ? DEFAULT_READONLY_SHORTCUT : DEFAULT_LOOKUPS_OPENER_SHORTCUT);
          if (nextValue === otherValue) {
            alert(`Shortcut already used by ${otherToolLabel}`);
            select.value = previousValue;
            return;
          }
          try {
            chrome.storage.local.set({ [storageKey]: nextValue });
            previousValue = nextValue;
          } catch {
            showContextInvalidatedBanner();
          }
        });
      });
      stopKeyPropagation(select);
    };
    const createShortcutSettingsControl = (btn, storageKey, defaultValue, otherStorageKey, otherToolLabel) => {
      const wrap = document.createElement("div");
      wrap.className = "crt-readonly-settings-wrap";
      const settingsRow = document.createElement("div");
      settingsRow.className = "crt-readonly-settings-row";
      const gearBtn = document.createElement("button");
      gearBtn.type = "button";
      gearBtn.className = "crt-readonly-settings-gear";
      gearBtn.title = "Shortcut settings";
      gearBtn.setAttribute("aria-label", "Shortcut settings");
      gearBtn.textContent = "\u2699\uFE0F";
      const settingsPanel = document.createElement("div");
      settingsPanel.className = "crt-readonly-settings-panel";
      settingsPanel.hidden = true;
      const label = document.createElement("label");
      label.textContent = "Shortcut:";
      const select = createShortcutSelect();
      const loadShortcut = () => {
        loadShortcutSettings((result) => {
          select.value = storageKey === "readonlyShortcut" ? result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT : result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
        });
      };
      gearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nextHidden = !settingsPanel.hidden;
        settingsPanel.hidden = nextHidden;
        if (!nextHidden) loadShortcut();
      });
      bindShortcutSelect(select, storageKey, otherStorageKey, otherToolLabel, defaultValue);
      settingsPanel.appendChild(label);
      settingsPanel.appendChild(select);
      settingsRow.appendChild(btn);
      settingsRow.appendChild(gearBtn);
      wrap.appendChild(settingsRow);
      wrap.appendChild(settingsPanel);
      return wrap;
    };
    for (const def of ACTIONS) {
      if (!def.popupBtnId) continue;
      const btn = makeDropdownBtn(def.icon, def.label);
      btn.addEventListener("click", () => {
        dropdown.style.display = "none";
        if (def.action === "injectOverrideReadonly") {
          const willBeActive = getSharedDataset()[STATE_KEYS.readonlyOverrideActive] !== "1";
          try {
            chrome.storage.local.set({ readonlyOverride: willBeActive });
          } catch {
          }
        }
        if (def.action === "injectLookupsOpener") {
          const willBeActive = getSharedDataset()[STATE_KEYS.lookupsOpenerActive] !== "1";
          try {
            chrome.storage.local.set({ lookupsOpenerOverride: willBeActive });
          } catch {
          }
        }
        sendAction(def.action);
      });
      if (def.conditional) {
        btn.style.display = "none";
        (conditionalButtons[def.conditional] ??= []).push(btn);
      }
      if (def.action === "injectShowHiddenFields" || def.action === "injectDirtyFields" || def.action === "injectOverrideReadonly" || def.action === "injectLookupsOpener") {
        activeButtons[def.action] = btn;
      }
      const parent = LEFT_ACTIONS.has(def.action) ? colLeft : colRight;
      if (def.action !== "injectOverrideReadonly" && def.action !== "injectLookupsOpener") {
        parent.appendChild(btn);
        continue;
      }
      if (def.action === "injectOverrideReadonly") {
        const wrap2 = createShortcutSettingsControl(
          btn,
          "readonlyShortcut",
          DEFAULT_READONLY_SHORTCUT,
          "lookupsOpenerShortcut",
          "Lookups Opener"
        );
        readonlyShortcutSelect = wrap2.querySelector("select");
        parent.appendChild(wrap2);
        continue;
      }
      const wrap = createShortcutSettingsControl(
        btn,
        "lookupsOpenerShortcut",
        DEFAULT_LOOKUPS_OPENER_SHORTCUT,
        "readonlyShortcut",
        "Override Readonly"
      );
      lookupsOpenerShortcutSelect = wrap.querySelector("select");
      parent.appendChild(wrap);
    }
    loadShortcutSettings((result) => {
      if (readonlyShortcutSelect) {
        readonlyShortcutSelect.value = result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT;
      }
      if (lookupsOpenerShortcutSelect) {
        lookupsOpenerShortcutSelect.value = result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
      }
    });
    dropdown.appendChild(colLeft);
    dropdown.appendChild(colRight);
    document.body.appendChild(dropdown);
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdown.style.display === "grid") {
        dropdown.style.display = "none";
      } else {
        const rect = wrapper.getBoundingClientRect();
        dropdown.style.top = rect.bottom + "px";
        dropdown.style.left = rect.left + "px";
        const ds = getSharedDataset();
        const hiddenBtn = activeButtons["injectShowHiddenFields"];
        const dirtyBtn = activeButtons["injectDirtyFields"];
        const readonlyBtn = activeButtons["injectOverrideReadonly"];
        const lookupsBtn = activeButtons["injectLookupsOpener"];
        if (hiddenBtn) setButtonActive(hiddenBtn, ds[STATE_KEYS.hiddenActive] === "1");
        if (dirtyBtn) setButtonActive(dirtyBtn, ds[STATE_KEYS.dirtyActive] === "1");
        if (readonlyBtn) setButtonActive(readonlyBtn, ds[STATE_KEYS.readonlyOverrideActive] === "1");
        if (lookupsBtn) setButtonActive(lookupsBtn, ds[STATE_KEYS.lookupsOpenerActive] === "1");
        dropdown.style.display = "grid";
      }
    });
    if (outsideClickHandler) document.removeEventListener("click", outsideClickHandler);
    outsideClickHandler = (e) => {
      if (!wrapper.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    };
    document.addEventListener("click", outsideClickHandler);
    window.addEventListener("blur", () => {
      dropdown.style.display = "none";
    });
    const navBar = document.getElementById("navBar");
    if (!navBar) {
      dropdown.remove();
      if (outsideClickHandler) {
        document.removeEventListener("click", outsideClickHandler);
        outsideClickHandler = null;
      }
      return;
    }
    navBar.prepend(wrapper);
  }
  function startObserver() {
    const root = document.body;
    new MutationObserver(() => {
      if (!document.getElementById(TOOLBAR_ID)) buildToolbar();
    }).observe(root, { childList: true, subtree: true });
  }
  function isCrmPage() {
    const mainBody = document.querySelectorAll("body[scroll=no]");
    const topBar = document.querySelector("div[data-id=topBar]");
    return mainBody && mainBody.length > 0 || topBar !== null;
  }
  function hasNavBar() {
    return document.getElementById("navBar") !== null;
  }
  function probeConditionalActions() {
    try {
      chrome.runtime.sendMessage({ action: "probeActivatable" }, (response) => {
        if (response?.activatable) {
          const ds = getSharedDataset();
          ds[STATE_KEYS.activatable] = "1";
          for (const btn of conditionalButtons["activatable"] ?? []) {
            btn.style.display = "";
          }
        }
      });
    } catch {
      showContextInvalidatedBanner();
    }
  }
  if (isCrmPage() && hasNavBar()) {
    buildToolbar();
    startObserver();
    probeConditionalActions();
    try {
      chrome.storage.local.get(["readonlyOverride", "lookupsOpenerOverride"], (result) => {
        if (result.readonlyOverride !== false) {
          writeFlag("readonlySilentInject", "1");
          sendAction("injectOverrideReadonly");
        }
        if (result.lookupsOpenerOverride !== false) {
          writeFlag("lookupsOpenerSilentInject", "1");
          sendAction("injectLookupsOpener");
        }
      });
    } catch {
      showContextInvalidatedBanner();
    }
    window.addEventListener("message", (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "dynamicscat-open-background-tab" || !e.data.url) return;
      const url = e.data.url;
      if (!url.startsWith(window.location.origin + "/")) return;
      try {
        chrome.runtime.sendMessage({ action: "openBackgroundTab", url });
      } catch {
        showContextInvalidatedBanner();
      }
    });
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vLi4vc3JjL2NvbnRlbnQvc3RhdGUudHMiLCAiLi4vLi4vc3JjL3JpYmJvbi9yaWJib24tdG9vbGJhci9yaWJib24tdG9vbGJhci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gU2luZ2xlIHJlZ2lzdHJ5IG9mIER5bmFtaWNzQ2F0IGFjdGlvbnMgXHUyMDE0IGNvbnN1bWVkIGJ5IGJhY2tncm91bmQsIHBvcHVwLCBhbmQgcmliYm9uLlxyXG4vLyBBZGRpbmcgYSBuZXcgYWN0aW9uIGhlcmUgYXV0b21hdGljYWxseSB3aXJlcyBpdCBpbnRvIGFsbCB0aHJlZSBzdXJmYWNlcy5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uRGVmIHtcclxuICBhY3Rpb246IHN0cmluZztcclxuICBmaWxlOiBzdHJpbmc7XHJcbiAgYWxsRnJhbWVzPzogYm9vbGVhbjsgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgaWNvbjogc3RyaW5nO1xyXG4gIHBvcHVwQnRuSWQ/OiBzdHJpbmc7XHJcbiAgLyoqIElmIHNldCwgdGhlIGJ1dHRvbiBpcyBoaWRkZW4gdW50aWwgYSBydW50aW1lIHByb2JlIGNvbmZpcm1zIGl0IHNob3VsZCBhcHBlYXIuICovXHJcbiAgY29uZGl0aW9uYWw/OiAnYWN0aXZhdGFibGUnO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgQUNUSU9OUzogQWN0aW9uRGVmW10gPSBbXHJcbiAgeyBhY3Rpb246ICdpbmplY3RBbGxGaWVsZHMnLCAgICAgICAgZmlsZTogJ2NvbnRlbnQvYWxsLWZpZWxkcy5qcycsICAgICAgICAgIGxhYmVsOiAnQWxsIEZpZWxkcycsICAgICBpY29uOiAnXHVEODNEXHVEQ0NCJywgcG9wdXBCdG5JZDogJ2J0bi1hbGwtZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0T3B0aW9uU2V0cycsICAgICAgIGZpbGU6ICdjb250ZW50L29wdGlvbi1zZXRzLmpzJywgICAgICAgICBsYWJlbDogJ09wdGlvbiBTZXRzJywgICAgaWNvbjogJ1x1RDgzRFx1REQxOCcsIHBvcHVwQnRuSWQ6ICdidG4tc2hvdy1vcHRpb24tc2V0cycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdFNob3dIaWRkZW5GaWVsZHMnLCBmaWxlOiAnY29udGVudC9zaG93LWhpZGRlbi1maWVsZHMuanMnLCAgbGFiZWw6ICdIaWRkZW4gRmllbGRzJywgIGljb246ICdcdUQ4M0RcdURDNDEnLCBwb3B1cEJ0bklkOiAnYnRuLXNob3ctaGlkZGVuLWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdERpcnR5RmllbGRzJywgICAgICBmaWxlOiAnY29udGVudC9kaXJ0eS1maWVsZHMuanMnLCAgICAgICAgbGFiZWw6ICdEaXJ0eSBGaWVsZHMnLCAgIGljb246ICdcdTI3MEZcdUZFMEYnLCBwb3B1cEJ0bklkOiAnYnRuLWRpcnR5LWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdE92ZXJyaWRlUmVhZG9ubHknLCBmaWxlOiAnY29udGVudC9vdmVycmlkZS1yZWFkb25seS5qcycsICAgbGFiZWw6ICdPdmVycmlkZSBSZWFkb25seScsIGljb246ICdcdUQ4M0RcdUREMTMnLCBwb3B1cEJ0bklkOiAnYnRuLW92ZXJyaWRlLXJlYWRvbmx5JyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0TG9va3Vwc09wZW5lcicsICAgIGZpbGU6ICdjb250ZW50L2xvb2t1cHMtb3BlbmVyLmpzJywgICAgICBsYWJlbDogJ0xvb2t1cHMgT3BlbmVyJywgaWNvbjogJ1x1RDgzRVx1REU5RicsIHBvcHVwQnRuSWQ6ICdidG4tbG9va3Vwcy1vcGVuZXInIH0sXHJcbiAgeyBhY3Rpb246ICdvcGVuT25BcGknLCAgICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvb3Blbi1vbi1hcGkuanMnLCAgICAgICAgIGxhYmVsOiAnT3BlbiBvbiBBUEknLCAgICBpY29uOiAnXHVEODNEXHVERDE3JywgcG9wdXBCdG5JZDogJ2J0bi1vcGVuLW9uLWFwaScgfSxcclxuICB7IGFjdGlvbjogJ2p1bXBUb0xhdGVzdCcsICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvanVtcC10by1sYXRlc3QuanMnLCAgICAgICBsYWJlbDogJ0p1bXAgdG8gTGF0ZXN0JywgaWNvbjogJ1x1RDgzRFx1REQ1MCcsIHBvcHVwQnRuSWQ6ICdidG4tanVtcC10by1sYXRlc3QnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbiAgeyBhY3Rpb246ICdqdW1wVG9MYXRlc3RRdWljaycsICAgICAgZmlsZTogJ2NvbnRlbnQvanVtcC10by1sYXRlc3QtcXVpY2suanMnLCBsYWJlbDogJ0p1bXAgdG8gTGF0ZXN0IChRdWljayknLCBpY29uOiAnXHUyNkExJywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG4gIHsgYWN0aW9uOiAnYWN0aXZhdGVBY3Rpdml0eScsICAgICAgZmlsZTogJ2NvbnRlbnQvYWN0aXZhdGUtYWN0aXZpdHkuanMnLCAgICBsYWJlbDogJ0FjdGl2YXRlJywgICAgICAgaWNvbjogJ1x1RDgzRFx1REQxMycsIHBvcHVwQnRuSWQ6ICdidG4tYWN0aXZhdGUtYWN0aXZpdHknLCBjb25kaXRpb25hbDogJ2FjdGl2YXRhYmxlJyB9LFxyXG5dO1xyXG5cclxuLyoqIExvb2t1cCBtYXAgZnJvbSBhY3Rpb24gbmFtZSB0byBzY3JpcHQgY29uZmlnLCBmb3IgdGhlIGJhY2tncm91bmQgc2VydmljZSB3b3JrZXIuICovXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05fTUFQOiBSZWNvcmQ8c3RyaW5nLCB7IGZpbGU6IHN0cmluZzsgYWxsRnJhbWVzOiBib29sZWFuIH0+ID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gIEFDVElPTlMubWFwKGEgPT4gW2EuYWN0aW9uLCB7IGZpbGU6IGEuZmlsZSwgYWxsRnJhbWVzOiBhLmFsbEZyYW1lcyA/PyB0cnVlIH1dKSxcclxuKTtcclxuIiwgIi8vIENyb3NzLWZyYW1lIHN0YXRlIGhlbHBlcnMgZm9yIER5bmFtaWNzQ2F0IGNvbnRlbnQgc2NyaXB0cy5cclxuLy8gQm90aCBNQUlOIGFuZCBJU09MQVRFRCB3b3JsZCBzY3JpcHRzIGNhbiBpbXBvcnQgdGhpcyBtb2R1bGUgXHUyMDE0IGVzYnVpbGQgaW5saW5lc1xyXG4vLyBpdCBpbnRvIGVhY2ggYnVuZGxlLiAgUnVudGltZSBjb21tdW5pY2F0aW9uIGdvZXMgdGhyb3VnaCBkYXRhc2V0IHByb3BlcnRpZXMgb25cclxuLy8gdGhlIHRvcC1sZXZlbCBkb2N1bWVudCBlbGVtZW50LlxyXG5cclxuZXhwb3J0IGNvbnN0IFNUQVRFX0tFWVMgPSB7XHJcbiAgaGlkZGVuQWN0aXZlOiAnZHluYW1pY3NDYXRIaWRkZW5BY3RpdmUnLFxyXG4gIGRpcnR5QWN0aXZlOiAnZHluYW1pY3NDYXREaXJ0eUFjdGl2ZScsXHJcbiAgcmVhZG9ubHlPdmVycmlkZUFjdGl2ZTogJ2R5bmFtaWNzQ2F0UmVhZG9ubHlPdmVycmlkZUFjdGl2ZScsXHJcbiAgcmVhZG9ubHlTaWxlbnRJbmplY3Q6ICdkeW5hbWljc0NhdFJlYWRvbmx5U2lsZW50SW5qZWN0JyxcclxuICByZWFkb25seVNob3J0Y3V0OiAnZHluYW1pY3NDYXRSZWFkb25seVNob3J0Y3V0JyxcclxuICBsb29rdXBzT3BlbmVyQWN0aXZlOiAnZHluYW1pY3NDYXRMb29rdXBzT3BlbmVyQWN0aXZlJyxcclxuICBsb29rdXBzT3BlbmVyU2lsZW50SW5qZWN0OiAnZHluYW1pY3NDYXRMb29rdXBzT3BlbmVyU2lsZW50SW5qZWN0JyxcclxuICBsb29rdXBzT3BlbmVyU2hvcnRjdXQ6ICdkeW5hbWljc0NhdExvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgcmV2ZWFsZWROYW1lczogJ2R5bmFtaWNzQ2F0UmV2ZWFsZWROYW1lcycsXHJcbiAgdG9nZ2xlTG9jazogJ2R5bmFtaWNzQ2F0VG9nZ2xlTG9jaycsXHJcbiAgYWN0aXZhdGFibGU6ICdkeW5hbWljc0NhdEFjdGl2YXRhYmxlJyxcclxufSBhcyBjb25zdDtcclxuXHJcbnR5cGUgU3RhdGVLZXkgPSBrZXlvZiB0eXBlb2YgU1RBVEVfS0VZUztcclxuXHJcbi8qKiBEYXRhc2V0IG9mIHRoZSB0b3AtbGV2ZWwgZG9jdW1lbnQsIGZhbGxpbmcgYmFjayB0byBjdXJyZW50IGZyYW1lIHdoZW4gY3Jvc3Mtb3JpZ2luLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2hhcmVkRGF0YXNldCgpOiBET01TdHJpbmdNYXAge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gKCh3aW5kb3cudG9wID8/IHdpbmRvdykgYXMgV2luZG93KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldDtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkRmxhZyhrZXk6IFN0YXRlS2V5KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICByZXR1cm4gZ2V0U2hhcmVkRGF0YXNldCgpW1NUQVRFX0tFWVNba2V5XV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZsYWcoa2V5OiBTdGF0ZUtleSwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xyXG4gIGdldFNoYXJlZERhdGFzZXQoKVtTVEFURV9LRVlTW2tleV1dID0gdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckZsYWcoa2V5OiBTdGF0ZUtleSk6IHZvaWQge1xyXG4gIGRlbGV0ZSBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZU1trZXldXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFjcXVpcmUgYSBzaG9ydC1saXZlZCBsb2NrIHRvIHByZXZlbnQgZHVwbGljYXRlIGV4ZWN1dGlvbiB3aGVuIGFsbEZyYW1lczogdHJ1ZVxyXG4gKiBpbmplY3RzIHRoZSBzYW1lIHNjcmlwdCBpbnRvIG11bHRpcGxlIENSTSBpZnJhbWVzLlxyXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGxvY2sgd2FzIGFjcXVpcmVkOyBmYWxzZSBpZiBhbHJlYWR5IGhlbGQgYnkgYW5vdGhlciBmcmFtZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhY3F1aXJlVG9nZ2xlTG9jayhtcyA9IDEwMDApOiBib29sZWFuIHtcclxuICBjb25zdCBkcyA9IGdldFNoYXJlZERhdGFzZXQoKTtcclxuICBpZiAoZHNbU1RBVEVfS0VZUy50b2dnbGVMb2NrXSkgcmV0dXJuIGZhbHNlO1xyXG4gIGRzW1NUQVRFX0tFWVMudG9nZ2xlTG9ja10gPSAnMSc7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7IGRlbGV0ZSBkc1tTVEFURV9LRVlTLnRvZ2dsZUxvY2tdOyB9LCBtcyk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkSnNvbkFycmF5KGtleTogU3RhdGVLZXkpOiBzdHJpbmdbXSB7XHJcbiAgY29uc3QgcmF3ID0gZ2V0U2hhcmVkRGF0YXNldCgpW1NUQVRFX0tFWVNba2V5XV07XHJcbiAgaWYgKCFyYXcpIHJldHVybiBbXTtcclxuICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShyYXcpIGFzIHN0cmluZ1tdOyB9IGNhdGNoIHsgcmV0dXJuIFtdOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUpzb25BcnJheShrZXk6IFN0YXRlS2V5LCBhcnI6IHN0cmluZ1tdKTogdm9pZCB7XHJcbiAgZ2V0U2hhcmVkRGF0YXNldCgpW1NUQVRFX0tFWVNba2V5XV0gPSBKU09OLnN0cmluZ2lmeShhcnIpO1xyXG59XHJcbiIsICIvLyBET00taW5qZWN0aW9uIHRvb2xiYXIgZm9yIENSTSBwYWdlcyAoSVNPTEFURUQgd29ybGQpLlxyXG4vLyBJbmplY3RzIGEgXCJDXCIgdG9nZ2xlIGJ1dHRvbiBhdCB0aGUgZmFyIGxlZnQgb2YgI25hdkJhciAodGhlIENSTSBtYXN0aGVhZCBuYXYgYmFyKSxcclxuLy8gbWlycm9yaW5nIHRoZSBjcm0tcG93ZXItcGFuZS1idXR0b24gc3RydWN0dXJlLlxyXG4vLyBEb2VzIE5PVCB0b3VjaCBYcm0gXHUyMDE0IGRlbGVnYXRlcyBhY3Rpb25zIHRvIGJhY2tncm91bmQgdmlhIHNlbmRNZXNzYWdlLlxyXG5cclxuaW1wb3J0IHsgQUNUSU9OUyB9IGZyb20gJy4uLy4uL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyBTVEFURV9LRVlTLCBnZXRTaGFyZWREYXRhc2V0LCB3cml0ZUZsYWcgfSBmcm9tICcuLi8uLi9jb250ZW50L3N0YXRlJztcclxuXHJcbmNvbnN0IFRPT0xCQVJfSUQgPSAnY3JtLXRvb2xzLXJpYmJvbi10b29sYmFyJztcclxuY29uc3QgU1RZTEVfSUQgICA9ICdjcm0tdG9vbHMtcmliYm9uLXN0eWxlJztcclxuY29uc3QgRFJPUERPV05fSUQgPSAnY3JtLXRvb2xzLXJpYmJvbi1kcm9wZG93bic7XHJcbmNvbnN0IENUWF9CQU5ORVJfSUQgPSAnY3JtLXRvb2xzLWN0eC1iYW5uZXInO1xyXG5jb25zdCBERUZBVUxUX1JFQURPTkxZX1NIT1JUQ1VUID0gJ2FsdCc7XHJcbmNvbnN0IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQgPSAnY3RybCc7XHJcblxyXG50eXBlIFNob3J0Y3V0U3RvcmFnZSA9IHtcclxuICByZWFkb25seVNob3J0Y3V0Pzogc3RyaW5nO1xyXG4gIGxvb2t1cHNPcGVuZXJTaG9ydGN1dD86IHN0cmluZztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVNob3J0Y3V0U2VsZWN0KCk6IEhUTUxTZWxlY3RFbGVtZW50IHtcclxuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcclxuICBzZWxlY3QuY2xhc3NOYW1lID0gJ2NydC1yZWFkb25seS1zZXR0aW5ncy1zZWxlY3QnO1xyXG5cclxuICBjb25zdCBvcHRpb25zID0gW1xyXG4gICAgeyB2YWx1ZTogJ2FsdCtzaGlmdCcsIGxhYmVsOiAnQWx0K1NoaWZ0K0NsaWNrJyB9LFxyXG4gICAgeyB2YWx1ZTogJ2FsdCcsIGxhYmVsOiAnQWx0K0NsaWNrJyB9LFxyXG4gICAgeyB2YWx1ZTogJ3NoaWZ0JywgbGFiZWw6ICdTaGlmdCtDbGljaycgfSxcclxuICAgIHsgdmFsdWU6ICdjdHJsJywgbGFiZWw6ICdDdHJsK0NsaWNrJyB9LFxyXG4gICAgeyB2YWx1ZTogJ2N0cmwrc2hpZnQnLCBsYWJlbDogJ0N0cmwrU2hpZnQrQ2xpY2snIH0sXHJcbiAgXTtcclxuXHJcbiAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0aW9ucykge1xyXG4gICAgY29uc3Qgb3B0aW9uRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbkVsLnZhbHVlID0gb3B0aW9uLnZhbHVlO1xyXG4gICAgb3B0aW9uRWwudGV4dENvbnRlbnQgPSBvcHRpb24ubGFiZWw7XHJcbiAgICBzZWxlY3QuYXBwZW5kQ2hpbGQob3B0aW9uRWwpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNlbGVjdDtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFNob3J0Y3V0U2V0dGluZ3MoY2FsbGJhY2s6IChzZXR0aW5nczogU2hvcnRjdXRTdG9yYWdlKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgdHJ5IHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3JlYWRvbmx5U2hvcnRjdXQnLCAnbG9va3Vwc09wZW5lclNob3J0Y3V0J10sIChyZXN1bHQpID0+IHtcclxuICAgICAgY2FsbGJhY2socmVzdWx0IGFzIFNob3J0Y3V0U3RvcmFnZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3BLZXlQcm9wYWdhdGlvbihlbGVtZW50OiBIVE1MU2VsZWN0RWxlbWVudCk6IHZvaWQge1xyXG4gIGZvciAoY29uc3QgZXZlbnROYW1lIG9mIFsna2V5ZG93bicsICdrZXl1cCddKSB7XHJcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCAoZSkgPT4ge1xyXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogQnV0dG9ucyB0aGF0IGFyZSBoaWRkZW4gdW50aWwgdGhlaXIgcHJvYmUgc3VjY2VlZHMuIEtleWVkIGJ5IGNvbmRpdGlvbmFsIHR5cGUuICovXHJcbmNvbnN0IGNvbmRpdGlvbmFsQnV0dG9uczogUmVjb3JkPHN0cmluZywgSFRNTEJ1dHRvbkVsZW1lbnRbXT4gPSB7fTtcclxuXHJcbmxldCBvdXRzaWRlQ2xpY2tIYW5kbGVyOiAoKGU6IE1vdXNlRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XHJcblxyXG4vKiogU2hvdyBhIHBlcnNpc3RlbnQgYmFubmVyIHdoZW4gdGhlIGV4dGVuc2lvbiBjb250ZXh0IGhhcyBiZWVuIGludmFsaWRhdGVkLiAqL1xyXG5mdW5jdGlvbiBzaG93Q29udGV4dEludmFsaWRhdGVkQmFubmVyKCk6IHZvaWQge1xyXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChDVFhfQkFOTkVSX0lEKSkgcmV0dXJuO1xyXG4gIGNvbnN0IGJhbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGJhbm5lci5pZCA9IENUWF9CQU5ORVJfSUQ7XHJcbiAgYmFubmVyLnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAncG9zaXRpb246IGZpeGVkJywgJ3RvcDogMCcsICdsZWZ0OiAwJywgJ3JpZ2h0OiAwJyxcclxuICAgICd6LWluZGV4OiAyMTQ3NDgzNjQ3JywgJ2JhY2tncm91bmQ6ICNjMDM5MmInLCAnY29sb3I6ICNmZmYnLFxyXG4gICAgJ2ZvbnQtZmFtaWx5OiBTZWdvZSBVSSwgQXJpYWwsIHNhbnMtc2VyaWYnLCAnZm9udC1zaXplOiAxM3B4JyxcclxuICAgICdwYWRkaW5nOiA4cHggMTZweCcsICd0ZXh0LWFsaWduOiBjZW50ZXInLFxyXG4gIF0uam9pbignOyAnKTtcclxuICBiYW5uZXIudGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIER5bmFtaWNzQ2F0IHdhcyByZWxvYWRlZCBcdTIwMTQgcGxlYXNlIHJlZnJlc2ggdGhpcyB0YWIgdG8gcmVzdG9yZSB0aGUgdG9vbGJhci4nO1xyXG4gIGNvbnN0IGNsb3NlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgY2xvc2VCdG4udGV4dENvbnRlbnQgPSAnXHUyNzE1JztcclxuICBjbG9zZUJ0bi5zdHlsZS5jc3NUZXh0ID0gJ21hcmdpbi1sZWZ0OiAxMnB4OyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgYm9yZGVyOiBub25lOyBjb2xvcjogI2ZmZjsgY3Vyc29yOiBwb2ludGVyOyBmb250LXNpemU6IDE1cHg7JztcclxuICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGJhbm5lci5yZW1vdmUoKSk7XHJcbiAgYmFubmVyLmFwcGVuZENoaWxkKGNsb3NlQnRuKTtcclxuICBkb2N1bWVudC5ib2R5LnByZXBlbmQoYmFubmVyKTtcclxufVxyXG5cclxuLyoqIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBiYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyLCBoYW5kbGluZyBpbnZhbGlkYXRlZCBjb250ZXh0cyBncmFjZWZ1bGx5LiAqL1xyXG5mdW5jdGlvbiBzZW5kQWN0aW9uKGFjdGlvbjogc3RyaW5nKTogdm9pZCB7XHJcbiAgdHJ5IHtcclxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uIH0pO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgLy8gRXh0ZW5zaW9uIHdhcyByZWxvYWRlZC91cGRhdGVkIHdoaWxlIHRoZSB0YWIgd2FzIG9wZW4uIENocm9tZSBpbnZhbGlkYXRlcyB0aGVcclxuICAgIC8vIHJ1bnRpbWUgY29udGV4dCBidXQgRE9NIGV2ZW50IGxpc3RlbmVycyByZW1haW4gbGl2ZSBcdTIwMTQgYW55IGNocm9tZS5ydW50aW1lIGNhbGxcclxuICAgIC8vIHdpbGwgdGhyb3cgXCJFeHRlbnNpb24gY29udGV4dCBpbnZhbGlkYXRlZFwiLiBQcm9tcHQgdGhlIHVzZXIgdG8gcmVmcmVzaC5cclxuICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluamVjdFN0eWxlcygpOiB2b2lkIHtcclxuICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU1RZTEVfSUQpKSByZXR1cm47XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLmlkID0gU1RZTEVfSUQ7XHJcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXHJcbiNjcm0tdG9vbHMtcmliYm9uLXRvb2xiYXIgLm5hdlRhYkJ1dHRvbkxpbmsgeyBjdXJzb3I6IHBvaW50ZXI7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG4uY3J0LWRyb3Bkb3duLWJ0biB7XHJcbiAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMnB4O1xyXG4gIHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDQwcHg7IHBhZGRpbmc6IDAgMTZweDtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgYm9yZGVyOiBub25lO1xyXG4gIGNvbG9yOiAjMWYxZjFmOyBmb250LXNpemU6IDEzcHg7IGZvbnQtZmFtaWx5OiBcIkdvb2dsZSBTYW5zXCIsIFJvYm90bywgXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZjtcclxuICBjdXJzb3I6IHBvaW50ZXI7IHRleHQtYWxpZ246IGxlZnQ7IHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuLmNydC1kcm9wZG93bi1idG46aG92ZXIgeyBiYWNrZ3JvdW5kOiAjZjFmM2Y0OyB9XHJcbi5jcnQtZHJvcGRvd24tYnRuOmFjdGl2ZSB7IGJhY2tncm91bmQ6ICNlOGVhZWQ7IH1cclxuLmNydC1kcm9wZG93bi1idG4uY3J0LWFjdGl2ZSB7IGJhY2tncm91bmQ6IHJnYmEoNDYsMTI1LDUwLDAuMDgpOyB9XHJcbi5jcnQtZHJvcGRvd24tYnRuLmNydC1hY3RpdmU6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDQ2LDEyNSw1MCwwLjE0KTsgfVxyXG4uY3J0LWJ0bi1pY29uIHsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGZvbnQtc2l6ZTogMTVweDsgZmxleC1zaHJpbms6IDA7IH1cclxuLmNydC1idG4tYWN0aXZlLWRvdCB7IHdpZHRoOiA4cHg7IGhlaWdodDogOHB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6ICMyZTdkMzI7IG1hcmdpbi1sZWZ0OiBhdXRvOyBmbGV4LXNocmluazogMDsgZGlzcGxheTogbm9uZTsgfVxyXG4uY3J0LWRyb3Bkb3duLWJ0bi5jcnQtYWN0aXZlIC5jcnQtYnRuLWFjdGl2ZS1kb3QgeyBkaXNwbGF5OiBibG9jazsgfVxyXG4uY3J0LXJlYWRvbmx5LXNldHRpbmdzLXdyYXAgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyB9XHJcbi5jcnQtcmVhZG9ubHktc2V0dGluZ3Mtcm93IHtcclxuICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyO1xyXG59XHJcbi5jcnQtcmVhZG9ubHktc2V0dGluZ3Mtcm93IC5jcnQtZHJvcGRvd24tYnRuIHtcclxuICBmbGV4OiAxIDEgYXV0bzsgd2lkdGg6IGF1dG87IG1pbi13aWR0aDogMDtcclxufVxyXG4uY3J0LXJlYWRvbmx5LXNldHRpbmdzLWdlYXIge1xyXG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50OyBib3JkZXI6IG5vbmU7IGN1cnNvcjogcG9pbnRlcjtcclxuICBmb250LXNpemU6IDE0cHg7IHBhZGRpbmc6IDJweCA0cHg7IG1hcmdpbi1yaWdodDogMTZweDsgYm9yZGVyLXJhZGl1czogNHB4OyBvcGFjaXR5OiAwLjY7XHJcbiAgZmxleC1zaHJpbms6IDA7XHJcbn1cclxuLmNydC1yZWFkb25seS1zZXR0aW5ncy1nZWFyOmhvdmVyIHsgb3BhY2l0eTogMTsgYmFja2dyb3VuZDogI2YxZjNmNDsgfVxyXG4uY3J0LXJlYWRvbmx5LXNldHRpbmdzLXBhbmVsIHtcclxuICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDZweDtcclxuICBmb250LXNpemU6IDEycHg7IGNvbG9yOiAjNWY2MzY4O1xyXG4gIHBhZGRpbmc6IDAgMTZweCA4cHggNDhweDtcclxufVxyXG4uY3J0LXJlYWRvbmx5LXNldHRpbmdzLXBhbmVsW2hpZGRlbl0geyBkaXNwbGF5OiBub25lOyB9XHJcbi5jcnQtcmVhZG9ubHktc2V0dGluZ3Mtc2VsZWN0IHtcclxuICBmb250LWZhbWlseTogaW5oZXJpdDsgZm9udC1zaXplOiAxMnB4OyBwYWRkaW5nOiAycHggNHB4O1xyXG4gIGJvcmRlcjogMXB4IHNvbGlkICNkYWRjZTA7IGJvcmRlci1yYWRpdXM6IDRweDsgYmFja2dyb3VuZDogI2ZmZjsgY29sb3I6ICMxZjFmMWY7XHJcbn1cclxuICAgYDtcclxuICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0QnV0dG9uQWN0aXZlKGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQsIGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gIGJ0bi5jbGFzc0xpc3QudG9nZ2xlKCdjcnQtYWN0aXZlJywgYWN0aXZlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRUb29sYmFyKCk6IHZvaWQge1xyXG4gIC8vIElkZW1wb3RlbnQ6IHNraXAgaWYgYWxyZWFkeSBpbmplY3RlZCAoZS5nLiBzb2Z0IG5hdmlnYXRpb24gd2l0aG91dCBmdWxsIHBhZ2UgdW5sb2FkKVxyXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChUT09MQkFSX0lEKSkgcmV0dXJuO1xyXG5cclxuICAvLyBDbGVhbiB1cCBhbnkgZGV0YWNoZWQgZHJvcGRvd24gZnJvbSBhIHByZXZpb3VzIGluamVjdGlvblxyXG4gIGNvbnN0IHN0YWxlRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChEUk9QRE9XTl9JRCk7XHJcbiAgaWYgKHN0YWxlRHJvcGRvd24pIHN0YWxlRHJvcGRvd24ucmVtb3ZlKCk7XHJcblxyXG4gIGluamVjdFN0eWxlcygpO1xyXG5cclxuICAvLyAtLS0gV3JhcHBlcjogbWlycm9ycyA8c3BhbiBjbGFzcz1cIm5hdlRhYkJ1dHRvblwiPiBzdHJ1Y3R1cmUgLS0tXHJcbiAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICB3cmFwcGVyLmNsYXNzTmFtZSA9ICduYXZUYWJCdXR0b24nO1xyXG4gIHdyYXBwZXIuaWQgPSBUT09MQkFSX0lEO1xyXG4gIHdyYXBwZXIudGl0bGUgPSAnRHluYW1pY3NDYXQnO1xyXG5cclxuICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIGxpbmsuY2xhc3NOYW1lID0gJ25hdlRhYkJ1dHRvbkxpbmsnO1xyXG4gIGxpbmsucm9sZSA9ICdidXR0b24nO1xyXG4gIGxpbmsudGFiSW5kZXggPSAwO1xyXG4gIGxpbmsudGl0bGUgPSAnJztcclxuXHJcbiAgY29uc3QgaW1nQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIGltZ0NvbnRhaW5lci5jbGFzc05hbWUgPSAnbmF2VGFiQnV0dG9uSW1hZ2VDb250YWluZXInO1xyXG5cclxuICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgbGV0IGljb25TcmMgPSAnJztcclxuICB0cnkge1xyXG4gICAgaWNvblNyYyA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnaWNvbnMvaWNvbjMyLnBuZycpO1xyXG4gIH0gY2F0Y2ggeyAvKiBjb250ZXh0IGFscmVhZHkgaW52YWxpZCBcdTIwMTQgaWNvbiB3aWxsIGJlIG1pc3NpbmcsIGJhbm5lciBzaG93biBvbiBmaXJzdCBjbGljayAqLyB9XHJcbiAgaWNvbi5zcmMgPSBpY29uU3JjO1xyXG4gIGljb24uYWx0ID0gJ0R5bmFtaWNzQ2F0JztcclxuICBpY29uLnN0eWxlLmNzc1RleHQgPSAnd2lkdGg6MjRweDtoZWlnaHQ6MjRweDtkaXNwbGF5OmJsb2NrOyc7XHJcblxyXG4gIGltZ0NvbnRhaW5lci5hcHBlbmRDaGlsZChpY29uKTtcclxuICBsaW5rLmFwcGVuZENoaWxkKGltZ0NvbnRhaW5lcik7XHJcbiAgd3JhcHBlci5hcHBlbmRDaGlsZChsaW5rKTtcclxuXHJcbiAgLy8gLS0tIERyb3Bkb3duIHBhbmVsIFx1MjAxNCBhcHBlbmRlZCB0byBkb2N1bWVudC5ib2R5IGZvciB6LWluZGV4IGVzY2FwZSAtLS1cclxuICBjb25zdCBkcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGRyb3Bkb3duLmlkID0gRFJPUERPV05fSUQ7XHJcbiAgZHJvcGRvd24uc3R5bGUuY3NzVGV4dCA9IFtcclxuICAgICdwb3NpdGlvbjogZml4ZWQnLFxyXG4gICAgJ3otaW5kZXg6IDIxNDc0ODM2NDcnLFxyXG4gICAgJ2JhY2tncm91bmQ6ICNmZmYnLFxyXG4gICAgJ2JvcmRlci1yYWRpdXM6IDhweCcsXHJcbiAgICAnYm94LXNoYWRvdzogMCAycHggMTBweCByZ2JhKDAsMCwwLDAuMTgpJyxcclxuICAgICdwYWRkaW5nOiA4cHggMCcsXHJcbiAgICAnbWluLXdpZHRoOiA0MDBweCcsXHJcbiAgICAnZGlzcGxheTogbm9uZScsXHJcbiAgICAnZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyJyxcclxuICBdLmpvaW4oJzsgJyk7XHJcblxyXG4gIGZ1bmN0aW9uIG1ha2VEcm9wZG93bkJ0bihpY29uOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBIVE1MQnV0dG9uRWxlbWVudCB7XHJcbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgIGJ0bi5jbGFzc05hbWUgPSAnY3J0LWRyb3Bkb3duLWJ0bic7XHJcbiAgICBjb25zdCBpY29uRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBpY29uRWwuY2xhc3NOYW1lID0gJ2NydC1idG4taWNvbic7XHJcbiAgICBpY29uRWwudGV4dENvbnRlbnQgPSBpY29uO1xyXG4gICAgY29uc3QgbGFiZWxFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGxhYmVsRWwudGV4dENvbnRlbnQgPSBsYWJlbDtcclxuICAgIGNvbnN0IGRvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGRvdC5jbGFzc05hbWUgPSAnY3J0LWJ0bi1hY3RpdmUtZG90JztcclxuICAgIGJ0bi5hcHBlbmRDaGlsZChpY29uRWwpO1xyXG4gICAgYnRuLmFwcGVuZENoaWxkKGxhYmVsRWwpO1xyXG4gICAgYnRuLmFwcGVuZENoaWxkKGRvdCk7XHJcbiAgICByZXR1cm4gYnRuO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tIEJ1aWxkIGJ1dHRvbnMgZnJvbSBhY3Rpb24gcmVnaXN0cnkgLS0tXHJcbiAgY29uc3QgY29sTGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGNvbnN0IGNvbFJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgY29sUmlnaHQuc3R5bGUuY3NzVGV4dCA9ICdib3JkZXItbGVmdDogMXB4IHNvbGlkICNlOGVhZWQ7JztcclxuXHJcbiAgLy8gQWN0aW9ucyBhcmUgc3BsaXQgaW50byB0d28gY29sdW1uczogZmlyc3QgNCBsZWZ0LCByZXN0IHJpZ2h0XHJcbiAgY29uc3QgTEVGVF9BQ1RJT05TID0gbmV3IFNldChbXHJcbiAgICAnaW5qZWN0QWxsRmllbGRzJyxcclxuICAgICdpbmplY3RPcHRpb25TZXRzJyxcclxuICAgICdpbmplY3RTaG93SGlkZGVuRmllbGRzJyxcclxuICAgICdpbmplY3REaXJ0eUZpZWxkcycsXHJcbiAgICAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScsXHJcbiAgICAnaW5qZWN0TG9va3Vwc09wZW5lcicsXHJcbiAgXSk7XHJcblxyXG4gIC8vIFRyYWNrIGJ1dHRvbnMgdGhhdCBzaG93IGFjdGl2ZSBzdGF0ZVxyXG4gIGNvbnN0IGFjdGl2ZUJ1dHRvbnM6IFJlY29yZDxzdHJpbmcsIEhUTUxCdXR0b25FbGVtZW50PiA9IHt9O1xyXG4gIGxldCByZWFkb25seVNob3J0Y3V0U2VsZWN0OiBIVE1MU2VsZWN0RWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIGxldCBsb29rdXBzT3BlbmVyU2hvcnRjdXRTZWxlY3Q6IEhUTUxTZWxlY3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIGNvbnN0IGJpbmRTaG9ydGN1dFNlbGVjdCA9IChcclxuICAgIHNlbGVjdDogSFRNTFNlbGVjdEVsZW1lbnQsXHJcbiAgICBzdG9yYWdlS2V5OiAncmVhZG9ubHlTaG9ydGN1dCcgfCAnbG9va3Vwc09wZW5lclNob3J0Y3V0JyxcclxuICAgIG90aGVyU3RvcmFnZUtleTogJ3JlYWRvbmx5U2hvcnRjdXQnIHwgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICBvdGhlclRvb2xMYWJlbDogc3RyaW5nLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBzdHJpbmcsXHJcbiAgKTogdm9pZCA9PiB7XHJcbiAgICBsZXQgcHJldmlvdXNWYWx1ZSA9IGRlZmF1bHRWYWx1ZTtcclxuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcclxuICAgICAgcHJldmlvdXNWYWx1ZSA9IHNlbGVjdC52YWx1ZTtcclxuICAgIH0pO1xyXG4gICAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcclxuICAgICAgY29uc3QgbmV4dFZhbHVlID0gc2VsZWN0LnZhbHVlO1xyXG4gICAgICBsb2FkU2hvcnRjdXRTZXR0aW5ncygoc2V0dGluZ3MpID0+IHtcclxuICAgICAgICBjb25zdCBvdGhlclZhbHVlID0gc2V0dGluZ3Nbb3RoZXJTdG9yYWdlS2V5XVxyXG4gICAgICAgICAgfHwgKG90aGVyU3RvcmFnZUtleSA9PT0gJ3JlYWRvbmx5U2hvcnRjdXQnID8gREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCA6IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQpO1xyXG4gICAgICAgIGlmIChuZXh0VmFsdWUgPT09IG90aGVyVmFsdWUpIHtcclxuICAgICAgICAgIGFsZXJ0KGBTaG9ydGN1dCBhbHJlYWR5IHVzZWQgYnkgJHtvdGhlclRvb2xMYWJlbH1gKTtcclxuICAgICAgICAgIHNlbGVjdC52YWx1ZSA9IHByZXZpb3VzVmFsdWU7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBbc3RvcmFnZUtleV06IG5leHRWYWx1ZSB9KTtcclxuICAgICAgICAgIHByZXZpb3VzVmFsdWUgPSBuZXh0VmFsdWU7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICBzaG93Q29udGV4dEludmFsaWRhdGVkQmFubmVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgc3RvcEtleVByb3BhZ2F0aW9uKHNlbGVjdCk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY3JlYXRlU2hvcnRjdXRTZXR0aW5nc0NvbnRyb2wgPSAoXHJcbiAgICBidG46IEhUTUxCdXR0b25FbGVtZW50LFxyXG4gICAgc3RvcmFnZUtleTogJ3JlYWRvbmx5U2hvcnRjdXQnIHwgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICBkZWZhdWx0VmFsdWU6IHN0cmluZyxcclxuICAgIG90aGVyU3RvcmFnZUtleTogJ3JlYWRvbmx5U2hvcnRjdXQnIHwgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICBvdGhlclRvb2xMYWJlbDogc3RyaW5nLFxyXG4gICk6IEhUTUxEaXZFbGVtZW50ID0+IHtcclxuICAgIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHdyYXAuY2xhc3NOYW1lID0gJ2NydC1yZWFkb25seS1zZXR0aW5ncy13cmFwJztcclxuXHJcbiAgICBjb25zdCBzZXR0aW5nc1JvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgc2V0dGluZ3NSb3cuY2xhc3NOYW1lID0gJ2NydC1yZWFkb25seS1zZXR0aW5ncy1yb3cnO1xyXG5cclxuICAgIGNvbnN0IGdlYXJCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgIGdlYXJCdG4udHlwZSA9ICdidXR0b24nO1xyXG4gICAgZ2VhckJ0bi5jbGFzc05hbWUgPSAnY3J0LXJlYWRvbmx5LXNldHRpbmdzLWdlYXInO1xyXG4gICAgZ2VhckJ0bi50aXRsZSA9ICdTaG9ydGN1dCBzZXR0aW5ncyc7XHJcbiAgICBnZWFyQnRuLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdTaG9ydGN1dCBzZXR0aW5ncycpO1xyXG4gICAgZ2VhckJ0bi50ZXh0Q29udGVudCA9ICdcdTI2OTlcdUZFMEYnO1xyXG5cclxuICAgIGNvbnN0IHNldHRpbmdzUGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHNldHRpbmdzUGFuZWwuY2xhc3NOYW1lID0gJ2NydC1yZWFkb25seS1zZXR0aW5ncy1wYW5lbCc7XHJcbiAgICBzZXR0aW5nc1BhbmVsLmhpZGRlbiA9IHRydWU7XHJcblxyXG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xyXG4gICAgbGFiZWwudGV4dENvbnRlbnQgPSAnU2hvcnRjdXQ6JztcclxuXHJcbiAgICBjb25zdCBzZWxlY3QgPSBjcmVhdGVTaG9ydGN1dFNlbGVjdCgpO1xyXG5cclxuICAgIGNvbnN0IGxvYWRTaG9ydGN1dCA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgbG9hZFNob3J0Y3V0U2V0dGluZ3MoKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgIHNlbGVjdC52YWx1ZSA9IHN0b3JhZ2VLZXkgPT09ICdyZWFkb25seVNob3J0Y3V0J1xyXG4gICAgICAgICAgPyByZXN1bHQucmVhZG9ubHlTaG9ydGN1dCB8fCBERUZBVUxUX1JFQURPTkxZX1NIT1JUQ1VUXHJcbiAgICAgICAgICA6IHJlc3VsdC5sb29rdXBzT3BlbmVyU2hvcnRjdXQgfHwgREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVDtcclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGdlYXJCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICBjb25zdCBuZXh0SGlkZGVuID0gIXNldHRpbmdzUGFuZWwuaGlkZGVuO1xyXG4gICAgICBzZXR0aW5nc1BhbmVsLmhpZGRlbiA9IG5leHRIaWRkZW47XHJcbiAgICAgIGlmICghbmV4dEhpZGRlbikgbG9hZFNob3J0Y3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBiaW5kU2hvcnRjdXRTZWxlY3Qoc2VsZWN0LCBzdG9yYWdlS2V5LCBvdGhlclN0b3JhZ2VLZXksIG90aGVyVG9vbExhYmVsLCBkZWZhdWx0VmFsdWUpO1xyXG5cclxuICAgIHNldHRpbmdzUGFuZWwuYXBwZW5kQ2hpbGQobGFiZWwpO1xyXG4gICAgc2V0dGluZ3NQYW5lbC5hcHBlbmRDaGlsZChzZWxlY3QpO1xyXG4gICAgc2V0dGluZ3NSb3cuYXBwZW5kQ2hpbGQoYnRuKTtcclxuICAgIHNldHRpbmdzUm93LmFwcGVuZENoaWxkKGdlYXJCdG4pO1xyXG4gICAgd3JhcC5hcHBlbmRDaGlsZChzZXR0aW5nc1Jvdyk7XHJcbiAgICB3cmFwLmFwcGVuZENoaWxkKHNldHRpbmdzUGFuZWwpO1xyXG4gICAgcmV0dXJuIHdyYXA7XHJcbiAgfTtcclxuXHJcbiAgZm9yIChjb25zdCBkZWYgb2YgQUNUSU9OUykge1xyXG4gICAgaWYgKCFkZWYucG9wdXBCdG5JZCkgY29udGludWU7XHJcbiAgICBjb25zdCBidG4gPSBtYWtlRHJvcGRvd25CdG4oZGVmLmljb24sIGRlZi5sYWJlbCk7XHJcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIGlmIChkZWYuYWN0aW9uID09PSAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScpIHtcclxuICAgICAgICBjb25zdCB3aWxsQmVBY3RpdmUgPSBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZUy5yZWFkb25seU92ZXJyaWRlQWN0aXZlXSAhPT0gJzEnO1xyXG4gICAgICAgIHRyeSB7IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IHJlYWRvbmx5T3ZlcnJpZGU6IHdpbGxCZUFjdGl2ZSB9KTsgfSBjYXRjaCB7IC8qIGNvbnRleHQgaW52YWxpZGF0ZWQgKi8gfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChkZWYuYWN0aW9uID09PSAnaW5qZWN0TG9va3Vwc09wZW5lcicpIHtcclxuICAgICAgICBjb25zdCB3aWxsQmVBY3RpdmUgPSBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZUy5sb29rdXBzT3BlbmVyQWN0aXZlXSAhPT0gJzEnO1xyXG4gICAgICAgIHRyeSB7IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IGxvb2t1cHNPcGVuZXJPdmVycmlkZTogd2lsbEJlQWN0aXZlIH0pOyB9IGNhdGNoIHsgLyogY29udGV4dCBpbnZhbGlkYXRlZCAqLyB9XHJcbiAgICAgIH1cclxuICAgICAgc2VuZEFjdGlvbihkZWYuYWN0aW9uKTtcclxuICAgIH0pO1xyXG4gICAgaWYgKGRlZi5jb25kaXRpb25hbCkge1xyXG4gICAgICBidG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgKGNvbmRpdGlvbmFsQnV0dG9uc1tkZWYuY29uZGl0aW9uYWxdID8/PSBbXSkucHVzaChidG4pO1xyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICBkZWYuYWN0aW9uID09PSAnaW5qZWN0U2hvd0hpZGRlbkZpZWxkcydcclxuICAgICAgfHwgZGVmLmFjdGlvbiA9PT0gJ2luamVjdERpcnR5RmllbGRzJ1xyXG4gICAgICB8fCBkZWYuYWN0aW9uID09PSAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seSdcclxuICAgICAgfHwgZGVmLmFjdGlvbiA9PT0gJ2luamVjdExvb2t1cHNPcGVuZXInXHJcbiAgICApIHtcclxuICAgICAgYWN0aXZlQnV0dG9uc1tkZWYuYWN0aW9uXSA9IGJ0bjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJlbnQgPSBMRUZUX0FDVElPTlMuaGFzKGRlZi5hY3Rpb24pID8gY29sTGVmdCA6IGNvbFJpZ2h0O1xyXG4gICAgaWYgKGRlZi5hY3Rpb24gIT09ICdpbmplY3RPdmVycmlkZVJlYWRvbmx5JyAmJiBkZWYuYWN0aW9uICE9PSAnaW5qZWN0TG9va3Vwc09wZW5lcicpIHtcclxuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGJ0bik7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGRlZi5hY3Rpb24gPT09ICdpbmplY3RPdmVycmlkZVJlYWRvbmx5Jykge1xyXG4gICAgY29uc3Qgd3JhcCA9IGNyZWF0ZVNob3J0Y3V0U2V0dGluZ3NDb250cm9sKFxyXG4gICAgICBidG4sXHJcbiAgICAgICdyZWFkb25seVNob3J0Y3V0JyxcclxuICAgICAgREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCxcclxuICAgICAgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICAgICdMb29rdXBzIE9wZW5lcicsXHJcbiAgICApO1xyXG4gICAgICByZWFkb25seVNob3J0Y3V0U2VsZWN0ID0gd3JhcC5xdWVyeVNlbGVjdG9yKCdzZWxlY3QnKTtcclxuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHdyYXApO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3cmFwID0gY3JlYXRlU2hvcnRjdXRTZXR0aW5nc0NvbnRyb2woXHJcbiAgICAgIGJ0bixcclxuICAgICAgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICAgIERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQsXHJcbiAgICAgICdyZWFkb25seVNob3J0Y3V0JyxcclxuICAgICAgJ092ZXJyaWRlIFJlYWRvbmx5JyxcclxuICAgICk7XHJcbiAgICBsb29rdXBzT3BlbmVyU2hvcnRjdXRTZWxlY3QgPSB3cmFwLnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpO1xyXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHdyYXApO1xyXG4gIH1cclxuXHJcbiAgbG9hZFNob3J0Y3V0U2V0dGluZ3MoKHJlc3VsdCkgPT4ge1xyXG4gICAgaWYgKHJlYWRvbmx5U2hvcnRjdXRTZWxlY3QpIHtcclxuICAgICAgcmVhZG9ubHlTaG9ydGN1dFNlbGVjdC52YWx1ZSA9IHJlc3VsdC5yZWFkb25seVNob3J0Y3V0IHx8IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQ7XHJcbiAgICB9XHJcbiAgICBpZiAobG9va3Vwc09wZW5lclNob3J0Y3V0U2VsZWN0KSB7XHJcbiAgICAgIGxvb2t1cHNPcGVuZXJTaG9ydGN1dFNlbGVjdC52YWx1ZSA9IHJlc3VsdC5sb29rdXBzT3BlbmVyU2hvcnRjdXQgfHwgREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgZHJvcGRvd24uYXBwZW5kQ2hpbGQoY29sTGVmdCk7XHJcbiAgZHJvcGRvd24uYXBwZW5kQ2hpbGQoY29sUmlnaHQpO1xyXG5cclxuICAvLyBBcHBlbmQgZHJvcGRvd24gdG8gYm9keSBzbyBpdCBlc2NhcGVzIHRoZSByaWJib24ncyBzdGFja2luZyBjb250ZXh0XHJcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkcm9wZG93bik7XHJcblxyXG4gIC8vIC0tLSBUb2dnbGUgY2xpY2sgaGFuZGxlciAtLS1cclxuICB3cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBpZiAoZHJvcGRvd24uc3R5bGUuZGlzcGxheSA9PT0gJ2dyaWQnKSB7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBSZWNhbGN1bGF0ZSBwb3NpdGlvbiBlYWNoIHRpbWUgaW4gY2FzZSBwYWdlIGhhcyBzY3JvbGxlZFxyXG4gICAgICBjb25zdCByZWN0ID0gd3JhcHBlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgZHJvcGRvd24uc3R5bGUudG9wICA9IHJlY3QuYm90dG9tICsgJ3B4JztcclxuICAgICAgZHJvcGRvd24uc3R5bGUubGVmdCA9IHJlY3QubGVmdCArICdweCc7XHJcbiAgICAgIC8vIFJlZmxlY3QgdG9nZ2xlIHN0YXRlIHdyaXR0ZW4gYnkgTUFJTi13b3JsZCBjb250ZW50IHNjcmlwdHMgdmlhIGRhdGFzZXRcclxuICAgICAgY29uc3QgZHMgPSBnZXRTaGFyZWREYXRhc2V0KCk7XHJcbiAgICAgIGNvbnN0IGhpZGRlbkJ0biA9IGFjdGl2ZUJ1dHRvbnNbJ2luamVjdFNob3dIaWRkZW5GaWVsZHMnXTtcclxuICAgICAgY29uc3QgZGlydHlCdG4gPSBhY3RpdmVCdXR0b25zWydpbmplY3REaXJ0eUZpZWxkcyddO1xyXG4gICAgICBjb25zdCByZWFkb25seUJ0biA9IGFjdGl2ZUJ1dHRvbnNbJ2luamVjdE92ZXJyaWRlUmVhZG9ubHknXTtcclxuICAgICAgY29uc3QgbG9va3Vwc0J0biA9IGFjdGl2ZUJ1dHRvbnNbJ2luamVjdExvb2t1cHNPcGVuZXInXTtcclxuICAgICAgaWYgKGhpZGRlbkJ0bikgc2V0QnV0dG9uQWN0aXZlKGhpZGRlbkJ0biwgZHNbU1RBVEVfS0VZUy5oaWRkZW5BY3RpdmVdID09PSAnMScpO1xyXG4gICAgICBpZiAoZGlydHlCdG4pIHNldEJ1dHRvbkFjdGl2ZShkaXJ0eUJ0biwgZHNbU1RBVEVfS0VZUy5kaXJ0eUFjdGl2ZV0gPT09ICcxJyk7XHJcbiAgICAgIGlmIChyZWFkb25seUJ0bikgc2V0QnV0dG9uQWN0aXZlKHJlYWRvbmx5QnRuLCBkc1tTVEFURV9LRVlTLnJlYWRvbmx5T3ZlcnJpZGVBY3RpdmVdID09PSAnMScpO1xyXG4gICAgICBpZiAobG9va3Vwc0J0bikgc2V0QnV0dG9uQWN0aXZlKGxvb2t1cHNCdG4sIGRzW1NUQVRFX0tFWVMubG9va3Vwc09wZW5lckFjdGl2ZV0gPT09ICcxJyk7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPSAnZ3JpZCc7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIC0tLSBDbGljay1vdXRzaWRlIGhhbmRsZXIgKHJlcGxhY2UgcHJldmlvdXMgdG8gYXZvaWQgZHVwbGljYXRlIGxpc3RlbmVycykgLS0tXHJcbiAgaWYgKG91dHNpZGVDbGlja0hhbmRsZXIpIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3V0c2lkZUNsaWNrSGFuZGxlcik7XHJcbiAgb3V0c2lkZUNsaWNrSGFuZGxlciA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAoIXdyYXBwZXIuY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkgJiYgIWRyb3Bkb3duLmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSB7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9XHJcbiAgfTtcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG91dHNpZGVDbGlja0hhbmRsZXIpO1xyXG5cclxuICAvLyAtLS0gQmx1ciBoYW5kbGVyOiBjbG9zZSBkcm9wZG93biB3aGVuIGZvY3VzIGxlYXZlcyB0b3Agd2luZG93IChlLmcuIGNsaWNrIGluIENSTSBpZnJhbWUpIC0tLVxyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xyXG4gICAgZHJvcGRvd24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICB9KTtcclxuXHJcbiAgLy8gLS0tIEluamVjdCBpbnRvICNuYXZCYXIgKHdoZXJlIGNybS1wb3dlci1wYW5lLWJ1dHRvbiBsaXZlcykgLS0tXHJcbiAgLy8gSWYgbmF2QmFyIGlzbid0IGluIHRoZSBET00geWV0LCBjbGVhbiB1cCBhbmQgbGV0IHRoZSBNdXRhdGlvbk9ic2VydmVyIHJldHJ5LlxyXG4gIC8vIE5ldmVyIGZhbGwgYmFjayB0byBib2R5IFx1MjAxNCBhdm9pZHMgcG9sbHV0aW5nIENSTSBmb3JtIGlmcmFtZXMgd2l0aCBhIHN0cmF5IGJ1dHRvbi5cclxuICBjb25zdCBuYXZCYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2QmFyJyk7XHJcbiAgaWYgKCFuYXZCYXIpIHtcclxuICAgIGRyb3Bkb3duLnJlbW92ZSgpO1xyXG4gICAgaWYgKG91dHNpZGVDbGlja0hhbmRsZXIpIHtcclxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvdXRzaWRlQ2xpY2tIYW5kbGVyKTtcclxuICAgICAgb3V0c2lkZUNsaWNrSGFuZGxlciA9IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIG5hdkJhci5wcmVwZW5kKHdyYXBwZXIpO1xyXG59XHJcblxyXG4vKiogUmUtaW5qZWN0IHRoZSB0b29sYmFyIHdoZW5ldmVyIENSTSByZW1vdmVzIGl0IChlLmcuIGludGVybmFsIFNQQSBuYXZpZ2F0aW9uKS4gKi9cclxuZnVuY3Rpb24gc3RhcnRPYnNlcnZlcigpOiB2b2lkIHtcclxuICAvLyBPYnNlcnZlIGRvY3VtZW50LmJvZHkgKG5ldmVyIHJlcGxhY2VkKSByYXRoZXIgdGhhbiAjY3JtTWFzdGhlYWQgc28gdGhhdFxyXG4gIC8vIHRoZSBvYnNlcnZlciBzdGF5cyBhbGl2ZSBldmVuIHdoZW4gQ1JNIFNQQSBuYXZpZ2F0aW9uIHJlcGxhY2VzIHRoZSBtYXN0aGVhZCBlbGVtZW50LlxyXG4gIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5ib2R5O1xyXG4gIG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcclxuICAgIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoVE9PTEJBUl9JRCkpIGJ1aWxkVG9vbGJhcigpO1xyXG4gIH0pLm9ic2VydmUocm9vdCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XHJcbn1cclxuXHJcbi8qKiBSZXR1cm5zIHRydWUgd2hlbiB0aGUgcGFnZSBpcyBhIER5bmFtaWNzIENSTSBvciBEeW5hbWljcyAzNjUgcGFnZS5cclxuICogIERldGVjdHMgQ1JNIDIwMTYgdmlhIGJvZHlbc2Nyb2xsPW5vXSBhbmQgRHluYW1pY3MgMzY1IHZpYSBkaXZbZGF0YS1pZD10b3BCYXJdLiAqL1xyXG5mdW5jdGlvbiBpc0NybVBhZ2UoKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgbWFpbkJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdib2R5W3Njcm9sbD1ub10nKTtcclxuICBjb25zdCB0b3BCYXIgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltkYXRhLWlkPXRvcEJhcl0nKTtcclxuICByZXR1cm4gKG1haW5Cb2R5ICYmIG1haW5Cb2R5Lmxlbmd0aCA+IDApIHx8IHRvcEJhciAhPT0gbnVsbDtcclxufVxyXG5cclxuLyoqIFJldHVybnMgdHJ1ZSBvbmx5IHdoZW4gdGhlIENSTSBuYXYgYmFyIGlzIHByZXNlbnQgaW4gdGhlIERPTS5cclxuICogIE1haW4gQ1JNIHdpbmRvd3MgYWx3YXlzIGhhdmUgI25hdkJhciBhdCBkb2N1bWVudF9pZGxlIChzZXJ2ZXItcmVuZGVyZWQpLlxyXG4gKiAgRGlhbG9nIGFuZCBwb3B1cCB3aW5kb3dzIChBZHZhbmNlZCBGaW5kLCBFZGl0IEZvcm0sIGV0Yy4pIG5ldmVyIGRvIFx1MjAxNCBza2lwcGluZ1xyXG4gKiAgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgb24gdGhvc2UgcGFnZXMgcHJldmVudHMgcnVuYXdheSBET00gcXVlcnlpbmcgYW5kIGJyb3dzZXIgaGFuZ3MuICovXHJcbmZ1bmN0aW9uIGhhc05hdkJhcigpOiBib29sZWFuIHtcclxuICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkJhcicpICE9PSBudWxsO1xyXG59XHJcblxyXG4vKipcclxuICogUHJvYmUgY29uZGl0aW9uYWwgYWN0aW9ucyB2aWEgYmFja2dyb3VuZCBleGVjdXRlU2NyaXB0IChNQUlOIHdvcmxkKS5cclxuICogVGhlIHJpYmJvbiBydW5zIGluIElTT0xBVEVEIHdvcmxkIHNvIGNhbm5vdCBhY2Nlc3MgWHJtIGRpcmVjdGx5LlxyXG4gKiBCYWNrZ3JvdW5kIHJ1bnMgdGhlIHByb2JlIGluIE1BSU4gd29ybGQgYW5kIHJldHVybnMgdGhlIHJlc3VsdC5cclxuICovXHJcbmZ1bmN0aW9uIHByb2JlQ29uZGl0aW9uYWxBY3Rpb25zKCk6IHZvaWQge1xyXG4gIHRyeSB7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IGFjdGlvbjogJ3Byb2JlQWN0aXZhdGFibGUnIH0sIChyZXNwb25zZSkgPT4ge1xyXG4gICAgICBpZiAocmVzcG9uc2U/LmFjdGl2YXRhYmxlKSB7XHJcbiAgICAgICAgY29uc3QgZHMgPSBnZXRTaGFyZWREYXRhc2V0KCk7XHJcbiAgICAgICAgZHNbU1RBVEVfS0VZUy5hY3RpdmF0YWJsZV0gPSAnMSc7XHJcbiAgICAgICAgZm9yIChjb25zdCBidG4gb2YgY29uZGl0aW9uYWxCdXR0b25zWydhY3RpdmF0YWJsZSddID8/IFtdKSB7XHJcbiAgICAgICAgICBidG4uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICBzaG93Q29udGV4dEludmFsaWRhdGVkQmFubmVyKCk7XHJcbiAgfVxyXG59XHJcblxyXG5pZiAoaXNDcm1QYWdlKCkgJiYgaGFzTmF2QmFyKCkpIHtcclxuICBidWlsZFRvb2xiYXIoKTtcclxuICBzdGFydE9ic2VydmVyKCk7XHJcbiAgcHJvYmVDb25kaXRpb25hbEFjdGlvbnMoKTtcclxuICB0cnkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsncmVhZG9ubHlPdmVycmlkZScsICdsb29rdXBzT3BlbmVyT3ZlcnJpZGUnXSwgKHJlc3VsdCkgPT4ge1xyXG4gICAgICBpZiAocmVzdWx0LnJlYWRvbmx5T3ZlcnJpZGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgd3JpdGVGbGFnKCdyZWFkb25seVNpbGVudEluamVjdCcsICcxJyk7XHJcbiAgICAgICAgc2VuZEFjdGlvbignaW5qZWN0T3ZlcnJpZGVSZWFkb25seScpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZXN1bHQubG9va3Vwc09wZW5lck92ZXJyaWRlICE9PSBmYWxzZSkge1xyXG4gICAgICAgIHdyaXRlRmxhZygnbG9va3Vwc09wZW5lclNpbGVudEluamVjdCcsICcxJyk7XHJcbiAgICAgICAgc2VuZEFjdGlvbignaW5qZWN0TG9va3Vwc09wZW5lcicpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICB9XHJcblxyXG4gIC8vIExpc3RlbiBmb3IgYmFja2dyb3VuZC10YWItb3BlbiByZXF1ZXN0cyBmcm9tIE1BSU4gd29ybGQgY29udGVudCBzY3JpcHRzICh2aWEgcG9zdE1lc3NhZ2UgYWNyb3NzIGZyYW1lcylcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChlOiBNZXNzYWdlRXZlbnQpID0+IHtcclxuICAgIGlmIChlLm9yaWdpbiAhPT0gd2luZG93LmxvY2F0aW9uLm9yaWdpbikgcmV0dXJuO1xyXG4gICAgaWYgKGUuZGF0YT8udHlwZSAhPT0gJ2R5bmFtaWNzY2F0LW9wZW4tYmFja2dyb3VuZC10YWInIHx8ICFlLmRhdGEudXJsKSByZXR1cm47XHJcbiAgICBjb25zdCB1cmwgPSBlLmRhdGEudXJsIGFzIHN0cmluZztcclxuICAgIGlmICghdXJsLnN0YXJ0c1dpdGgod2luZG93LmxvY2F0aW9uLm9yaWdpbiArICcvJykpIHJldHVybjtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uOiAnb3BlbkJhY2tncm91bmRUYWInLCB1cmwgfSk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgc2hvd0NvbnRleHRJbnZhbGlkYXRlZEJhbm5lcigpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQWNPLE1BQU0sVUFBdUI7QUFBQSxJQUNsQyxFQUFFLFFBQVEsbUJBQTBCLE1BQU0seUJBQWtDLE9BQU8sY0FBa0IsTUFBTSxhQUFNLFlBQVksaUJBQWlCO0FBQUEsSUFDOUksRUFBRSxRQUFRLG9CQUEwQixNQUFNLDBCQUFrQyxPQUFPLGVBQWtCLE1BQU0sYUFBTSxZQUFZLHVCQUF1QjtBQUFBLElBQ3BKLEVBQUUsUUFBUSwwQkFBMEIsTUFBTSxpQ0FBa0MsT0FBTyxpQkFBa0IsTUFBTSxhQUFNLFlBQVkseUJBQXlCO0FBQUEsSUFDdEosRUFBRSxRQUFRLHFCQUEwQixNQUFNLDJCQUFrQyxPQUFPLGdCQUFrQixNQUFNLGdCQUFNLFlBQVksbUJBQW1CO0FBQUEsSUFDaEosRUFBRSxRQUFRLDBCQUEwQixNQUFNLGdDQUFrQyxPQUFPLHFCQUFxQixNQUFNLGFBQU0sWUFBWSx3QkFBd0I7QUFBQSxJQUN4SixFQUFFLFFBQVEsdUJB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QSxXQUFTLFlBQXFCO0FBQzVCLFVBQU0sV0FBVyxTQUFTLGlCQUFpQixpQkFBaUI7QUFDNUQsVUFBTSxTQUFXLFNBQVMsY0FBYyxxQkFBcUI7QUFDN0QsV0FBUSxZQUFZLFNBQVMsU0FBUyxLQUFNLFdBQVc7QUFBQSxFQUN6RDtBQU1BLFdBQVMsWUFBcUI7QUFDNUIsV0FBTyxTQUFTLGVBQWUsUUFBUSxNQUFNO0FBQUEsRUFDL0M7QUFPQSxXQUFTLDBCQUFnQztBQUN2QyxRQUFJO0FBQ0YsYUFBTyxRQUFRLFlBQVksRUFBRSxRQUFRLG1CQUFtQixHQUFHLENBQUMsYUFBYTtBQUN2RSxZQUFJLFVBQVUsYUFBYTtBQUN6QixnQkFBTSxLQUFLLGlCQUFpQjtBQUM1QixhQUFHLFdBQVcsV0FBVyxJQUFJO0FBQzdCLHFCQUFXLE9BQU8sbUJBQW1CLGFBQWEsS0FBSyxDQUFDLEdBQUc7QUFDekQsZ0JBQUksTUFBTSxVQUFVO0FBQUEsVUFDdEI7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxRQUFRO0FBQ04sbUNBQTZCO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBRUEsTUFBSSxVQUFVLEtBQUssVUFBVSxHQUFHO0FBQzlCLGlCQUFhO0FBQ2Isa0JBQWM7QUFDZCw0QkFBd0I7QUFDeEIsUUFBSTtBQUNGLGFBQU8sUUFBUSxNQUFNLElBQUksQ0FBQyxvQkFBb0IsdUJBQXVCLEdBQUcsQ0FBQyxXQUFXO0FBQ2xGLFlBQUksT0FBTyxxQkFBcUIsT0FBTztBQUNyQyxvQkFBVSx3QkFBd0IsR0FBRztBQUNyQyxxQkFBVyx3QkFBd0I7QUFBQSxRQUNyQztBQUNBLFlBQUksT0FBTywwQkFBMEIsT0FBTztBQUMxQyxvQkFBVSw2QkFBNkIsR0FBRztBQUMxQyxxQkFBVyxxQkFBcUI7QUFBQSxRQUNsQztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0gsUUFBUTtBQUNOLG1DQUE2QjtBQUFBLElBQy9CO0FBR0EsV0FBTyxpQkFBaUIsV0FBVyxDQUFDLE1BQW9CO0FBQ3RELFVBQUksRUFBRSxXQUFXLE9BQU8sU0FBUyxPQUFRO0FBQ3pDLFVBQUksRUFBRSxNQUFNLFNBQVMscUNBQXFDLENBQUMsRUFBRSxLQUFLLElBQUs7QUFDdkUsWUFBTSxNQUFNLEVBQUUsS0FBSztBQUNuQixVQUFJLENBQUMsSUFBSSxXQUFXLE9BQU8sU0FBUyxTQUFTLEdBQUcsRUFBRztBQUNuRCxVQUFJO0FBQ0YsZUFBTyxRQUFRLFlBQVksRUFBRSxRQUFRLHFCQUFxQixJQUFJLENBQUM7QUFBQSxNQUNqRSxRQUFRO0FBQ04scUNBQTZCO0FBQUEsTUFDL0I7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIOyIsCiAgIm5hbWVzIjogWyJpY29uIiwgIndyYXAiXQp9Cg==
