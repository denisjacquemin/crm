const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');


const userSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    language: { type: String, required: true, default: 'en-US' },
    timezone: { type: String, required: true, default: 'Europe/Paris' },
    google_id: { type: String, required: false },
    picture: { type: String, required: false },
    companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    email: {type: String, required: true, unique: true },
    password: { type: String, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    created_at: { type: Date, required: true, default: new Date() },
    updated_at: { type: Date, required: true, default: new Date() },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
