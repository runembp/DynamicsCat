document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-hello-world').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('Hello world'),
      });
    });
  });
});
