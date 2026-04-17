chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;

  if (message.action === 'injectAllFields') {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content/all-fields.js'],
      world: 'MAIN',
    });
  } else if (message.action === 'injectOptionSets') {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content/option-sets.js'],
      world: 'MAIN',
    });
  } else if (message.action === 'injectShowHiddenFields') {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content/show-hidden-fields.js'],
      world: 'MAIN',
    });
  }
});
