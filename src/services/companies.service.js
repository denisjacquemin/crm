const { ObjectId } = require('mongodb');
const mongoService = require('./lib/mongo');
const Service = require('./_service');

let companyServiceInstance = null;
class CompanyService extends Service {
    constructor(db) {
        super(db);
        this.collection = "companies"
        this.fields_white_list = new Set([
            "_id",
            "name",
            "description",
            "address",
            "phone_number",
            "email",
            "website",
            "users"
        ]);
    }

    static async getInstance() {
        if (!companyServiceInstance) {
            const db = await mongoService.get();
            companyServiceInstance = new CompanyService(db);
        }

        return companyServiceInstance;
    }

    async getUserById(id) {
        return this.getById("companies", id);
    }

    async create(data, options = {}) {
        try {
            // Check if all fields in data are in white list
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
            return await super.create(filteredData, options);

        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Check if all fields in data are in white list
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);

            // Update the company in the companies collection
            await this.db.collection('companies').updateOne({ _id: ObjectId(id) }, { $set: filteredData });

            const company = await this.db.collection('companies').findOne({ _id: ObjectId(id) });

            // Return the updated company
            return company;
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    async findOrCreateById(currentCompanyId, id) {
        try {
            // if id is not undefined or null or invalid skip the findOne query
            if (id) {
                // Try to find a company
                const result = await this.db.collection('companies').findOne({ _id: ObjectId(id) });
                // If a company was found, return it
                if (result) {
                    return result;
                }
            }
            // If no company was found, create a new one
            return this.create();
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }


}
module.exports = CompanyService