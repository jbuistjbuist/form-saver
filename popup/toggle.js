(async () => {
  //send a message to the content script to clear the form data, then update the button text
  const clearButton = document.getElementById("clear_button");

  clearButton.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { clear: true }, (response) => {
        if (response?.success) {
          clearButton.innerText = "Cleared!";
          setTimeout(() => {
            clearButton.innerText = "Clear Form";
          }, 1000);
        }
      });
    });
  });

  //when the user clicks the toggle button, toggle the extension on or off for the current site and update the button text.
  //we also need to update the button when the popup is opened, so we do that here too
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

  //when the user clicks the settings button, show or hide the settings menu
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

  //when the user clicks the clear all button, clear all of the form data for all sites, after confirming that they want to do so
  const clearAllButton = document.getElementById("clear_all");

  clearAllButton.addEventListener("click", () => {
    if (
      !confirm(
        "Are you sure you want to clear all of your saved form data? This cannot be undone."
      )
    ) {
      return;
    }
    chrome.runtime.sendMessage({ clear: true }).then((response) => {
      response.success && alert("All form data cleared.");
    });
  });

  //when the user clicks the disable extension button, disable the extension after confirming that they want to do so
  const disableButton = document.getElementById("disable_extension");

  disableButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to disable this extension?")) {
      return;
    }
    chrome.management.setEnabled(chrome.runtime.id, false);
  });
})();
