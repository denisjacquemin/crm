const { response } = require('express');
const session = require('express-session');
const mongo = require('../services/lib/mongo');
const CompanyService = require('../services/companies.service');
const UserService = require('../services/users.service');
const geoip = require('geoip-lite');
const mongoose = require('mongoose');


async function updateInvoiceSequence(req, res, next) {
    // Destructure the email field from the request body
    const value = req.body.value;
    try {
        // Update company settings.current_invoice_sequence
        // await CompanyService.updateById(req.session.current_company._id, { settings: { current_invoice_sequence: value } });
        await CompanyService.updateById(req.session.current_company._id, { $set: { "settings.current_invoice_sequence": value } });

        // Update the current_invoice_sequence field on the user's session
        req.session.current_company.settings.current_invoice_sequence = value;

        // Send a success response
        return res.status(200).json({ message: req.i18n.t('settings.current_invoice_sequence_updated') });

    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.updateInvoiceSequence `, err.message);
        next(err);
    }
}

async function deleteAjax(req, res, next) {
    try {
        if (req.session.current_company.slug === req.params.slug) {
            return next({ 
                status: 403,
                message: 'Cannot delete current company', 
                notification: { message: req.i18n.t('companies.controller.cannot_delete_current_company'), type: 'error'}
            });
        }


        const company = await CompanyService.getBySlug(req.params.slug);
        if (!company) {
            return next({ 
                status: 404, 
                message: 'Company not found', 
                notification: { message: req.i18n.t('companies.controller.not_found'), type: 'error'}
            });
        }

        
        // Step 2: for all company.users, remove the company from the user.companies array  
        // by calling UserService.removeCompanyFromUser(userId, companyId)
        company.users.forEach(async (userId) => {
            await UserService.removeCompanyFromUser(userId.toString(), company._id.toString());
        });

        // remove the company from the user.companies array in Session  
        req.session.user.companies = req.session.user.companies.filter(companyId => {
            const isDifferent = companyId.toString() !== company._id.toString();
            return isDifferent;
          });
        const companyDeleted = await CompanyService.delete(company._id.toString());

        console.log('deleteAjax', company._id.toString(), req.session.user.companies);

        res.status(200).json(companyDeleted.toObject());
        
    } catch (error) {
        next(error);
    }
}

async function changeCurrentCompany(req, res, next) {
// this function update session with to the company id sent in the request body
    try {
        const company = await CompanyService.getBySlug(req.body.company_slug);
        if (!company) {
            return next({ 
                status: 404, 
                message: req.i18n.t('companies.controller.not_found'), 
                notification: { message: req.i18n.t('companies.controller.not_found'), type: 'error'}
            });
        }
        const userHasCompany = req.session.user.companies.includes(company._id.toHexString());
        if (!userHasCompany) {
            return next({
                status: 403,
                message: req.i18n.t('companies.controller.user_does_not_have_access'),
                notification: { message: req.i18n.t('companies.controller.user_does_not_have_access'), type: 'error'}
            });
        }

        req.session.current_company = company;
        res.status(200).json({ message: 'OK' });
    } catch (error) {
        next(error);
    }
}        

async function editAjax(req, res, next) {

    try {
        const company = await CompanyService.getBySlug(req.params.slug);
        if (!company) {
            return next({ 
                status: 404, 
                message: 'Company not found', 
                notification: { message: 'Company not found', type: 'error'}
            });
        }

        res.status(200).json(company.toObject());

    } catch (error) {
        next(error);
    }
};

async function newCompanyAjax(req, res, next) {
    try {
        
        const geo = geoip.lookup(req.ip);
        const frequentlySelectedCountries = req.i18n.t('countries:frequently_selected_countries', { returnObjects: true });
        const country = (geo && geo.country) || Object.keys(frequentlySelectedCountries)[0];
        const companyCreated = await CompanyService.create({
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: req.i18n.t('companies.controller.default_company_name'),
            country: country,
            vat_number: '',
            users: [req.session.user._id],
            tax_rates: [],
            settings: {
                default_currency: {
                    name: process.env.DEFAULT_CURRENCY_NAME,
                    label: process.env.DEFAULT_CURRENCY_LABEL,
                    symbol: process.env.DEFAULT_CURRENCY_SYMBOL
                },
            }
        });
        // add the company id to the user's companies array in Session and DB
        if (req.session.user.companies.indexOf(companyCreated._id.toString()) === -1) {
            req.session.user.companies.push(companyCreated._id.toString());
        }
        await UserService.updateCompanies(req.session.user._id, req.session.user.companies);

        res.status(200).json(companyCreated.toObject());
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        let company = await CompanyService.getBySlug(req.body.value.slug);

        if (!company) {
            return next({ status: 404, message: 'Company not found' });
        }

        if (req.body.value.settings) {
            if (req.body.value.settings.default_currency && typeof req.body.value.settings.default_currency === 'string') {
                req.body.value.settings.default_currency = JSON.parse(req.body.value.settings.default_currency);
            }    
        }


        let updatedCompany = await CompanyService.update(company._id, req.body.value);
        updatedCompany = updatedCompany.toObject();



        if (req.session.current_company.slug === updatedCompany.slug) {
            req.session.current_company = updatedCompany;
        }

        updatedCompany.autosave_updated_at = req.body.value.autosave_updated_at;

        res.status(200).json(updatedCompany);

    } catch (error) {
        next(error);
    }
}

async function getCurrentUserCompanies(req, res, next) {
    try {
        const companies = await CompanyService.getByIds(req.session.user.companies);
        const companiesWithSelected = companies.map(company => ({
            ...company.toJSON(),
            selected: company._id.toString() === req.session.current_company.id.toString()
        }));
        res.status(200).json(companiesWithSelected);
    } catch (error) {
        next(error);
    }
}

async function setDefaultInvoiceDueDateTermsType(req, res, next) {
    try {
        // Update company settings.default_invoice_due_date_terms_type
        await CompanyService.update(req.session
            .current_company._id, { $set: { "settings.default_invoice_due_date_terms_type": req.body.default_invoice_due_date_terms_type } });

        // Update the default_invoice_due_date_terms_type field on the user's session
        req.session.current_company.settings.default_invoice_due_date_terms_type = req.body.default_invoice_due_date_terms_type;

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.default_invoice_due_date_terms_type_updated'), type: 'success'}});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.setDefaultInvoiceDueDateTermsType `, err.message);
        next(err);
    }
}

