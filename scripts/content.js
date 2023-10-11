(async () => {
  //find any forms on the page, if there are none, stop the script
  const forms = document.querySelectorAll("form");
  if (!forms.length) return;

  //credit to Ab. Karim, https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82 for this xpath function
  //this function takes an element and returns its xpath, to identify it later
  function getXPath(element, root) {
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
  }

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
    "off",
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

  //get the handle from the url, to identify the page later
  const handle = window.location.href + "formsaver📌";

  //check if there is already data for this page
  const storedData = await chrome.runtime.sendMessage({ handle, get: true });
  const prevData = storedData[handle] || {};
  const saveInitial = Object.keys(prevData).length === 0;

  //loop through each form
  forms.forEach((form) => {
    //get the form xpath relative to the page
    const formXpath = getXPath(form, "html");
    if (!prevData[formXpath]) prevData[formXpath] = {};
    const formData = prevData[formXpath] || {};

    //get all the inputs in the form
    const inputs = form.querySelectorAll("input");
    const selects = form.querySelectorAll("select");
    const textareas = form.querySelectorAll("textarea");
    let allInputs = [...inputs, ...selects, ...textareas];
    allInputs = allInputs.filter((input) => {
      return (
        !inputTypesUnsaved.includes(input.type) &&
        !inputAutocompleteUnsaved.includes(input.autocomplete)
      );
    });

    //loop through each input
    allInputs.forEach((input) => {
      const inputXpath = getXPath(input, "form");
      //if there is data for this input, set the value to the data
      if (formData[inputXpath]) {
        input.setAttribute("value", formData[inputXpath]);
      } else {
        formData[inputXpath] = input.value;
      }

      //add an event listener to the input, so that when the value changes, it is saved to the object
      input.addEventListener("change", async (e) => {
        prevData[formXpath][inputXpath] = e.target.value;
        await chrome.runtime.sendMessage({
          handle,
          set: true,
          data: prevData,
        });
      });
    });
  });

  //save the data to chrome storage
  saveInitial && chrome.runtime.sendMessage({ handle, set: true, prevData });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.clear) {
      chrome.storage.local.remove(handle);
      const inputs = document.querySelectorAll("input");
      const selects = document.querySelectorAll("select");
      const textareas = document.querySelectorAll("textarea");
      const allInputs = [...inputs, ...selects, ...textareas];
      allInputs.forEach((input) => {
        input.setAttribute("value", "");
      });
      sendResponse({ success: true });
    }
  });
})();
