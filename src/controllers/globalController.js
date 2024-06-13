const { get } = require('../services/lib/mongo');
const UserService = require('../services/users.service');
const CompanyService = require('../services/companies.service');
const geoip = require('geoip-lite');


// Change current language with i18n.changeLanguage and store it session and db if logged in
async function changeLang(req, res) {
    // Get the lang parameter from the request body
    const { lng } = req.body;

    // Check if the lang parameter is valid
    // if (!validator.isIn(lang, ['en', 'es', 'fr'])) {
    //     // If the lang parameter is not valid, set a flash message and redirect to the home page
    //     req.flash('messages', req.i18n.t('languages.invalid_language'));

    //     return res.status(200).send();
    // }

    // update in db only if user is logged in
    if (req.session.isAuth) {

        // Get the user by their id
        const user = await UserService.getById(req.session
            .userId);

        // Update the user's language in db
        await UserService.updateLanguage(user._id, lang);
    }

    const referer = req.get('referer');
    const redirectUrl = referer.includes('lng=') ? referer.replace(/lng=\w+/g, `lng=${lng}`) : `${referer}?lng=${lng}`;

    res.redirect(redirectUrl);


}

async function getTaxRatesByCountryCodes(req, res) {
    const { countries } = req.body;
    // get tax rates froom translation files for each country code
    const taxRates = {};
    countries.forEach(code => {
        taxRates[code] = req.i18n.t(`taxrates:${code}`,  { returnObjects: true });
    });
    res.status(200).send(taxRates);
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
            countries: req.i18n.t('buyers.views.countries',  { returnObjects: true }),
            frequentlySelectedCountries: req.i18n.t('buyers.views.frequently_selected_countries',  { returnObjects: true }),
            defaultCountry: geo && geo.country,
            ...getCompanyRegistrationNumberLabels(req),
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

function getCompanyRegistrationNumberLabels(req){
    // get all translations that begin with users.views.signup2.company_registration_number_ + each country_code and put them in an object 
    // and return the object
    var country_codes = ['BE', 'FR', 'CA', 'NL', 'LU', 'DE', 'IT', 'ES', 'US', 'IE', 'AT', 'CH', 'PL', 'PT', 'SE', 'DK', 'NO', 'FI', 'HU', 'RO', 'BG', 'GR', 'CZ', 'SK', 'SI', 'HR', 'RS', 'BA', 'ME', 'AL', 'MK', 'XK', 'TR', 'RU', 'BY', 'UA', 'MD', 'LV', 'LT', 'EE', 'CY', 'MT', 'LI', 'IS', 'FO', 'GL', 'SJ', 'AX', 'DZ', 'MA', 'TN'];
    var company_registration_number_label_translations = []
    country_codes.forEach(function(country_code){
        company_registration_number_label_translations.push({country_code: country_code, label: req.i18n.t('users.views.signup2.company_registration_number_' + country_code )});
    });
    return {
        company_registration_number_label_translations: company_registration_number_label_translations
    }
}

module.exports = {
    changeLang,
    settings,
    getTaxRatesByCountryCodes
};