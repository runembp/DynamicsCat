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
    if (details.reason === "install") {
      chrome.storage.local.set({
        readonlyShortcut: DEFAULT_READONLY_SHORTCUT,
        lookupsOpenerShortcut: DEFAULT_LOOKUPS_OPENER_SHORTCUT
      });
    } else if (details.reason === "update") {
      chrome.storage.local.get(
        ["readonlyShortcut", "lookupsOpenerShortcut"],
        (result) => {
          const defaults = {};
          if (result.readonlyShortcut === void 0) defaults.readonlyShortcut = DEFAULT_READONLY_SHORTCUT;
          if (result.lookupsOpenerShortcut === void 0) defaults.lookupsOpenerShortcut = DEFAULT_LOOKUPS_OPENER_SHORTCUT;
          if (Object.keys(defaults).length > 0) chrome.storage.local.set(defaults);
        }
      );
    }
  });
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      const actionName = command === "jump-to-latest" ? "jumpToLatest" : command === "jump-to-latest-quick" ? "jumpToLatestQuick" : command === "show-hidden-fields" ? "injectShowHiddenFields" : command === "unlock-all-fields" ? "injectUnlockAllFields" : null;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vc3JjL2JhY2tncm91bmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFNpbmdsZSByZWdpc3RyeSBvZiBEeW5hbWljc0NhdCBhY3Rpb25zIFx1MjAxNCBjb25zdW1lZCBieSBiYWNrZ3JvdW5kLCBwb3B1cCwgYW5kIHJpYmJvbi5cclxuLy8gQWRkaW5nIGEgbmV3IGFjdGlvbiBoZXJlIGF1dG9tYXRpY2FsbHkgd2lyZXMgaXQgaW50byBhbGwgdGhyZWUgc3VyZmFjZXMuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkRlZiB7XHJcbiAgYWN0aW9uOiBzdHJpbmc7XHJcbiAgZmlsZTogc3RyaW5nO1xyXG4gIGFsbEZyYW1lcz86IGJvb2xlYW47IC8vIGRlZmF1bHRzIHRvIHRydWVcclxuICBsYWJlbDogc3RyaW5nO1xyXG4gIGljb24/OiBzdHJpbmc7XHJcbiAgcG9wdXBCdG5JZD86IHN0cmluZztcclxuICAvKiogSWYgc2V0LCB0aGUgYnV0dG9uIGlzIGhpZGRlbiB1bnRpbCBhIHJ1bnRpbWUgcHJvYmUgY29uZmlybXMgaXQgc2hvdWxkIGFwcGVhci4gKi9cclxuICBjb25kaXRpb25hbD86ICdhY3RpdmF0YWJsZSc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05TOiBBY3Rpb25EZWZbXSA9IFtcclxuICB7IGFjdGlvbjogJ2luamVjdEFsbEZpZWxkcycsICAgICAgICBmaWxlOiAnY29udGVudC9hbGwtZmllbGRzLmpzJywgICAgICAgICAgbGFiZWw6ICdBbGwgRmllbGRzJywgICAgIGljb246ICdcdUQ4M0RcdURDQ0InLCBwb3B1cEJ0bklkOiAnYnRuLWFsbC1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RPcHRpb25TZXRzJywgICAgICAgZmlsZTogJ2NvbnRlbnQvb3B0aW9uLXNldHMuanMnLCAgICAgICAgIGxhYmVsOiAnT3B0aW9uIFNldHMnLCAgICBpY29uOiAnXHVEODNEXHVERDE4JywgcG9wdXBCdG5JZDogJ2J0bi1zaG93LW9wdGlvbi1zZXRzJyB9LFxyXG4gIC8vIEtleWJvYXJkLXNob3J0Y3V0IG9ubHkgKG5vIGJ1dHRvbikgXHUyMDE0IHN1cGVyc2VkZWQgYnkgdGhlIFNob3cgSGlkZGVuIEZpZWxkcyBzaG9ydGN1dC5cclxuICB7IGFjdGlvbjogJ2luamVjdFNob3dIaWRkZW5GaWVsZHMnLCBmaWxlOiAnY29udGVudC9zaG93LWhpZGRlbi1maWVsZHMuanMnLCAgbGFiZWw6ICdIaWRkZW4gRmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0RGlydHlGaWVsZHMnLCAgICAgIGZpbGU6ICdjb250ZW50L2RpcnR5LWZpZWxkcy5qcycsICAgICAgICBsYWJlbDogJ0RpcnR5IEZpZWxkcycsICAgaWNvbjogJ1x1MjcwRlx1RkUwRicsIHBvcHVwQnRuSWQ6ICdidG4tZGlydHktZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0T3ZlcnJpZGVSZWFkb25seScsIGZpbGU6ICdjb250ZW50L292ZXJyaWRlLXJlYWRvbmx5LmpzJywgICBsYWJlbDogJ092ZXJyaWRlIFJlYWRvbmx5JywgaWNvbjogJ1x1RDgzRFx1REQxMycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdExvb2t1cHNPcGVuZXInLCAgICBmaWxlOiAnY29udGVudC9sb29rdXBzLW9wZW5lci5qcycsICAgICAgbGFiZWw6ICdMb29rdXBzIE9wZW5lcicsIGljb246ICdcdUQ4M0VcdURFOUYnIH0sXHJcbiAgeyBhY3Rpb246ICdvcGVuT25BcGknLCAgICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvb3Blbi1vbi1hcGkuanMnLCAgICAgICAgIGxhYmVsOiAnT3BlbiBvbiBBUEknLCAgICBpY29uOiAnXHVEODNEXHVERDE3JywgcG9wdXBCdG5JZDogJ2J0bi1vcGVuLW9uLWFwaScgfSxcclxuICB7IGFjdGlvbjogJ2p1bXBUb0xhdGVzdCcsICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvanVtcC10by1sYXRlc3QuanMnLCAgICAgICBsYWJlbDogJ0p1bXAgdG8gTGF0ZXN0JywgaWNvbjogJ1x1RDgzRFx1REQ1MCcsIHBvcHVwQnRuSWQ6ICdidG4tanVtcC10by1sYXRlc3QnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbiAgeyBhY3Rpb246ICdqdW1wVG9MYXRlc3RRdWljaycsICAgICAgZmlsZTogJ2NvbnRlbnQvanVtcC10by1sYXRlc3QtcXVpY2suanMnLCBsYWJlbDogJ0p1bXAgdG8gTGF0ZXN0IChRdWljayknLCBpY29uOiAnXHUyNkExJywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0VW5sb2NrQWxsRmllbGRzJywgIGZpbGU6ICdjb250ZW50L3VubG9jay1hbGwtZmllbGRzLmpzJywgICBsYWJlbDogJ1VubG9jayBBbGwgRmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnYWN0aXZhdGVBY3Rpdml0eScsICAgICAgZmlsZTogJ2NvbnRlbnQvYWN0aXZhdGUtYWN0aXZpdHkuanMnLCAgICBsYWJlbDogJ0FjdGl2YXRlJywgICAgICAgaWNvbjogJ1x1RDgzRFx1REQxMycsIHBvcHVwQnRuSWQ6ICdidG4tYWN0aXZhdGUtYWN0aXZpdHknLCBjb25kaXRpb25hbDogJ2FjdGl2YXRhYmxlJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0U2hvcnRjdXRzSGVscCcsICAgIGZpbGU6ICdjb250ZW50L3Nob3J0Y3V0cy1oZWxwLmpzJywgICAgICBsYWJlbDogJ1Nob3J0Y3V0cycsICAgICAgaWNvbjogJ1x1MjMyOFx1RkUwRicsIHBvcHVwQnRuSWQ6ICdidG4tc2hvcnRjdXRzLWhlbHAnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbl07XHJcblxyXG4vKiogTG9va3VwIG1hcCBmcm9tIGFjdGlvbiBuYW1lIHRvIHNjcmlwdCBjb25maWcsIGZvciB0aGUgYmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlci4gKi9cclxuZXhwb3J0IGNvbnN0IEFDVElPTl9NQVA6IFJlY29yZDxzdHJpbmcsIHsgZmlsZTogc3RyaW5nOyBhbGxGcmFtZXM6IGJvb2xlYW4gfT4gPSBPYmplY3QuZnJvbUVudHJpZXMoXHJcbiAgQUNUSU9OUy5tYXAoYSA9PiBbYS5hY3Rpb24sIHsgZmlsZTogYS5maWxlLCBhbGxGcmFtZXM6IGEuYWxsRnJhbWVzID8/IHRydWUgfV0pLFxyXG4pO1xyXG4iLCAiLy8gU2luZ2xlIHNvdXJjZSBvZiB0cnV0aDogYWN0aW9uIG5hbWUgXHUyMTkyIGNvbnRlbnQgc2NyaXB0IGNvbmZpZy5cclxuLy8gVXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gcG9wdXAgYW5kIHRoZSBDUk0gcmliYm9uIHRvb2xiYXIuXHJcblxyXG5pbXBvcnQgeyBBQ1RJT05fTUFQIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmNvbnN0IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQgPSAnYWx0JztcclxuY29uc3QgREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVCA9ICdjdHJsJztcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihcclxuICAobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIHNlbmRlciwgc2VuZFJlc3BvbnNlKTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB7XHJcbiAgICBpZiAobWVzc2FnZS5hY3Rpb24gPT09ICdvcGVuQmFja2dyb3VuZFRhYicpIHtcclxuICAgICAgY29uc3QgdXJsID0gbWVzc2FnZS51cmwgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgICBpZiAodXJsKSB7XHJcbiAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsLCBhY3RpdmU6IGZhbHNlIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGFiSWQgPSAobWVzc2FnZS50YWJJZCBhcyBudW1iZXIgfCB1bmRlZmluZWQpID8/IHNlbmRlci50YWI/LmlkO1xyXG4gICAgaWYgKHRhYklkID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAncHJvYmVBY3RpdmF0YWJsZScpIHtcclxuICAgICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogdHJ1ZSB9LFxyXG4gICAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgICAgZnVuYzogKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBYcm0gPT09ICd1bmRlZmluZWQnIHx8ICFYcm0uUGFnZSB8fCAhWHJtLlBhZ2UuZGF0YSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBjb25zdCBhdHRyID0gWHJtLlBhZ2UuZ2V0QXR0cmlidXRlKCdzdGF0ZWNvZGUnKTtcclxuICAgICAgICAgICAgaWYgKCFhdHRyKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiBhdHRyLmdldFZhbHVlKCkgIT09IDA7XHJcbiAgICAgICAgICB9IGNhdGNoIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSkudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgICBjb25zdCBhY3RpdmF0YWJsZSA9IHJlc3VsdHMuc29tZShyID0+IHIucmVzdWx0ID09PSB0cnVlKTtcclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBhY3RpdmF0YWJsZSB9KTtcclxuICAgICAgfSkuY2F0Y2goKCkgPT4gc2VuZFJlc3BvbnNlKHsgYWN0aXZhdGFibGU6IGZhbHNlIH0pKTtcclxuICAgICAgcmV0dXJuIHRydWU7IC8vIGtlZXAgbWVzc2FnZSBjaGFubmVsIG9wZW4gZm9yIGFzeW5jIHNlbmRSZXNwb25zZVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtZXNzYWdlLmFjdGlvbiA9PT0gJ2luamVjdE92ZXJyaWRlUmVhZG9ubHknKSB7XHJcbiAgICAgIGNvbnN0IGNvbmZpZyA9IEFDVElPTl9NQVAuaW5qZWN0T3ZlcnJpZGVSZWFkb25seTtcclxuICAgICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3JlYWRvbmx5U2hvcnRjdXQnKTtcclxuICAgICAgICAgIGNvbnN0IHNob3J0Y3V0VmFsdWUgPSB0eXBlb2YgcmVzdWx0LnJlYWRvbmx5U2hvcnRjdXQgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgID8gcmVzdWx0LnJlYWRvbmx5U2hvcnRjdXRcclxuICAgICAgICAgICAgOiBERUZBVUxUX1JFQURPTkxZX1NIT1JUQ1VUO1xyXG4gICAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkLCBhbGxGcmFtZXM6IGNvbmZpZy5hbGxGcmFtZXMgfSxcclxuICAgICAgICAgICAgd29ybGQ6ICdNQUlOJyxcclxuICAgICAgICAgICAgZnVuYzogKHNob3J0Y3V0OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5keW5hbWljc0NhdFJlYWRvbmx5U2hvcnRjdXQgPSBzaG9ydGN1dDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYXJnczogW3Nob3J0Y3V0VmFsdWVdLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogY29uZmlnLmFsbEZyYW1lcyB9LFxyXG4gICAgICAgICAgICBmaWxlczogW2NvbmZpZy5maWxlXSxcclxuICAgICAgICAgICAgd29ybGQ6ICdNQUlOJyxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSB9KTtcclxuICAgICAgfSkoKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSAnaW5qZWN0TG9va3Vwc09wZW5lcicpIHtcclxuICAgICAgY29uc3QgY29uZmlnID0gQUNUSU9OX01BUC5pbmplY3RMb29rdXBzT3BlbmVyO1xyXG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnbG9va3Vwc09wZW5lclNob3J0Y3V0Jyk7XHJcbiAgICAgICAgICBjb25zdCBzaG9ydGN1dFZhbHVlID0gdHlwZW9mIHJlc3VsdC5sb29rdXBzT3BlbmVyU2hvcnRjdXQgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgID8gcmVzdWx0Lmxvb2t1cHNPcGVuZXJTaG9ydGN1dFxyXG4gICAgICAgICAgICA6IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQ7XHJcbiAgICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogY29uZmlnLmFsbEZyYW1lcyB9LFxyXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxyXG4gICAgICAgICAgICBmdW5jOiAoc2hvcnRjdXQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmR5bmFtaWNzQ2F0TG9va3Vwc09wZW5lclNob3J0Y3V0ID0gc2hvcnRjdXQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFyZ3M6IFtzaG9ydGN1dFZhbHVlXSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkLCBhbGxGcmFtZXM6IGNvbmZpZy5hbGxGcmFtZXMgfSxcclxuICAgICAgICAgICAgZmlsZXM6IFtjb25maWcuZmlsZV0sXHJcbiAgICAgICAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiBmYWxzZSB9KTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHRydWUgfSk7XHJcbiAgICAgIH0pKCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbmZpZyA9IEFDVElPTl9NQVBbbWVzc2FnZS5hY3Rpb24gYXMgc3RyaW5nXTtcclxuICAgIGlmICghY29uZmlnKSByZXR1cm4gdW5kZWZpbmVkO1xyXG5cclxuICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiBjb25maWcuYWxsRnJhbWVzIH0sXHJcbiAgICAgIGZpbGVzOiBbY29uZmlnLmZpbGVdLFxyXG4gICAgICB3b3JsZDogJ01BSU4nLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH0sXHJcbik7XHJcblxyXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoZGV0YWlscykgPT4ge1xyXG4gIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gJ2luc3RhbGwnKSB7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xyXG4gICAgICByZWFkb25seVNob3J0Y3V0OiBERUZBVUxUX1JFQURPTkxZX1NIT1JUQ1VULFxyXG4gICAgICBsb29rdXBzT3BlbmVyU2hvcnRjdXQ6IERFRkFVTFRfTE9PS1VQU19PUEVORVJfU0hPUlRDVVQsXHJcbiAgICB9KTtcclxuICB9IGVsc2UgaWYgKGRldGFpbHMucmVhc29uID09PSAndXBkYXRlJykge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFxyXG4gICAgICBbJ3JlYWRvbmx5U2hvcnRjdXQnLCAnbG9va3Vwc09wZW5lclNob3J0Y3V0J10sXHJcbiAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICBjb25zdCBkZWZhdWx0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcclxuICAgICAgICBpZiAocmVzdWx0LnJlYWRvbmx5U2hvcnRjdXQgPT09IHVuZGVmaW5lZCkgZGVmYXVsdHMucmVhZG9ubHlTaG9ydGN1dCA9IERFRkFVTFRfUkVBRE9OTFlfU0hPUlRDVVQ7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5sb29rdXBzT3BlbmVyU2hvcnRjdXQgPT09IHVuZGVmaW5lZCkgZGVmYXVsdHMubG9va3Vwc09wZW5lclNob3J0Y3V0ID0gREVGQVVMVF9MT09LVVBTX09QRU5FUl9TSE9SVENVVDtcclxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoZGVmYXVsdHMpLmxlbmd0aCA+IDApIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChkZWZhdWx0cyk7XHJcbiAgICAgIH0sXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcblxyXG5jaHJvbWUuY29tbWFuZHMub25Db21tYW5kLmFkZExpc3RlbmVyKChjb21tYW5kKSA9PiB7XHJcbiAgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSwgKFt0YWJdKSA9PiB7XHJcbiAgICBpZiAoIXRhYj8uaWQpIHJldHVybjtcclxuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSBjb21tYW5kID09PSAnanVtcC10by1sYXRlc3QnID8gJ2p1bXBUb0xhdGVzdCdcclxuICAgICAgOiBjb21tYW5kID09PSAnanVtcC10by1sYXRlc3QtcXVpY2snID8gJ2p1bXBUb0xhdGVzdFF1aWNrJ1xyXG4gICAgICA6IGNvbW1hbmQgPT09ICdzaG93LWhpZGRlbi1maWVsZHMnID8gJ2luamVjdFNob3dIaWRkZW5GaWVsZHMnXHJcbiAgICAgIDogY29tbWFuZCA9PT0gJ3VubG9jay1hbGwtZmllbGRzJyA/ICdpbmplY3RVbmxvY2tBbGxGaWVsZHMnXHJcbiAgICAgIDogbnVsbDtcclxuICAgIGlmICghYWN0aW9uTmFtZSkgcmV0dXJuO1xyXG4gICAgY29uc3QgY29uZmlnID0gQUNUSU9OX01BUFthY3Rpb25OYW1lXTtcclxuICAgIGlmICghY29uZmlnKSByZXR1cm47XHJcbiAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICB0YXJnZXQ6IHsgdGFiSWQ6IHRhYi5pZCwgYWxsRnJhbWVzOiBjb25maWcuYWxsRnJhbWVzIH0sXHJcbiAgICAgIGZpbGVzOiBbY29uZmlnLmZpbGVdLFxyXG4gICAgICB3b3JsZDogJ01BSU4nLFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFjTyxNQUFNLFVBQXVCO0FBQUEsSUFDbEMsRUFBRSxRQUFRLG1CQUEwQixNQUFNLHlCQUFrQyxPQUFPLGNBQWtCLE1BQU0sYUFBTSxZQUFZLGlCQUFpQjtBQUFBLElBQzlJLEVBQUUsUUFBUSxvQkFBMEIsTUFBTSwwQkFBa0MsT0FBTyxlQUFrQixNQUFNLGFBQU0sWUFBWSx1QkFBdUI7QUFBQTtBQUFBLElBRXBKLEVBQUUsUUFBUSwwQkFBMEIsTUFBTSxpQ0FBa0MsT0FBTyxnQkFBZ0I7QUFBQSxJQUNuRyxFQUFFLFFBQVEscUJBQTBCLE1BQU0sMkJBQWtDLE9BQU8sZ0JBQWtCLE1BQU0sZ0JBQU0sWUFBWSxtQkFBbUI7QUFBQSxJQUNoSixFQUFFLFFBQVEsMEJB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QkFBYSxFQUFFLElBQUksS0FBSyxDQUFDO0FBQUEsUUFDM0IsR0FBRztBQUNILGVBQU87QUFBQSxNQUNUO0FBRUEsWUFBTSxTQUFTLFdBQVcsUUFBUSxNQUFnQjtBQUNsRCxVQUFJLENBQUMsT0FBUSxRQUFPO0FBRXBCLGFBQU8sVUFBVSxjQUFjO0FBQUEsUUFDN0IsUUFBUSxFQUFFLE9BQU8sV0FBVyxPQUFPLFVBQVU7QUFBQSxRQUM3QyxPQUFPLENBQUMsT0FBTyxJQUFJO0FBQUEsUUFDbkIsT0FBTztBQUFBLE1BQ1QsQ0FBQztBQUNELGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUVBLFNBQU8sUUFBUSxZQUFZLFlBQVksQ0FBQyxZQUFZO0FBQ2xELFFBQUksUUFBUSxXQUFXLFdBQVc7QUFDaEMsYUFBTyxRQUFRLE1BQU0sSUFBSTtBQUFBLFFBQ3ZCLGtCQUFrQjtBQUFBLFFBQ2xCLHVCQUF1QjtBQUFBLE1BQ3pCLENBQUM7QUFBQSxJQUNILFdBQVcsUUFBUSxXQUFXLFVBQVU7QUFDdEMsYUFBTyxRQUFRLE1BQU07QUFBQSxRQUNuQixDQUFDLG9CQUFvQix1QkFBdUI7QUFBQSxRQUM1QyxDQUFDLFdBQVc7QUFDVixnQkFBTSxXQUFvQyxDQUFDO0FBQzNDLGNBQUksT0FBTyxxQkFBcUIsT0FBVyxVQUFTLG1CQUFtQjtBQUN2RSxjQUFJLE9BQU8sMEJBQTBCLE9BQVcsVUFBUyx3QkFBd0I7QUFDakYsY0FBSSxPQUFPLEtBQUssUUFBUSxFQUFFLFNBQVMsRUFBRyxRQUFPLFFBQVEsTUFBTSxJQUFJLFFBQVE7QUFBQSxRQUN6RTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxTQUFTLFVBQVUsWUFBWSxDQUFDLFlBQVk7QUFDakQsV0FBTyxLQUFLLE1BQU0sRUFBRSxRQUFRLE1BQU0sZUFBZSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTTtBQUNsRSxVQUFJLENBQUMsS0FBSyxHQUFJO0FBQ2QsWUFBTSxhQUFhLFlBQVksbUJBQW1CLGlCQUM5QyxZQUFZLHlCQUF5QixzQkFDckMsWUFBWSx1QkFBdUIsMkJBQ25DLFlBQVksc0JBQXNCLDBCQUNsQztBQUNKLFVBQUksQ0FBQyxXQUFZO0FBQ2pCLFlBQU0sU0FBUyxXQUFXLFVBQVU7QUFDcEMsVUFBSSxDQUFDLE9BQVE7QUFDYixhQUFPLFVBQVUsY0FBYztBQUFBLFFBQzdCLFFBQVEsRUFBRSxPQUFPLElBQUksSUFBSSxXQUFXLE9BQU8sVUFBVTtBQUFBLFFBQ3JELE9BQU8sQ0FBQyxPQUFPLElBQUk7QUFBQSxRQUNuQixPQUFPO0FBQUEsTUFDVCxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBQUEsRUFDSCxDQUFDOyIsCiAgIm5hbWVzIjogWyJjb25maWciXQp9Cg==
