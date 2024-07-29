const { response } = require('express');
const session = require('express-session');
const mongo = require('../services/lib/mongo');
const CompanyService = require('../services/companies.service');
const UserService = require('../services/users.service');


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
        const companyCreated = await CompanyService.create({
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: req.i18n.t('companies.controller.default_company_name'),
            country: req.session.user.country,
            vat_number: '',
            users: [req.session.user._id]
        });
        // add the company id to the user's companies array in Session and DB
        if (req.session.user.companies.indexOf(companyCreated._id.toString()) === -1) {
            req.session.user.companies.push(companyCreated._id.toString());
        }
        await UserService.updateCompanies(req.session.user._id, req.session.user.companies);        

        console.log('newCompanyAjax', companyCreated._id.toString(), req.session.user.companies);


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
        let updatedCompany = await CompanyService.update(company._id, req.body.value);
        updatedCompany = updatedCompany.toObject();

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
            ...company._doc,
            selected: company._id.toString() === req.session.current_company._id.toString()
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
        return res.status(200).json({ notification: { message: req.i18n.t('settings.invoices_default_invoice_due_date_terms_type_updated') }, type: 'success'});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.setDefaultInvoiceDueDateTermsType `, err.message);
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
    changeCurrentCompany,
    setDefaultInvoiceDueDateTermsType
}