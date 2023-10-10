(async () => {
  //find any forms on the page, if there are none, stop the script
  const forms = document.querySelectorAll("form");
  if (!forms.length) return;

  //credit to Ab. Karim, https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82 for this xpath function
  //this function takes an element and returns its xpath, to identify it later
  function getXPath(element, root) {
    console.log("element", element);
    let selector = "";
    let foundRoot;
    let current = element;

    do {
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;

      if (parent.childElementCount > 1) {
        const siblings = parent.children;

        console.log("siblings", siblings);

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

  //get the handle from the url, to identify the page later
  const handle = window.location.href + "formsaver📌";

  //check if there is already data for this page
  const prevData = await chrome.runtime.sendMessage({ handle, get: true });

  if (prevData) {
  } else {
    //create an object to store the form data
    const data = {};

    //loop through each form
    forms.forEach((form) => {
      //get the form xpath relative to the page
      const formXpath = getXPath(form, "html");
      data[formXpath] = {};
      const formData = data[formXpath];

      //get all the inputs in the form
      const inputs = form.querySelectorAll("input");
      const selects = form.querySelectorAll("select");
      const textareas = form.querySelectorAll("textarea");

      const allInputs = [...inputs, ...selects, ...textareas];
      //loop through each input
      allInputs.forEach((input) => {
        const inputXpath = getXPath(input, "form");
        //add an event listener to the input, so that when the value changes, it is saved to the object
        input.addEventListener("change", async (e) => {
          formData[inputXpath] = input.value;
          console.log("data in listener", data);
          await chrome.runtime.sendMessage({ handle, set: true, data });
        });
        //get the input xPath relative to the form
        formData[inputXpath] = input.value;
      });
    });

    console.log("data", data);
    //save the object to storage via the background script
    await chrome.runtime.sendMessage({ handle, set: true, data });
  }
})();
