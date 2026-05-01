// Single source of truth: action name → content script config.
// Used by both the extension popup and the CRM ribbon toolbar.

import { ACTION_MAP } from './actions';

chrome.runtime.onMessage.addListener(
  (message: Record<string, unknown>, sender, sendResponse): boolean | undefined => {
    const tabId = (message.tabId as number | undefined) ?? sender.tab?.id;
    if (tabId === undefined) return undefined;

    if (message.action === 'probeActivatable') {
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        func: () => {
          try {
            if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) return false;
            const attr = Xrm.Page.getAttribute('statecode');
            if (!attr) return false;
            return attr.getValue() !== 0;
          } catch { return false; }
        },
      }).then(results => {
        const activatable = results.some(r => r.result === true);
        sendResponse({ activatable });
      }).catch(() => sendResponse({ activatable: false }));
      return true; // keep message channel open for async sendResponse
    }

    const config = ACTION_MAP[message.action as string];
    if (!config) return undefined;

    chrome.scripting.executeScript({
      target: { tabId, allFrames: config.allFrames },
      files: [config.file],
      world: 'MAIN',
    });
    return undefined;
  },
);
