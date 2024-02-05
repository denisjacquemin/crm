const { response } = require('express');
const session = require('express-session');
const mongo = require('../services/lib/mongo');
const CompanyService = require('../services/companies.service');


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



module.exports = {
    updateInvoiceSequence,
}