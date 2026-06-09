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

  // src/popup/popup.ts
  function sendAction(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.runtime.sendMessage({ action, tabId: tab.id });
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
        sendAction(def.action);
      });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vLi4vc3JjL3BvcHVwL3BvcHVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaW5nbGUgcmVnaXN0cnkgb2YgRHluYW1pY3NDYXQgYWN0aW9ucyBcdTIwMTQgY29uc3VtZWQgYnkgYmFja2dyb3VuZCwgcG9wdXAsIGFuZCByaWJib24uXHJcbi8vIEFkZGluZyBhIG5ldyBhY3Rpb24gaGVyZSBhdXRvbWF0aWNhbGx5IHdpcmVzIGl0IGludG8gYWxsIHRocmVlIHN1cmZhY2VzLlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25EZWYge1xyXG4gIGFjdGlvbjogc3RyaW5nO1xyXG4gIGZpbGU6IHN0cmluZztcclxuICBhbGxGcmFtZXM/OiBib29sZWFuOyAvLyBkZWZhdWx0cyB0byB0cnVlXHJcbiAgbGFiZWw6IHN0cmluZztcclxuICBpY29uPzogc3RyaW5nO1xyXG4gIHBvcHVwQnRuSWQ/OiBzdHJpbmc7XHJcbiAgLyoqIElmIHNldCwgdGhlIGJ1dHRvbiBpcyBoaWRkZW4gdW50aWwgYSBydW50aW1lIHByb2JlIGNvbmZpcm1zIGl0IHNob3VsZCBhcHBlYXIuICovXHJcbiAgY29uZGl0aW9uYWw/OiAnYWN0aXZhdGFibGUnO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgQUNUSU9OUzogQWN0aW9uRGVmW10gPSBbXHJcbiAgeyBhY3Rpb246ICdpbmplY3RBbGxGaWVsZHMnLCAgICAgICAgZmlsZTogJ2NvbnRlbnQvYWxsLWZpZWxkcy5qcycsICAgICAgICAgIGxhYmVsOiAnQWxsIEZpZWxkcycsICAgICBpY29uOiAnXHVEODNEXHVEQ0NCJywgcG9wdXBCdG5JZDogJ2J0bi1hbGwtZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0T3B0aW9uU2V0cycsICAgICAgIGZpbGU6ICdjb250ZW50L29wdGlvbi1zZXRzLmpzJywgICAgICAgICBsYWJlbDogJ09wdGlvbiBTZXRzJywgICAgaWNvbjogJ1x1RDgzRFx1REQxOCcsIHBvcHVwQnRuSWQ6ICdidG4tc2hvdy1vcHRpb24tc2V0cycgfSxcclxuICAvLyBLZXlib2FyZC1zaG9ydGN1dCBvbmx5IChubyBidXR0b24pIFx1MjAxNCBzdXBlcnNlZGVkIGJ5IHRoZSBTaG93IEhpZGRlbiBGaWVsZHMgc2hvcnRjdXQuXHJcbiAgeyBhY3Rpb246ICdpbmplY3RTaG93SGlkZGVuRmllbGRzJywgZmlsZTogJ2NvbnRlbnQvc2hvdy1oaWRkZW4tZmllbGRzLmpzJywgIGxhYmVsOiAnSGlkZGVuIEZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdERpcnR5RmllbGRzJywgICAgICBmaWxlOiAnY29udGVudC9kaXJ0eS1maWVsZHMuanMnLCAgICAgICAgbGFiZWw6ICdEaXJ0eSBGaWVsZHMnLCAgIGljb246ICdcdTI3MEZcdUZFMEYnLCBwb3B1cEJ0bklkOiAnYnRuLWRpcnR5LWZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdE92ZXJyaWRlUmVhZG9ubHknLCBmaWxlOiAnY29udGVudC9vdmVycmlkZS1yZWFkb25seS5qcycsICAgbGFiZWw6ICdPdmVycmlkZSBSZWFkb25seScsIGljb246ICdcdUQ4M0RcdUREMTMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RMb29rdXBzT3BlbmVyJywgICAgZmlsZTogJ2NvbnRlbnQvbG9va3Vwcy1vcGVuZXIuanMnLCAgICAgIGxhYmVsOiAnTG9va3VwcyBPcGVuZXInLCBpY29uOiAnXHVEODNFXHVERTlGJyB9LFxyXG4gIHsgYWN0aW9uOiAnb3Blbk9uQXBpJywgICAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L29wZW4tb24tYXBpLmpzJywgICAgICAgICBsYWJlbDogJ09wZW4gb24gQVBJJywgICAgaWNvbjogJ1x1RDgzRFx1REQxNycsIHBvcHVwQnRuSWQ6ICdidG4tb3Blbi1vbi1hcGknIH0sXHJcbiAgeyBhY3Rpb246ICdqdW1wVG9MYXRlc3QnLCAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L2p1bXAtdG8tbGF0ZXN0LmpzJywgICAgICAgbGFiZWw6ICdKdW1wIHRvIExhdGVzdCcsIGljb246ICdcdUQ4M0RcdURENTAnLCBwb3B1cEJ0bklkOiAnYnRuLWp1bXAtdG8tbGF0ZXN0JywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG4gIHsgYWN0aW9uOiAnanVtcFRvTGF0ZXN0UXVpY2snLCAgICAgIGZpbGU6ICdjb250ZW50L2p1bXAtdG8tbGF0ZXN0LXF1aWNrLmpzJywgbGFiZWw6ICdKdW1wIHRvIExhdGVzdCAoUXVpY2spJywgaWNvbjogJ1x1MjZBMScsIGFsbEZyYW1lczogZmFsc2UgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdFVubG9ja0FsbEZpZWxkcycsICBmaWxlOiAnY29udGVudC91bmxvY2stYWxsLWZpZWxkcy5qcycsICAgbGFiZWw6ICdVbmxvY2sgQWxsIEZpZWxkcycgfSxcclxuICB7IGFjdGlvbjogJ2FjdGl2YXRlQWN0aXZpdHknLCAgICAgIGZpbGU6ICdjb250ZW50L2FjdGl2YXRlLWFjdGl2aXR5LmpzJywgICAgbGFiZWw6ICdBY3RpdmF0ZScsICAgICAgIGljb246ICdcdUQ4M0RcdUREMTMnLCBwb3B1cEJ0bklkOiAnYnRuLWFjdGl2YXRlLWFjdGl2aXR5JywgY29uZGl0aW9uYWw6ICdhY3RpdmF0YWJsZScgfSxcclxuICB7IGFjdGlvbjogJ2luamVjdFNob3J0Y3V0c0hlbHAnLCAgICBmaWxlOiAnY29udGVudC9zaG9ydGN1dHMtaGVscC5qcycsICAgICAgbGFiZWw6ICdTaG9ydGN1dHMnLCAgICAgIGljb246ICdcdTIzMjhcdUZFMEYnLCBwb3B1cEJ0bklkOiAnYnRuLXNob3J0Y3V0cy1oZWxwJywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG5dO1xyXG5cclxuLyoqIExvb2t1cCBtYXAgZnJvbSBhY3Rpb24gbmFtZSB0byBzY3JpcHQgY29uZmlnLCBmb3IgdGhlIGJhY2tncm91bmQgc2VydmljZSB3b3JrZXIuICovXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05fTUFQOiBSZWNvcmQ8c3RyaW5nLCB7IGZpbGU6IHN0cmluZzsgYWxsRnJhbWVzOiBib29sZWFuIH0+ID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gIEFDVElPTlMubWFwKGEgPT4gW2EuYWN0aW9uLCB7IGZpbGU6IGEuZmlsZSwgYWxsRnJhbWVzOiBhLmFsbEZyYW1lcyA/PyB0cnVlIH1dKSxcclxuKTtcclxuIiwgImltcG9ydCB7IEFDVElPTlMgfSBmcm9tICcuLi9hY3Rpb25zJztcclxuXHJcbmZ1bmN0aW9uIHNlbmRBY3Rpb24oYWN0aW9uOiBzdHJpbmcpOiB2b2lkIHtcclxuICBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9LCAoW3RhYl0pID0+IHtcclxuICAgIGlmICghdGFiPy5pZCkgcmV0dXJuO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBhY3Rpb24sIHRhYklkOiB0YWIuaWQgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm9iZSB0aGUgYWN0aXZlIHRhYiB0byBjaGVjayBpZiB0aGUgY3VycmVudCBlbnRpdHkgY2FuIGJlIGFjdGl2YXRlZC5cclxuICogVXNlcyBhIHR3by1zdGVwIGFwcHJvYWNoOiBNQUlOIHdvcmxkIHNjcmlwdCB3cml0ZXMgcmVzdWx0IHRvIGEgZGF0YSBhdHRyaWJ1dGUsXHJcbiAqIHRoZW4gSVNPTEFURUQgd29ybGQgc2NyaXB0IHJlYWRzIGl0IGJhY2sgKE1BSU4gd29ybGQgY2Fubm90IHJldHVybiB2YWx1ZXMgdG8gZXh0ZW5zaW9uKS5cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2JlQWN0aXZhdGFibGUodGFiSWQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGNvbnN0IG1hcmtlciA9ICdfX2R5bmFtaWNzY2F0X2FjdGl2YXRhYmxlJztcclxuICB0cnkge1xyXG4gICAgLy8gU3RlcCAxOiBpbmplY3QgaW50byBNQUlOIHdvcmxkIHRvIGNoZWNrIFhybSBzdGF0ZSwgd3JpdGUgcmVzdWx0IHRvIGRvY3VtZW50IGVsZW1lbnRcclxuICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiB0cnVlIH0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgIGZ1bmM6IChhdHRyOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlPy5kYXRhKSByZXR1cm47XHJcbiAgICAgICAgY29uc3Qgc2MgPSBYcm0uUGFnZS5nZXRBdHRyaWJ1dGUoJ3N0YXRlY29kZScpO1xyXG4gICAgICAgIGlmICghc2MpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjbG9zZWQgPSAoc2MuZ2V0VmFsdWUoKSBhcyBudW1iZXIpICE9PSAwO1xyXG4gICAgICAgIGlmIChjbG9zZWQpIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwgJzEnKTtcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdGVwIDI6IHJlYWQgdGhlIG1hcmtlciBmcm9tIElTT0xBVEVEIHdvcmxkIChjYW4gcmV0dXJuIHZhbHVlcylcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogdHJ1ZSB9LFxyXG4gICAgICBmdW5jOiAoYXR0cjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdmFsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICBpZiAodmFsKSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgICAgIHJldHVybiB2YWwgPT09ICcxJztcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzLnNvbWUociA9PiByLnJlc3VsdCA9PT0gdHJ1ZSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gIGZvciAoY29uc3QgZGVmIG9mIEFDVElPTlMpIHtcclxuICAgIGlmICghZGVmLnBvcHVwQnRuSWQpIGNvbnRpbnVlO1xyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmLnBvcHVwQnRuSWQpO1xyXG4gICAgaWYgKCFidG4pIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgW0R5bmFtaWNzQ2F0XSBQb3B1cCBlbGVtZW50ICMke2RlZi5wb3B1cEJ0bklkfSBub3QgZm91bmRgKTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIHNlbmRBY3Rpb24oZGVmLmFjdGlvbik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIENvbmRpdGlvbmFsbHkgc2hvdyB0aGUgQWN0aXZhdGUgYnV0dG9uXHJcbiAgY29uc3QgW3RhYl0gPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KTtcclxuICBpZiAodGFiPy5pZCkge1xyXG4gICAgY29uc3QgY2FuQWN0aXZhdGUgPSBhd2FpdCBwcm9iZUFjdGl2YXRhYmxlKHRhYi5pZCk7XHJcbiAgICBpZiAoY2FuQWN0aXZhdGUpIHtcclxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScpO1xyXG4gICAgICBpZiAoYnRuKSBidG4uaGlkZGVuID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBY08sTUFBTSxVQUF1QjtBQUFBLElBQ2xDLEVBQUUsUUFBUSxtQkFBMEIsTUFBTSx5QkFBa0MsT0FBTyxjQUFrQixNQUFNLGFBQU0sWUFBWSxpQkFBaUI7QUFBQSxJQUM5SSxFQUFFLFFBQVEsb0JBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlBQVksdUJBQXVCO0FBQUE7QUFBQSxJQUVwSixFQUFFLFFBQVEsMEJBQTBCLE1BQU0saUNBQWtDLE9BQU8sZ0JBQWdCO0FBQUEsSUFDbkcsRUFBRSxRQUFRLHFCQUEwQixNQUFNLDJCQUFrQyxPQUFPLGdCQUFrQixNQUFNLGdCQUFNLFlBQVksbUJBQW1CO0FBQUEsSUFDaEosRUFBRSxRQUFRLDBCQUEwQixNQUFNLGdDQUFrQyxPQUFPLHFCQUFxQixNQUFNLFlBQUs7QUFBQSxJQUNuSCxFQUFFLFFBQVEsdUJBQTBCLE1BQU0sNkJBQWtDLE9BQU8sa0JBQWtCLE1BQU0sWUFBSztBQUFBLElBQ2hILEVBQUUsUUFBUSxhQUEwQixNQUFNLDBCQUFrQyxPQUFPLGVBQWtCLE1BQU0sYUFBTSxZQUFZLGtCQUFrQjtBQUFBLElBQy9JLEVBQUUsUUFBUSxnQkFBMkIsTUFBTSw2QkFBbUMsT0FBTyxrQkFBa0IsTUFBTSxhQUFNLFlBQVksc0JBQXNCLFdBQVcsTUFBTTtBQUFBLElBQ3RLLEVBQUUsUUFBUSxxQkFBMEIsTUFBTSxtQ0FBbUMsT0FBTywwQkFBMEIsTUFBTSxVQUFLLFdBQVcsTUFBTTtBQUFBLElBQzFJLEVBQUUsUUFBUSx5QkFBMEIsTUFBTSxnQ0FBa0MsT0FBTyxvQkFBb0I7QUFBQSxJQUN2RyxFQUFFLFFBQVEsb0JBQXlCLE1BQU0sZ0NBQW1DLE9BQU8sWUFBa0IsTUFBTSxhQUFNLFlBQVkseUJBQXlCLGFBQWEsY0FBYztBQUFBLElBQ2pMLEVBQUUsUUFBUSx1QkFBMEIs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
