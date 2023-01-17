const { ObjectId } = require('mongodb');

class Company {
    constructor(db) {
        this.db = db;
        this.fields_white_list = ["name", "description",
            "address", "phone_number", "email", "website", "users"
        ];
    }

    async getById(id) {
        try {
            // Query the companies collection by the id field
            return await this.db.collection('companies').findOne({
                _id: ObjectId(id)
            })
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    async create(data) {
        try {
            // Check if all fields in data are in white list
            Object.keys(data).forEach((field) => {
                if (!this.fields_white_list.includes(field)) {
                    throw new Error(`Invalid field: ${field}`);
                }
            });

            // Insert the company in the companies collection with data parameter
            const result = await this.db.collection('companies').insertOne({
                ...data
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
            delete data._id;
            // Check if all fields in data are in white list
            Object.keys(data).forEach((field) => {
                if (!this.fields_white_list.includes(field)) {
                    throw new Error(`Invalid field: ${field}`);
                }
            });

            // Update the company in the companies collection
            await this.db.collection('companies').updateOne({ _id: ObjectId(id) }, { $set: data });

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
            // Check if the passed id matches the id of the current company
            if (currentCompanyId !== id) {
                throw new Error('Unauthorized access to company');
            }
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