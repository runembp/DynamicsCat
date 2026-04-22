// Single source of truth: action name → content script config.
// Used by both the extension popup and the CRM ribbon toolbar.
interface ActionConfig {
  file: string;
  allFrames?: boolean; // defaults to true
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  injectAllFields:        { file: 'content/all-fields.js' },
  injectOptionSets:       { file: 'content/option-sets.js' },
  injectShowHiddenFields: { file: 'content/show-hidden-fields.js' },
  injectDirtyFields:      { file: 'content/dirty-fields.js' },
  openOnApi:              { file: 'content/open-on-api.js' },
  // openNewestModified runs in the top-level frame only — prevents duplicate panels
  // since allFrames:true would inject into every CRM sub-iframe that exposes Xrm.
  openNewestModified:     { file: 'content/open-newest-modified.js', allFrames: false },
};

chrome.runtime.onMessage.addListener((message, sender) => {
  // tabId may come from the popup (which knows the active tab) or from sender.tab (ribbon).
  const tabId = (message.tabId as number | undefined) ?? sender.tab?.id;
  if (tabId === undefined) return;

  const config = ACTION_CONFIGS[message.action as string];
  if (!config) return;

  chrome.scripting.executeScript({
    target: { tabId, allFrames: config.allFrames ?? true },
    files: [config.file],
    world: 'MAIN',
  });
});
