document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-all-fields')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/all-fields.js'],
        world: 'MAIN',
      });
    });
  });

  document.getElementById('btn-show-option-sets')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/option-sets.js'],
        world: 'MAIN',
      });
    });
  });

  document.getElementById('btn-show-hidden-fields')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/show-hidden-fields.js'],
        world: 'MAIN',
      });
    });
  });
});
