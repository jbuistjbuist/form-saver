(async () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.handle && message.get) {
      chrome.storage.local.get(message.handle, (data) => {
        sendResponse(data);
      });
    }

    if (message.handle && message.set) {
      chrome.storage.local.set({ [message.handle]: message.data }, () => {
        sendResponse({ data: "saved" });
      });
    }
  });
})();
