// Single source of truth: action name → content script file.
// Used by both the extension popup and the CRM ribbon toolbar.
const ACTION_SCRIPTS: Record<string, string> = {
  injectAllFields:        'content/all-fields.js',
  injectOptionSets:       'content/option-sets.js',
  injectShowHiddenFields: 'content/show-hidden-fields.js',
  injectDirtyFields:      'content/dirty-fields.js',
  openOnApi:              'content/open-on-api.js',
  openNewestModified:     'content/open-newest-modified.js',
};

chrome.runtime.onMessage.addListener((message, sender) => {
  // tabId may come from the popup (which knows the active tab) or from sender.tab (ribbon).
  const tabId = (message.tabId as number | undefined) ?? sender.tab?.id;
  if (tabId === undefined) return;

  const file = ACTION_SCRIPTS[message.action as string];
  if (!file) return;

  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: [file],
    world: 'MAIN',
  });
});
