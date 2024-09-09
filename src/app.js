import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { autocompletion } from '@codemirror/autocomplete'

const geocachingCssFiles = [
    'https://fonts.googleapis.com/css?family=Noto+Sans:400,700&subset=latin,latin-ext',
    'https://www.geocaching.com/content/coreCSS',
]

let copyBtn = document.getElementById('copy'),
    shadowPreview = document.getElementById('previewContainer').attachShadow({ mode: 'open' }),
    view

const initialDocument = `<h1 style="color: chocolate">Your Geocache title</h1>

<p style="margin: 1em 0 0 0;">You can edit the content of the title above and this paragraph.</p>`

document.addEventListener('DOMContentLoaded', () => {
    let doc = initialDocument
    if (
        storageAvailable('localStorage') &&
        localStorage.getItem('content') &&
        localStorage.getItem('content').trim().length > 0
    ) {
        doc = localStorage.getItem('content')
    }

    view = new EditorView({
        doc,
        extensions: [
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            lineNumbers(),
            html(),
            EditorView.lineWrapping,
            oneDark,
            autocompletion({}),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    if (storageAvailable('localStorage')) {
                        localStorage.setItem('content', update.state.doc.toString().trim())
                    }
                    applyPreview(update.state.doc.toString())
                }
            }),
        ],
        parent: document.querySelector('#inputText'),
    })

    initPreview()
    applyPreview(view.state.doc.toString())

    if (!isCopyAvailable()) {
        copyBtn.style.display = 'none'
    } else {
        copyBtn.addEventListener('click', copyToClipboard)
    }
})

const initPreview = () => {
    let html = document.createElement('html'),
        head = document.createElement('head'),
        body = document.createElement('body')

    html.appendChild(head)

    geocachingCssFiles.forEach((cssFile) => {
        let linkElem = document.createElement('link')
        linkElem.setAttribute('rel', 'stylesheet')
        linkElem.setAttribute('href', cssFile)
        head.appendChild(linkElem)
    })

    let userSuppliedContent = document.createElement('div')
    userSuppliedContent.classList.add('UserSuppliedContent')

    let longDescription = userSuppliedContent.appendChild(document.createElement('span'))
    longDescription.setAttribute('id', 'ctl00_ContentBody_LongDescription')

    userSuppliedContent.appendChild(longDescription)

    body.appendChild(userSuppliedContent)

    html.appendChild(body)

    shadowPreview.appendChild(html)
}

const applyPreview = (content) => {
    // if (content.length === 0) {
    //   return;
    // }

    shadowPreview.getElementById('ctl00_ContentBody_LongDescription').innerHTML = content
}

// const cleanInput = (content) => {
//   let parser = new DOMParser();
//   let doc = parser.parseFromString(content, "text/html");

//   let tags = doc.querySelectorAll("script");
//   tags.forEach((tag) => {
//     tag.remove();
//   });
// };

const storageAvailable = (type) => {
    let storage
    try {
        storage = window[type]
        let x = '__storage_test__'
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            storage &&
            storage.length !== 0
        )
    }
}

const isCopyAvailable = () => {
    return navigator && navigator.clipboard && navigator.clipboard.writeText
}

const copyToClipboard = () => {
    navigator.clipboard.writeText(view.state.doc.toString())
    document.getElementById('copy').innerHTML = '📋 Copied!'
    window.setTimeout(() => {
        document.getElementById('copy').innerHTML = '📋 Copy'
    }, 1000)
}

const modals = document.querySelectorAll('[data-modal]')
modals.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
        event.preventDefault()
        const modal = document.getElementById(trigger.dataset.modal)
        modal.classList.add('modal-open')
        const exits = modal.querySelectorAll('.modal-exit')
        exits.forEach(function (exit) {
            exit.addEventListener('click', function (event) {
                event.preventDefault()
                modal.classList.remove('modal-open')
            })
        })
    })
})
