(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.handle && message.get) {
      chrome.storage.local.get(message.handle).then(sendResponse);
      return true;
    }

    if (message.handle && message.set) {
      chrome.storage.local
        .set({ [message.handle]: message.data })
        .then(sendResponse({ success: true }));
      return true;
    }
  });
})();
