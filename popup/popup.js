document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-hello-world').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('Hello world'),
      });
    });
  });

  document.getElementById('btn-show-fields').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/show-fields.css'],
      }).then(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/show-fields.js'],
        });
      });
    });
  });
});
