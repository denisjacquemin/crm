const UserService = require('../services/users.service');
const CompanyService = require('../services/companies.service');
const FileService = require('../services/files.service');
const geoip = require('geoip-lite');
const i18next = require('i18next');

// Change current language with i18n.changeLanguage and store it session and db if logged in
async function changeLang(req, res, next) {
  try {
    // Get the lang parameter from the request body
    const lng = req.body.lng;

    // update in db only if user is logged in
    if (req.session.isAuth) {
      // Update the user's language in db
      await UserService.updateById(req.session.user._id, { language: lng });
    }

    if (req.session.user) {
      // If user exists, update only the language property
      req.session.user = {
        ...req.session.user,
        language: lng,
      };
    } else {
      // If user doesn't exist yet, create a new user object with only the language
      req.session.user = { language: lng };
    }

    const referer = req.get('referer');
    const redirectUrl = referer.includes('lng=')
      ? referer.replace(/lng=\w+/g, `lng=${lng}`)
      : `${referer}?lng=${lng}`;
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
}

async function staticData(req, res) {
  const data = {
    countries: req.i18n.t('countries:countries', { returnObjects: true }),
    frequentlySelectedCountries: req.i18n.t('countries:frequently_selected_countries', {
      returnObjects: true,
    }),
    currencies: req.i18n.t('currencies:currencies', { returnObjects: true }),
    languages: req.i18n.t('languages:all_languages', { returnObjects: true }),
    frequentlySelectedLanguages: req.i18n.t('languages:frequently_selected_languages', {
      returnObjects: true,
    }),
    choose_languages_dropdown: req.i18n.t('languages:choose_languages_dropdown', {
      returnObjects: true,
    }),
    languages: req.i18n.t('languages:all_languages', { returnObjects: true }),
    i18n_languages: process.env.TRANSLATION_i18_CODE.split(','),
    all_languages: req.i18n.t('all_languages:all_languages', { returnObjects: true }),
    company_form_settings: req.i18n.t('custom_settings:company_form', { returnObjects: true }),
    buyer_form_settings: req.i18n.t('custom_settings:buyer_form', { returnObjects: true }),
  };
  const jsContent = `window.staticData = ${JSON.stringify(data)};`;
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(jsContent);
}

async function settings(req, res) {
  try {
    const tabid = req.params.tabid;

    // Get the user's companies ids and then build sellers array from companies ids
    const companiesIds = req.session.user.companies;
    const sellers = await CompanyService.getByIds(companiesIds);
    const geo = geoip.lookup(req.ip);
    const frequentlySelectedCountries = req.i18n.t('countries:frequently_selected_countries', {
      returnObjects: true,
    });

    // Calculate invoice prefix with the same logic as buildDocumentPrefix
    const invoicePrefix =
      req.session.current_company.settings.invoice.prefix === undefined
        ? process.env.DEFAULT_INVOICE_PREFIX_FORMAT.replaceAll(
            '[DOCUMENT_TYPE]',
            req.i18n.t('common.invoice_short')
          )
        : req.session.current_company.settings.invoice.prefix;

    const creditNotePrefix =
      req.session.current_company.settings.credit_note.prefix === undefined
        ? process.env.DEFAULT_CREDIT_NOTE_PREFIX_FORMAT.replaceAll(
            '[DOCUMENT_TYPE]',
            req.i18n.t('common.credit_note_short')
          )
        : req.session.current_company.settings.credit_note.prefix;

    const quotePrefix =
      req.session.current_company.settings.quote.prefix === undefined
        ? process.env.DEFAULT_QUOTE_PREFIX_FORMAT.replaceAll(
            '[DOCUMENT_TYPE]',
            req.i18n.t('common.quote_short')
          )
        : req.session.current_company.settings.quote.prefix;

    res.render('global/settings', {
      currentTab: tabid || 1,
      oauthRegistered: req.session.user.google_id ? true : false,
      accountEmail: req.session.user.email,
      sellers: sellers,
      document_types: req.i18n.t('common.document_types', { returnObjects: true }),
      sizes: req.i18n.t('common.sizes', { returnObjects: true }),
      currentInvoiceSequence: req.session.current_company.settings.current_invoice_sequence,
      currentCreditNoteSequence: req.session.current_company.settings.current_credit_note_sequence,
      defaultCountry: (geo && geo.country) || Object.keys(frequentlySelectedCountries)[0],
      taxRates: req.i18n.t('taxrates:taxrates', { returnObjects: true }),
      layout: false,
      invoicePrefix: invoicePrefix,
      invoiceResetYearly: req.session.current_company.settings.invoice.reset_yearly,
      invoiceSequenceIncrement: req.session.current_company.settings.invoice.sequence_increment,
      creditNotePrefix: creditNotePrefix,
      creditNoteResetYearly: req.session.current_company.settings.credit_note.reset_yearly,
      creditNoteSequenceIncrement:
        req.session.current_company.settings.credit_note.sequence_increment,
      quotePrefix: quotePrefix,
      quoteResetYearly: req.session.current_company.settings.quote.reset_yearly,
      quoteSequenceIncrement: req.session.current_company.settings.quote.sequence_increment,
      show_delivery_date: req.session.current_company.settings?.show_delivery_date,
      show_contact_person: req.session.current_company.settings?.show_contact_person,
      show_seller_email: req.session.current_company.settings?.show_seller_email,
      show_seller_website: req.session.current_company.settings?.show_seller_website,
      show_seller_phone: req.session.current_company.settings?.show_seller_phone,
      show_iban: req.session.current_company.settings?.show_iban,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

module.exports = {
  changeLang,
  settings,
  staticData,
};
