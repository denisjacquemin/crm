const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');

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

const buyerSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    attention: { type: String, required: false },
    address1: { type: String, required: false },
    address2: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    registration_number: { type: String, required: false },
    default_due_delay: { type: String, required: false },
    without_vat: { type: Boolean, required: true, default: false },
    contact_title: { type: String, required: false },
    contact_firstname: { type: String, required: false },
    contact_lastname: { type: String, required: false },
    phone: { type: String, required: false },
    delivery_name: { type: String, required: false },
    delivery_attention: { type: String, required: false },
    delivery_address1: { type: String, required: false },
    delivery_address2: { type: String, required: false },
    delivery_city: { type: String, required: false },
    delivery_state: { type: String, required: false },
    delivery_zip: { type: String, required: false },
    delivery_country: { type: String, required: false },
    delivery_phone: { type: String, required: false },
    language: { type: String, required: false },
    email: {
        type: String,
        required: false,
        validate: {
            validator: validateEmail,
            message: props => `${props.value} is not a valid email address!`
        }
    },
}, schemaOptions);

// Add text index (similar to products)
buyerSchema.index({ 
    name: 'text',
    address1: 'text',
    address2: 'text',
    city: 'text',
    vat_number: 'text',
    contact_firstname: 'text',
    contact_lastname: 'text',
    email: 'text',
    phone: 'text'
}, {
    weights: {
        name: 10,
        vat_number: 8,
        contact_firstname: 5,
        contact_lastname: 5,
        email: 5,
        phone: 3,
        address1: 2,
        address2: 1,
        city: 1
    },
    name: "buyers_text_index"
});

// Add text index with additional fields
buyerSchema.index({ 
    name: 'text',
    address1: 'text',
    address2: 'text',
    city: 'text',
    zip: 'text',                    // Added
    vat_number: 'text',
    registration_number: 'text',    // Added
    contact_firstname: 'text',
    contact_lastname: 'text',
    email: 'text',
    phone: 'text'
}, {
    weights: {
        name: 10,
        vat_number: 8,
        registration_number: 8,      // Added
        zip: 7,                      // Added
        contact_firstname: 5,
        contact_lastname: 5,
        email: 5,
        phone: 3,
        address1: 2,
        address2: 1,
        city: 1
    },
    name: "buyers_text_index"
});

const Buyer = mongoose.model('Buyer', buyerSchema);

module.exports = Buyer;