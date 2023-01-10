const uuid = require('uuid');
const bcrypt = require("bcrypt");

class User {
    constructor(db) {
        // Store a reference to the database connection
        this.db = db
    }

    // Get a user by their email address
    async getByEmail(email) {
        try {
            // Query the users collection by the email field
            const result = await this.db.collection('users').findOne({ email })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Create a new user
    async create(email, password) {
        try {
            const id = uuid.v4();

            // Insert the new user into the users collection
            const result = await this.db.collection('users').insertOne({ _id: id, email, password })

            // Return the new user document
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Update a user by their email address
    async updateByEmail(email, updates) {
        try {
            // Update the user in the users collection using the email field
            const result = await this.db.collection('users').updateOne({ email }, { $set: updates })

            // Return the number of updated documents
            return result.modifiedCount
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Delete a user by their email address
    async deleteByEmail(email) {
        try {
            // Delete the user from the users collection using the email field
            const result = await this.db.collection('users').deleteOne({ email })

            // Return the number of deleted documents
            return result.deletedCount
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // create a updateLanguage function
    async updateLanguage(userId, language) {
        try {
            // Update the user in the users collection using the id
            const result = await this.db.collection('users').updateOne({ _id: userId }, { $set: { language } })

            // Return the number of updated documents
            return result.modifiedCount
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    comparePassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }

}

module.exports = User