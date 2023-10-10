(async () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message", message);
})})();