// ==UserScript==
// @name QA Popup - Main
// @namespace QA tools
// @version 1.0.2
// @description Create a popup for given cases
// @author Philip Berg
// @match https://www.stepstone.de/admin/admin_OfferCategoryEdit.cfm?id=*
// @match https://www.stepstone.de/5/index.cfm?event=listing.listingoverviewbo.dspListingQualityCheck*
// @grant none
// ==/UserScript==
(function () {
    'use strict';

    // css
    document.head.insertAdjacentHTML("beforeend", `
    <style>
        .overlay {
            width: 100%;
            height: 100%;
            position: fixed;
            top: 0;
            left: 0;
            background-color: #000000ad;
            z-index: 100000;
        }

        .modal-window {
            background-color: white;
            width: 500px;
            height: auto;
            min-height: 200px;
            border: none;
            border-radius: 8px;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            z-index: 100001;
        }

        .modal-window__inner-wrapper {
            width: calc(100% - 30px);
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin-top: 50px;
            margin-bottom: 20px;
            gap: 20px;
        }

        .modal-window__inner-wrapper__close-icon {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 25px;
            height: 25px;
        }
          .modal-window__inner-wrapper__close-icon:hover {
            cursor: pointer;
        }
        .modal-window__inner-wrapper__close-icon svg {
            width: 100%;
            height: 100%;
        }
        .modal-window__inner-wrapper__tab-wrapper{
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .⚠ {
            position: relative;
            border-left: 0.70em solid transparent;
            border-right: 0.70em solid transparent;
            border-bottom: 1.35em solid yellow;
            top: -1em;
        }
        .⚠::before {
            content: "⚠";
            top: -5px;
            left: -12px;
            position: absolute;
            color: black;
            font-size: 2em;
            line-height: 1em;
        }
        .alert {
            padding: 20px;
            border-radius: 10px;
            font-family: Arial;
            font-weight: 700;
        }
        .alert-caution {
            background-color: #ffc3c3;

        }
        .alert-caution-orange {
            background-color: #ff8455;

        }
        .modal__warning-text{
            text-align: center;
            font-size: 25px;
            color: red;
            margin-top: -10px;
        }
    </style>
    `)

    // object for searching inside backoffice listings to determine wether listing has string included (i.e. veritreff/dreessommer)
    const SEARCH_OBJECT_BACKOFFICE_LISTINGS = [
        {
            string: "Veritreff",
            comment: "Veritreff: Bitte gesondert auf Informationen zur Anstellungsart und Arbeitszeit im Stellentitel achten!"
        },
        {
            string: "Drees",
            comment: "Drees Sommer: Drees Warnhinweis (Meldung anpassbar)"
        },
        {
            string: "Appcast",
            comment: "Appcast: Appcast Warnhinweis (Meldung anpassbar)"
        },
    ]

    // object for searching inside backoffice listings to determine wether listing has string included (i.e. veritreff/dreessommer)
    const SEARCH_OBJECT_WINDOW_ONLY = [
        {
            string: "Select ",
            comment: "Select Anzeige"
        },
        {
            string: "SelectPlus ",
            comment: "Select Plus Anzeige"
        },
    ]


    const checkSessionStorageNull = () => {
        return sessionStorage.getItem("listingAndComment") === null
    }

    const checkIsBackoffice = () => {
        let url = window.location.href
        return url.includes("dspListingQualityCheck")
    }

    const setNewSessionStorage = (props) => {
        let newSessionArr = []
        newSessionArr.push(
            {
                id: props.id,
                comment: props.comment
            },
        )
        sessionStorage.setItem("listingAndComment", JSON.stringify(newSessionArr))
    }

    const updateSessionStorage = (props) => {
        let store = JSON.parse(sessionStorage.getItem("listingAndComment"))
        if (!sessionStorage.getItem("listingAndComment").includes(props.id)) {
            store.push({
                id: props.id,
                comment: props.comment
            })
        }
        sessionStorage.setItem("listingAndComment", JSON.stringify(store))
    }

    const runBackofficeStringCheck = () => {
        SEARCH_OBJECT_BACKOFFICE_LISTINGS.map((obj, index) => {
            document.querySelectorAll("td.TxtNormalBlue.column-owner").forEach((c, i) => {
                if (c.lastChild.textContent.indexOf(obj.string) !== -1) {
                    if (!checkSessionStorageNull()) {
                        updateSessionStorage({ id: document.querySelectorAll("td.TxtNormalBlue.JB3.column-id")[i].innerText.replace(/\D/g, ""), comment: obj.comment })
                    }
                    else {
                        setNewSessionStorage({ id: document.querySelectorAll("td.TxtNormalBlue.JB3.column-id")[i].innerText.replace(/\D/g, ""), comment: obj.comment })
                    }
                }
                else if (document.querySelectorAll("td.TxtNormalBlue.column-company > a > strong")[i].textContent.indexOf(obj.string) !== -1) {
                    if (!checkSessionStorageNull()) {
                        updateSessionStorage({ id: document.querySelectorAll("td.TxtNormalBlue.JB3.column-id")[i].innerText.replace(/\D/g, ""), comment: obj.comment })
                    }
                    else {
                        setNewSessionStorage({ id: document.querySelectorAll("td.TxtNormalBlue.JB3.column-id")[i].innerText.replace(/\D/g, ""), comment: obj.comment })
                    }
                }
            })
        })
    }

    const closeModal = () => {
        document.querySelector("body > div.modal-window").remove()
        document.querySelector("body > div.overlay").remove()
    }

    const getStaticOptions = () => {
        let titleArray = document.querySelector("body > h2").innerText
        titleArray = titleArray.split("-")
        let product = titleArray[0]
        product.replace(/^\s+/, '').replace(/\s+$/, '')
        let checkObject = SEARCH_OBJECT_WINDOW_ONLY.filter((sow) => {
            return sow.string == product
        })
        if (checkObject != "") {
            return checkObject[0].comment
        }
        return false
    }

    const checkListingIdIsInStorage = (listingID) => {
        let sessionStore = sessionStorage.getItem("listingAndComment")
        if (sessionStore) {
            if (sessionStore.includes(listingID)) {
                let obj = JSON.parse(sessionStorage.getItem("listingAndComment")).filter(c => {
                    return c.id == listingID
                })
                setModalMain(obj[0].comment)
                return true
            }
            else {
                let opt = getStaticOptions()
                if (opt) {
                    setModalMain("Produkt beachten!")
                }
            }
        }
        else {
            let opt = getStaticOptions()
            if (opt) {
                setModalMain("Produkt beachten!")
            }
        }
    }

    const setModalWindow = (comment) => {

        let options = getStaticOptions()
        console.log(options)
        let finalAlert
        if (options) {
            finalAlert = `
            <div class="alert alert-caution-orange" role="alert">
                ${comment}
            </div>
            <div class="alert alert-caution" role="alert">
                ${options}
            </div>
            `
        }
        else {
            finalAlert = `
            <div class="alert alert-caution-orange" role="alert">
                ${comment}
            </div>`
        }
        let modalWindow = document.createElement("div")
        modalWindow.setAttribute("class", "modal-window")

        modalWindow.innerHTML = `
            <div class="modal-window__inner-wrapper">
                <span class="modal-window__inner-wrapper__close-icon">
                    <!--?xml version="1.0" ?--><svg height="512px" id="Layer_1" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M443.6,387.1L312.4,255.4l131.5-130c5.4-5.4,5.4-14.2,0-19.6l-37.4-37.6c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4  L256,197.8L124.9,68.3c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4L68,105.9c-5.4,5.4-5.4,14.2,0,19.6l131.5,130L68.4,387.1  c-2.6,2.6-4.1,6.1-4.1,9.8c0,3.7,1.4,7.2,4.1,9.8l37.4,37.6c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1L256,313.1l130.7,131.1  c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1l37.4-37.6c2.6-2.6,4.1-6.1,4.1-9.8C447.7,393.2,446.2,389.7,443.6,387.1z"></path></svg>
                </span>
                <span class="⚠"></span>
                <p class="modal__warning-text">Achtung!</p>
                ${finalAlert}
            </div>
        `
        document.body.appendChild(modalWindow)
        document.querySelector(".modal-window__inner-wrapper__close-icon").addEventListener("click", () => {
            closeModal()
        })
    }


    const setOverlay = () => {
        let overlay = document.createElement("div")
        overlay.setAttribute("class", "overlay")
        document.body.appendChild(overlay)
        overlay.addEventListener("click", () => {
            closeModal()
        })
    }

    const sanitizeListingID = () => {
        let ID = document.querySelector("body > h2 > b")
        ID.innerText.replace(/\D/g, "")
        return ID.innerText
    }


    const setModalMain = (comment) => {
        setOverlay()
        setModalWindow(comment)
    }
    if (checkIsBackoffice()) {
        runBackofficeStringCheck()
        setInterval(() => {
            runBackofficeStringCheck()
        }, 1000);
    }
    else {
        let sanitizedListingID = sanitizeListingID()
        checkListingIdIsInStorage(sanitizedListingID)
    }
})();
