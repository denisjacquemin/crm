const {Company} = require('../models/company.model');
const { ObjectId } = require('mongoose').Types;
const { i18next } = require('../middlewares/i18next');


class CompanyService {
 
    static async getById(id) {
        return await Company.findOne({_id: id});
    }

    static async getByIds(ids) {
        return await Company.find({_id: { $in: ids }});
    }

    static async getBySlug(slug, projection = '') {
        const company = await Company.findOne({ slug}, projection)
            .populate('logo')
            .exec();
        return company ? company : null;
    }

    static async create(data, options = {}) {
        try {
            const company = new Company(data);
            console.log('company.country:', company);
            company.default_taxrate = i18next.t(`countries:countries.${company.country}.default_taxrate`, { returnObjects: true });
            company.settings.default_currency = i18next.t(`countries:countries.${company.country}.currencies`, { returnObjects: true }).find(currency => currency.label === i18next.t(`countries:countries.${company.country}.default_currency`, { returnObjects: true })); // find the default currency

            // Initialize email subject templates for each preloaded language
            // This creates a template for each language supported by the application
            const i18n_languages = process.env.TRANSLATION_i18_CODE.split(',');
            company.settings.email_subject_templates = (() => {
                const templates = {};
                i18n_languages.forEach(lang => {
                    const key = 'companies.controller.email_subject_template';
                    templates[lang] = i18next.t(key, {lng: lang});
                });
                return templates;
            })();

            // Initialize email message templates for each preloaded language
            company.settings.email_message_templates = (() => {
                const templates = {};
                i18n_languages.forEach(lang => {
                    const key = 'companies.controller.email_message_template';
                    templates[lang] = i18next.t(key, {lng: lang});
                });
                return templates;
            })();

            
            const companySaved = await company.save(options);           
            return companySaved;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, data) {
        return await Company.findOneAndUpdate({ _id: id }, data, { new: true });
    }

    static async delete(id) {
        return await Company.findOneAndDelete({ _id: id });
    }

    static async updateById(id, data) {
        return await Company.findOneAndUpdate({_id: id}, data, { new: true });
    }

    static async getNextInvoiceSequenceValue(id) {
        const company = await Company.findOneAndUpdate({_id: id}, {$inc: { "settings.current_invoice_sequence": 1}}, {new: true});
        return company.settings.current_invoice_sequence;
    }

    static async getNextCreditNoteSequenceValue(id) {
        const company = await Company.findOneAndUpdate({_id: id}, {$inc: { "settings.current_credit_note_sequence": 1}}, {new: true});
        return company.settings.current_credit_note_sequence;
    }

    static async updateUsers(companyId, users) {
        try {
            console.log('companyId:', companyId);
            console.log('users:', users);
            console.log('users.map(id => new ObjectId(id)):', users.map(id => new ObjectId(id)));
            return await
                Company.findOneAndUpdate({ _id: companyId }, { users: users.map(id => new ObjectId(id)) }, { new: true });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    static async findOneAndUpdate(query, update, options) {
        try {
            const result = await Company.findOneAndUpdate(query, update, options);
            return result; // Return the updated document
        } catch (error) {
            console.error('Error in CompanyService.findOneAndUpdate:', error.stack);
            throw error;
        }
    }


}
module.exports = CompanyService