async function saveOrUpdateTaxRate(req, res, next) {
    try {
        const taxrate = JSON.parse(req.body.taxrate);

        // Validate the taxrate object
        if (!taxrate || taxrate.value == null || !taxrate.label) {
            return res.status(400).json({ notification: { message: 'Invalid tax rate data', type: 'error' } });
        }

        // If the taxrate does not have an _id, generate a new one
        if (!taxrate._id) {
            taxrate._id = new mongoose.Types.ObjectId();
        }

        // Find the company and update the taxrate if it exists, otherwise push a new taxrate
        const updateResult = await CompanyService.findOneAndUpdate(
            { _id: req.session.current_company._id, "taxrates._id": taxrate._id },
            {
                $set: { "taxrates.$": taxrate }
            },
            { new: true }
        );
        
        // If the taxrate was not found and updated, push the new taxrate
        if (!updateResult) {
            await CompanyService.update(
                req.session.current_company._id,
                {
                    $push: { "taxrates": taxrate }
                }
            );
        }

        // Optionally, update the taxrates field on the user's session if needed
        console.log('req.session.current_company.taxrates', req.session.current_company.taxrates);
        console.log('taxrate._id.toString()', taxrate._id);
        const existingTaxrateIndex = req.session.current_company.taxrates.findIndex(tr => tr._id.toString() === taxrate._id.toString());
        if (existingTaxrateIndex !== -1) {
            req.session.current_company.taxrates[existingTaxrateIndex] = taxrate;
        } else {
            req.session.current_company.taxrates.push({ ...taxrate, _id: taxrate._id.toString() });
        }
        console.log('req.session.current_company.taxrates', req.session.current_company.taxrates);


        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.taxrate_saved'), type: 'success' }, taxrate: taxrate });
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in companiesController.saveOrUpdateTaxRate`, err.message);
        next(err);
    }
}

async function deleteTaxRate(req, res, next) {
    try {
        const taxrate = JSON.parse(req.body.taxrate);

        // Validate the taxrate object
        if (!taxrate || !taxrate._id) {
            return res.status(400).json({ notification: { message: 'Invalid tax rate data', type: 'error' } });
        }

        // Find the company and remove the taxrate
        const updateResult = await CompanyService.findOneAndUpdate(
            { _id: req.session.current_company._id },
            {
                $pull: { "taxrates": { _id: taxrate._id } }
            },
            { new: true }
        );

        // If the taxrate was not found and removed, return an error
        if (!updateResult) {
            return res.status(404).json({ notification: { message: 'Tax rate not found', type: 'error' } });
        }

        // Optionally, update the taxrates field on the user's session if needed
        const existingTaxrateIndex = req.session.current_company.taxrates.findIndex(tr => tr._id.toString() === taxrate._id.toString());
        if (existingTaxrateIndex !== -1) {
            req.session.current_company.taxrates.splice(existingTaxrateIndex, 1);
        }

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.taxrate_deleted'), type: 'success' } });
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in companiesController.deleteTaxRate`, err.message);
        next(err);
    }
}


