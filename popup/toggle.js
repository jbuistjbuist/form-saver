(() => {
  const clearButton = document.getElementById("clear_button");

  clearButton.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { clear: true });
    });
  });
})();
