const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');


const companySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    address: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    email: {
        type: String,
        required: false,
        validate: {
            validator: validateEmail,
            message: props => `${props.value} is not a valid email address!`
        }
    },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
