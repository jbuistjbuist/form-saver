(async () => {
  const clearButton = document.getElementById("clear_button");

  clearButton.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { clear: true });
    });
  });

  const toggleButton = document.getElementById("toggle");
  const toggleText = document.getElementById("toggle_text");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const origin = url.origin;
    chrome.storage.sync.get(origin, (result) => {
      if (!result[origin]) {
        toggleText.innerText = "Turn off for this site";
        toggleButton.checked = false;
      } else {
        toggleText.innerText = "Turn on for this site";
        toggleButton.checked = true;
      }
    });
  });

  toggleButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const origin = url.origin;
      chrome.storage.sync.get(origin, (result) => {
        if (!result[origin]) {
          chrome.storage.sync.set({ [origin]: true }, () => {
            toggleText.innerText = "Turn on for this site";
            toggleButton.checked = true;
          });
        } else {
          chrome.storage.sync.remove(origin, () => {
            toggleText.innerText = "Turn off for this site";
            toggleButton.checked = false;
          });
        }
      });
    });
  });
})();
