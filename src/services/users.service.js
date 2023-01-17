const bcrypt = require("bcrypt");
const { ObjectId } = require('mongodb');

class User {
    constructor(db) {
        // Store a reference to the database connection
        this.db = db;
        this.fields_white_list = ["fisrtname", "email",
            "password", "companies", "language"
        ];
    }

    // Get a user by their id
    async getById(id) {
        try {
            // Query the users collection by the id field
            const result = await this.db.collection('users').findOne({
                _id: ObjectId(id)
            })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Get a user by their email address
    async getByEmail(email) {
        try {
            email = email.trim();
            // Query the users collection by the email field using the $regex operator
            // RegExp(^${email}$, 'i') creates a new regular expression object that matches the input email exactly and case-insensitive
            const result = await this.db.collection('users').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Create a new user
    async create(data) {


        try {

            // Check if all fields in data are in white list
            const filteredData = Object.keys(data)
                .filter(key => this.fields_white_list.includes(key))
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            const { companies, firstname, email, password, language } = filteredData;

            // encrypt password
            const salt = bcrypt.genSaltSync(15);
            const hash = bcrypt.hashSync(password, salt);

            // Insert the new user into the users collection
            const result = await this.db.collection('users').insertOne({ email, firstname, language, companies, password: hash })
            const user = await this.db.collection('users').findOne({
                _id: result.insertedId
            });


            // Return the new user document
            return user
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Update a user by their email address
    async updateByEmail(email, data) {
        try {
            // Check if all fields in data are in white list
            const filteredData = Object.keys(data)
                .filter(key => this.fields_white_list.includes(key))
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            // Update the user in the users collection using the email field
            const result = await this.db.collection('users').updateOne({ email }, { $set: filteredData })

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
    async updateLanguage(id, language) {
        try {
            // Update the user in the users collection using the id
            const result = await this.db.collection('users').updateOne({ _id: ObjectId(id) }, { $set: { language } })

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

    // check if user exist by id
    async checkUserExistById(id) {
        try {
            // Query the users collection by the id field
            const result = await this.db.collection('users').findOne({
                _id: ObjectId(id)
            })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }
}

module.exports = User