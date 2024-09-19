const mongoose = require('mongoose');
const { currencySchema } = require('./document.model');


const schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    }
};

const companySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    internal_name: { type: String, required: false },
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
    logo: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
    settings: {
        default_template: { type: String, required: false, default: 'default_template' },
        default_currency: { type: currencySchema, required: false, default: {
            name: process.env.DEFAULT_CURRENCY_NAME,
            label: process.env.DEFAULT_CURRENCY_LABEL,
            symbol: process.env.DEFAULT_CURRENCY_SYMBOL
        } },
        show_delivery_date: { type: Boolean, required: false, default: true },
        show_target_invoice: { type: Boolean, required: false, default: true },
        default_language: { type: String, required: false, default: 'en' },
        default_notes_on_invoice: { type: String, required: false, default: '' },
        default_notes_on_credit_notes: { type: String, required: false, default: '' },
        default_vat: { type: String, required: false, default: '21' },
        default_invoice_due_date_terms_type: { type: String, required: false, default: '+30' },
        default_payment_method: { type: String, required: false, default: 'bank_transfer' },
        default_bank_account: { type: String, required: false, default: '' },
        current_invoice_sequence: { type: Number, required: false, default: 1 },
        current_credit_note_sequence: { type: Number, required: false, default: 1 },
        default_invoice_due_date_terms_type: { type: String, required: false, default: '+30' }
    },


}, schemaOptions);

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
