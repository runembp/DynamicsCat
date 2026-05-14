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

  // src/popup/popup.ts
  var DEFAULT_READONLY_SHORTCUT = "alt";
  var DEFAULT_LOOKUPS_OPENER_SHORTCUT = "ctrl";
  function sendAction(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.runtime.sendMessage({ action, tabId: tab.id });
    });
  }
  function stopKeyPropagation(element) {
    for (const eventName of ["keydown", "keyup"]) {
      element.addEventListener(eventName, (e) => {
        e.stopPropagation();
      });
    }
  }
  function loadShortcutSettings(callback) {
    chrome.storage.local.get(["readonlyShortcut", "lookupsOpenerShortcut"], (result) => {
      callback(result);
    });
  }
  async function probeActivatable(tabId) {
    const marker = "__dynamicscat_activatable";
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: "MAIN",
        func: (attr) => {
          if (typeof Xrm === "undefined" || !Xrm.Page?.data) return;
          const sc = Xrm.Page.getAttribute("statecode");
          if (!sc) return;
          const closed = sc.getValue() !== 0;
          if (closed) document.documentElement.setAttribute(attr, "1");
        },
        args: [marker]
      });
      const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: (attr) => {
          const val = document.documentElement.getAttribute(attr);
          if (val) document.documentElement.removeAttribute(attr);
          return val === "1";
        },
        args: [marker]
      });
      return results.some((r) => r.result === true);
    } catch {
      return false;
    }
  }
  document.addEventListener("DOMContentLoaded", async () => {
    for (const def of ACTIONS) {
      if (!def.popupBtnId) continue;
      const btn = document.getElementById(def.popupBtnId);
      if (!btn) {
        console.error(`[DynamicsCat] Popup element #${def.popupBtnId} not found`);
        continue;
      }
      btn.addEventListener("click", () => {
        if (def.action === "injectOverrideReadonly") {
          chrome.storage.local.get("readonlyOverride", (result) => {
            chrome.storage.local.set({ readonlyOverride: result.readonlyOverride === false });
          });
        }
        if (def.action === "injectLookupsOpener") {
          chrome.storage.local.get("lookupsOpenerOverride", (result) => {
            chrome.storage.local.set({ lookupsOpenerOverride: result.lookupsOpenerOverride === false });
          });
        }
        sendAction(def.action);
      });
    }
    const readonlyGearBtn = document.getElementById("btn-readonly-settings");
    const readonlySettingsPanel = document.getElementById("readonly-settings-panel");
    const readonlyShortcutSelect = document.getElementById("readonly-shortcut-select");
    const lookupsGearBtn = document.getElementById("btn-lookups-opener-settings");
    const lookupsSettingsPanel = document.getElementById("lookups-opener-settings-panel");
    const lookupsShortcutSelect = document.getElementById("lookups-opener-shortcut-select");
    const toggleSettingsPanel = (button, panel) => {
      if (!button || !panel) return;
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.hidden = !panel.hidden;
      });
    };
    toggleSettingsPanel(readonlyGearBtn, readonlySettingsPanel);
    toggleSettingsPanel(lookupsGearBtn, lookupsSettingsPanel);
    if (readonlyShortcutSelect && lookupsShortcutSelect) {
      loadShortcutSettings((result) => {
        readonlyShortcutSelect.value = result.readonlyShortcut || DEFAULT_READONLY_SHORTCUT;
        lookupsShortcutSelect.value = result.lookupsOpenerShortcut || DEFAULT_LOOKUPS_OPENER_SHORTCUT;
      });
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
            chrome.storage.local.set({ [storageKey]: nextValue });
            previousValue = nextValue;
          });
        });
        stopKeyPropagation(select);
      };
      bindShortcutSelect(readonlyShortcutSelect, "readonlyShortcut", "lookupsOpenerShortcut", "Lookups Opener", DEFAULT_READONLY_SHORTCUT);
      bindShortcutSelect(lookupsShortcutSelect, "lookupsOpenerShortcut", "readonlyShortcut", "Override Readonly", DEFAULT_LOOKUPS_OPENER_SHORTCUT);
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const canActivate = await probeActivatable(tab.id);
      if (canActivate) {
        const btn = document.getElementById("btn-activate-activity");
        if (btn) btn.hidden = false;
      }
    }
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vLi4vc3JjL3BvcHVwL3BvcHVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaW5nbGUgcmVnaXN0cnkgb2YgRHluYW1pY3NDYXQgYWN0aW9ucyBcdTIwMTQgY29uc3VtZWQgYnkgYmFja2dyb3VuZCwgcG9wdXAsIGFuZCByaWJib24uXHJcbi8vIEFkZGluZyBhIG5ldyBhY3Rpb24gaGVyZSBhdXRvbWF0aWNhbGx5IHdpcmVzIGl0IGludG8gYWxsIHRocmVlIHN1cmZhY2VzLlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25EZWYge1xyXG4gIGFjdGlvbjogc3RyaW5nO1xyXG4gIGZpbGU6IHN0cmluZztcclxuICBhbGxGcmFtZXM/OiBib29sZWFuOyAvLyBkZWZhdWx0cyB0byB0cnVlXHJcbiAgbGFiZWw6IHN0cmluZztcclxuICBpY29uOiBzdHJpbmc7XHJcbiAgcG9wdXBCdG5JZD86IHN0cmluZztcclxuICAvKiogSWYgc2V0LCB0aGUgYnV0dG9uIGlzIGhpZGRlbiB1bnRpbCBhIHJ1bnRpbWUgcHJvYmUgY29uZmlybXMgaXQgc2hvdWxkIGFwcGVhci4gKi9cclxuICBjb25kaXRpb25hbD86ICdhY3RpdmF0YWJsZSc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05TOiBBY3Rpb25EZWZbXSA9IFtcclxuICB7IGFjdGlvbjogJ2luamVjdEFsbEZpZWxkcycsICAgICAgICBmaWxlOiAnY29udGVudC9hbGwtZmllbGRzLmpzJywgICAgICAgICAgbGFiZWw6ICdBbGwgRmllbGRzJywgICAgIGljb246ICdcdUQ4M0RcdURDQ0InLCBwb3B1cEJ0bklkOiAnYnRuLWFsbC1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RPcHRpb25TZXRzJywgICAgICAgZmlsZTogJ2NvbnRlbnQvb3B0aW9uLXNldHMuanMnLCAgICAgICAgIGxhYmVsOiAnT3B0aW9uIFNldHMnLCAgICBpY29uOiAnXHVEODNEXHVERDE4JywgcG9wdXBCdG5JZDogJ2J0bi1zaG93LW9wdGlvbi1zZXRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0U2hvd0hpZGRlbkZpZWxkcycsIGZpbGU6ICdjb250ZW50L3Nob3ctaGlkZGVuLWZpZWxkcy5qcycsICBsYWJlbDogJ0hpZGRlbiBGaWVsZHMnLCAgaWNvbjogJ1x1RDgzRFx1REM0MScsIHBvcHVwQnRuSWQ6ICdidG4tc2hvdy1oaWRkZW4tZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0RGlydHlGaWVsZHMnLCAgICAgIGZpbGU6ICdjb250ZW50L2RpcnR5LWZpZWxkcy5qcycsICAgICAgICBsYWJlbDogJ0RpcnR5IEZpZWxkcycsICAgaWNvbjogJ1x1MjcwRlx1RkUwRicsIHBvcHVwQnRuSWQ6ICdidG4tZGlydHktZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScsIGZpbGU6ICdjb250ZW50L292ZXJyaWRlLXJlYWRvbmx5LmpzJywgICBsYWJlbDogJ092ZXJyaWRlIFJlYWRvbmx5JywgaWNvbjogJ1x1RDgzRFx1REQxMycsIHBvcHVwQnRuSWQ6ICdidG4tb3ZlcnJpZGUtcmVhZG9ubHknIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RMb29rdXBzT3BlbmVyJywgICAgZmlsZTogJ2NvbnRlbnQvbG9va3Vwcy1vcGVuZXIuanMnLCAgICAgIGxhYmVsOiAnTG9va3VwcyBPcGVuZXInLCBpY29uOiAnXHVEODNFXHVERTlGJywgcG9wdXBCdG5JZDogJ2J0bi1sb29rdXBzLW9wZW5lcicgfSxcclxuICB7IGFjdGlvbjogJ29wZW5PbkFwaScsICAgICAgICAgICAgICBmaWxlOiAnY29udGVudC9vcGVuLW9uLWFwaS5qcycsICAgICAgICAgbGFiZWw6ICdPcGVuIG9uIEFQSScsICAgIGljb246ICdcdUQ4M0RcdUREMTcnLCBwb3B1cEJ0bklkOiAnYnRuLW9wZW4tb24tYXBpJyB9LFxyXG4gIHsgYWN0aW9uOiAnanVtcFRvTGF0ZXN0JywgICAgICAgICAgICBmaWxlOiAnY29udGVudC9qdW1wLXRvLWxhdGVzdC5qcycsICAgICAgIGxhYmVsOiAnSnVtcCB0byBMYXRlc3QnLCBpY29uOiAnXHVEODNEXHVERDUwJywgcG9wdXBCdG5JZDogJ2J0bi1qdW1wLXRvLWxhdGVzdCcsIGFsbEZyYW1lczogZmFsc2UgfSxcclxuICB7IGFjdGlvbjogJ2p1bXBUb0xhdGVzdFF1aWNrJywgICAgICBmaWxlOiAnY29udGVudC9qdW1wLXRvLWxhdGVzdC1xdWljay5qcycsIGxhYmVsOiAnSnVtcCB0byBMYXRlc3QgKFF1aWNrKScsIGljb246ICdcdTI2QTEnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbiAgeyBhY3Rpb246ICdhY3RpdmF0ZUFjdGl2aXR5JywgICAgICBmaWxlOiAnY29udGVudC9hY3RpdmF0ZS1hY3Rpdml0eS5qcycsICAgIGxhYmVsOiAnQWN0aXZhdGUnLCAgICAgICBpY29uOiAnXHVEODNEXHVERDEzJywgcG9wdXBCdG5JZDogJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScsIGNvbmRpdGlvbmFsOiAnYWN0aXZhdGFibGUnIH0sXHJcbl07XHJcblxyXG4vKiogTG9va3VwIG1hcCBmcm9tIGFjdGlvbiBuYW1lIHRvIHNjcmlwdCBjb25maWcsIGZvciB0aGUgYmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlci4gKi9cclxuZXhwb3J0IGNvbnN0IEFDVElPTl9NQVA6IFJlY29yZDxzdHJpbmcsIHsgZmlsZTogc3RyaW5nOyBhbGxGcmFtZXM6IGJvb2xlYW4gfT4gPSBPYmplY3QuZnJvbUVudHJpZXMoXHJcbiAgQUNUSU9OUy5tYXAoYSA9PiBbYS5hY3Rpb24sIHsgZmlsZTogYS5maWxlLCBhbGxGcmFtZXM6IGEuYWxsRnJhbWVzID8/IHRydWUgfV0pLFxyXG4pO1xyXG4iLCAiaW1wb3J0IHsgQUNUSU9OUyB9IGZyb20gJy4uL2FjdGlvbnMnO1xyXG5cclxuY29uc3QgREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCA9ICdhbHQnO1xyXG5jb25zdCBERUZBVUxUX0xPT0tVUFNfT1BFTkVSX1NIT1JUQ1VUID0gJ2N0cmwnO1xyXG5cclxudHlwZSBTaG9ydGN1dFNldHRpbmdzID0ge1xyXG4gIHJlYWRvbmx5U2hvcnRjdXQ/OiBzdHJpbmc7XHJcbiAgbG9va3Vwc09wZW5lclNob3J0Y3V0Pzogc3RyaW5nO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2VuZEFjdGlvbihhY3Rpb246IHN0cmluZyk6IHZvaWQge1xyXG4gIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0sIChbdGFiXSkgPT4ge1xyXG4gICAgaWYgKCF0YWI/LmlkKSByZXR1cm47XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IGFjdGlvbiwgdGFiSWQ6IHRhYi5pZCB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcEtleVByb3BhZ2F0aW9uKGVsZW1lbnQ6IEhUTUxTZWxlY3RFbGVtZW50KTogdm9pZCB7XHJcbiAgZm9yIChjb25zdCBldmVudE5hbWUgb2YgWydrZXlkb3duJywgJ2tleXVwJ10pIHtcclxuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIChlKSA9PiB7XHJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRTaG9ydGN1dFNldHRpbmdzKGNhbGxiYWNrOiAoc2V0dGluZ3M6IFNob3J0Y3V0U2V0dGluZ3MpID0+IHZvaWQpOiB2b2lkIHtcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydyZWFkb25seVNob3J0Y3V0JywgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCddLCAocmVzdWx0KSA9PiB7XHJcbiAgICBjYWxsYmFjayhyZXN1bHQgYXMgU2hvcnRjdXRTZXR0aW5ncyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm9iZSB0aGUgYWN0aXZlIHRhYiB0byBjaGVjayBpZiB0aGUgY3VycmVudCBlbnRpdHkgY2FuIGJlIGFjdGl2YXRlZC5cclxuICogVXNlcyBhIHR3by1zdGVwIGFwcHJvYWNoOiBNQUlOIHdvcmxkIHNjcmlwdCB3cml0ZXMgcmVzdWx0IHRvIGEgZGF0YSBhdHRyaWJ1dGUsXHJcbiAqIHRoZW4gSVNPTEFURUQgd29ybGQgc2NyaXB0IHJlYWRzIGl0IGJhY2sgKE1BSU4gd29ybGQgY2Fubm90IHJldHVybiB2YWx1ZXMgdG8gZXh0ZW5zaW9uKS5cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2JlQWN0aXZhdGFibGUodGFiSWQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGNvbnN0IG1hcmtlciA9ICdfX2R5bmFtaWNzY2F0X2FjdGl2YXRhYmxlJztcclxuICB0cnkge1xyXG4gICAgLy8gU3RlcCAxOiBpbmplY3QgaW50byBNQUlOIHdvcmxkIHRvIGNoZWNrIFhybSBzdGF0ZSwgd3JpdGUgcmVzdWx0IHRvIGRvY3VtZW50IGVsZW1lbnRcclxuICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiB0cnVlIH0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgIGZ1bmM6IChhdHRyOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlPy5kYXRhKSByZXR1cm47XHJcbiAgICAgICAgY29uc3Qgc2MgPSBYcm0uUGFnZS5nZXRBdHRyaWJ1dGUoJ3N0YXRlY29kZScpO1xyXG4gICAgICAgIGlmICghc2MpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjbG9zZWQgPSAoc2MuZ2V0VmFsdWUoKSBhcyBudW1iZXIpICE9PSAwO1xyXG4gICAgICAgIGlmIChjbG9zZWQpIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwgJzEnKTtcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdGVwIDI6IHJlYWQgdGhlIG1hcmtlciBmcm9tIElTT0xBVEVEIHdvcmxkIChjYW4gcmV0dXJuIHZhbHVlcylcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogdHJ1ZSB9LFxyXG4gICAgICBmdW5jOiAoYXR0cjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdmFsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICBpZiAodmFsKSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgICAgIHJldHVybiB2YWwgPT09ICcxJztcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzLnNvbWUociA9PiByLnJlc3VsdCA9PT0gdHJ1ZSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gIGZvciAoY29uc3QgZGVmIG9mIEFDVElPTlMpIHtcclxuICAgIGlmICghZGVmLnBvcHVwQnRuSWQpIGNvbnRpbnVlO1xyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmLnBvcHVwQnRuSWQpO1xyXG4gICAgaWYgKCFidG4pIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgW0R5bmFtaWNzQ2F0XSBQb3B1cCBlbGVtZW50ICMke2RlZi5wb3B1cEJ0bklkfSBub3QgZm91bmRgKTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIGlmIChkZWYuYWN0aW9uID09PSAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScpIHtcclxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3JlYWRvbmx5T3ZlcnJpZGUnLCAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyByZWFkb25seU92ZXJyaWRlOiByZXN1bHQucmVhZG9ubHlPdmVycmlkZSA9PT0gZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRlZi5hY3Rpb24gPT09ICdpbmplY3RMb29rdXBzT3BlbmVyJykge1xyXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnbG9va3Vwc09wZW5lck92ZXJyaWRlJywgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgbG9va3Vwc09wZW5lck92ZXJyaWRlOiByZXN1bHQubG9va3Vwc09wZW5lck92ZXJyaWRlID09PSBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBzZW5kQWN0aW9uKGRlZi5hY3Rpb24pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0gU2hvcnRjdXQgc2V0dGluZ3MgLS0tXHJcbiAgY29uc3QgcmVhZG9ubHlHZWFyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1yZWFkb25seS1zZXR0aW5ncycpO1xyXG4gIGNvbnN0IHJlYWRvbmx5U2V0dGluZ3NQYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkb25seS1zZXR0aW5ncy1wYW5lbCcpO1xyXG4gIGNvbnN0IHJlYWRvbmx5U2hvcnRjdXRTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZG9ubHktc2hvcnRjdXQtc2VsZWN0JykgYXMgSFRNTFNlbGVjdEVsZW1lbnQgfCBudWxsO1xyXG4gIGNvbnN0IGxvb2t1cHNHZWFyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1sb29rdXBzLW9wZW5lci1zZXR0aW5ncycpO1xyXG4gIGNvbnN0IGxvb2t1cHNTZXR0aW5nc1BhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvb2t1cHMtb3BlbmVyLXNldHRpbmdzLXBhbmVsJyk7XHJcbiAgY29uc3QgbG9va3Vwc1Nob3J0Y3V0U2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvb2t1cHMtb3BlbmVyLXNob3J0Y3V0LXNlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50IHwgbnVsbDtcclxuXHJcbiAgY29uc3QgdG9nZ2xlU2V0dGluZ3NQYW5lbCA9IChidXR0b246IEhUTUxFbGVtZW50IHwgbnVsbCwgcGFuZWw6IEhUTUxFbGVtZW50IHwgbnVsbCk6IHZvaWQgPT4ge1xyXG4gICAgaWYgKCFidXR0b24gfHwgIXBhbmVsKSByZXR1cm47XHJcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICBwYW5lbC5oaWRkZW4gPSAhcGFuZWwuaGlkZGVuO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgdG9nZ2xlU2V0dGluZ3NQYW5lbChyZWFkb25seUdlYXJCdG4sIHJlYWRvbmx5U2V0dGluZ3NQYW5lbCk7XHJcbiAgdG9nZ2xlU2V0dGluZ3NQYW5lbChsb29rdXBzR2VhckJ0biwgbG9va3Vwc1NldHRpbmdzUGFuZWwpO1xyXG5cclxuICBpZiAocmVhZG9ubHlTaG9ydGN1dFNlbGVjdCAmJiBsb29rdXBzU2hvcnRjdXRTZWxlY3QpIHtcclxuICAgIGxvYWRTaG9ydGN1dFNldHRpbmdzKChyZXN1bHQpID0+IHtcclxuICAgICAgcmVhZG9ubHlTaG9ydGN1dFNlbGVjdC52YWx1ZSA9IHJlc3VsdC5yZWFkb25seVNob3J0Y3V0IHx8IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQ7XHJcbiAgICAgIGxvb2t1cHNTaG9ydGN1dFNlbGVjdC52YWx1ZSA9IHJlc3VsdC5sb29rdXBzT3BlbmVyU2hvcnRjdXQgfHwgREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGJpbmRTaG9ydGN1dFNlbGVjdCA9IChcclxuICAgICAgc2VsZWN0OiBIVE1MU2VsZWN0RWxlbWVudCxcclxuICAgICAgc3RvcmFnZUtleTogJ3JlYWRvbmx5U2hvcnRjdXQnIHwgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICAgIG90aGVyU3RvcmFnZUtleTogJ3JlYWRvbmx5U2hvcnRjdXQnIHwgJ2xvb2t1cHNPcGVuZXJTaG9ydGN1dCcsXHJcbiAgICAgIG90aGVyVG9vbExhYmVsOiBzdHJpbmcsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nLFxyXG4gICAgKTogdm9pZCA9PiB7XHJcbiAgICAgIGxldCBwcmV2aW91c1ZhbHVlID0gZGVmYXVsdFZhbHVlO1xyXG4gICAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB7XHJcbiAgICAgICAgcHJldmlvdXNWYWx1ZSA9IHNlbGVjdC52YWx1ZTtcclxuICAgICAgfSk7XHJcbiAgICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgbmV4dFZhbHVlID0gc2VsZWN0LnZhbHVlO1xyXG4gICAgICAgIGxvYWRTaG9ydGN1dFNldHRpbmdzKChzZXR0aW5ncykgPT4ge1xyXG4gICAgICAgICAgY29uc3Qgb3RoZXJWYWx1ZSA9IHNldHRpbmdzW290aGVyU3RvcmFnZUtleV1cclxuICAgICAgICAgICAgfHwgKG90aGVyU3RvcmFnZUtleSA9PT0gJ3JlYWRvbmx5U2hvcnRjdXQnID8gREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCA6IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQpO1xyXG4gICAgICAgICAgaWYgKG5leHRWYWx1ZSA9PT0gb3RoZXJWYWx1ZSkge1xyXG4gICAgICAgICAgICBhbGVydChgU2hvcnRjdXQgYWxyZWFkeSB1c2VkIGJ5ICR7b3RoZXJUb29sTGFiZWx9YCk7XHJcbiAgICAgICAgICAgIHNlbGVjdC52YWx1ZSA9IHByZXZpb3VzVmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IFtzdG9yYWdlS2V5XTogbmV4dFZhbHVlIH0pO1xyXG4gICAgICAgICAgcHJldmlvdXNWYWx1ZSA9IG5leHRWYWx1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHN0b3BLZXlQcm9wYWdhdGlvbihzZWxlY3QpO1xyXG4gICAgfTtcclxuXHJcbiAgICBiaW5kU2hvcnRjdXRTZWxlY3QocmVhZG9ubHlTaG9ydGN1dFNlbGVjdCwgJ3JlYWRvbmx5U2hvcnRjdXQnLCAnbG9va3Vwc09wZW5lclNob3J0Y3V0JywgJ0xvb2t1cHMgT3BlbmVyJywgREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCk7XHJcbiAgICBiaW5kU2hvcnRjdXRTZWxlY3QobG9va3Vwc1Nob3J0Y3V0U2VsZWN0LCAnbG9va3Vwc09wZW5lclNob3J0Y3V0JywgJ3JlYWRvbmx5U2hvcnRjdXQnLCAnT3ZlcnJpZGUgUmVhZG9ubHknLCBERUZBVUxUX0xPT0tVUFNfT1BFTkVSX1NIT1JUQ1VUKTtcclxuICB9XHJcblxyXG4gIC8vIENvbmRpdGlvbmFsbHkgc2hvdyB0aGUgQWN0aXZhdGUgYnV0dG9uXHJcbiAgY29uc3QgW3RhYl0gPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KTtcclxuICBpZiAodGFiPy5pZCkge1xyXG4gICAgY29uc3QgY2FuQWN0aXZhdGUgPSBhd2FpdCBwcm9iZUFjdGl2YXRhYmxlKHRhYi5pZCk7XHJcbiAgICBpZiAoY2FuQWN0aXZhdGUpIHtcclxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScpO1xyXG4gICAgICBpZiAoYnRuKSBidG4uaGlkZGVuID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBY08sTUFBTSxVQUF1QjtBQUFBLElBQ2xDLEVBQUUsUUFBUSxtQkFBMEIsTUFBTSx5QkFBa0MsT0FBTyxjQUFrQixNQUFNLGFBQU0sWUFBWSxpQkFBaUI7QUFBQSxJQUM5SSxFQUFFLFFBQVEsb0JBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlBQVksdUJBQXVCO0FBQUEsSUFDcEosRUFBRSxRQUFRLDBCQUEwQixNQUFNLGlDQUFrQyxPQUFPLGlCQUFrQixNQUFNLGFBQU0sWUFBWSx5QkFBeUI7QUFBQSxJQUN0SixFQUFFLFFBQVEscUJBQTBCLE1BQU0sMkJBQWtDLE9BQU8sZ0JBQWtCLE1BQU0sZ0JBQU0sWUFBWSxtQkFBbUI7QUFBQSxJQUNoSixFQUFFLFFBQVEsMEJBQTBCLE1BQU0sZ0NBQWtDLE9BQU8scUJBQXFCLE1BQU0sYUFBTSxZQUFZLHdCQUF3QjtBQUFBLElBQ3hKLEVBQUUsUUFBUSx1QkFBMEIsTUFBTSw2QkFBa0MsT0FBTyxrQkFBa0IsTUFBTSxhQUFNLFlBQVkscUJBQXFCO0FBQUEsSUFDbEosRUFBRSxRQUFRLGFBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlBQVksa0JBQWtCO0FBQUEsSUFDL0ksRUFBRSxRQUFRLGdCQUEyQixNQUFNLDZCQUFtQyxPQUFPLGtCQUFrQixNQUFNLGFBQU0sWUFBWSxzQkFBc0IsV0FBVyxNQUFNO0FBQUEsSUFDdEssRUFBRSxRQUFRLHFCQUEwQixNQUFNLG1DQUFtQyxPQUFPLDBCQUEwQixNQUFNLFVBQUssV0FBVyxNQUFN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
