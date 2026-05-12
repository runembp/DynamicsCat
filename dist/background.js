"use strict";
(() => {
  // src/actions.ts
  var ACTIONS = [
    { action: "injectAllFields", file: "content/all-fields.js", label: "All Fields", icon: "\u{1F4CB}", popupBtnId: "btn-all-fields" },
    { action: "injectOptionSets", file: "content/option-sets.js", label: "Option Sets", icon: "\u{1F518}", popupBtnId: "btn-show-option-sets" },
    { action: "injectShowHiddenFields", file: "content/show-hidden-fields.js", label: "Hidden Fields", icon: "\u{1F441}", popupBtnId: "btn-show-hidden-fields" },
    { action: "injectDirtyFields", file: "content/dirty-fields.js", label: "Dirty Fields", icon: "\u270F\uFE0F", popupBtnId: "btn-dirty-fields" },
    { action: "openOnApi", file: "content/open-on-api.js", label: "Open on API", icon: "\u{1F517}", popupBtnId: "btn-open-on-api" },
    { action: "jumpToLatest", file: "content/jump-to-latest.js", label: "Jump to Latest", icon: "\u{1F550}", popupBtnId: "btn-jump-to-latest", allFrames: false },
    { action: "activateActivity", file: "content/activate-activity.js", label: "Activate", icon: "\u{1F513}", popupBtnId: "btn-activate-activity", conditional: "activatable" }
  ];
  var ACTION_MAP = Object.fromEntries(
    ACTIONS.map((a) => [a.action, { file: a.file, allFrames: a.allFrames ?? true }])
  );

  // src/background.ts
  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
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
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vc3JjL2JhY2tncm91bmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFNpbmdsZSByZWdpc3RyeSBvZiBEeW5hbWljc0NhdCBhY3Rpb25zIFx1MjAxNCBjb25zdW1lZCBieSBiYWNrZ3JvdW5kLCBwb3B1cCwgYW5kIHJpYmJvbi5cclxuLy8gQWRkaW5nIGEgbmV3IGFjdGlvbiBoZXJlIGF1dG9tYXRpY2FsbHkgd2lyZXMgaXQgaW50byBhbGwgdGhyZWUgc3VyZmFjZXMuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkRlZiB7XHJcbiAgYWN0aW9uOiBzdHJpbmc7XHJcbiAgZmlsZTogc3RyaW5nO1xyXG4gIGFsbEZyYW1lcz86IGJvb2xlYW47IC8vIGRlZmF1bHRzIHRvIHRydWVcclxuICBsYWJlbDogc3RyaW5nO1xyXG4gIGljb246IHN0cmluZztcclxuICBwb3B1cEJ0bklkPzogc3RyaW5nO1xyXG4gIC8qKiBJZiBzZXQsIHRoZSBidXR0b24gaXMgaGlkZGVuIHVudGlsIGEgcnVudGltZSBwcm9iZSBjb25maXJtcyBpdCBzaG91bGQgYXBwZWFyLiAqL1xyXG4gIGNvbmRpdGlvbmFsPzogJ2FjdGl2YXRhYmxlJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEFDVElPTlM6IEFjdGlvbkRlZltdID0gW1xyXG4gIHsgYWN0aW9uOiAnaW5qZWN0QWxsRmllbGRzJywgICAgICAgIGZpbGU6ICdjb250ZW50L2FsbC1maWVsZHMuanMnLCAgICAgICAgICBsYWJlbDogJ0FsbCBGaWVsZHMnLCAgICAgaWNvbjogJ1x1RDgzRFx1RENDQicsIHBvcHVwQnRuSWQ6ICdidG4tYWxsLWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdE9wdGlvblNldHMnLCAgICAgICBmaWxlOiAnY29udGVudC9vcHRpb24tc2V0cy5qcycsICAgICAgICAgbGFiZWw6ICdPcHRpb24gU2V0cycsICAgIGljb246ICdcdUQ4M0RcdUREMTgnLCBwb3B1cEJ0bklkOiAnYnRuLXNob3ctb3B0aW9uLXNldHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RTaG93SGlkZGVuRmllbGRzJywgZmlsZTogJ2NvbnRlbnQvc2hvdy1oaWRkZW4tZmllbGRzLmpzJywgIGxhYmVsOiAnSGlkZGVuIEZpZWxkcycsICBpY29uOiAnXHVEODNEXHVEQzQxJywgcG9wdXBCdG5JZDogJ2J0bi1zaG93LWhpZGRlbi1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3REaXJ0eUZpZWxkcycsICAgICAgZmlsZTogJ2NvbnRlbnQvZGlydHktZmllbGRzLmpzJywgICAgICAgIGxhYmVsOiAnRGlydHkgRmllbGRzJywgICBpY29uOiAnXHUyNzBGXHVGRTBGJywgcG9wdXBCdG5JZDogJ2J0bi1kaXJ0eS1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdvcGVuT25BcGknLCAgICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvb3Blbi1vbi1hcGkuanMnLCAgICAgICAgIGxhYmVsOiAnT3BlbiBvbiBBUEknLCAgICBpY29uOiAnXHVEODNEXHVERDE3JywgcG9wdXBCdG5JZDogJ2J0bi1vcGVuLW9uLWFwaScgfSxcclxuICB7IGFjdGlvbjogJ2p1bXBUb0xhdGVzdCcsICAgICAgICAgICAgZmlsZTogJ2NvbnRlbnQvanVtcC10by1sYXRlc3QuanMnLCAgICAgICBsYWJlbDogJ0p1bXAgdG8gTGF0ZXN0JywgaWNvbjogJ1x1RDgzRFx1REQ1MCcsIHBvcHVwQnRuSWQ6ICdidG4tanVtcC10by1sYXRlc3QnLCBhbGxGcmFtZXM6IGZhbHNlIH0sXHJcbiAgeyBhY3Rpb246ICdhY3RpdmF0ZUFjdGl2aXR5JywgICAgICBmaWxlOiAnY29udGVudC9hY3RpdmF0ZS1hY3Rpdml0eS5qcycsICAgIGxhYmVsOiAnQWN0aXZhdGUnLCAgICAgICBpY29uOiAnXHVEODNEXHVERDEzJywgcG9wdXBCdG5JZDogJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScsIGNvbmRpdGlvbmFsOiAnYWN0aXZhdGFibGUnIH0sXHJcbl07XHJcblxyXG4vKiogTG9va3VwIG1hcCBmcm9tIGFjdGlvbiBuYW1lIHRvIHNjcmlwdCBjb25maWcsIGZvciB0aGUgYmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlci4gKi9cclxuZXhwb3J0IGNvbnN0IEFDVElPTl9NQVA6IFJlY29yZDxzdHJpbmcsIHsgZmlsZTogc3RyaW5nOyBhbGxGcmFtZXM6IGJvb2xlYW4gfT4gPSBPYmplY3QuZnJvbUVudHJpZXMoXHJcbiAgQUNUSU9OUy5tYXAoYSA9PiBbYS5hY3Rpb24sIHsgZmlsZTogYS5maWxlLCBhbGxGcmFtZXM6IGEuYWxsRnJhbWVzID8/IHRydWUgfV0pLFxyXG4pO1xyXG4iLCAiLy8gU2luZ2xlIHNvdXJjZSBvZiB0cnV0aDogYWN0aW9uIG5hbWUgXHUyMTkyIGNvbnRlbnQgc2NyaXB0IGNvbmZpZy5cclxuLy8gVXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gcG9wdXAgYW5kIHRoZSBDUk0gcmliYm9uIHRvb2xiYXIuXHJcblxyXG5pbXBvcnQgeyBBQ1RJT05fTUFQIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihcclxuICAobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIHNlbmRlciwgc2VuZFJlc3BvbnNlKTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB7XHJcbiAgICBjb25zdCB0YWJJZCA9IChtZXNzYWdlLnRhYklkIGFzIG51bWJlciB8IHVuZGVmaW5lZCkgPz8gc2VuZGVyLnRhYj8uaWQ7XHJcbiAgICBpZiAodGFiSWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5hY3Rpb24gPT09ICdwcm9iZUFjdGl2YXRhYmxlJykge1xyXG4gICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiB0cnVlIH0sXHJcbiAgICAgICAgd29ybGQ6ICdNQUlOJyxcclxuICAgICAgICBmdW5jOiAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlIHx8ICFYcm0uUGFnZS5kYXRhKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBYcm0uUGFnZS5nZXRBdHRyaWJ1dGUoJ3N0YXRlY29kZScpO1xyXG4gICAgICAgICAgICBpZiAoIWF0dHIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIGF0dHIuZ2V0VmFsdWUoKSAhPT0gMDtcclxuICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9LFxyXG4gICAgICB9KS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2YXRhYmxlID0gcmVzdWx0cy5zb21lKHIgPT4gci5yZXN1bHQgPT09IHRydWUpO1xyXG4gICAgICAgIHNlbmRSZXNwb25zZSh7IGFjdGl2YXRhYmxlIH0pO1xyXG4gICAgICB9KS5jYXRjaCgoKSA9PiBzZW5kUmVzcG9uc2UoeyBhY3RpdmF0YWJsZTogZmFsc2UgfSkpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBtZXNzYWdlIGNoYW5uZWwgb3BlbiBmb3IgYXN5bmMgc2VuZFJlc3BvbnNlXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29uZmlnID0gQUNUSU9OX01BUFttZXNzYWdlLmFjdGlvbiBhcyBzdHJpbmddO1xyXG4gICAgaWYgKCFjb25maWcpIHJldHVybiB1bmRlZmluZWQ7XHJcblxyXG4gICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgdGFyZ2V0OiB7IHRhYklkLCBhbGxGcmFtZXM6IGNvbmZpZy5hbGxGcmFtZXMgfSxcclxuICAgICAgZmlsZXM6IFtjb25maWcuZmlsZV0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICB9KTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfSxcclxuKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBY08sTUFBTSxVQUF1QjtBQUFBLElBQ2xDLEVBQUUsUUFBUSxtQkFBMEIsTUFBTSx5QkFBa0MsT0FBTyxjQUFrQixNQUFNLGFBQU0sWUFBWSxpQkFBaUI7QUFBQSxJQUM5SSxFQUFFLFFBQVEsb0JBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlBQVksdUJBQXVCO0FBQUEsSUFDcEosRUFBRSxRQUFRLDBCQUEwQixNQUFNLGlDQUFrQyxPQUFPLGlCQUFrQixNQUFNLGFBQU0sWUFBWSx5QkFBeUI7QUFBQSxJQUN0SixFQUFFLFFBQVEscUJBQTBCLE1BQU0sMkJBQWtDLE9BQU8sZ0JBQWtCLE1BQU0sZ0JBQU0sWUFBWSxtQkFBbUI7QUFBQSxJQUNoSixFQUFFLFFBQVEsYUFBMEIsTUFBTSwwQkFBa0MsT0FBTyxlQUFrQixNQUFNLGFBQU0sWUFBWSxrQkFBa0I7QUFBQSxJQUMvSSxFQUFFLFFBQVEsZ0JBQTJCLE1BQU0sNkJBQW1DLE9BQU8sa0JBQWtCLE1BQU0sYUFBTSxZQUFZLHNCQUFzQixXQUFXLE1BQU07QUFBQSxJQUN0SyxFQUFFLFFBQVEsb0JBQXlCLE1BQU0sZ0NBQW1DLE9BQU8sWUFBa0IsTUFBTSxhQUFNLFlBQVkseUJBQXlCLGFBQWEsY0FBYztBQUFBLEVBQ25MO0FBR08sTUFBTSxhQUFtRSxPQUFPO0FBQUEsSUFDckYsUUFBUSxJQUFJLE9BQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLEVBQUUsYUFBYSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQy9FOzs7QUN0QkEsU0FBTyxRQUFRLFVBQVU7QUFBQSxJQUN2QixDQUFDLFNBQWtDLFFBQVEsaUJBQXNDO0FBQy9FLFlBQU0sUUFBUyxRQUFRLFNBQWdDLE9BQU8sS0FBSztBQUNuRSxVQUFJLFVBQVUsT0FBVyxRQUFPO0FBRWhDLFVBQUksUUFBUSxXQUFXLG9CQUFvQjtBQUN6QyxlQUFPLFVBQVUsY0FBYztBQUFBLFVBQzdCLFFBQVEsRUFBRSxPQUFPLFdBQVcsS0FBSztBQUFBLFVBQ2pDLE9BQU87QUFBQSxVQUNQLE1BQU0sTUFBTTtBQUNWLGdCQUFJO0FBQ0Ysa0JBQUksT0FBTyxRQUFRLGVBQWUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssS0FBTSxRQUFPO0FBQ3RFLG9CQUFNLE9BQU8sSUFBSSxLQUFLLGFBQWEsV0FBVztBQUM5QyxrQkFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixxQkFBTyxLQUFLLFNBQVMsTUFBTTtBQUFBLFlBQzdCLFFBQVE7QUFBRSxxQkFBTztBQUFBLFlBQU87QUFBQSxVQUMxQjtBQUFBLFFBQ0YsQ0FBQyxFQUFFLEtBQUssYUFBVztBQUNqQixnQkFBTSxjQUFjLFFBQVEsS0FBSyxPQUFLLEVBQUUsV0FBVyxJQUFJO0FBQ3ZELHVCQUFhLEVBQUUsWUFBWSxDQUFDO0FBQUEsUUFDOUIsQ0FBQyxFQUFFLE1BQU0sTUFBTSxhQUFhLEVBQUUsYUFBYSxNQUFNLENBQUMsQ0FBQztBQUNuRCxlQUFPO0FBQUEsTUFDVDtBQUVBLFlBQU0sU0FBUyxXQUFXLFFBQVEsTUFBZ0I7QUFDbEQsVUFBSSxDQUFDLE9BQVEsUUFBTztBQUVwQixhQUFPLFVBQVUsY0FBYztBQUFBLFFBQzdCLFFBQVEsRUFBRSxPQUFPLFdBQVcsT0FBTyxVQUFVO0FBQUEsUUFDN0MsT0FBTyxDQUFDLE9BQU8sSUFBSTtBQUFBLFFBQ25CLE9BQU87QUFBQSxNQUNULENBQUM7QUFDRCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
