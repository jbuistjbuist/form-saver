(async () => {
  const clearButton = document.getElementById("clear_button");

  clearButton.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { clear: true }, (response) => {
        if (response.success) {
          clearButton.innerText = "Cleared!";
          setTimeout(() => {
            clearButton.innerText = "Clear Form";
          }, 1000);
        }
      });
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

  const settingsButton = document.getElementById("settings");
  settingsButton.addEventListener("click", () => {
    if (settingsButton.innerText === "Settings") {
      settingsButton.innerText = "Close";
      document.getElementById("options").className = "";
    } else {
      settingsButton.innerText = "Settings";
      document.getElementById("options").className = "hidden";
    }
  });

  const clearAllButton = document.getElementById("clear_all");

  clearAllButton.addEventListener("click", () => {
    if (
      !confirm(
        "Are you sure you want to clear all of your saved form data? This cannot be undone."
      )
    ) {
      return;
    }
    chrome.storage.local.clear().then(() => {
      alert("All form data cleared.");
    });
  });

  const disableButton = document.getElementById("disable_extension");

  disableButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to disable this extension?")) {
      return;
    }
    chrome.management.setEnabled(chrome.runtime.id, false);
  });
})();
