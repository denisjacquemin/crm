const session = require("express-session");


module.exports = function(req, res, next) {

    res.locals.i18n_languages = process.env.TRANSLATION_i18_CODE ? process.env.TRANSLATION_i18_CODE.split(',') : ['en'];

    // if req.i18n.language is not found in the list of languages, then we fall back to the default language

    // get the language code from req.i18n.language
    const languageCode = req.i18n.language.split('-')[0];

    // check if the language code is found in the list of languages
    const languageFound = res.locals.i18n_languages.find(language => language === languageCode);

    // if the default language is not found, then we use en as default
    if (!languageFound) {
        req.i18n.changeLanguage('en');
    }

    // find the index of the current language in the res.locals.languages based on req.i18n.language
    res.locals.i18n_languages.forEach((language, index) => {
        // req.i18n.language should be normalize by removing the region part
        // for example, if req.i18n.language is 'en-US', then we should normalize it to 'en'
        // so that we can compare it with the language.code

        // get the language code from req.i18n.language
        const languageCode = req.i18n.language.split('-')[0];

        if (language.code_dnt === languageCode) {
            res.locals.currentIndex = index;
        }
    });

    next();
};