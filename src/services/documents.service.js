const uuid = require('uuid');
const { ObjectId } = require('mongodb');


class Document {
    constructor(db) {
        // Store a reference to the database connection
        this.db = db
    }

    // Get a document by their id
    async getById(id) {
        try {
            // Query the documents collection by the id field
            const result = await this.db.collection('documents').findOne({ _id: ObjectId(id) })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Create a new document
    async create(config) {
        try {
            const id = uuid.v4();

            // Validate the input parameters
            if (typeof config !== 'object') {
                throw new Error(`Invalid config: ${config}`);
            }

            // Insert the new document into the documents collection
            const result = await this.db.collection('documents').insertOne({ _id: id, config });

            // Return the new document
            return result;
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }

    // Update a document
    async update(id, config) {
        try {
            // Update the document in the documents collection
            const result = await this.db.collection('documents').updateOne({ _id: ObjectId(id) }, { $set: { config } })

            // Return the updated document
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    async findOrCreateById(id, config) {
        try {
            // Try to find a document with the given id
            const result = await this.db.collection('documents').findOne({ _id: ObjectId(id) })

            // If a document was found, return it
            if (result) {
                return result;
            }

            // If no document was found, create a new one with the given id and config
            return this.create({ _id: id, config });
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }
}
module.exports = Document