(async () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.storage.sync.set({ "key": "value" }, function () {
    console.log('Value is set to value');
  });
})})();