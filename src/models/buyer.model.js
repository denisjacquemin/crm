const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');

const buyerSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: false },
    address: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    phone: { type: String, required: false },
    email: {
        type: String,
        required: false,
        validate: {
            validator: validateEmail,
            message: props => `${props.value} is not a valid email address!`
        }
    },
    created_at: { type: Date, required: true, default: new Date() },
    updated_at: { type: Date, required: true, default: new Date() },
});