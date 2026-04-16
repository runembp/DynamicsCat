document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-hello-world')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content/hello-world.js'],
      });
    });
  });

  document.getElementById('btn-all-fields')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id!, allFrames: true },
        files: ['content/all-fields.js'],
        world: 'MAIN',
      });
    });
  });
});
