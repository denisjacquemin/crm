const { ObjectId } = require('mongodb');
const Service = require('./_service');

class Company extends Service {
    constructor(db) {
        super(db);
        this.collection = "companies"
        this.fields_white_list = ["_id", "name", "description",
            "address", "phone_number", "email", "website", "users"
        ];
    }

    async getUserById(id) {
        return this.getById("companies", id);
    }

    async create(data) {
        try {
            // Check if all fields in data are in white list
            const filteredData = this.filterWhiteListedFields(data);

            // Insert the company in the companies collection with data parameter
            const result = await this.db.collection('companies').insertOne({
                ...filteredData
            });

            const company = await this.db.collection('companies').findOne({
                _id: result.insertedId
            });

            // Return the new company
            return company;
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Check if all fields in data are in white list
            const filteredData = this.filterWhiteListedFields(data);

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
module.exports = Company