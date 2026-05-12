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
      btn.addEventListener("click", () => sendAction(def.action));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FjdGlvbnMudHMiLCAiLi4vLi4vc3JjL3BvcHVwL3BvcHVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaW5nbGUgcmVnaXN0cnkgb2YgRHluYW1pY3NDYXQgYWN0aW9ucyBcdTIwMTQgY29uc3VtZWQgYnkgYmFja2dyb3VuZCwgcG9wdXAsIGFuZCByaWJib24uXHJcbi8vIEFkZGluZyBhIG5ldyBhY3Rpb24gaGVyZSBhdXRvbWF0aWNhbGx5IHdpcmVzIGl0IGludG8gYWxsIHRocmVlIHN1cmZhY2VzLlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25EZWYge1xyXG4gIGFjdGlvbjogc3RyaW5nO1xyXG4gIGZpbGU6IHN0cmluZztcclxuICBhbGxGcmFtZXM/OiBib29sZWFuOyAvLyBkZWZhdWx0cyB0byB0cnVlXHJcbiAgbGFiZWw6IHN0cmluZztcclxuICBpY29uOiBzdHJpbmc7XHJcbiAgcG9wdXBCdG5JZD86IHN0cmluZztcclxuICAvKiogSWYgc2V0LCB0aGUgYnV0dG9uIGlzIGhpZGRlbiB1bnRpbCBhIHJ1bnRpbWUgcHJvYmUgY29uZmlybXMgaXQgc2hvdWxkIGFwcGVhci4gKi9cclxuICBjb25kaXRpb25hbD86ICdhY3RpdmF0YWJsZSc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05TOiBBY3Rpb25EZWZbXSA9IFtcclxuICB7IGFjdGlvbjogJ2luamVjdEFsbEZpZWxkcycsICAgICAgICBmaWxlOiAnY29udGVudC9hbGwtZmllbGRzLmpzJywgICAgICAgICAgbGFiZWw6ICdBbGwgRmllbGRzJywgICAgIGljb246ICdcdUQ4M0RcdURDQ0InLCBwb3B1cEJ0bklkOiAnYnRuLWFsbC1maWVsZHMnIH0sXHJcbiAgeyBhY3Rpb246ICdpbmplY3RPcHRpb25TZXRzJywgICAgICAgZmlsZTogJ2NvbnRlbnQvb3B0aW9uLXNldHMuanMnLCAgICAgICAgIGxhYmVsOiAnT3B0aW9uIFNldHMnLCAgICBpY29uOiAnXHVEODNEXHVERDE4JywgcG9wdXBCdG5JZDogJ2J0bi1zaG93LW9wdGlvbi1zZXRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0U2hvd0hpZGRlbkZpZWxkcycsIGZpbGU6ICdjb250ZW50L3Nob3ctaGlkZGVuLWZpZWxkcy5qcycsICBsYWJlbDogJ0hpZGRlbiBGaWVsZHMnLCAgaWNvbjogJ1x1RDgzRFx1REM0MScsIHBvcHVwQnRuSWQ6ICdidG4tc2hvdy1oaWRkZW4tZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnaW5qZWN0RGlydHlGaWVsZHMnLCAgICAgIGZpbGU6ICdjb250ZW50L2RpcnR5LWZpZWxkcy5qcycsICAgICAgICBsYWJlbDogJ0RpcnR5IEZpZWxkcycsICAgaWNvbjogJ1x1MjcwRlx1RkUwRicsIHBvcHVwQnRuSWQ6ICdidG4tZGlydHktZmllbGRzJyB9LFxyXG4gIHsgYWN0aW9uOiAnb3Blbk9uQXBpJywgICAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L29wZW4tb24tYXBpLmpzJywgICAgICAgICBsYWJlbDogJ09wZW4gb24gQVBJJywgICAgaWNvbjogJ1x1RDgzRFx1REQxNycsIHBvcHVwQnRuSWQ6ICdidG4tb3Blbi1vbi1hcGknIH0sXHJcbiAgeyBhY3Rpb246ICdqdW1wVG9MYXRlc3QnLCAgICAgICAgICAgIGZpbGU6ICdjb250ZW50L2p1bXAtdG8tbGF0ZXN0LmpzJywgICAgICAgbGFiZWw6ICdKdW1wIHRvIExhdGVzdCcsIGljb246ICdcdUQ4M0RcdURENTAnLCBwb3B1cEJ0bklkOiAnYnRuLWp1bXAtdG8tbGF0ZXN0JywgYWxsRnJhbWVzOiBmYWxzZSB9LFxyXG4gIHsgYWN0aW9uOiAnYWN0aXZhdGVBY3Rpdml0eScsICAgICAgZmlsZTogJ2NvbnRlbnQvYWN0aXZhdGUtYWN0aXZpdHkuanMnLCAgICBsYWJlbDogJ0FjdGl2YXRlJywgICAgICAgaWNvbjogJ1x1RDgzRFx1REQxMycsIHBvcHVwQnRuSWQ6ICdidG4tYWN0aXZhdGUtYWN0aXZpdHknLCBjb25kaXRpb25hbDogJ2FjdGl2YXRhYmxlJyB9LFxyXG5dO1xyXG5cclxuLyoqIExvb2t1cCBtYXAgZnJvbSBhY3Rpb24gbmFtZSB0byBzY3JpcHQgY29uZmlnLCBmb3IgdGhlIGJhY2tncm91bmQgc2VydmljZSB3b3JrZXIuICovXHJcbmV4cG9ydCBjb25zdCBBQ1RJT05fTUFQOiBSZWNvcmQ8c3RyaW5nLCB7IGZpbGU6IHN0cmluZzsgYWxsRnJhbWVzOiBib29sZWFuIH0+ID0gT2JqZWN0LmZyb21FbnRyaWVzKFxyXG4gIEFDVElPTlMubWFwKGEgPT4gW2EuYWN0aW9uLCB7IGZpbGU6IGEuZmlsZSwgYWxsRnJhbWVzOiBhLmFsbEZyYW1lcyA/PyB0cnVlIH1dKSxcclxuKTtcclxuIiwgImltcG9ydCB7IEFDVElPTlMgfSBmcm9tICcuLi9hY3Rpb25zJztcclxuXHJcbmZ1bmN0aW9uIHNlbmRBY3Rpb24oYWN0aW9uOiBzdHJpbmcpOiB2b2lkIHtcclxuICBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9LCAoW3RhYl0pID0+IHtcclxuICAgIGlmICghdGFiPy5pZCkgcmV0dXJuO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBhY3Rpb24sIHRhYklkOiB0YWIuaWQgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm9iZSB0aGUgYWN0aXZlIHRhYiB0byBjaGVjayBpZiB0aGUgY3VycmVudCBlbnRpdHkgY2FuIGJlIGFjdGl2YXRlZC5cclxuICogVXNlcyBhIHR3by1zdGVwIGFwcHJvYWNoOiBNQUlOIHdvcmxkIHNjcmlwdCB3cml0ZXMgcmVzdWx0IHRvIGEgZGF0YSBhdHRyaWJ1dGUsXHJcbiAqIHRoZW4gSVNPTEFURUQgd29ybGQgc2NyaXB0IHJlYWRzIGl0IGJhY2sgKE1BSU4gd29ybGQgY2Fubm90IHJldHVybiB2YWx1ZXMgdG8gZXh0ZW5zaW9uKS5cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2JlQWN0aXZhdGFibGUodGFiSWQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGNvbnN0IG1hcmtlciA9ICdfX2R5bmFtaWNzY2F0X2FjdGl2YXRhYmxlJztcclxuICB0cnkge1xyXG4gICAgLy8gU3RlcCAxOiBpbmplY3QgaW50byBNQUlOIHdvcmxkIHRvIGNoZWNrIFhybSBzdGF0ZSwgd3JpdGUgcmVzdWx0IHRvIGRvY3VtZW50IGVsZW1lbnRcclxuICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XHJcbiAgICAgIHRhcmdldDogeyB0YWJJZCwgYWxsRnJhbWVzOiB0cnVlIH0sXHJcbiAgICAgIHdvcmxkOiAnTUFJTicsXHJcbiAgICAgIGZ1bmM6IChhdHRyOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIFhybSA9PT0gJ3VuZGVmaW5lZCcgfHwgIVhybS5QYWdlPy5kYXRhKSByZXR1cm47XHJcbiAgICAgICAgY29uc3Qgc2MgPSBYcm0uUGFnZS5nZXRBdHRyaWJ1dGUoJ3N0YXRlY29kZScpO1xyXG4gICAgICAgIGlmICghc2MpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjbG9zZWQgPSAoc2MuZ2V0VmFsdWUoKSBhcyBudW1iZXIpICE9PSAwO1xyXG4gICAgICAgIGlmIChjbG9zZWQpIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwgJzEnKTtcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdGVwIDI6IHJlYWQgdGhlIG1hcmtlciBmcm9tIElTT0xBVEVEIHdvcmxkIChjYW4gcmV0dXJuIHZhbHVlcylcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xyXG4gICAgICB0YXJnZXQ6IHsgdGFiSWQsIGFsbEZyYW1lczogdHJ1ZSB9LFxyXG4gICAgICBmdW5jOiAoYXR0cjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdmFsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICBpZiAodmFsKSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgICAgIHJldHVybiB2YWwgPT09ICcxJztcclxuICAgICAgfSxcclxuICAgICAgYXJnczogW21hcmtlcl0sXHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzLnNvbWUociA9PiByLnJlc3VsdCA9PT0gdHJ1ZSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gIGZvciAoY29uc3QgZGVmIG9mIEFDVElPTlMpIHtcclxuICAgIGlmICghZGVmLnBvcHVwQnRuSWQpIGNvbnRpbnVlO1xyXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmLnBvcHVwQnRuSWQpO1xyXG4gICAgaWYgKCFidG4pIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgW0R5bmFtaWNzQ2F0XSBQb3B1cCBlbGVtZW50ICMke2RlZi5wb3B1cEJ0bklkfSBub3QgZm91bmRgKTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBzZW5kQWN0aW9uKGRlZi5hY3Rpb24pKTtcclxuICB9XHJcblxyXG4gIC8vIENvbmRpdGlvbmFsbHkgc2hvdyB0aGUgQWN0aXZhdGUgYnV0dG9uXHJcbiAgY29uc3QgW3RhYl0gPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KTtcclxuICBpZiAodGFiPy5pZCkge1xyXG4gICAgY29uc3QgY2FuQWN0aXZhdGUgPSBhd2FpdCBwcm9iZUFjdGl2YXRhYmxlKHRhYi5pZCk7XHJcbiAgICBpZiAoY2FuQWN0aXZhdGUpIHtcclxuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bi1hY3RpdmF0ZS1hY3Rpdml0eScpO1xyXG4gICAgICBpZiAoYnRuKSBidG4uaGlkZGVuID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBY08sTUFBTSxVQUF1QjtBQUFBLElBQ2xDLEVBQUUsUUFBUSxtQkFBMEIsTUFBTSx5QkFBa0MsT0FBTyxjQUFrQixNQUFNLGFBQU0sWUFBWSxpQkFBaUI7QUFBQSxJQUM5SSxFQUFFLFFBQVEsb0JBQTBCLE1BQU0sMEJBQWtDLE9BQU8sZUFBa0IsTUFBTSxhQUFNLFlBQVksdUJBQXVCO0FBQUEsSUFDcEosRUFBRSxRQUFRLDBCQUEwQixNQUFNLGlDQUFrQyxPQUFPLGlCQUFrQixNQUFNLGFBQU0sWUFBWSx5QkFBeUI7QUFBQSxJQUN0SixFQUFFLFFBQVEscUJBQTBCLE1BQU0sMkJBQWtDLE9BQU8sZ0JBQWtCLE1BQU0sZ0JBQU0sWUFBWSxtQkFBbUI7QUFBQSxJQUNoSixFQUFFLFFBQVEsYUFBMEIsTUFBTSwwQkFBa0MsT0FBTyxlQUFrQixNQUFNLGFBQU0sWUFBWSxrQkFBa0I7QUFBQSxJQUMvSSxFQUFFLFFBQVEsZ0JBQTJCLE1BQU0sNkJBQW1DLE9BQU8sa0JBQWtCLE1BQU0sYUFBTSxZQUFZLHNCQUFzQixXQUFXLE1BQU07QUFBQSxJQUN0SyxFQUFFLFFBQVEsb0JBQXlCLE1BQU0sZ0NBQW1DLE9BQU8sWUFBa0IsTUFBTSxhQUFNLFlBQVkseUJBQXlCLGFBQWEsY0FBYztBQUFBLEVBQ25MO0FBR08sTUFBTSxhQUFtRSxPQUFPO0FBQUEsSUFDckYsUUFBUSxJQUFJLE9BQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLEVBQUUsYUFBYSxLQUFLLENBQUMsQ0FBQztBQUFBLEVBQy9FOzs7QUN6QkEsV0FBUyxXQUFXLFFBQXNCO0FBQ3hDLFdBQU8sS0FBSyxNQUFNLEVBQUUsUUFBUSxNQUFNLGVBQWUsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU07QUFDbEUsVUFBSSxDQUFDLEtBQUssR0FBSTtBQUNkLGFBQU8sUUFBUSxZQUFZLEVBQUUsUUFBUSxPQUFPLElBQUksR0FBRyxDQUFDO0FBQUEsSUFDdEQsQ0FBQztBQUFBLEVBQ0g7QUFPQSxpQkFBZSxpQkFBaUIsT0FBaUM7QUFDL0QsVUFBTSxTQUFTO0FBQ2YsUUFBSTtBQUVGLFlBQU0sT0FBTyxVQUFVLGNBQWM7QUFBQSxRQUNuQyxRQUFRLEVBQUUsT0FBTyxXQUFXLEtBQUs7QUFBQSxRQUNqQyxPQUFPO0FBQUEsUUFDUCxNQUFNLENBQUMsU0FBaUI7QUFDdEIsY0FBSSxPQUFPLFFBQVEsZUFBZSxDQUFDLElBQUksTUFBTSxLQUFNO0FBQ25ELGdCQUFNLEtBQUssSUFBSSxLQUFLLGFBQWEsV0FBVztBQUM1QyxjQUFJLENBQUMsR0FBSTtBQUNULGdCQUFNLFNBQVUsR0FBRyxTQUFTLE1BQWlCO0FBQzdDLGNBQUksT0FBUSxVQUFTLGdCQUFnQixhQUFhLE1BQU0sR0FBRztBQUFBLFFBQzdEO0FBQUEsUUFDQSxNQUFNLENBQUMsTUFBTTtBQUFBLE1BQ2YsQ0FBQztBQUdELFlBQU0sVUFBVSxNQUFNLE9BQU8sVUFBVSxjQUFjO0FBQUEsUUFDbkQsUUFBUSxFQUFFLE9BQU8sV0FBVyxLQUFLO0FBQUEsUUFDakMsTUFBTSxDQUFDLFNBQWlCO0FBQ3RCLGdCQUFNLE1BQU0sU0FBUyxnQkFBZ0IsYUFBYSxJQUFJO0FBQ3RELGNBQUksSUFBSyxVQUFTLGdCQUFnQixnQkFBZ0IsSUFBSTtBQUN0RCxpQkFBTyxRQUFRO0FBQUEsUUFDakI7QUFBQSxRQUNBLE1BQU0sQ0FBQyxNQUFNO0FBQUEsTUFDZixDQUFDO0FBQ0QsYUFBTyxRQUFRLEtBQUssT0FBSyxFQUFFLFdBQVcsSUFBSTtBQUFBLElBQzVDLFFBQVE7QUFDTixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGlCQUFpQixvQkFBb0IsWUFBWTtBQUN4RCxlQUFXLE9BQU8sU0FBUztBQUN6QixVQUFJLENBQUMsSUFBSSxXQUFZO0FBQ3JCLFlBQU0sTUFBTSxTQUFTLGVBQWUsSUFBSSxVQUFVO0FBQ2xELFVBQUksQ0FBQyxLQUFLO0FBQ1IsZ0JBQVEsTUFBTSxnQ0FBZ0MsSUFBSSxVQUFVLFlBQVk7QUFDeEU7QUFBQSxNQUNGO0FBQ0EsVUFBSSxpQkFBaUIsU0FBUyxNQUFNLFdBQVcsSUFBSSxNQUFNLENBQUM7QUFBQSxJQUM1RDtBQUdBLFVBQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxPQUFPLEtBQUssTUFBTSxFQUFFLFFBQVEsTUFBTSxlQUFlLEtBQUssQ0FBQztBQUMzRSxRQUFJLEtBQUssSUFBSTtBQUNYLFlBQU0sY0FBYyxNQUFNLGlCQUFpQixJQUFJLEVBQUU7QUFDakQsVUFBSSxhQUFhO0FBQ2YsY0FBTSxNQUFNLFNBQVMsZUFBZSx1QkFBdUI7QUFDM0QsWUFBSSxJQUFLLEtBQUksU0FBUztBQUFBLE1BQ3hCO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
