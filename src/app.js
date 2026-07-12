import { autocompletion } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import i18next from 'i18next'
import Fetch from 'i18next-fetch-backend'

const i18nextOptions = {
    // path where resources get loaded from, or a function
    // returning a path:
    // function(lngs, namespaces) { return customPath; }
    // the returned path will interpolate lng, ns if provided like giving a static path
    loadPath: 'assets/locales/fr.json',

    // parse data after it has been fetched
    // in example use https://www.npmjs.com/package/json5
    // here it removes the letter a from the json (bad idea)
    // parse: function (data) {
    //     return data.replace(/a/g, '')
    // },

    // path to post missing resources
    // addPath: 'assets/locales/add/{{lng}}/{{ns}}',

    // define how to stringify the data when adding missing resources
    stringify: JSON.stringify,

    // your backend server supports multiloading
    // /locales/resources.json?lng=de+en&ns=ns1+ns2
    allowMultiLoading: false, // set loadPath: '/locales/resources.json?lng={{lng}}&ns={{ns}}' to adapt to multiLoading

    multiSeparator: '+',

    // init option for fetch, for example
    requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default',
    },

    // define a custom fetch function
    fetch: (url, options, callback) => {},
}

i18next.use(Fetch).init({
    backend: i18nextOptions,
})

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
    const html = document.createElement('html'),
        head = document.createElement('head'),
        body = document.createElement('body')

    html.appendChild(head)

    geocachingCssFiles.forEach((cssFile) => {
        const linkElem = document.createElement('link')
        linkElem.setAttribute('rel', 'stylesheet')
        linkElem.setAttribute('href', cssFile)
        head.appendChild(linkElem)
    })

    const userSuppliedContent = document.createElement('div')
    userSuppliedContent.classList.add('UserSuppliedContent')

    const longDescription = userSuppliedContent.appendChild(document.createElement('span'))
    longDescription.setAttribute('id', 'ctl00_ContentBody_LongDescription')

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
        const x = '__storage_test__'
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

document.querySelectorAll('.theme-toggle [data-set-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.setTheme
        document.documentElement.setAttribute('data-theme', theme)
        if (storageAvailable('localStorage')) {
            localStorage.setItem('theme', theme)
        }
    })
})

const modals = document.querySelectorAll('[data-modal]')
modals.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault()
        const modal = document.getElementById(trigger.dataset.modal)
        modal.classList.add('modal-open')
        const exits = modal.querySelectorAll('.modal-exit')
        exits.forEach((exit) => {
            exit.addEventListener('click', (event) => {
                event.preventDefault()
                modal.classList.remove('modal-open')
            })
        })
    })
})
