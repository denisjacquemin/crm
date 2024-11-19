const mongoose = require('mongoose');
const { currencySchema } = require('./document.model');

const schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
};

const taxrateSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
});

const companySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
    },
    name: { type: String, required: true },
    internal_name: { type: String, required: false },
    address1: { type: String, required: false },
    address2: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    without_vat: { type: Boolean, required: false, default: false },
    registration_number: { type: String, required: false },
    language: { type: String, required: false },
    bank_accounts: {
      type: [
        {
          iban: { type: String, required: false },
          bic: { type: String, required: false },
        },
      ],
      default: [],
    },
    contact_title: { type: String, required: false },
    contact_firstname: { type: String, required: false },
    contact_lastname: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false },
    website: { type: String, required: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    logo: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
    taxrates: {
      type: [taxrateSchema],
      default: [],
    },
    default_taxrate: { type: mongoose.Schema.Types.ObjectId, required: false },
    settings: {
      default_template: { type: String, required: false, default: 'default_template' },
      default_currency: { type: currencySchema, required: false },
      default_language: { type: String, required: false, default: 'en' },
      default_payment_method: { type: String, required: false, default: 'bank_transfer' },
      default_bank_account: { type: String, required: false, default: '' },
      current_invoice_sequence: { type: Number, required: false, default: 0 },
      current_credit_note_sequence: { type: Number, required: false, default: 0 },
      current_quote_sequence: { type: Number, required: false, default: 0 },
      send_cc_to: { type: String, required: false, default: '' },
      send_bcc_to: { type: String, required: false, default: '' },

      // Invoice specific settings
      invoice: {
        prefix: { type: String, required: false },
        reset_yearly: { type: Boolean, required: false, default: true },
        sequence_increment: { type: Number, required: false, default: 1 },
        show_invoice_due_date: { type: Boolean, required: false, default: true },
        show_delivery_date: { type: Boolean, required: false, default: true },
        show_contact_person: { type: Boolean, required: false, default: false },
        show_seller_email: { type: Boolean, required: false, default: true },
        show_seller_website: { type: Boolean, required: false, default: true },
        show_seller_phone: { type: Boolean, required: false, default: true },
        show_approval: { type: Boolean, required: false, default: false},
        approval_label: { type: String, required: false},
        show_iban: { type: Boolean, required: false, default: true },
        default_notes: { type: String, required: false, default: '' },
        default_due_date_terms_type: { type: String, required: false, default: '+30' },

      },

      // Credit Note specific settings
      credit_note: {
        prefix: { type: String, required: false },
        reset_yearly: { type: Boolean, required: false, default: true },
        sequence_increment: { type: Number, required: false, default: 1 },
        show_invoice_due_date: { type: Boolean, required: false, default: true },
        show_delivery_date: { type: Boolean, required: false, default: true },
        show_target_invoice: { type: Boolean, required: false, default: true },
        show_contact_person: { type: Boolean, required: false, default: false },
        show_seller_email: { type: Boolean, required: false, default: true },
        show_seller_website: { type: Boolean, required: false, default: true },
        show_seller_phone: { type: Boolean, required: false, default: true },
        show_approval: { type: Boolean, required: false, default: false},
        approval_label: { type: String, required: false},
        show_iban: { type: Boolean, required: false, default: true },
        default_notes: { type: String, required: false, default: '' },
      },

      // Quote specific settings
      quote: {
        prefix: { type: String, required: false },
        reset_yearly: { type: Boolean, required: false, default: true },
        sequence_increment: { type: Number, required: false, default: 1 },
        show_invoice_due_date: { type: Boolean, required: false, default: false },
        show_delivery_date: { type: Boolean, required: false, default: false },
        show_contact_person: { type: Boolean, required: false, default: false },
        show_seller_email: { type: Boolean, required: false, default: true },
        show_seller_website: { type: Boolean, required: false, default: true },
        show_seller_phone: { type: Boolean, required: false, default: true },
        show_approval: { type: Boolean, required: false, default: true},
        approval_label: { type: String, required: false},
        show_iban: { type: Boolean, required: false, default: true },
        default_notes: { type: String, required: false, default: '' },
      },

      email_subject_templates: {
        type: Object,
        default: {},
      },
      email_message_templates: {
        type: Object,
        default: {},
      },
    },
  },
  schemaOptions
);

module.exports = {
  Company: mongoose.model('Company', companySchema),
  taxrateSchema,
};
