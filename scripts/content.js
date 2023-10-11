(async () => {
  //credit to Ab. Karim, https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82 for this xpath function
  //this function takes an element and returns its xpath, to identify it later
  const getXPath = (element, root) => {
    let selector = "";
    let foundRoot;
    let current = element;

    do {
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;

      if (parent.childElementCount > 1) {
        const siblings = parent.children;

        let tagArr = [];
        for (const sibling of siblings) {
          if (sibling.tagName.toLowerCase() === tag) {
            tagArr.push(sibling);
          }
        }

        if (tagArr.length === 1) {
          // Append tag to selector
          selector = `/${tag}${selector}`;
        } else {
          // Append tag and index to selector
          const index = tagArr.indexOf(current);
          selector = `/${tag}[${index + 1}]${selector}`;
        }
      } else {
        selector = `/${tag}${selector}`;
      }
      // Set parent element to current element
      current = parent;
      // Is root
      foundRoot = parent.tagName.toLowerCase() === root;
      // Finish selector if found root element
      if (foundRoot) selector = `/${root}${selector}`;
    } while (!foundRoot);

    return selector;
  };

  const inputTypesUnsaved = [
    "password",
    "file",
    "hidden",
    "submit",
    "reset",
    "button",
    "image",
  ];

  const inputAutocompleteUnsaved = [
    "new-password",
    "current-password",
    "one-time-code",
    "cc-name",
    "cc-given-name",
    "cc-additional-name",
    "cc-number",
    "cc-exp",
    "cc-exp-month",
    "cc-exp-year",
    "cc-csc",
    "cc-type",
    "webauthn",
  ];

  const getAllInputs = (node) => {
    const inputs = node.querySelectorAll("input");
    const selects = node.querySelectorAll("select");
    const textareas = node.querySelectorAll("textarea");
    let allInputs = [...inputs, ...selects, ...textareas];
    allInputs = allInputs.filter((input) => {
      return (
        !/\b(?:\d[ -]*?){13,16}\b/.test(input.value) &&
        !inputTypesUnsaved.includes(input.type) &&
        !inputAutocompleteUnsaved.includes(input.autocomplete)
      );
    });
    return allInputs;
  };

  const savePage = async () => {
    //get the handle from the url, to identify the page later
    const handle = window.location.href + "formsaver📌";

    const disabled = await chrome.storage.sync.get(window.location.origin);
    if (disabled[window.location.origin]) {
      chrome.storage.local.remove(handle);
      return;
    }

    //find any forms on the page, if there are none, stop the script
    const forms = Array.from(document.querySelectorAll("form")) || [];
    const orphanInputs = document.querySelectorAll("input:not(form input)");
    const orphanSelects = document.querySelectorAll("select:not(form select)");
    const orphanTextareas = document.querySelectorAll(
      "textarea:not(form textarea)"
    );

    if (!forms.length && !orphanInputs.length) return;

    if (orphanInputs.length) {
      forms.push({
        id: "orphan",
        action: "orphan",
        querySelectorAll: (query) => {
          switch (query) {
            case "input":
              return orphanInputs;
            case "select":
              return orphanSelects;
            case "textarea":
              return orphanTextareas;
          }
        },
      });
    }
    //check if there is already data for this page
    const storedData = await chrome.storage.local.get(handle);
    const prevData = storedData[handle] || {};
    const saveInitial = Object.keys(prevData).length === 0;

    //loop through each form
    forms.forEach((form) => {
      //get the form xpath relative to the page
      const formId = form.id || form.action || getXPath(form, "body");
      if (!prevData[formId]) prevData[formId] = {};
      const formData = prevData[formId] || {};

      //get all the inputs in the form
      const allInputs = getAllInputs(form);
      //loop through each input
      allInputs.forEach((input) => {
        const inputId = input.id || getXPath(input, "orphan" ? "body" : "form");
        //if there is data for this input, set the value to the data
        if (formData[inputId]) {
          if (input.type === "radio" || input.type === "checkbox") {
            input.setAttribute("checked", formData[inputId]);
          } else {
            input.setAttribute("value", formData[inputId]);
          }
        } else {
          if (input.type === "radio" || input.type === "checkbox") {
            formData[inputId] = input.checked;
          } else {
            formData[inputId] = input.value;
          }
        }

        //add an event listener to the input, so that when the value changes, it is saved to the object
        input.addEventListener("input", async (e) => {
          if (e.target.type === "radio" || e.target.type === "checkbox") {
            prevData[formId][inputId] = e.target.checked;
          } else {
            prevData[formId][inputId] = e.target.value;
          }
          await chrome.storage.local.set({
            [handle]: prevData,
          });
        });
      });
    });
    //save the data to chrome storage
    saveInitial && chrome.storage.local.set({ [handle]: prevData });
  };

  await savePage();

  //add an event listener to the window, so that when the url changes, the page is saved again
  const observer = new MutationObserver(async () => {
    await savePage();
  });

  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden"],
    characterData: false,
  });

  window.addEventListener("locationchange", async () => {
    await savePage();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.clear) {
      const handle = window.location.href + "formsaver📌";
      chrome.storage.local.remove(handle);
      const allInputs = getAllInputs(document);
      allInputs.forEach((input) => {
        if (input.type === "radio" || input.type === "checkbox") {
          input.removeAttribute("checked");
        } else {
          input.setAttribute("value", "");
        }
      });
      sendResponse({ success: true });
    }
  });
})();
