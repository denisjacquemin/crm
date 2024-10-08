const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');
const { DocumentsTypesenseService } = require('../services/documents.typesense.service');

const dayjs = require('dayjs');

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

const paymentSchema = new mongoose.Schema({
    bank: { type: String, required: false },
    iban: { type: String, required: false },
    bic: { type: String, required: false },
}, { _id: false });

const taxrateSchema = new mongoose.Schema({
    value: { type: String, required: false },
    label: { type: String, required: false },
});

const itemSchema = new mongoose.Schema({
    name: { type: String, required: false, default: '' },
    reference: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '' },
    quantity: { type: String, required: false, default: 1 },
    unit_price: { type: String, required: false, default: 0 },
    reduction: { type: String, required: false, default: 0 },
    reduction_unit: { type: String, required: false, default: '%' },
    vat: { type: taxrateSchema, required: false },
    custom_vat_rate: { type: Boolean, required: false, default: false },
    amountvat: { type: String, required: false, default: 0 },
    amountvatexcl: { type: String, required: false, default: 0 },
    amountvatincl: { type: String, required: false, default: 0 },
    order: { type: Number, required: true, default: 0 },
    form_automatic_computation: { type: Boolean, required: true, default: true },
}, { _id: false });

const currencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    symbol: { type: String, required: true }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true },
    config: {
        document_type: { type: String, required: true, default: 'invoice' },
        template_name: { type: String, required: true, default: 'default_template' },
        buyer: {
            name: { type: String, required: false, default: '' },
            address1: { type: String, required: false, default: '' },
            address2: { type: String, required: false, default: '' },
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
            address1: { type: String, required: false, default: '' },
            address2: { type: String, required: false, default: '' },
            city: { type: String, required: false, default: '' },
            zip: { type: String, required: false, default: '' },
            country: { type: String, required: false, default: '' },
            vat_number: { type: String, required: false, default: '' },
            phone: { type: String, required: false, default: '' },
            logo: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
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
        credit_note_number: { type: String, required: false, default: '' }, // credit note number
        invoice_date: { type: String, required: false, default: () => dayjs().format('YYYY-MM-DD') },
        invoice_due_date: { 
            type: {
                value: { type: String, required: false, default: '' },
                terms_type: { type: String, required: false, default: '' }
            }, 
            required: false, 
            default: {} 
        },
        invoice_delivery_date: { type: String, required: false, default: () => dayjs().format('YYYY-MM-DD') },
        currency: { type: currencySchema, required: false },
        show_delivery_date: { type: Boolean, required: false },
        show_target_invoice: { type: Boolean, required: false },
        language: { type: String, required: false, default: 'en' },
        subject: { type: String, required: false, default: '' },
        reference: { type: String, required: false, default: '' },
        notes_internal: { type: String, required: false, default: '' },
        notes_on_invoice: { type: String, required: false, default: '' },
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
        files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], default: [],
        documentFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], default: [],
    },
}, schemaOptions);

documentSchema.post(['save', 'updateOne', 'updateMany', 'findOneAndUpdate'], async function (doc, next) {
    try {

        const documentsTypesenseService = new DocumentsTypesenseService();
        await documentsTypesenseService.upsertDocument(doc);
        next();
    } catch (error) {
        console.error('Error saving/updating product in Typesense:', error.message);
        // Handle error - For simplicity, removing the document from MongoDB
        try {
            const document = await Document.findOne({ _id: doc._id.toString(), company_id: doc.company_id.toString() });
            if (document) {
                await document.deleteOne();
            }            
        } catch (deleteError) {
            console.error('Error deleting document from MongoDB:', deleteError.message);
        }
        next(error); // Abort the save/update operation in MongoDB
    }
});


documentSchema.pre(['remove', 'deleteOne', 'delete'], { document: true }, async function(next) {
    try {
        const deletedDocumentId = this._id;
        const documentsTypesenseService = new DocumentsTypesenseService();
        
        // Delete the document from Typesense
        await documentsTypesenseService.deleteDocument(deletedDocumentId);
        
        // Delete related files from MongoDB
        console.log('this', this);
        console.log('this.config.documentFiles', this.config.documentFiles);
        await mongoose.model('File').deleteMany({ _id: { $in: this.config.documentFiles } });
        
        next();
    } catch (error) {
      console.error(`Failed to delete product from Typesense: ${error.message}`);
      next(error); // Abort the remove operation in MongoDB
    }
});


module.exports = {
    Document: mongoose.model('Document', documentSchema),
    currencySchema
};