const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');
const { DocumentTypesenseService } = require('../services/documents.typesense.service');

const paymentSchema = new mongoose.Schema({
    bank: { type: String, required: false },
    iban: { type: String, required: false },
    bic: { type: String, required: false },
});


const itemSchema = new mongoose.Schema({
    description: { type: String, required: false, default: '' },
    quantity: { type: String, required: false, default: 1 },
    unit_price: { type: String, required: false, default: 0 },
    reduction: { type: String, required: false, default: 0 },
    reduction_unit: { type: String, required: false, default: '%' },
    vat: { type: String, required: false, default: 0 },
    amountvat: { type: String, required: false, default: 0 },
    amountvatexcl: { type: String, required: false, default: 0 },
    amountvatincl: { type: String, required: false, default: 0 },
    order: { type: Number, required: true, default: 0 },
    form_automatic_computation: { type: Boolean, required: true, default: true },
});

const documentSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true },
    config: {
        template_name: { type: String, required: true, default: 'default_template' },
        buyer: {
            name: { type: String, required: false, default: '' },
            address: { type: String, required: false, default: '' },
            city: { type: String, required: false, default: '' },
            zip: { type: String, required: false, default: '' },
            country: { type: String, required: false, default: '' },
            vat_number: { type: String, required: false, default: '' },
            phone: { type: String, required: false, default: '' },
            email: {
                type: String,
                required: false,
                default: '',
                validate: {
                    validator: validateEmail || '',
                    message: props => `${props.value} is not a valid email address!`
                }
            },
        },
        seller: {
            name: { type: String, required: false, default: '' },
            address: { type: String, required: false, default: '' },
            city: { type: String, required: false, default: '' },
            zip: { type: String, required: false, default: '' },
            country: { type: String, required: false, default: '' },
            vat_number: { type: String, required: false, default: '' },
            phone: { type: String, required: false, default: '' },
            email: {
                type: String,
                required: false,
                default: '',
                validate: {
                    validator: validateEmail || '',
                    message: props => `${props.value} is not a valid email address!`
                }
            },
        },
        amounts: {
            subtotal: { type: String, required: false, default: 0 },
            totalvat: { type: String, required: false, default: 0  },
            total: { type: String, required: false, default: 0 },
        },
        payment: {
            type: [paymentSchema],
        },
        invoice_number: { type: String, required: false, default: '' }, // invoice number
        invoice_date: { type: Date, required: false, default: Date.now() },
        invoice_due_date: { 
            type: {
                value: { type: String, required: false, default: '' },
                terms_type: { type: String, required: false, default: '' }
            }, 
            required: false, 
            default: {} 
        },
        currency: { type: String, required: false, default: 'eur' },
        language: { type: String, required: false, default: 'en' },
        notes: { type: String, required: false, default: '' },
        footer: { type: String, required: false, default: '' },
        items: {
            type: [itemSchema],
            required: false,
            validate: {
                validator: function (v) {
                    return v.length === 0 || v.some(item => Object.keys(item.toJSON()).length > 1);
                },
                message: props => `At least one field besides 'order' is required for each item!`
            }
        },
    },
}, { timestamps: true });

documentSchema.post(['save', 'updateOne', 'updateMany', 'findOneAndUpdate'], async function (doc, next) {
    const documentTypesenseService = new DocumentTypesenseService();
    await documentTypesenseService.upsertDocument(doc);
    console.log('Document.post(save) ' + '%s has been saved in Typesense', doc._id);
});


const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
