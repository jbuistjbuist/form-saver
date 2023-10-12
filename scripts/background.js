chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.clear) {
    chrome.storage.session.clear().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.get) {
    chrome.storage.session.get(request.get, (result) => {
      sendResponse(result);
    });
    return true;
  }
  if (request.set) {
    chrome.storage.session.set(request.set).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.remove) {
    chrome.storage.session.remove(request.remove).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