async function showdeliverydate(req, res, next) {
    try {
        // Update company settings.show_delivery_date
        await CompanyService.update(req.session
            .current_company._id, { $set: { "settings.show_delivery_date": req.body.show_delivery_date } });

        // Update the show_delivery_date field on the user's session
        req.session.current_company.settings.show_delivery_date = req.body.show_delivery_date === 'true';

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.show_delivery_date_updated'), type: 'success' }});

    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.showdeliverydate `, err.message);
        next(err);
    }
}

async function showtargetinvoice(req, res, next) {
    try {
        // Update company settings.show_target_invoice
        await CompanyService.update(req.session
            .current_company._id, { $set: { "settings.show_target_invoice": req.body.show_target_invoice } });

        // Update the show_target_invoice field on the user's session
        req.session.current_company.settings.show_target_invoice = req.body.show_target_invoice === 'true';

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.show_target_invoice_updated'), type: 'success' }});

    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.showtargetinvoice `, err.message);
        next(err);
    }
}

async function defaultnotesoninvoice(req, res, next) {
    try {
        // Update company settings.default_notes_on_invoice
        await CompanyService.update(req.session
            .current_company._id, { $set: { "settings.default_notes_on_invoice": req.body.default_notes_on_invoice } });

        // Update the default_notes_on_invoice field on the user's session
        req.session.current_company.settings.default_notes_on_invoice = req.body.default_notes_on_invoice;

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.default_notes_on_invoice_updated'), type: 'success' }});

    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.defaultnotesoninvoice `, err.message);
        next(err);
    }
}

async function defaultnotesoncreditnotes(req, res, next) {
    try {
        // Update company settings.default_notes_on_credit_notes
        await CompanyService.update(req.session
            .current_company._id, { $set: { "settings.default_notes_on_credit_notes": req.body.default_notes_on_credit_notes } });

        // Update the default_notes_on_credit_notes field on the user's session
        req.session.current_company.settings.default_notes_on_credit_notes = req.body.default_notes_on_credit_notes;

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.default_notes_on_credit_notes_updated'), type: 'success' }});

    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in companiesController.defaultnotesoncreditnotes `, err.message);
        next(err);
    }
}

async function defaulttaxrate(req, res, next) {
    try {
        console.log('test0', req.body.default_taxrate);
        const defaultTaxrateObjectId = new mongoose.Types.ObjectId(req.body.default_taxrate);

        // Update company settings.default_vat_rate
        await CompanyService.update(req.session
            .current_company._id, { $set: { "default_taxrate": defaultTaxrateObjectId } });

        // Update the default_vat_rate field on the user's session
        req.session.current_company.default_taxrate = req.body.default_taxrate;

        // Send a success response
        return res.status(200).json({ notification: { message: req.i18n.t('companies.controller.default_vat_rate_updated'), type: 'success' }});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in companiesController.defaultaxtrate `, err.message);
        next(err);
    }
}

module.exports = {
    updateInvoiceSequence,
    editAjax,
    deleteAjax,
    newCompanyAjax,
    update,
    getCurrentUserCompanies,
    defaultnotesoninvoice,
    defaultnotesoncreditnotes,
    changeCurrentCompany,
    setDefaultInvoiceDueDateTermsType,
    showdeliverydate,
    showtargetinvoice,
    saveOrUpdateTaxRate,
    defaulttaxrate,
    deleteTaxRate
}