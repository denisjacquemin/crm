const { ObjectId } = require('mongodb');
const Service = require('./_service');


class User extends Service {
    constructor(db) {
        super(db);
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
            // Query the users collection by the email field
            const result = await this.db.collection('users').findOne({ email })
            return result
        } catch (err) {
            console.error(err.stack)
            throw err
        }
    }

    // Create a new user


}

module.exports = User