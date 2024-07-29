function getCompanyRegistrationNumberLabels(req) {
    var country_codes = ['BE', 'FR', 'CA', 'NL', 'LU', 'DE', 'IT', 'ES', 'US', 'IE', 'AT', 'CH', 'PL', 'PT', 'SE', 'DK', 'NO', 'FI', 'HU', 'RO', 'BG', 'GR', 'CZ', 'SK', 'SI', 'HR', 'RS', 'BA', 'ME', 'AL', 'MK', 'XK', 'TR', 'RU', 'BY', 'UA', 'MD', 'LV', 'LT', 'EE', 'CY', 'MT', 'LI', 'IS', 'FO', 'GL', 'SJ', 'AX', 'DZ', 'MA', 'TN'];
    var company_registration_number_label_translations = [];
    country_codes.forEach(function(country_code) {
        company_registration_number_label_translations.push({country_code: country_code, label: req.i18n.t('users.views.signup2.company_registration_number_' + country_code)});
    });
    return {
        company_registration_number_label_translations: company_registration_number_label_translations
    };
}

module.exports = {
    getCompanyRegistrationNumberLabels,
}