"use strict";
(() => {
  // src/actions.ts
  var ACTIONS = [
    { action: "injectAllFields", file: "content/all-fields.js", label: "All Fields", icon: "\u{1F4CB}", popupBtnId: "btn-all-fields" },
    { action: "injectOptionSets", file: "content/option-sets.js", label: "Option Sets", icon: "\u{1F518}", popupBtnId: "btn-show-option-sets" },
    // Keyboard-shortcut only (no button) — superseded by the Show Hidden Fields shortcut.
    { action: "injectShowHiddenFields", file: "content/show-hidden-fields.js", label: "Hidden Fields" },
    { action: "injectDirtyFields", file: "content/dirty-fields.js", label: "Dirty Fields", icon: "\u270F\uFE0F", popupBtnId: "btn-dirty-fields" },
    { action: "injectOverrideReadonly", file: "content/override-readonly.js", label: "Override Readonly", icon: "\u{1F513}" },
    { action: "injectLookupsOpener", file: "content/lookups-opener.js", label: "Lookups Opener", icon: "\u{1FA9F}" },
    { action: "openOnApi", file: "content/open-on-api.js", label: "Open on API", icon: "\u{1F517}", popupBtnId: "btn-open-on-api" },
    { action: "jumpToLatest", file: "content/jump-to-latest.js", label: "Jump to Latest", icon: "\u{1F550}", popupBtnId: "btn-jump-to-latest", allFrames: false },
    { action: "jumpToLatestQuick", file: "content/jump-to-latest-quick.js", label: "Jump to Latest (Quick)", icon: "\u26A1", allFrames: false },
    { action: "injectUnlockAllFields", file: "content/unlock-all-fields.js", label: "Unlock All Fields" },
    { action: "activateActivity", file: "content/activate-activity.js", label: "Activate", icon: "\u{1F513}", popupBtnId: "btn-activate-activity", conditional: "activatable" },
    { action: "injectShortcutsHelp", file: "content/shortcuts-help.js", label: "Shortcuts", icon: "\u2328\uFE0F", popupBtnId: "btn-shortcuts-help", allFrames: false }
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
    unlockAllActive: "dynamicsCatUnlockAllActive",
    unlockedNames: "dynamicsCatUnlockedNames",
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
      "injectDirtyFields"
    ]);
    const activeButtons = {};
    for (const def of ACTIONS) {
      if (!def.popupBtnId) continue;
      const btn = makeDropdownBtn(def.icon ?? "", def.label);
      btn.addEventListener("click", () => {
        dropdown.style.display = "none";
        sendAction(def.action);
      });
      if (def.conditional) {
        btn.style.display = "none";
        (conditionalButtons[def.conditional] ??= []).push(btn);
      }
      if (def.action === "injectDirtyFields") {
        activeButtons[def.action] = btn;
      }
      const parent = LEFT_ACTIONS.has(def.action) ? colLeft : colRight;
      parent.appendChild(btn);
    }
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
        const dirtyBtn = activeButtons["injectDirtyFields"];
        if (dirtyBtn) setButtonActive(dirtyBtn, ds[STATE_KEYS.dirtyActive] === "1");
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
    writeFlag("readonlySilentInject", "1");
    sendAction("injectOverrideReadonly");
    writeFlag("lookupsOpenerSilentInject", "1");
    sendAction("injectLookupsOpener");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vLi4vc3JjL2NvbnRlbnQvc3RhdGUudHMiLCAiLi4vLi4vc3JjL3JpYmJvbi9yaWJib24tdG9vbGJhci9yaWJib24tdG9vbGJhci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gU2luZ2xlIHJlZ2lzdHJ5IG9mIER5bmFtaWNzQ2F0IGFjdGlvbnMgXHUyMDE0IGNvbnN1bWVkIGJ5IGJhY2tncm91bmQsIHBvcHVwLCBhbmQgcmliYm9uLlxyXG4vLyBBZGRpbmcgYSBuZXcgYWN0aW9uIGhlcmUgYXV0b21hdGljYWxseSB3aXJlcyBpdCBpbnRvIGFsbCB0aHJlZSBzdXJmYWNlcy5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uRGVmIHtcclxuICBhY3Rpb246IHN0cmluZztcclxuICBmaWxlOiBzdHJpbmc7XHJcbiAgYWxsRnJhbWVzPzogYm9vbGVhbjsgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgaWNvbj86IHN0cmluZztcclxuICBwb3B1cEJ0bklkPzogc3RyaW5nO1xyXG4gIC8qKiBJZiBzZXQsIHRoZSBidXR0b24gaXMgaGlkZGVuIHVudGlsIGEgcnVudGltZSBwcm9iZSBjb25maXJtcyBpdCBzaG91bGQgYXBwZWFyLiAqL1xyXG4gIGNvbmRpdGlvbmFsPzogJ2FjdGl2YXRhYmxlJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEFDVElPTlM6IEFjdGlvbkRlZltdID0gW1xyXG4gIHsgYWN0aW9uOiAnaW5qZWN0QWxsRmllbGRzJywgICAgICAgIGZpbGU6ICdjb250ZW50L2FsbC1maWVsZHMuanMnLCAgICAgICAgICBsYWJlbDogJ0FsbCBGaWVsZHMnLCAgICAgaWNvbjogJ1x1RDgzRFx1RENDQicsIHBvcHVwQnRuSWQ6ICdidG4tYWxsLWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdE9wdGlvblNldHMnLCAgICAgICBmaWxlOiAnY29udGVudC9vcHRpb24tc2V0cy5qcycsICAgICAgICAgbGFiZWw6ICdPcHRpb24gU2V0cycsICAgIGljb246ICdcdUQ4M0RcdUREMTgnLCBwb3B1cEJ0bklkOiAnYnRuLXNob3ctb3B0aW9uLXNldHMnIH0sXHJcbiAgLy8gS2V5Ym9hcmQtc2hvcnRjdXQgb25seSAobm8gYnV0dG9uKSBcdTIwMTQgc3VwZXJzZWRlZCBieSB0aGUgU2hvdyBIaWRkZW4gRmllbGRzIHNob3J0Y3V0LlxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0U2hvd0hpZGRlbkZpZWxkcycsIGZpbGU6ICdjb250ZW50L3Nob3ctaGlkZGVuLWZpZWxkcy5qcycsICBsYWJlbDogJ0hpZGRlbiBGaWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3REaXJ0eUZpZWxkcycsICAgICAgZmlsZTogJ2NvbnRlbnQvZGlydHktZmllbGRzLmpzJywgICAgICAgIGxhYmVsOiAnRGlydHkgRmllbGRzJywgICBpY29uOiAnXHUyNzBGXHVGRTBGJywgcG9wdXBCdG5JZDogJ2J0bi1kaXJ0eS1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RPdmVycmlkZVJlYWRvbmx5JywgZmlsZTogJ2NvbnRlbnQvb3ZlcnJpZGUtcmVhZG9ubHkuanMnLCAgIGxhYmVsOiAnT3ZlcnJpZGUgUmVhZG9ubHknLCBpY29uOiAnXHVEODNEXHVERDEzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0TG9va3Vwc09wZW5lcicsICAgIGZpbGU6ICdjb250ZW50L2xvb2t1cHMtb3BlbmVyLmpzJywgICAgICBsYWJlbDogJ0xvb2t1cHMgT3BlbmVyJywgaWNvbjogJ1x1RDgzRVx1REU5RicgfSxcclxuICB7IGFjdGlvbjogJ29wZW5PbkFwaScsICAgICAgICAgICAgICBmaWxlOiAnY29udGVudC9vcGVuLW9uLWFwaS5qcycsICAgICAgICAgbGFiZWw6ICdPcGVuIG9uIEFQSScsICAgIGljb246ICdcdUQ4M0RcdUREMTcnLCBwb3B1cEJ0bklkOiAnYnRuLW9wZW4tb24tYXBpJyB9LFxyXG4gIHsgYWN0aW9uOiAnanVtcFRvTGF0ZXN0JywgICAgICAgICAgICBmaWxlOiAnY29udGVudC9qdW1wLXRvLWxhdGVzdC5qcycsICAgICAgIGxhYmVsOiAnSnVtcCB0byBMYXRlc3QnLCBpY29uOiAnXHVEODNEXHVERDUwJywgcG9wdXBCdG5JZDogJ2J0bi1qdW1wLXRvLWxhdGVzdCcsIGFsbEZyYW1lczogZmFsc2UgfSxcclxuICB7IGFjdGlvbjogJ2p1bXBUb0xhdGVzdFF1aWNrJywgICAgICBmaWxlOiAnY29udGVudC9qdW1wLXRvLWxhdGVzdC1xdWljay5qcycsIGxhYmVsOiAnSnVtcCB0byBMYXRlc3QgKFF1aWNrKScsIGljb246ICdcdTI2QTEnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RVbmxvY2tBbGxGaWVsZHMnLCAgZmlsZTogJ2NvbnRlbnQvdW5sb2NrLWFsbC1maWVsZHMuanMnLCAgIGxhYmVsOiAnVW5sb2NrIEFsbCBGaWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdhY3RpdmF0ZUFjdGl2aXR5JywgICAgICBmaWxlOiAnY29udGVudC9hY3RpdmF0ZS1hY3Rpdml0eS5qcycsICAgIGxhYmVsOiAnQWN0aXZhdGUnLCAgICAgICBpY29uOiAnXHVEODNEXHVERDEzJywgcG9wdXBCdG5JZDogJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScsIGNvbmRpdGlvbmFsOiAnYWN0aXZhdGFibGUnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RTaG9ydGN1dHNIZWxwJywgICAgZmlsZTogJ2NvbnRlbnQvc2hvcnRjdXRzLWhlbHAuanMnLCAgICAgIGxhYmVsOiAnU2hvcnRjdXRzJywgICAgICBpY29uOiAnXHUyMzI4XHVGRTBGJywgcG9wdXBCdG5JZDogJ2J0bi1zaG9ydGN1dHMtaGVscCcsIGFsbEZyYW1lczogZmFsc2UgfSxcclxuXTtcclxuXHJcbi8qKiBMb29rdXAgbWFwIGZyb20gYWN0aW9uIG5hbWUgdG8gc2NyaXB0IGNvbmZpZywgZm9yIHRoZSBiYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyLiAqL1xyXG5leHBvcnQgY29uc3QgQUNUSU9OX01BUDogUmVjb3JkPHN0cmluZywgeyBmaWxlOiBzdHJpbmc7IGFsbEZyYW1lczogYm9vbGVhbiB9PiA9IE9iamVjdC5mcm9tRW50cmllcyhcclxuICBBQ1RJT05TLm1hcChhID0+IFthLmFjdGlvbiwgeyBmaWxlOiBhLmZpbGUsIGFsbEZyYW1lczogYS5hbGxGcmFtZXMgPz8gdHJ1ZSB9XSksXHJcbik7XHJcbiIsICIvLyBDcm9zcy1mcmFtZSBzdGF0ZSBoZWxwZXJzIGZvciBEeW5hbWljc0NhdCBjb250ZW50IHNjcmlwdHMuXHJcbi8vIEJvdGggTUFJTiBhbmQgSVNPTEFURUQgd29ybGQgc2NyaXB0cyBjYW4gaW1wb3J0IHRoaXMgbW9kdWxlIFx1MjAxNCBlc2J1aWxkIGlubGluZXNcclxuLy8gaXQgaW50byBlYWNoIGJ1bmRsZS4gIFJ1bnRpbWUgY29tbXVuaWNhdGlvbiBnb2VzIHRocm91Z2ggZGF0YXNldCBwcm9wZXJ0aWVzIG9uXHJcbi8vIHRoZSB0b3AtbGV2ZWwgZG9jdW1lbnQgZWxlbWVudC5cclxuXHJcbmV4cG9ydCBjb25zdCBTVEFURV9LRVlTID0ge1xyXG4gIGhpZGRlbkFjdGl2ZTogJ2R5bmFtaWNzQ2F0SGlkZGVuQWN0aXZlJyxcclxuICBkaXJ0eUFjdGl2ZTogJ2R5bmFtaWNzQ2F0RGlydHlBY3RpdmUnLFxyXG4gIHJlYWRvbmx5T3ZlcnJpZGVBY3RpdmU6ICdkeW5hbWljc0NhdFJlYWRvbmx5T3ZlcnJpZGVBY3RpdmUnLFxyXG4gIHJlYWRvbmx5U2lsZW50SW5qZWN0OiAnZHluYW1pY3NDYXRSZWFkb25seVNpbGVudEluamVjdCcsXHJcbiAgcmVhZG9ubHlTaG9ydGN1dDogJ2R5bmFtaWNzQ2F0UmVhZG9ubHlTaG9ydGN1dCcsXHJcbiAgbG9va3Vwc09wZW5lckFjdGl2ZTogJ2R5bmFtaWNzQ2F0TG9va3Vwc09wZW5lckFjdGl2ZScsXHJcbiAgbG9va3Vwc09wZW5lclNpbGVudEluamVjdDogJ2R5bmFtaWNzQ2F0TG9va3Vwc09wZW5lclNpbGVudEluamVjdCcsXHJcbiAgbG9va3Vwc09wZW5lclNob3J0Y3V0OiAnZHluYW1pY3NDYXRMb29rdXBzT3BlbmVyU2hvcnRjdXQnLFxyXG4gIHJldmVhbGVkTmFtZXM6ICdkeW5hbWljc0NhdFJldmVhbGVkTmFtZXMnLFxyXG4gIHVubG9ja0FsbEFjdGl2ZTogJ2R5bmFtaWNzQ2F0VW5sb2NrQWxsQWN0aXZlJyxcclxuICB1bmxvY2tlZE5hbWVzOiAnZHluYW1pY3NDYXRVbmxvY2tlZE5hbWVzJyxcclxuICB0b2dnbGVMb2NrOiAnZHluYW1pY3NDYXRUb2dnbGVMb2NrJyxcclxuICBhY3RpdmF0YWJsZTogJ2R5bmFtaWNzQ2F0QWN0aXZhdGFibGUnLFxyXG59IGFzIGNvbnN0O1xyXG5cclxudHlwZSBTdGF0ZUtleSA9IGtleW9mIHR5cGVvZiBTVEFURV9LRVlTO1xyXG5cclxuLyoqIERhdGFzZXQgb2YgdGhlIHRvcC1sZXZlbCBkb2N1bWVudCwgZmFsbGluZyBiYWNrIHRvIGN1cnJlbnQgZnJhbWUgd2hlbiBjcm9zcy1vcmlnaW4uICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaGFyZWREYXRhc2V0KCk6IERPTVN0cmluZ01hcCB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiAoKHdpbmRvdy50b3AgPz8gd2luZG93KSBhcyBXaW5kb3cpLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0O1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0O1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGbGFnKGtleTogU3RhdGVLZXkpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xyXG4gIHJldHVybiBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZU1trZXldXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmxhZyhrZXk6IFN0YXRlS2V5LCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgZ2V0U2hhcmVkRGF0YXNldCgpW1NUQVRFX0tFWVNba2V5XV0gPSB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyRmxhZyhrZXk6IFN0YXRlS2V5KTogdm9pZCB7XHJcbiAgZGVsZXRlIGdldFNoYXJlZERhdGFzZXQoKVtTVEFURV9LRVlTW2tleV1dO1xyXG59XHJcblxyXG4vKipcclxuICogQWNxdWlyZSBhIHNob3J0LWxpdmVkIGxvY2sgdG8gcHJldmVudCBkdXBsaWNhdGUgZXhlY3V0aW9uIHdoZW4gYWxsRnJhbWVzOiB0cnVlXHJcbiAqIGluamVjdHMgdGhlIHNhbWUgc2NyaXB0IGludG8gbXVsdGlwbGUgQ1JNIGlmcmFtZXMuXHJcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgbG9jayB3YXMgYWNxdWlyZWQ7IGZhbHNlIGlmIGFscmVhZHkgaGVsZCBieSBhbm90aGVyIGZyYW1lLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFjcXVpcmVUb2dnbGVMb2NrKG1zID0gMTAwMCk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGRzID0gZ2V0U2hhcmVkRGF0YXNldCgpO1xyXG4gIGlmIChkc1tTVEFURV9LRVlTLnRvZ2dsZUxvY2tdKSByZXR1cm4gZmFsc2U7XHJcbiAgZHNbU1RBVEVfS0VZUy50b2dnbGVMb2NrXSA9ICcxJztcclxuICBzZXRUaW1lb3V0KCgpID0+IHsgZGVsZXRlIGRzW1NUQVRFX0tFWVMudG9nZ2xlTG9ja107IH0sIG1zKTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRKc29uQXJyYXkoa2V5OiBTdGF0ZUtleSk6IHN0cmluZ1tdIHtcclxuICBjb25zdCByYXcgPSBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZU1trZXldXTtcclxuICBpZiAoIXJhdykgcmV0dXJuIFtdO1xyXG4gIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHJhdykgYXMgc3RyaW5nW107IH0gY2F0Y2ggeyByZXR1cm4gW107IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlSnNvbkFycmF5KGtleTogU3RhdGVLZXksIGFycjogc3RyaW5nW10pOiB2b2lkIHtcclxuICBnZXRTaGFyZWREYXRhc2V0KClbU1RBVEVfS0VZU1trZXldXSA9IEpTT04uc3RyaW5naWZ5KGFycik7XHJcbn1cclxuIiwgIi8vIERPTS1pbmplY3Rpb24gdG9vbGJhciBmb3IgQ1JNIHBhZ2VzIChJU09MQVRFRCB3b3JsZCkuXHJcbi8vIEluamVjdHMgYSBcIkNcIiB0b2dnbGUgYnV0dG9uIGF0IHRoZSBmYXIgbGVmdCBvZiAjbmF2QmFyICh0aGUgQ1JNIG1hc3RoZWFkIG5hdiBiYXIpLFxyXG4vLyBtaXJyb3JpbmcgdGhlIGNybS1wb3dlci1wYW5lLWJ1dHRvbiBzdHJ1Y3R1cmUuXHJcbi8vIERvZXMgTk9UIHRvdWNoIFhybSBcdTIwMTQgZGVsZWdhdGVzIGFjdGlvbnMgdG8gYmFja2dyb3VuZCB2aWEgc2VuZE1lc3NhZ2UuXHJcblxyXG5pbXBvcnQgeyBBQ1RJT05TIH0gZnJvbSAnLi4vLi4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IFNUQVRFX0tFWVMsIGdldFNoYXJlZERhdGFzZXQsIHdyaXRlRmxhZyB9IGZyb20gJy4uLy4uL2NvbnRlbnQvc3RhdGUnO1xyXG5cclxuY29uc3QgVE9PTEJBUl9JRCA9ICdjcm0tdG9vbHMtcmliYm9uLXRvb2xiYXInO1xyXG5jb25zdCBTVFlMRV9JRCAgID0gJ2NybS10b29scy1yaWJib24tc3R5bGUnO1xyXG5jb25zdCBEUk9QRE9XTl9JRCA9ICdjcm0tdG9vbHMtcmliYm9uLWRyb3Bkb3duJztcclxuY29uc3QgQ1RYX0JBTk5FUl9JRCA9ICdjcm0tdG9vbHMtY3R4LWJhbm5lcic7XHJcblxyXG4vKiogQnV0dG9ucyB0aGF0IGFyZSBoaWRkZW4gdW50aWwgdGhlaXIgcHJvYmUgc3VjY2VlZHMuIEtleWVkIGJ5IGNvbmRpdGlvbmFsIHR5cGUuICovXHJcbmNvbnN0IGNvbmRpdGlvbmFsQnV0dG9uczogUmVjb3JkPHN0cmluZywgSFRNTEJ1dHRvbkVsZW1lbnRbXT4gPSB7fTtcclxuXHJcbmxldCBvdXRzaWRlQ2xpY2tIYW5kbGVyOiAoKGU6IE1vdXNlRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XHJcblxyXG4vKiogU2hvdyBhIHBlcnNpc3RlbnQgYmFubmVyIHdoZW4gdGhlIGV4dGVuc2lvbiBjb250ZXh0IGhhcyBiZWVuIGludmFsaWRhdGVkLiAqL1xyXG5mdW5jdGlvbiBzaG93Q29udGV4dEludmFsaWRhdGVkQmFubmVyKCk6IHZvaWQge1xyXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChDVFhfQkFOTkVSX0lEKSkgcmV0dXJuO1xyXG4gIGNvbnN0IGJhbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIGJhbm5lci5pZCA9IENUWF9CQU5ORVJfSUQ7XHJcbiAgYmFubmVyLnN0eWxlLmNzc1RleHQgPSBbXHJcbiAgICAncG9zaXRpb246IGZpeGVkJywgJ3RvcDogMCcsICdsZWZ0OiAwJywgJ3JpZ2h0OiAwJyxcclxuICAgICd6LWluZGV4OiAyMTQ3NDgzNjQ3JywgJ2JhY2tncm91bmQ6ICNjMDM5MmInLCAnY29sb3I6ICNmZmYnLFxyXG4gICAgJ2ZvbnQtZmFtaWx5OiBTZWdvZSBVSSwgQXJpYWwsIHNhbnMtc2VyaWYnLCAnZm9udC1zaXplOiAxM3B4JyxcclxuICAgICdwYWRkaW5nOiA4cHggMTZweCcsICd0ZXh0LWFsaWduOiBjZW50ZXInLFxyXG4gIF0uam9pbignOyAnKTtcclxuICBiYW5uZXIudGV4dENvbnRlbnQgPSAnXHUyNkEwXHVGRTBGIER5bmFtaWNzQ2F0IHdhcyByZWxvYWRlZCBcdTIwMTQgcGxlYXNlIHJlZnJlc2ggdGhpcyB0YWIgdG8gcmVzdG9yZSB0aGUgdG9vbGJhci4nO1xyXG4gIGNvbnN0IGNsb3NlQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgY2xvc2VCdG4udGV4dENvbnRlbnQgPSAnXHUyNzE1JztcclxuICBjbG9zZUJ0bi5zdHlsZS5jc3NUZXh0ID0gJ21hcmdpbi1sZWZ0OiAxMnB4OyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgYm9yZGVyOiBub25lOyBjb2xvcjogI2ZmZjsgY3Vyc29yOiBwb2ludGVyOyBmb250LXNpemU6IDE1cHg7JztcclxuICBjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGJhbm5lci5yZW1vdmUoKSk7XHJcbiAgYmFubmVyLmFwcGVuZENoaWxkKGNsb3NlQnRuKTtcclxuICBkb2N1bWVudC5ib2R5LnByZXBlbmQoYmFubmVyKTtcclxufVxyXG5cclxuLyoqIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBiYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyLCBoYW5kbGluZyBpbnZhbGlkYXRlZCBjb250ZXh0cyBncmFjZWZ1bGx5LiAqL1xyXG5mdW5jdGlvbiBzZW5kQWN0aW9uKGFjdGlvbjogc3RyaW5nKTogdm9pZCB7XHJcbiAgdHJ5IHtcclxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uIH0pO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgLy8gRXh0ZW5zaW9uIHdhcyByZWxvYWRlZC91cGRhdGVkIHdoaWxlIHRoZSB0YWIgd2FzIG9wZW4uIENocm9tZSBpbnZhbGlkYXRlcyB0aGVcclxuICAgIC8vIHJ1bnRpbWUgY29udGV4dCBidXQgRE9NIGV2ZW50IGxpc3RlbmVycyByZW1haW4gbGl2ZSBcdTIwMTQgYW55IGNocm9tZS5ydW50aW1lIGNhbGxcclxuICAgIC8vIHdpbGwgdGhyb3cgXCJFeHRlbnNpb24gY29udGV4dCBpbnZhbGlkYXRlZFwiLiBQcm9tcHQgdGhlIHVzZXIgdG8gcmVmcmVzaC5cclxuICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluamVjdFN0eWxlcygpOiB2b2lkIHtcclxuICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU1RZTEVfSUQpKSByZXR1cm47XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLmlkID0gU1RZTEVfSUQ7XHJcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXHJcbiNjcm0tdG9vbHMtcmliYm9uLXRvb2xiYXIgLm5hdlRhYkJ1dHRvbkxpbmsgeyBjdXJzb3I6IHBvaW50ZXI7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgfVxyXG4uY3J0LWRyb3Bkb3duLWJ0biB7XHJcbiAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMnB4O1xyXG4gIHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDQwcHg7IHBhZGRpbmc6IDAgMTZweDtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgYm9yZGVyOiBub25lO1xyXG4gIGNvbG9yOiAjMWYxZjFmOyBmb250LXNpemU6IDEzcHg7IGZvbnQtZmFtaWx5OiBcIkdvb2dsZSBTYW5zXCIsIFJvYm90bywgXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZjtcclxuICBjdXJzb3I6IHBvaW50ZXI7IHRleHQtYWxpZ246IGxlZnQ7IHdoaXRlLXNwYWNlOiBub3dyYXA7XHJcbn1cclxuLmNydC1kcm9wZG93bi1idG46aG92ZXIgeyBiYWNrZ3JvdW5kOiAjZjFmM2Y0OyB9XHJcbi5jcnQtZHJvcGRvd24tYnRuOmFjdGl2ZSB7IGJhY2tncm91bmQ6ICNlOGVhZWQ7IH1cclxuLmNydC1kcm9wZG93bi1idG4uY3J0LWFjdGl2ZSB7IGJhY2tncm91bmQ6IHJnYmEoNDYsMTI1LDUwLDAuMDgpOyB9XHJcbi5jcnQtZHJvcGRvd24tYnRuLmNydC1hY3RpdmU6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDQ2LDEyNSw1MCwwLjE0KTsgfVxyXG4uY3J0LWJ0bi1pY29uIHsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGZvbnQtc2l6ZTogMTVweDsgZmxleC1zaHJpbms6IDA7IH1cclxuLmNydC1idG4tYWN0aXZlLWRvdCB7IHdpZHRoOiA4cHg7IGhlaWdodDogOHB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6ICMyZTdkMzI7IG1hcmdpbi1sZWZ0OiBhdXRvOyBmbGV4LXNocmluazogMDsgZGlzcGxheTogbm9uZTsgfVxyXG4uY3J0LWRyb3Bkb3duLWJ0bi5jcnQtYWN0aXZlIC5jcnQtYnRuLWFjdGl2ZS1kb3QgeyBkaXNwbGF5OiBibG9jazsgfVxyXG4gICBgO1xyXG4gIChkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRCdXR0b25BY3RpdmUoYnRuOiBIVE1MQnV0dG9uRWxlbWVudCwgYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XHJcbiAgYnRuLmNsYXNzTGlzdC50b2dnbGUoJ2NydC1hY3RpdmUnLCBhY3RpdmUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZFRvb2xiYXIoKTogdm9pZCB7XHJcbiAgLy8gSWRlbXBvdGVudDogc2tpcCBpZiBhbHJlYWR5IGluamVjdGVkIChlLmcuIHNvZnQgbmF2aWdhdGlvbiB3aXRob3V0IGZ1bGwgcGFnZSB1bmxvYWQpXHJcbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFRPT0xCQVJfSUQpKSByZXR1cm47XHJcblxyXG4gIC8vIENsZWFuIHVwIGFueSBkZXRhY2hlZCBkcm9wZG93biBmcm9tIGEgcHJldmlvdXMgaW5qZWN0aW9uXHJcbiAgY29uc3Qgc3RhbGVEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKERST1BET1dOX0lEKTtcclxuICBpZiAoc3RhbGVEcm9wZG93bikgc3RhbGVEcm9wZG93bi5yZW1vdmUoKTtcclxuXHJcbiAgaW5qZWN0U3R5bGVzKCk7XHJcblxyXG4gIC8vIC0tLSBXcmFwcGVyOiBtaXJyb3JzIDxzcGFuIGNsYXNzPVwibmF2VGFiQnV0dG9uXCI+IHN0cnVjdHVyZSAtLS1cclxuICBjb25zdCB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gIHdyYXBwZXIuY2xhc3NOYW1lID0gJ25hdlRhYkJ1dHRvbic7XHJcbiAgd3JhcHBlci5pZCA9IFRPT0xCQVJfSUQ7XHJcbiAgd3JhcHBlci50aXRsZSA9ICdEeW5hbWljc0NhdCc7XHJcblxyXG4gIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgbGluay5jbGFzc05hbWUgPSAnbmF2VGFiQnV0dG9uTGluayc7XHJcbiAgbGluay5yb2xlID0gJ2J1dHRvbic7XHJcbiAgbGluay50YWJJbmRleCA9IDA7XHJcbiAgbGluay50aXRsZSA9ICcnO1xyXG5cclxuICBjb25zdCBpbWdDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgaW1nQ29udGFpbmVyLmNsYXNzTmFtZSA9ICduYXZUYWJCdXR0b25JbWFnZUNvbnRhaW5lcic7XHJcblxyXG4gIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICBsZXQgaWNvblNyYyA9ICcnO1xyXG4gIHRyeSB7XHJcbiAgICBpY29uU3JjID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCdpY29ucy9pY29uMzIucG5nJyk7XHJcbiAgfSBjYXRjaCB7IC8qIGNvbnRleHQgYWxyZWFkeSBpbnZhbGlkIFx1MjAxNCBpY29uIHdpbGwgYmUgbWlzc2luZywgYmFubmVyIHNob3duIG9uIGZpcnN0IGNsaWNrICovIH1cclxuICBpY29uLnNyYyA9IGljb25TcmM7XHJcbiAgaWNvbi5hbHQgPSAnRHluYW1pY3NDYXQnO1xyXG4gIGljb24uc3R5bGUuY3NzVGV4dCA9ICd3aWR0aDoyNHB4O2hlaWdodDoyNHB4O2Rpc3BsYXk6YmxvY2s7JztcclxuXHJcbiAgaW1nQ29udGFpbmVyLmFwcGVuZENoaWxkKGljb24pO1xyXG4gIGxpbmsuYXBwZW5kQ2hpbGQoaW1nQ29udGFpbmVyKTtcclxuICB3cmFwcGVyLmFwcGVuZENoaWxkKGxpbmspO1xyXG5cclxuICAvLyAtLS0gRHJvcGRvd24gcGFuZWwgXHUyMDE0IGFwcGVuZGVkIHRvIGRvY3VtZW50LmJvZHkgZm9yIHotaW5kZXggZXNjYXBlIC0tLVxyXG4gIGNvbnN0IGRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgZHJvcGRvd24uaWQgPSBEUk9QRE9XTl9JRDtcclxuICBkcm9wZG93bi5zdHlsZS5jc3NUZXh0ID0gW1xyXG4gICAgJ3Bvc2l0aW9uOiBmaXhlZCcsXHJcbiAgICAnei1pbmRleDogMjE0NzQ4MzY0NycsXHJcbiAgICAnYmFja2dyb3VuZDogI2ZmZicsXHJcbiAgICAnYm9yZGVyLXJhZGl1czogOHB4JyxcclxuICAgICdib3gtc2hhZG93OiAwIDJweCAxMHB4IHJnYmEoMCwwLDAsMC4xOCknLFxyXG4gICAgJ3BhZGRpbmc6IDhweCAwJyxcclxuICAgICdtaW4td2lkdGg6IDQwMHB4JyxcclxuICAgICdkaXNwbGF5OiBub25lJyxcclxuICAgICdncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnInLFxyXG4gIF0uam9pbignOyAnKTtcclxuXHJcbiAgZnVuY3Rpb24gbWFrZURyb3Bkb3duQnRuKGljb246IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IEhUTUxCdXR0b25FbGVtZW50IHtcclxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gICAgYnRuLmNsYXNzTmFtZSA9ICdjcnQtZHJvcGRvd24tYnRuJztcclxuICAgIGNvbnN0IGljb25FbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGljb25FbC5jbGFzc05hbWUgPSAnY3J0LWJ0bi1pY29uJztcclxuICAgIGljb25FbC50ZXh0Q29udGVudCA9IGljb247XHJcbiAgICBjb25zdCBsYWJlbEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbGFiZWxFbC50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG4gICAgY29uc3QgZG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgZG90LmNsYXNzTmFtZSA9ICdjcnQtYnRuLWFjdGl2ZS1kb3QnO1xyXG4gICAgYnRuLmFwcGVuZENoaWxkKGljb25FbCk7XHJcbiAgICBidG4uYXBwZW5kQ2hpbGQobGFiZWxFbCk7XHJcbiAgICBidG4uYXBwZW5kQ2hpbGQoZG90KTtcclxuICAgIHJldHVybiBidG47XHJcbiAgfVxyXG5cclxuICAvLyAtLS0gQnVpbGQgYnV0dG9ucyBmcm9tIGFjdGlvbiByZWdpc3RyeSAtLS1cclxuICBjb25zdCBjb2xMZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgY29uc3QgY29sUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBjb2xSaWdodC5zdHlsZS5jc3NUZXh0ID0gJ2JvcmRlci1sZWZ0OiAxcHggc29saWQgI2U4ZWFlZDsnO1xyXG5cclxuICAvLyBBY3Rpb25zIGFyZSBzcGxpdCBpbnRvIHR3byBjb2x1bW5zOiBmaXJzdCAzIGxlZnQsIHJlc3QgcmlnaHRcclxuICBjb25zdCBMRUZUX0FDVElPTlMgPSBuZXcgU2V0KFtcclxuICAgICdpbmplY3RBbGxGaWVsZHMnLFxyXG4gICAgJ2luamVjdE9wdGlvblNldHMnLFxyXG4gICAgJ2luamVjdERpcnR5RmllbGRzJyxcclxuICBdKTtcclxuXHJcbiAgLy8gVHJhY2sgYnV0dG9ucyB0aGF0IHNob3cgYWN0aXZlIHN0YXRlXHJcbiAgY29uc3QgYWN0aXZlQnV0dG9uczogUmVjb3JkPHN0cmluZywgSFRNTEJ1dHRvbkVsZW1lbnQ+ID0ge307XHJcblxyXG4gIGZvciAoY29uc3QgZGVmIG9mIEFDVElPTlMpIHtcclxuICAgIGlmICghZGVmLnBvcHVwQnRuSWQpIGNvbnRpbnVlO1xyXG4gICAgY29uc3QgYnRuID0gbWFrZURyb3Bkb3duQnRuKGRlZi5pY29uID8/ICcnLCBkZWYubGFiZWwpO1xyXG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICBkcm9wZG93bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICBzZW5kQWN0aW9uKGRlZi5hY3Rpb24pO1xyXG4gICAgfSk7XHJcbiAgICBpZiAoZGVmLmNvbmRpdGlvbmFsKSB7XHJcbiAgICAgIGJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAoY29uZGl0aW9uYWxCdXR0b25zW2RlZi5jb25kaXRpb25hbF0gPz89IFtdKS5wdXNoKGJ0bik7XHJcbiAgICB9XHJcbiAgICBpZiAoZGVmLmFjdGlvbiA9PT0gJ2luamVjdERpcnR5RmllbGRzJykge1xyXG4gICAgICBhY3RpdmVCdXR0b25zW2RlZi5hY3Rpb25dID0gYnRuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmVudCA9IExFRlRfQUNUSU9OUy5oYXMoZGVmLmFjdGlvbikgPyBjb2xMZWZ0IDogY29sUmlnaHQ7XHJcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoYnRuKTtcclxuICB9XHJcblxyXG4gIGRyb3Bkb3duLmFwcGVuZENoaWxkKGNvbExlZnQpO1xyXG4gIGRyb3Bkb3duLmFwcGVuZENoaWxkKGNvbFJpZ2h0KTtcclxuXHJcbiAgLy8gQXBwZW5kIGRyb3Bkb3duIHRvIGJvZHkgc28gaXQgZXNjYXBlcyB0aGUgcmliYm9uJ3Mgc3RhY2tpbmcgY29udGV4dFxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZHJvcGRvd24pO1xyXG5cclxuICAvLyAtLS0gVG9nZ2xlIGNsaWNrIGhhbmRsZXIgLS0tXHJcbiAgd3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgaWYgKGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPT09ICdncmlkJykge1xyXG4gICAgICBkcm9wZG93bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUmVjYWxjdWxhdGUgcG9zaXRpb24gZWFjaCB0aW1lIGluIGNhc2UgcGFnZSBoYXMgc2Nyb2xsZWRcclxuICAgICAgY29uc3QgcmVjdCA9IHdyYXBwZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLnRvcCAgPSByZWN0LmJvdHRvbSArICdweCc7XHJcbiAgICAgIGRyb3Bkb3duLnN0eWxlLmxlZnQgPSByZWN0LmxlZnQgKyAncHgnO1xyXG4gICAgICAvLyBSZWZsZWN0IHRvZ2dsZSBzdGF0ZSB3cml0dGVuIGJ5IE1BSU4td29ybGQgY29udGVudCBzY3JpcHRzIHZpYSBkYXRhc2V0XHJcbiAgICAgIGNvbnN0IGRzID0gZ2V0U2hhcmVkRGF0YXNldCgpO1xyXG4gICAgICBjb25zdCBkaXJ0eUJ0biA9IGFjdGl2ZUJ1dHRvbnNbJ2luamVjdERpcnR5RmllbGRzJ107XHJcbiAgICAgIGlmIChkaXJ0eUJ0bikgc2V0QnV0dG9uQWN0aXZlKGRpcnR5QnRuLCBkc1tTVEFURV9LRVlTLmRpcnR5QWN0aXZlXSA9PT0gJzEnKTtcclxuICAgICAgZHJvcGRvd24uc3R5bGUuZGlzcGxheSA9ICdncmlkJztcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gLS0tIENsaWNrLW91dHNpZGUgaGFuZGxlciAocmVwbGFjZSBwcmV2aW91cyB0byBhdm9pZCBkdXBsaWNhdGUgbGlzdGVuZXJzKSAtLS1cclxuICBpZiAob3V0c2lkZUNsaWNrSGFuZGxlcikgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvdXRzaWRlQ2xpY2tIYW5kbGVyKTtcclxuICBvdXRzaWRlQ2xpY2tIYW5kbGVyID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIGlmICghd3JhcHBlci5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSAmJiAhZHJvcGRvd24uY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkpIHtcclxuICAgICAgZHJvcGRvd24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH1cclxuICB9O1xyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3V0c2lkZUNsaWNrSGFuZGxlcik7XHJcblxyXG4gIC8vIC0tLSBCbHVyIGhhbmRsZXI6IGNsb3NlIGRyb3Bkb3duIHdoZW4gZm9jdXMgbGVhdmVzIHRvcCB3aW5kb3cgKGUuZy4gY2xpY2sgaW4gQ1JNIGlmcmFtZSkgLS0tXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XHJcbiAgICBkcm9wZG93bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gIH0pO1xyXG5cclxuICAvLyAtLS0gSW5qZWN0IGludG8gI25hdkJhciAod2hlcmUgY3JtLXBvd2VyLXBhbmUtYnV0dG9uIGxpdmVzKSAtLS1cclxuICAvLyBJZiBuYXZCYXIgaXNuJ3QgaW4gdGhlIERPTSB5ZXQsIGNsZWFuIHVwIGFuZCBsZXQgdGhlIE11dGF0aW9uT2JzZXJ2ZXIgcmV0cnkuXHJcbiAgLy8gTmV2ZXIgZmFsbCBiYWNrIHRvIGJvZHkgXHUyMDE0IGF2b2lkcyBwb2xsdXRpbmcgQ1JNIGZvcm0gaWZyYW1lcyB3aXRoIGEgc3RyYXkgYnV0dG9uLlxyXG4gIGNvbnN0IG5hdkJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZCYXInKTtcclxuICBpZiAoIW5hdkJhcikge1xyXG4gICAgZHJvcGRvd24ucmVtb3ZlKCk7XHJcbiAgICBpZiAob3V0c2lkZUNsaWNrSGFuZGxlcikge1xyXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG91dHNpZGVDbGlja0hhbmRsZXIpO1xyXG4gICAgICBvdXRzaWRlQ2xpY2tIYW5kbGVyID0gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgbmF2QmFyLnByZXBlbmQod3JhcHBlcik7XHJcbn1cclxuXHJcbi8qKiBSZS1pbmplY3QgdGhlIHRvb2xiYXIgd2hlbmV2ZXIgQ1JNIHJlbW92ZXMgaXQgKGUuZy4gaW50ZXJuYWwgU1BBIG5hdmlnYXRpb24pLiAqL1xyXG5mdW5jdGlvbiBzdGFydE9ic2VydmVyKCk6IHZvaWQge1xyXG4gIC8vIE9ic2VydmUgZG9jdW1lbnQuYm9keSAobmV2ZXIgcmVwbGFjZWQpIHJhdGhlciB0aGFuICNjcm1NYXN0aGVhZCBzbyB0aGF0XHJcbiAgLy8gdGhlIG9ic2VydmVyIHN0YXlzIGFsaXZlIGV2ZW4gd2hlbiBDUk0gU1BBIG5hdmlnYXRpb24gcmVwbGFjZXMgdGhlIG1hc3RoZWFkIGVsZW1lbnQuXHJcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LmJvZHk7XHJcbiAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xyXG4gICAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZChUT09MQkFSX0lEKSkgYnVpbGRUb29sYmFyKCk7XHJcbiAgfSkub2JzZXJ2ZShyb290LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcclxufVxyXG5cclxuLyoqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBwYWdlIGlzIGEgRHluYW1pY3MgQ1JNIG9yIER5bmFtaWNzIDM2NSBwYWdlLlxyXG4gKiAgRGV0ZWN0cyBDUk0gMjAxNiB2aWEgYm9keVtzY3JvbGw9bm9dIGFuZCBEeW5hbWljcyAzNjUgdmlhIGRpdltkYXRhLWlkPXRvcEJhcl0uICovXHJcbmZ1bmN0aW9uIGlzQ3JtUGFnZSgpOiBib29sZWFuIHtcclxuICBjb25zdCBtYWluQm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2JvZHlbc2Nyb2xsPW5vXScpO1xyXG4gIGNvbnN0IHRvcEJhciAgID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2W2RhdGEtaWQ9dG9wQmFyXScpO1xyXG4gIHJldHVybiAobWFpbkJvZHkgJiYgbWFpbkJvZHkubGVuZ3RoID4gMCkgfHwgdG9wQmFyICE9PSBudWxsO1xyXG59XHJcblxyXG4vKiogUmV0dXJucyB0cnVlIG9ubHkgd2hlbiB0aGUgQ1JNIG5hdiBiYXIgaXMgcHJlc2VudCBpbiB0aGUgRE9NLlxyXG4gKiAgTWFpbiBDUk0gd2luZG93cyBhbHdheXMgaGF2ZSAjbmF2QmFyIGF0IGRvY3VtZW50X2lkbGUgKHNlcnZlci1yZW5kZXJlZCkuXHJcbiAqICBEaWFsb2cgYW5kIHBvcHVwIHdpbmRvd3MgKEFkdmFuY2VkIEZpbmQsIEVkaXQgRm9ybSwgZXRjLikgbmV2ZXIgZG8gXHUyMDE0IHNraXBwaW5nXHJcbiAqICB0aGUgTXV0YXRpb25PYnNlcnZlciBvbiB0aG9zZSBwYWdlcyBwcmV2ZW50cyBydW5hd2F5IERPTSBxdWVyeWluZyBhbmQgYnJvd3NlciBoYW5ncy4gKi9cclxuZnVuY3Rpb24gaGFzTmF2QmFyKCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2QmFyJykgIT09IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm9iZSBjb25kaXRpb25hbCBhY3Rpb25zIHZpYSBiYWNrZ3JvdW5kIGV4ZWN1dGVTY3JpcHQgKE1BSU4gd29ybGQpLlxyXG4gKiBUaGUgcmliYm9uIHJ1bnMgaW4gSVNPTEFURUQgd29ybGQgc28gY2Fubm90IGFjY2VzcyBYcm0gZGlyZWN0bHkuXHJcbiAqIEJhY2tncm91bmQgcnVucyB0aGUgcHJvYmUgaW4gTUFJTiB3b3JsZCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0LlxyXG4gKi9cclxuZnVuY3Rpb24gcHJvYmVDb25kaXRpb25hbEFjdGlvbnMoKTogdm9pZCB7XHJcbiAgdHJ5IHtcclxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uOiAncHJvYmVBY3RpdmF0YWJsZScgfSwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgIGlmIChyZXNwb25zZT8uYWN0aXZhdGFibGUpIHtcclxuICAgICAgICBjb25zdCBkcyA9IGdldFNoYXJlZERhdGFzZXQoKTtcclxuICAgICAgICBkc1tTVEFURV9LRVlTLmFjdGl2YXRhYmxlXSA9ICcxJztcclxuICAgICAgICBmb3IgKGNvbnN0IGJ0biBvZiBjb25kaXRpb25hbEJ1dHRvbnNbJ2FjdGl2YXRhYmxlJ10gPz8gW10pIHtcclxuICAgICAgICAgIGJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbmlmIChpc0NybVBhZ2UoKSAmJiBoYXNOYXZCYXIoKSkge1xyXG4gIGJ1aWxkVG9vbGJhcigpO1xyXG4gIHN0YXJ0T2JzZXJ2ZXIoKTtcclxuICBwcm9iZUNvbmRpdGlvbmFsQWN0aW9ucygpO1xyXG5cclxuICAvLyBPdmVycmlkZSBSZWFkb25seSBhbmQgTG9va3VwcyBPcGVuZXIgYXJlIGFsd2F5cyBvbiBcdTIwMTQgaW5qZWN0IHNpbGVudGx5IG9uIGxvYWQuXHJcbiAgd3JpdGVGbGFnKCdyZWFkb25seVNpbGVudEluamVjdCcsICcxJyk7XHJcbiAgc2VuZEFjdGlvbignaW5qZWN0T3ZlcnJpZGVSZWFkb25seScpO1xyXG4gIHdyaXRlRmxhZygnbG9va3Vwc09wZW5lclNpbGVudEluamVjdCcsICcxJyk7XHJcbiAgc2VuZEFjdGlvbignaW5qZWN0TG9va3Vwc09wZW5lcicpO1xyXG5cclxuICAvLyBMaXN0ZW4gZm9yIGJhY2tncm91bmQtdGFiLW9wZW4gcmVxdWVzdHMgZnJvbSBNQUlOIHdvcmxkIGNvbnRlbnQgc2NyaXB0cyAodmlhIHBvc3RNZXNzYWdlIGFjcm9zcyBmcmFtZXMpXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZTogTWVzc2FnZUV2ZW50KSA9PiB7XHJcbiAgICBpZiAoZS5vcmlnaW4gIT09IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pIHJldHVybjtcclxuICAgIGlmIChlLmRhdGE/LnR5cGUgIT09ICdkeW5hbWljc2NhdC1vcGVuLWJhY2tncm91bmQtdGFiJyB8fCAhZS5kYXRhLnVybCkgcmV0dXJuO1xyXG4gICAgY29uc3QgdXJsID0gZS5kYXRhLnVybCBhcyBzdHJpbmc7XHJcbiAgICBpZiAoIXVybC5zdGFydHNXaXRoKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyAnLycpKSByZXR1cm47XHJcbiAgICB0cnkge1xyXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IGFjdGlvbjogJ29wZW5CYWNrZ3JvdW5kVGFiJywgdXJsIH0pO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHNob3dDb250ZXh0SW52YWxpZGF0ZWRCYW5uZXIoKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFjTyxNQUFNLFVBQXVCO0FBQUEsSUFDbEMsRUFBRSxRQUFRLG1CQUEwQixNQUFNLHlCQUFrQyxPQUFPLGNBQWtCLE1BQU0sYUFBTSxZQUFZLGlCQUFpQjtBQUFBLElBQzlJLEVBQUUsUUFBUSxvQkFBMEIsTUFBTSwwQkFBa0MsT0FBTyxlQUFrQixNQUFNLGFBQU0sWUFBWSx1QkFBdUI7QUFBQTtBQUFBLElBRXBKLEVBQUUsUUFBUSwwQkFBMEIsTUFBTSxpQ0FBa0MsT0FBTyxnQkFBZ0I7QUFBQSxJQUNuRyxFQUFFLFFBQVEscUJBQTBCLE1BQU0sMkJBQWtDLE9BQU8sZ0JBQWtCLE1BQU0sZ0JBQU0sWUFBWSxtQkFBbUI7QUFBQSxJQUNoSixFQUFFLFFBQVEsMEJBQTBCLE1BQU0sZ0NBQWtDLE9BQU8scUJBQXFCLE1BQU0sWUFBSztBQUFBLElBQ25ILEVBQUUsUUFBUSx1QkFBMEIsTUFBTSw2QkFBa0MsT0FBTyxrQkFBa0IsTUFBTSxZQUFLO0FBQUEsSUFDaEgsRUFBRSxRQUFRLGFBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlB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TztBQUFBLEVBQ3hCO0FBR0EsV0FBUyxnQkFBc0I7QUFHN0IsVUFBTSxPQUFPLFNBQVM7QUFDdEIsUUFBSSxpQkFBaUIsTUFBTTtBQUN6QixVQUFJLENBQUMsU0FBUyxlQUFlLFVBQVUsRUFBRyxjQUFhO0FBQUEsSUFDekQsQ0FBQyxFQUFFLFFBQVEsTUFBTSxFQUFFLFdBQVcsTUFBTSxTQUFTLEtBQUssQ0FBQztBQUFBLEVBQ3JEO0FBSUEsV0FBUyxZQUFxQjtBQUM1QixVQUFNLFdBQVcsU0FBUyxpQkFBaUIsaUJBQWlCO0FBQzVELFVBQU0sU0FBVyxTQUFTLGNBQWMscUJBQXFCO0FBQzdELFdBQVEsWUFBWSxTQUFTLFNBQVMsS0FBTSxXQUFXO0FBQUEsRUFDekQ7QUFNQSxXQUFTLFlBQXFCO0FBQzVCLFdBQU8sU0FBUyxlQUFlLFFBQVEsTUFBTTtBQUFBLEVBQy9DO0FBT0EsV0FBUywwQkFBZ0M7QUFDdkMsUUFBSTtBQUNGLGFBQU8sUUFBUSxZQUFZLEVBQUUsUUFBUSxtQkFBbUIsR0FBRyxDQUFDLGFBQWE7QUFDdkUsWUFBSSxVQUFVLGFBQWE7QUFDekIsZ0JBQU0sS0FBSyxpQkFBaUI7QUFDNUIsYUFBRyxXQUFXLFdBQVcsSUFBSTtBQUM3QixxQkFBVyxPQUFPLG1CQUFtQixhQUFhLEtBQUssQ0FBQyxHQUFHO0FBQ3pELGdCQUFJLE1BQU0sVUFBVTtBQUFBLFVBQ3RCO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0gsUUFBUTtBQUNOLG1DQUE2QjtBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUVBLE1BQUksVUFBVSxLQUFLLFVBQVUsR0FBRztBQUM5QixpQkFBYTtBQUNiLGtCQUFjO0FBQ2QsNEJBQXdCO0FBR3hCLGNBQVUsd0JBQXdCLEdBQUc7QUFDckMsZUFBVyx3QkFBd0I7QUFDbkMsY0FBVSw2QkFBNkIsR0FBRztBQUMxQyxlQUFXLHFCQUFxQjtBQUdoQyxXQUFPLGlCQUFpQixXQUFXLENBQUMsTUFBb0I7QUFDdEQsVUFBSSxFQUFFLFdBQVcsT0FBTyxTQUFTLE9BQVE7QUFDekMsVUFBSSxFQUFFLE1BQU0sU0FBUyxxQ0FBcUMsQ0FBQyxFQUFFLEtBQUssSUFBSztBQUN2RSxZQUFNLE1BQU0sRUFBRSxLQUFLO0FBQ25CLFVBQUksQ0FBQyxJQUFJLFdBQVcsT0FBTyxTQUFTLFNBQVMsR0FBRyxFQUFHO0FBQ25ELFVBQUk7QUFDRixlQUFPLFFBQVEsWUFBWSxFQUFFLFFBQVEscUJBQXFCLElBQUksQ0FBQztBQUFBLE1BQ2pFLFFBQVE7QUFDTixxQ0FBNkI7QUFBQSxNQUMvQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7IiwKICAibmFtZXMiOiBbImljb24iXQp9Cg==
