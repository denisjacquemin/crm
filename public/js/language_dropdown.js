async function selectedLangChanged(lang) {
    // set the lang param to the lang input hidden field and submit the form
    document.getElementById("lang").value = lang;
    document.getElementById("lang-form").submit();
}

function getSelectedLang() {
    // get the current language from req.18n.language



    // return the current selected language code based on req.i18.language
    return document.getElementById("lang").value;

}