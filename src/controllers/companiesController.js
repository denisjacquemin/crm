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
        });
        // add the company id to the user's companies array
        req.session.user.companies.push(companyCreated._id);
        // also in db
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
        console.log('updating company', req.body.value);
        let updatedCompany = await CompanyService.update(company._id, req.body.value);
        updatedCompany = updatedCompany.toObject();

        updatedCompany.autosave_updated_at = req.body.value.autosave_updated_at;
        res.status(200).json(updatedCompany);

    } catch (error) {
        next(error);
    }
}

module.exports = {
    updateInvoiceSequence,
    editAjax,
    newCompanyAjax,
    update
}