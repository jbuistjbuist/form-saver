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

  //these are the input types that we don't want to save, anything that could be a password or other sensitive data, or that is not editable
  const inputTypesUnsaved = [
    "password",
    "file",
    "hidden",
    "submit",
    "reset",
    "button",
    "image",
  ];

  //these are the autocomplete types that we don't want to save, anything that could be a password or other sensitive data
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

  //to be safe, we will also check the value of inputa against several regex expressions to see if it is likely to be a password or other sensitive data
  const regExpPass = (text) => {
    if (typeof text === "undefined") return true;
    if (typeof text !== "string") text = text.toString();

    return (
      // regex to check if the text is a credit card number
      !/\b(?:\d[ -]*?){13,19}\b/.test(text?.trim()) &&
      // regex to check if the text is a expiration date
      !/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/.test(text?.trim()) &&
      // regex to check if the text is a cvv
      !/^[0-9]{3,4}$/.test(text?.trim()) &&
      // regex to check if the text might be a sin number
      !/\b(?:\d[ -]*?){9}\b/.test(text?.trim()) &&
      // regex to check if the text is likely to be a password
      !/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,32}$/.test(
        text?.trim()
      )
    );
  };

  //this function gets all the inputs on the page that we want to save
  const getAllInputs = (node) => {
    const inputs = node.querySelectorAll("input");
    const selects = node.querySelectorAll("select");
    const textareas = node.querySelectorAll("textarea");
    let allInputs = [...inputs, ...selects, ...textareas];
    allInputs = allInputs.filter((input) => {
      return (
        regExpPass(input.value) &&
        !inputTypesUnsaved.includes(input.type) &&
        !inputAutocompleteUnsaved.includes(input.autocomplete)
      );
    });
    return allInputs;
  };

  //this function is the main function to save the page and restore it later
  const savePage = async () => {
    //get the handle from the url, to identify the page later
    const handle = window.location.href + "formsaver📌";

    //check if the page is disabled, if it is, stop the script
    const disabled = await chrome.storage.sync.get(window.location.origin);
    if (disabled[window.location.origin]) {
      await chrome.runtime.sendMessage({ remove: handle });
      return;
    }

    //find any forms on the page, if there are none, stop the script
    const forms = Array.from(document.querySelectorAll("form")) || [];

    //check for orphan inputs, selects, and textareas that are not in a form
    const orphanInputs = document.querySelectorAll("input:not(form input)");
    const orphanSelects = document.querySelectorAll("select:not(form select)");
    const orphanTextareas = document.querySelectorAll(
      "textarea:not(form textarea)"
    );

    if (!forms.length && !orphanInputs.length) return;

    //if there are orphan inputs, add a pseudo form to the forms array
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
    const storedData = await chrome.runtime.sendMessage({ get: handle });
    const prevData = storedData[handle] || {};
    const saveInitial = Object.keys(prevData).length === 0;

    //loop through each form
    forms.forEach((form) => {
      //get the form xpath relative to the page
      const formId = form.id || getXPath(form, "body");

      //if there is no data for this form, create an empty object
      if (!prevData[formId]) prevData[formId] = {};
      const formData = prevData[formId];

      //get all the inputs in the form
      const allInputs = getAllInputs(form);
      //loop through each input
      allInputs.forEach((input) => {
        if (!input) return;
        //get the input xpath relative to the form if possible (less work), otherwise relative to the body
        const inputId =
          input.id || getXPath(input, formId === "orphan" ? "body" : "form");
        //if there is data for this input, set the value to the data
        if (formData[inputId]) {
          if (input.type === "radio" || input.type === "checkbox") {
            input.setAttribute("checked", formData[inputId]);
          } else if (input.tagName === "TEXTAREA") {
            input.innerHTML = formData[inputId];
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
          //check if the input is a password or other sensitive data, if it is, don't save it
          if (!regExpPass(e.target.value)) return;

          if (e.target.type === "radio" || e.target.type === "checkbox") {
            prevData[formId][inputId] = e.target.checked;
          } else {
            prevData[formId][inputId] = e.target.value;
          }
          await chrome.runtime.sendMessage({ set: { [handle]: prevData } });
        });
      });
    });
    //save the data to chrome storage, but only if there was no data before
    saveInitial &&
      (await chrome.runtime.sendMessage({ set: { [handle]: prevData } }));
  };

  await savePage();

  //observe for mutations to the page, so that we can save the page when it changes
  const observer = new MutationObserver(async (record) => {

    // we only want to save the page if the mutation is a new HTML element being added
    if (
      !record.some(
        (r) =>
          r.target.tagName === "INPUT" ||
          r.target.tagName === "SELECT" ||
          r.target.tagName === "TEXTAREA" ||
          r.target.tagName === "FORM"
      )
    )
      return;
    if (
      record.some(
        (r) =>
          r?.addedNodes[0]?.nodeName === "#text" ||
          r?.removedNodes[0]?.nodeName === "#text"
      )
    )
      return;


    return setTimeout(async () => {
      await savePage();
    }, 100);
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

  //listen for messages from the popup, for now we only have one message, to clear the data for the page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.clear) {
      const handle = window.location.href + "formsaver📌";
      const response = chrome.runtime.sendMessage({ remove: handle });
      const allInputs = getAllInputs(document);
      allInputs.forEach((input) => {
        if (input.type === "radio" || input.type === "checkbox") {
          input.removeAttribute("checked");
        } else {
          input.setAttribute("value", "");
        }
      });
      if (response.success) sendResponse({ success: true });
    }
  });
})();
