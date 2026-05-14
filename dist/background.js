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

  // src/background.ts
  var DEFAULT_READONLY_SHORTCUT = "alt";
  var DEFAULT_LOOKUPS_OPENER_SHORTCUT = "ctrl";
  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (message.action === "openBackgroundTab") {
        const url = message.url;
        if (url) {
          chrome.tabs.create({ url, active: false });
        }
        return void 0;
      }
      const tabId = message.tabId ?? sender.tab?.id;
      if (tabId === void 0) return void 0;
      if (message.action === "probeActivatable") {
        chrome.scripting.executeScript({
          target: { tabId, allFrames: true },
          world: "MAIN",
          func: () => {
            try {
              if (typeof Xrm === "undefined" || !Xrm.Page || !Xrm.Page.data) return false;
              const attr = Xrm.Page.getAttribute("statecode");
              if (!attr) return false;
              return attr.getValue() !== 0;
            } catch {
              return false;
            }
          }
        }).then((results) => {
          const activatable = results.some((r) => r.result === true);
          sendResponse({ activatable });
        }).catch(() => sendResponse({ activatable: false }));
        return true;
      }
      if (message.action === "injectOverrideReadonly") {
        const config2 = ACTION_MAP.injectOverrideReadonly;
        void (async () => {
          try {
            const result = await chrome.storage.local.get("readonlyShortcut");
            const shortcutValue = typeof result.readonlyShortcut === "string" ? result.readonlyShortcut : DEFAULT_READONLY_SHORTCUT;
            await chrome.scripting.executeScript({
              target: { tabId, allFrames: config2.allFrames },
              world: "MAIN",
              func: (shortcut) => {
                document.documentElement.dataset.dynamicsCatReadonlyShortcut = shortcut;
              },
              args: [shortcutValue]
            });
            await chrome.scripting.executeScript({
              target: { tabId, allFrames: config2.allFrames },
              files: [config2.file],
              world: "MAIN"
            });
          } catch {
            sendResponse({ ok: false });
            return;
          }
          sendResponse({ ok: true });
        })();
        return true;
      }
      if (message.action === "injectLookupsOpener") {
        const config2 = ACTION_MAP.injectLookupsOpener;
        void (async () => {
          try {
            const result = await chrome.storage.local.get("lookupsOpenerShortcut");
            const shortcutValue = typeof result.lookupsOpenerShortcut === "string" ? result.lookupsOpenerShortcut : DEFAULT_LOOKUPS_OPENER_SHORTCUT;
            await chrome.scripting.executeScript({
              target: { tabId, allFrames: config2.allFrames },
              world: "MAIN",
              func: (shortcut) => {
                document.documentElement.dataset.dynamicsCatLookupsOpenerShortcut = shortcut;
              },
              args: [shortcutValue]
            });
            await chrome.scripting.executeScript({
              target: { tabId, allFrames: config2.allFrames },
              files: [config2.file],
              world: "MAIN"
            });
          } catch {
            sendResponse({ ok: false });
            return;
          }
          sendResponse({ ok: true });
        })();
        return true;
      }
      const config = ACTION_MAP[message.action];
      if (!config) return void 0;
      chrome.scripting.executeScript({
        target: { tabId, allFrames: config.allFrames },
        files: [config.file],
        world: "MAIN"
      });
      return void 0;
    }
  );
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== "install") return;
    chrome.storage.local.set({
      readonlyOverride: true,
      readonlyShortcut: DEFAULT_READONLY_SHORTCUT,
      lookupsOpenerOverride: true,
      lookupsOpenerShortcut: DEFAULT_LOOKUPS_OPENER_SHORTCUT
    });
  });
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      const actionName = command === "jump-to-latest" ? "jumpToLatest" : command === "jump-to-latest-quick" ? "jumpToLatestQuick" : null;
      if (!actionName) return;
      const config = ACTION_MAP[actionName];
      if (!config) return;
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: config.allFrames },
        files: [config.file],
        world: "MAIN"
      });
    });
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vc3JjL2JhY2tncm91bmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFNpbmdsZSByZWdpc3RyeSBvZiBEeW5hbWljc0NhdCBhY3Rpb25zIFx1MjAxNCBjb25zdW1lZCBieSBiYWNrZ3JvdW5kLCBwb3B1cCwgYW5kIHJpYmJvbi5cclxuLy8gQWRkaW5nIGEgbmV3IGFjdGlvbiBoZXJlIGF1dG9tYXRpY2FsbHkgd2lyZXMgaXQgaW50byBhbGwgdGhyZWUgc3VyZmFjZXMuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkRlZiB7XHJcbiAgYWN0aW9uOiBzdHJpbmc7XHJcbiAgZmlsZTogc3RyaW5nO1xyXG4gIGFsbEZyYW1lcz86IGJvb2xlYW47IC8vIGRlZmF1bHRzIHRvIHRydWVcclxuICBsYWJlbDogc3RyaW5nO1xyXG4gIGljb246IHN0cmluZztcclxuICBwb3B1cEJ0bklkPzogc3RyaW5nO1xyXG4gIC8qKiBJZiBzZXQsIHRoZSBidXR0b24gaXMgaGlkZGVuIHVudGlsIGEgcnVudGltZSBwcm9iZSBjb25maXJtcyBpdCBzaG91bGQgYXBwZWFyLiAqL1xyXG4gIGNvbmRpdGlvbmFsPzogJ2FjdGl2YXRhYmxlJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEFDVElPTlM6IEFjdGlvbkRlZltdID0gW1xyXG4gIHsgYWN0aW9uOiAnaW5qZWN0QWxsRmllbGRzJywgICAgICAgIGZpbGU6ICdjb250ZW50L2FsbC1maWVsZHMuanMnLCAgICAgICAgICBsYWJlbDogJ0FsbCBGaWVsZHMnLCAgICAgaWNvbjogJ1x1RDgzRFx1RENDQicsIHBvcHVwQnRuSWQ6ICdidG4tYWxsLWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdE9wdGlvblNldHMnLCAgICAgICBmaWxlOiAnY29udGVudC9vcHRpb24tc2V0cy5qcycsICAgICAgICAgbGFiZWw6ICdPcHRpb24gU2V0cycsICAgIGljb246ICdcdUQ4M0RcdUREMTgnLCBwb3B1cEJ0bklkOiAnYnRuLXNob3ctb3B0aW9uLXNldHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RTaG93SGlkZGVuRmllbGRzJywgZmlsZTogJ2NvbnRlbnQvc2hvdy1oaWRkZW4tZmllbGRzLmpzJywgIGxhYmVsOiAnSGlkZGVuIEZpZWxkcycsICBpY29uOiAnXHVEODNEXHVEQzQxJywgcG9wdXBCdG5JZDogJ2J0bi1zaG93LWhpZGRlbi1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3REaXJ0eUZpZWxkcycsICAgICAgZmlsZTogJ2NvbnRlbnQvZGlydHktZmllbGRzLmpzJywgICAgICAgIGxhYmVsOiAnRGlydHkgRmllbGRzJywgICBpY29uOiAnXHUyNzBGXHVGRTBGJywgcG9wdXBCdG5JZDogJ2J0bi1kaXJ0eS1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RPdmVycmlkZVJlYWRvbmx5JywgZmlsZTogJ2NvbnRlbnQvb3ZlcnJpZGUtcmVhZG9ubHkuanMnLCAgIGxhYmVsOiAnT3ZlcnJpZGUgUmVhZG9ubHknLCBpY29uOiAnXHVEODNEXHVERDEzJywgcG9wdXBCdG5JZDogJ2J0bi1vdmVycmlkZS1yZWFkb25seScgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdExvb2t1cHNPcGVuZXInLCAgICBmaWxlOiAnY29udGVudC9sb29rdXBzLW9wZW5lci5qcycsICAgICAgbGFiZWw6ICdMb29rdXBzIE9wZW5lcicsIGljb246ICdcdUQ4M0VcdURFOUYnLCBwb3B1cEJ0bklkOiAnYnRuLWxvb2t1cHMtb3BlbmVyJyB9LFxyXG4gIHsgYWN0aW9uOiAnb3Blbk9uQXBpJywgICAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L29wZW4tb24tYXBpLmpzJywgICAgICAgICBsYWJlbDogJ09wZW4gb24gQVBJJywgICAgaWNvbjogJ1x1RDgzRFx1REQxNycsIHBvcHVwQnRuSWQ6ICdidG4tb3Blbi1vbi1hcGknIH0sXHJcbiAgeyBhY3Rpb246ICdqdW1wVG9MYXRlc3QnLCAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L2p1bXAtdG8tbGF0ZXN0LmpzJywgICAgICAgbGFiZWw6ICdKdW1wIHRvIExhdGVzdCcsIGljb246ICdcdUQ4M0RcdURENTAnLCBwb3B1cEJ0bklkOiAnYnRuLWp1bXAtdG8tbGF0ZXN0JywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG4gIHsgYWN0aW9uOiAnanVtcFRvTGF0ZXN0UXVpY2snLCAgICAgIGZpbGU6ICdjb250ZW50L2p1bXAtdG8tbGF0ZXN0LXF1aWNrLmpzJywgbGFiZWw6ICdKdW1wIHRvIExhdGVzdCAoUXVpY2spJywgaWNvbjogJ1x1MjZBMScsIGFsbEZyYW1lczogZmFsc2UgfSxcclxuICB7IGFjdGlvbjogJ2FjdGl2YXRlQWN0aXZpdHknLCAgICAgIGZpbGU6ICdjb250ZW50L2FjdGl2YXRlLWFjdGl2aXR5LmpzJywgICAgbGFiZWw6ICdBY3RpdmF0ZScsICAgICAgIGljb246ICdcdUQ4M0RcdUREMTMnLCBwb3B1cEJ0bklkOiAnYnRuLWFjdGl2YXRlLWFjdGl2aXR5JywgY29uZGl0aW9uYWw6ICdhY3RpdmF0YWJsZScgfSxcclxuXTtcclxuXHJcbi8qKiBMb29rdXAgbWFwIGZyb20gYWN0aW9uIG5hbWUgdG8gc2NyaXB0IGNvbmZpZywgZm9yIHRoZSBiYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyLiAqL1xyXG5leHBvcnQgY29uc3QgQUNUSU9OX01BUDogUmVjb3JkPHN0cmluZywgeyBmaWxlOiBzdHJpbmc7IGFsbEZyYW1lczogYm9vbGVhbiB9PiA9IE9iamVjdC5mcm9tRW50cmllcyhcclxuICBBQ1RJT05TLm1hcChhID0+IFthLmFjdGlvbiwgeyBmaWxlOiBhLmZpbGUsIGFsbEZyYW1lczogYS5hbGxGcmFtZXMgPz8gdHJ1ZSB9XSksXHJcbik7XHJcbiIsICIvLyBTaW5nbGUgc291cmNlIG9mIHRydXRoOiBhY3Rpb24gbmFtZSBcdTIxOTIgY29udGVudCBzY3JpcHQgY29uZmlnLlxyXG4vLyBVc2VkIGJ5IGJvdGggdGhlIGV4dGVuc2lvbiBwb3B1cCBhbmQgdGhlIENSTSByaWJib24gdG9vbGJhci5cclxuXHJcbmltcG9ydCB7IEFDVElPTl9NQVAgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuY29uc3QgREVGQVVMVF9SRUFET05MWV9TSE9SVENVVCA9ICdhbHQnO1xyXG5jb25zdCBERUZBVUxUX0xPT0tVUFNfT1BFTkVSX1NIT1JUQ1VUID0gJ2N0cmwnO1xyXG5cclxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxyXG4gIChtZXNzYWdlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpOiBib29sZWFuIHwgdW5kZWZpbmVkID0+IHtcclxuICAgIGlmIChtZXNzYWdlLmFjdGlvbiA9PT0gJ29wZW5CYWNrZ3JvdW5kVGFiJykge1xyXG4gICAgICBjb25zdCB1cmwgPSBtZXNzYWdlLnVybCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmICh1cmwpIHtcclxuICAgICAgICBjaHJvbWUudGFicy5jcmVhdGUoeyB1cmwsIGFjdGl2ZTogZmFsc2UgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0YWJJZCA9IChtZXNzYWdlLnRhYklkIGFzIG51bWJlciB8IHVuZGVmaW5lZCkgPz8gc2VuZGVyLnRhYj8uaWQ7XHJcbiAgICBpZiAodGFiSWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5hY3Rpb24gPT09ICdwcm9iZUFjdGl2YXRhYmxlJykge1xyXG4gICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiB0cnVlIH0sXHJcbiAgICAgICAgd29ybGQ6ICdNQUlOJyxcclxuICAgICAgICBmdW5jOiAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlIHx8ICFYcm0uUGFnZS5kYXRhKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBYcm0uUGFnZS5nZXRBdHRyaWJ1dGUoJ3N0YXRlY29kZScpO1xyXG4gICAgICAgICAgICBpZiAoIWF0dHIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIGF0dHIuZ2V0VmFsdWUoKSAhPT0gMDtcclxuICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9LFxyXG4gICAgICB9KS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2YXRhYmxlID0gcmVzdWx0cy5zb21lKHIgPT4gci5yZXN1bHQgPT09IHRydWUpO1xyXG4gICAgICAgIHNlbmRSZXNwb25zZSh7IGFjdGl2YXRhYmxlIH0pO1xyXG4gICAgICB9KS5jYXRjaCgoKSA9PiBzZW5kUmVzcG9uc2UoeyBhY3RpdmF0YWJsZTogZmFsc2UgfSkpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBtZXNzYWdlIGNoYW5uZWwgb3BlbiBmb3IgYXN5bmMgc2VuZFJlc3BvbnNlXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScpIHtcclxuICAgICAgY29uc3QgY29uZmlnID0gQUNUSU9OX01BUC5pbmplY3RPdmVycmlkZVJlYWRvbmx5O1xyXG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncmVhZG9ubHlTaG9ydGN1dCcpO1xyXG4gICAgICAgICAgY29uc3Qgc2hvcnRjdXRWYWx1ZSA9IHR5cGVvZiByZXN1bHQucmVhZG9ubHlTaG9ydGN1dCA9PT0gJ3N0cmluZydcclxuICAgICAgICAgICAgPyByZXN1bHQucmVhZG9ubHlTaG9ydGN1dFxyXG4gICAgICAgICAgICA6IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQ7XHJcbiAgICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogY29uZmlnLmFsbEZyYW1lcyB9LFxyXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxyXG4gICAgICAgICAgICBmdW5jOiAoc2hvcnRjdXQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmR5bmFtaWNzQ2F0UmVhZG9ubHlTaG9ydGN1dCA9IHNob3J0Y3V0O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhcmdzOiBbc2hvcnRjdXRWYWx1ZV0sXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiBjb25maWcuYWxsRnJhbWVzIH0sXHJcbiAgICAgICAgICAgIGZpbGVzOiBbY29uZmlnLmZpbGVdLFxyXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UgfSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiB0cnVlIH0pO1xyXG4gICAgICB9KSgpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobWVzc2FnZS5hY3Rpb24gPT09ICdpbmplY3RMb29rdXBzT3BlbmVyJykge1xyXG4gICAgICBjb25zdCBjb25maWcgPSBBQ1RJT05fTUFQLmluamVjdExvb2t1cHNPcGVuZXI7XHJcbiAgICAgIHZvaWQgKGFzeW5jICgpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdsb29rdXBzT3BlbmVyU2hvcnRjdXQnKTtcclxuICAgICAgICAgIGNvbnN0IHNob3J0Y3V0VmFsdWUgPSB0eXBlb2YgcmVzdWx0Lmxvb2t1cHNPcGVuZXJTaG9ydGN1dCA9PT0gJ3N0cmluZydcclxuICAgICAgICAgICAgPyByZXN1bHQubG9va3Vwc09wZW5lclNob3J0Y3V0XHJcbiAgICAgICAgICAgIDogREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVDtcclxuICAgICAgICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiBjb25maWcuYWxsRnJhbWVzIH0sXHJcbiAgICAgICAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgICAgICAgIGZ1bmM6IChzaG9ydGN1dDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZHluYW1pY3NDYXRMb29rdXBzT3BlbmVyU2hvcnRjdXQgPSBzaG9ydGN1dDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYXJnczogW3Nob3J0Y3V0VmFsdWVdLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogY29uZmlnLmFsbEZyYW1lcyB9LFxyXG4gICAgICAgICAgICBmaWxlczogW2NvbmZpZy5maWxlXSxcclxuICAgICAgICAgICAgd29ybGQ6ICdNQUlOJyxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSB9KTtcclxuICAgICAgfSkoKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29uZmlnID0gQUNUSU9OX01BUFttZXNzYWdlLmFjdGlvbiBhcyBzdHJpbmddO1xyXG4gICAgaWYgKCFjb25maWcpIHJldHVybiB1bmRlZmluZWQ7XHJcblxyXG4gICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgdGFyZ2V0OiB7IHRhYklkLCBhbGxGcmFtZXM6IGNvbmZpZy5hbGxGcmFtZXMgfSxcclxuICAgICAgZmlsZXM6IFtjb25maWcuZmlsZV0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICB9KTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfSxcclxuKTtcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKChkZXRhaWxzKSA9PiB7XHJcbiAgaWYgKGRldGFpbHMucmVhc29uICE9PSAnaW5zdGFsbCcpIHJldHVybjtcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xyXG4gICAgcmVhZG9ubHlPdmVycmlkZTogdHJ1ZSxcclxuICAgIHJlYWRvbmx5U2hvcnRjdXQ6IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQsXHJcbiAgICBsb29rdXBzT3BlbmVyT3ZlcnJpZGU6IHRydWUsXHJcbiAgICBsb29rdXBzT3BlbmVyU2hvcnRjdXQ6IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQsXHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuY2hyb21lLmNvbW1hbmRzLm9uQ29tbWFuZC5hZGRMaXN0ZW5lcigoY29tbWFuZCkgPT4ge1xyXG4gIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0sIChbdGFiXSkgPT4ge1xyXG4gICAgaWYgKCF0YWI/LmlkKSByZXR1cm47XHJcbiAgICBjb25zdCBhY3Rpb25OYW1lID0gY29tbWFuZCA9PT0gJ2p1bXAtdG8tbGF0ZXN0JyA/ICdqdW1wVG9MYXRlc3QnXHJcbiAgICAgIDogY29tbWFuZCA9PT0gJ2p1bXAtdG8tbGF0ZXN0LXF1aWNrJyA/ICdqdW1wVG9MYXRlc3RRdWljaydcclxuICAgICAgOiBudWxsO1xyXG4gICAgaWYgKCFhY3Rpb25OYW1lKSByZXR1cm47XHJcbiAgICBjb25zdCBjb25maWcgPSBBQ1RJT05fTUFQW2FjdGlvbk5hbWVdO1xyXG4gICAgaWYgKCFjb25maWcpIHJldHVybjtcclxuICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgIHRhcmdldDogeyB0YWJJZDogdGFiLmlkLCBhbGxGcmFtZXM6IGNvbmZpZy5hbGxGcmFtZXMgfSxcclxuICAgICAgZmlsZXM6IFtjb25maWcuZmlsZV0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQWNPLE1BQU0sVUFBdUI7QUFBQSxJQUNsQyxFQUFFLFFBQVEsbUJBQTBCLE1BQU0seUJBQWtDLE9BQU8sY0FBa0IsTUFBTSxhQUFNLFlBQVksaUJBQWlCO0FBQUEsSUFDOUksRUFBRSxRQUFRLG9CQUEwQixNQUFNLDBCQUFrQyxPQUFPLGVBQWtCLE1BQU0sYUFBTSxZQUFZLHVCQUF1QjtBQUFBLElBQ3BKLEVBQUUsUUFBUSwwQkFBMEIsTUFBTSxpQ0FBa0MsT0FBTyxpQkFBa0IsTUFBTSxhQUFNLFlBQVkseUJBQXlCO0FBQUEsSUFDdEosRUFBRSxRQUFRLHFCQUEwQixNQUFNLDJCQUFrQyxPQUFPLGdCQUFrQixNQUFNLGdCQUFNLFlBQVksbUJBQW1CO0FBQUEs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
