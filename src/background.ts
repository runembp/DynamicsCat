// Single source of truth: action name → content script config.
// Used by both the extension popup and the CRM ribbon toolbar.

import { ACTION_MAP } from './actions';

chrome.runtime.onMessage.addListener((message, sender) => {
  // tabId may come from the popup (which knows the active tab) or from sender.tab (ribbon).
  const tabId = (message.tabId as number | undefined) ?? sender.tab?.id;
  if (tabId === undefined) return;

  const config = ACTION_MAP[message.action as string];
  if (!config) return;

  chrome.scripting.executeScript({
    target: { tabId, allFrames: config.allFrames },
    files: [config.file],
    world: 'MAIN',
  });
});
