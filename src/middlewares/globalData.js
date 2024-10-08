
module.exports = async function(req, res, next) {

    res.locals.countries = req.i18n.t('countries:countries',  { returnObjects: true });
    res.locals.frequentlySelectedCountries = req.i18n.t('countries:frequently_selected_countries', { returnObjects: true });
    res.locals.defaultCurrency = req.session.current_company.settings.default_currency;
    res.locals.frequentlySelectedCurrencies = req.i18n.t('currencies:frequently_selected_currencies', { returnObjects: true });
    res.locals.currencies = req.i18n.t('currencies:currencies', { returnObjects: true });
    const currentCompanyCountry = req.session.current_company.country;
    const defaultTaxrate = req.session.current_company.default_taxrate || res.locals.countries[currentCompanyCountry].default_taxrate;
    res.locals.default_taxrate = defaultTaxrate;
    next();
};