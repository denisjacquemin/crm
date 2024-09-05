const mongoose = require('mongoose');
const sanitize = require('sanitize-html');

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

const fileSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: false },
    is_logo: { type: Boolean, required: false, default: false },
    name: { type: String, required: true },
    internal_name: { type: String, required: false },
    size: { type: Number, required: false },
    type: { type: String, required: false },
    filename: { type: String, required: false },
    key: { type: String, required: false },
    url: { type: String, required: false },
    default_attached_document_types: { type: [String], required: false },
}, schemaOptions);

const File = mongoose.model('File', fileSchema);

module.exports = File;
