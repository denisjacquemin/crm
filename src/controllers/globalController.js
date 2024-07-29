const UserService = require('../services/users.service');
const CompanyService = require('../services/companies.service');
const geoip = require('geoip-lite');
const { getCompanyRegistrationNumberLabels } = require('./utils/helper');
const { French } = require("flatpickr/dist/l10n/fr.js").default.fr




// Change current language with i18n.changeLanguage and store it session and db if logged in
async function changeLang(req, res, next) {

    try {
        // Get the lang parameter from the request body
        const lng= req.body.lng;

        // Check if the lang parameter is valid
        // if (!validator.isIn(lang, ['en', 'es', 'fr'])) {
        //     // If the lang parameter is not valid, set a flash message and redirect to the home page
        //     req.flash('messages', req.i18n.t('languages.invalid_language'));

        //     return res.status(200).send();
        // }

        // update in db only if user is logged in
        if (req.session.isAuth) {
            // Update the user's language in db
            console.log('req.session.user._id', req.session.user._id);
            await UserService.updateById(req.session
                .user._id, {language: lng});
            req.session.user.language = lng;
        }

        const referer = req.get('referer');
        const redirectUrl = referer.includes('lng=') ? referer.replace(/lng=\w+/g, `lng=${lng}`) : `${referer}?lng=${lng}`;
        console.log(redirectUrl);
        res.redirect(redirectUrl);
    } catch (err) {
        next(err);
    }

}

async function getTaxRatesByCountryCodes(req, res) {
    const { countries } = req.body;
    // get tax rates from translation files for each country code
    const taxRates = {};
    countries.forEach(code => {
        taxRates[code] = req.i18n.t(`taxrates:taxrates.${code}`, { returnObjects: true });
    });

    const countriesAndCodes = {};
    const allTaxRates = req.i18n.t('taxrates:taxrates', { returnObjects: true });
    Object.keys(allTaxRates).forEach(code => {
        countriesAndCodes[code] = allTaxRates[code].country;
    });

    res.status(200).send({ taxRates: taxRates, countries: countriesAndCodes });
}


async function settings(req, res) {
    try {
        const tabid = req.params.tabid;

        // Get the user's companies ids and then build sellers array from companies ids
        const companiesIds = req.session.user.companies;
        const sellers = await CompanyService.getByIds(companiesIds);
        const geo = geoip.lookup(req.ip);//geoip.lookup('178.51.244.142');

        res.render('global/settings', {
            currentTab: tabid || 1,
            // oauthRegistered should be true if the user has registered with oauth
            oauthRegistered: req.session.user.google_id ? true : false,
            accountEmail: req.session.user.email,
            sellers: sellers,
            currentInvoiceSequence: req.session.current_company.settings.current_invoice_sequence,
            countries: req.i18n.t('countries:countries', { returnObjects: true }),
            frequentlySelectedCountries: req.i18n.t('countries:frequently_selected_countries', { returnObjects: true }),
            defaultCountry: geo && geo.country,
            ...getCompanyRegistrationNumberLabels(req),
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}


module.exports = {
    changeLang,
    settings,
    getTaxRatesByCountryCodes
};