const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');


const companySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    address1: { type: String, required: false },
    address2: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    without_vat: { type: Boolean, required: false },
    company_registration_number: { type: String, required: false },
    contact_name: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false},
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    settings: {
        default_template: { type: String, required: false, default: 'default_template' },
        default_currency: { type: String, required: false, default: 'EUR' },
        default_language: { type: String, required: false, default: 'en' },
        default_vat: { type: String, required: false, default: '21' },
        default_invoice_due_date_terms_type: { type: String, required: false, default: '+30' },
        default_payment_method: { type: String, required: false, default: 'bank_transfer' },
        default_bank_account: { type: String, required: false, default: '' },
        current_invoice_sequence: { type: Number, required: false, default: 1 }
    },


}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
