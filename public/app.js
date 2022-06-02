const geocachingCssFiles = [
  "https://fonts.googleapis.com/css?family=Noto+Sans:400,700&subset=latin,latin-ext",
  "https://www.geocaching.com/content/coreCSS",
];

let inputText = document.getElementById("inputText"),
  copyBtn = document.getElementById("copy"),
  shadowPreview = document
    .getElementById("previewContainer")
    .attachShadow({ mode: "open" });
document.addEventListener("DOMContentLoaded", () => {
  initPreview();

  applyPreview(inputText.value);

  inputText.addEventListener("input", (e) => {
    if (e.isComposing) {
      return;
    }
    applyPreview(e.target.value);
  });

  if (!isCopyAvailable()) {
    copyBtn.style.display = "none";
  } else {
    copyBtn.addEventListener("click", copyToClipboard);
  }
});

const initPreview = () => {
  geocachingCssFiles.forEach((cssFile) => {
    let linkElem = document.createElement("link");
    linkElem.setAttribute("rel", "stylesheet");
    linkElem.setAttribute("href", cssFile);
    shadowPreview.appendChild(linkElem);
  });

  let wrapper = document.createElement("div");
  wrapper.setAttribute("id", "preview");
  shadowPreview.appendChild(wrapper);
};

const applyPreview = (content) => {
  if (content.length === 0) {
    return;
  }

  shadowPreview.getElementById("preview").innerHTML = `
  <div class="UserSuppliedContent">
      <span id="ctl00_ContentBody_LongDescription">${content}</span>
  </div>`;
};

const isCopyAvailable = () => {
  return navigator && navigator.clipboard && navigator.clipboard.writeText;
};

const copyToClipboard = () => {
  document.getElementById("copied").style.display = "inline";
  navigator.clipboard.writeText(inputText.value);
  window.setTimeout(() => {
    document.getElementById("copied").style.display = "none";
  }, 1000);
};
