/* global CodeMirror */

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
  let htmlCodeMirror = CodeMirror.fromTextArea(inputText, {
    autofocus: true,
    dragDrop: false,
    extraKeys: { "Ctrl-Space": "autocomplete" },
    lineNumbers: true,
    lineWrapping: true,
    mode: "text/html",
    styleActiveLine: true,
    theme: "material-darker",
  });

  htmlCodeMirror.refresh();
  htmlCodeMirror.on("change", (e) => {
    applyPreview(e.getValue());
  });

  initPreview();
  applyPreview(inputText.value);

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

  let style = document.createElement("style");
  style.textContent = `
  html {
    line-height: normal !important;
  }
  UserSuppliedContent {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #fff;
    color: #4a4a4a;
    font-size: 0.875rem;
    line-height: 1.3;
    position: relative;
}`;
  shadowPreview.appendChild(style);

  let wrapper = document.createElement("div");
  wrapper.setAttribute("id", "preview");
  shadowPreview.appendChild(wrapper);
};

const applyPreview = (content) => {
  // if (content.length === 0) {
  //   return;
  // }

  shadowPreview.getElementById("preview").innerHTML = `
  <div class="UserSuppliedContent">
      <span id="ctl00_ContentBody_LongDescription">${content}</span>
  </div>`;
};

// const cleanInput = (content) => {
//   let parser = new DOMParser();
//   let doc = parser.parseFromString(content, "text/html");

//   let tags = doc.querySelectorAll("script");
//   tags.forEach((tag) => {
//     tag.remove();
//   });
// };

const isCopyAvailable = () => {
  return navigator && navigator.clipboard && navigator.clipboard.writeText;
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(inputText.value);
  document.getElementById("copy").innerHTML = "📋 Copied!";
  window.setTimeout(() => {
    document.getElementById("copy").innerHTML = "📋 Copy";
  }, 1000);
};

const modals = document.querySelectorAll("[data-modal]");
modals.forEach(function (trigger) {
  trigger.addEventListener("click", function (event) {
    event.preventDefault();
    const modal = document.getElementById(trigger.dataset.modal);
    modal.classList.add("modal-open");
    const exits = modal.querySelectorAll(".modal-exit");
    exits.forEach(function (exit) {
      exit.addEventListener("click", function (event) {
        event.preventDefault();
        modal.classList.remove("modal-open");
      });
    });
  });
});
