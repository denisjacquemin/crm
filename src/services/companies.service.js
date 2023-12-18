const Company = require('../models/company.model');

class CompanyService {
 
    static async getById(id) {
        return await Company.findOne({_id: id});
    }

    static async create(data, options = {}) {
        const company = new Company(data);
        await company.save();
        return company;
    }

    static async update(id, data) {
        return await Company.findOneAndUpdate({ _id: id }, data, { new: true });
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