const mongoose = require('mongoose');
const { Schema } = require('mongoose');

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

const taxrateSchema = new mongoose.Schema({
    is_custom: { type: Boolean, required: false, default: false },
    value: { type: String, required: false },
    label: { type: String, required: false },
}, { _id: false });

const productSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    reference: { type: String, required: false, sparse: true },
    description: { type: String, required: false, default: '' },
    unit_price: { type: Number, required: false, default: 0 },
    vat: { type: Schema.Types.ObjectId, required: false },
    custom_vat_rate: { type: taxrateSchema, required: false, default: { is_custom: false, value: '', label: '' } },
    unit: { type: String, required: false },
}, schemaOptions);

// Add text index
productSchema.index({ 
    name: 'text', 
    reference: 'text', 
    description: 'text' 
}, {
    weights: {
        name: 10,
        reference: 5,
        description: 1
    },
    name: "products_text_index"
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;