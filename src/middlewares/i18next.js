const i18next = require('i18next');
const i18Middleware = require('i18next-http-middleware');
const i18nBackend = require('i18next-fs-backend');
const path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');


i18next.use(i18nBackend)
    .use(i18Middleware.LanguageDetector)
    .init({
        partialBundledLanguages: true,
        ns: ['translation', 'taxrates', 'countries'],
        defaultNS: 'translation',
        detection: {
            lookupCookie: 'lng',
            caches: ['cookie']
        },
        backend: {
            loadPath: `${rootDir}/locales/{{lng}}/{{ns}}.json`,
            addPath: `${rootDir}/locales/{{lng}}/{{ns}}.missing.json`
        },
        fallbackLng: 'en',
        // nonExplicitSupportedLngs: true,
        // supportedLngs: ['en', 'de'],

        load: 'languageOnly',
        saveMissing: true,
        nonExplicitSupportedLngs: true
    });

// i18next.on('initialized', function(options) {
//     // Once i18next is initialized, try fetching a translation
//     console.log('@@@@@@@@@@@@@@@@@@@@: ' + i18next.t('countries:test')); // Should log "United States" if the setup is correct
// });
    
module.exports = i18Middleware.handle(i18next);