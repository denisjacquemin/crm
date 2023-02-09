module.exports = function(req, res, next) {
    res.locals.languages = req.i18n.t('do_not_translate.languages', { returnObjects: true })

    // if req.i18n.language is not found in the list of languages, then we fall back to the default language

    // get the language code from req.i18n.language
    const languageCode = req.i18n.language.split('-')[0];

    // check if the language code is found in the list of languages
    const languageFound = res.locals.languages.find(language => language.code_dnt === languageCode);

    // if the language is not found, then we fall back to the default language, if the default language is not found, then we use en-US as default
    if (!languageFound) {
        const defaultLanguage = res.locals.languages.find(language => language.default);
        if (defaultLanguage) {
            req.i18n.changeLanguage(defaultLanguage.code_dnt);
        } else {
            req.i18n.changeLanguage('en-US');
        }
    }

    // find the index of the current language in the res.locals.languages based on req.i18n.language
    res.locals.languages.forEach((language, index) => {
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