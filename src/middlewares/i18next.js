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
  },
};

// Create a new instance of LanguageDetector
var lngDetector = new i18Middleware.LanguageDetector();
// Add your custom detector
lngDetector.addDetector(sessionLanguageDetector);

const i18n_languages = process.env.TRANSLATION_i18_CODE
  ? process.env.TRANSLATION_i18_CODE.split(',')
  : ['en'];
console.log('i18n_languages', i18n_languages);

i18next
  .use(i18nBackend)
  .use(lngDetector)
  .init({
    detection: {
      order: ['sessionLanguageDetector', 'querystring', 'cookie', 'header'],
      detectors: [sessionLanguageDetector],
      lookupCookie: 'lng',
      caches: ['cookie'],
      cookieOptions: {
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    partialBundledLanguages: true,
    ns: [
      'translation',
      'taxrates',
      'countries',
      'currencies',
      'languages',
      'all_languages',
      'custom_settings',
    ],
    defaultNS: 'translation',
    backend: {
      loadPath: `${rootDir}/locales/{{lng}}/{{ns}}.json`,
      addPath: `${rootDir}/locales/{{lng}}/{{ns}}.missing.json`,
    },
    fallbackLng: 'en',
    // nonExplicitSupportedLngs: true,
    // supportedLngs: ['en', 'de'],

    load: 'languageOnly',
    saveMissing: true,
    nonExplicitSupportedLngs: true,
    preload: i18n_languages,
  });

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  // Fetch the translated size units
  const sizes = i18next.t('sizes', { returnObjects: true });

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  // Calculate the formatted size
  const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));

  return `${formattedSize} ${sizes[i]}`;
}

module.exports = {
  i18nMiddleware: i18Middleware.handle(i18next),
  formatBytes,
  i18next,
};
