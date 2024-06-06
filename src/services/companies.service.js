const Company = require('../models/company.model');

class CompanyService {
 
    static async getById(id) {
        return await Company.findOne({_id: id});
    }

    static async getByIds(ids) {
        return await Company.find({_id: { $in: ids }});
    }

    static async getBySlug(slug, projection = '') {
        const company = await Company.findOne({ slug}, projection).exec();
        return company ? company : null;
    }

    static async create(data, options = {}) {
        try {
            const company = new Company(data);
            await company.save(options);
            return company;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, data) {
        return await Company.findOneAndUpdate({ _id: id }, data, { new: true });
    }

    static async updateById(id, data) {
        return await Company.findOneAndUpdate({_id: id}, data, { new: true });
    }

    static async getNextInvoiceSequenceValue(id) {
        const company = await Company.findOneAndUpdate({_id: id}, {$inc: { "settings.current_invoice_sequence": 1}}, {new: true});
        return company.settings.current_invoice_sequence;
    }

    // async findOrCreateById(currentCompanyId, id) {
        
    //     try {
    //         // if id is not undefined or null or invalid skip the findOne query
    //         if (id) {
    //             // Try to find a company
    //             const result = await this.db.collection('companies').findOne({ _id: ObjectId(id) });
    //             // If a company was found, return it
    //             if (result) {
    //                 return result;
    //             }
    //         }
    //         // If no company was found, create a new one
    //         return this.create();
    //     } catch (error) {
    //         console.error(error.stack);
    //         throw error;
    //     }
    // }


}
module.exports = CompanyService