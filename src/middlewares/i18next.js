const i18next = require('i18next');
const i18Middleware = require('i18next-http-middleware');
const i18nBackend = require('i18next-fs-backend');
const path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');

const sessionLanguageDetector = {
    name: 'sessionLanguageDetector',
    lookup(req, res, options) {
      if (req.session && req.session.user && req.session.user.language) {
        if (req.session.user.language.trim() !== '') {
          return req.session.user.language;
        }
      }
      return null;
    }
  };

// Create a new instance of LanguageDetector
var lngDetector = new i18Middleware.LanguageDetector();
// Add your custom detector
lngDetector.addDetector(sessionLanguageDetector);


i18next.use(i18nBackend)
    .use(lngDetector)
    .init({
        detection: {
            order: ['sessionLanguageDetector', 'querystring', 'cookie', 'header'],
            // Register the custom detector
            detectors: [sessionLanguageDetector],
            lookupCookie: 'lng',
            caches: ['cookie']
        },
        partialBundledLanguages: true,
        ns: ['translation', 'taxrates', 'countries', 'currencies'],
        defaultNS: 'translation',
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
    
module.exports = i18Middleware.handle(i18next);