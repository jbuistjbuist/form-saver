
(async () => {await chrome.runtime.sendMessage({ message: "hello" }, (response) => {
  console.log("response", response);
})})();

//credit to Ab. Karim, https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82 for this xpath function
function getXPath(element) {
  let selector = "";
  let foundRoot;
  let current = element;

  do {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;

    if (parent.childElementCount > 1) {
      const siblings = parent.children;
      let tagArr = [];
      siblings.forEach((el) => {
        if (el.tagName.toLowerCase() === tag) {
          tagArr.push(el);
        }
      });
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
    foundRoot = parent.tagName.toLowerCase() === "html";
    // Finish selector if found root element
    if (foundRoot) selector = `/html${selector}`;
  } while (!foundRoot);

  return selector;
}

//get the handle from the url
const handle = window.location.href + "formsaver📌";

//find any forms on the page
const forms = document.querySelectorAll("form");

const localObj = JSON.parse(localStorage.getItem(handle));

if (localObj) {
} else {
  //create an object to store the form data
  const data = {};

  //loop through each form
  forms.forEach((form) => {
    //get the form id
    const formXpath = getXPath(form);
    data[formXpath] = {};
    const formData = data[formXpath];

    //get all the inputs in the form
    const inputs = form.querySelectorAll("input");
    const selects = form.querySelectorAll("select");
    const textareas = form.querySelectorAll("textarea");

    const allInputs = [...inputs, ...selects, ...textareas];

    //loop through each input
    allInputs.forEach((input) => {
      //get the input xPath
      const inputXpath = getXPath(input);
      formData[inputXpath] = input.value;
    });
  });

  //save the object to local storage
  localStorage.setItem(handle, JSON.stringify(obj));
}
