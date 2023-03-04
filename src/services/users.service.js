const { ObjectId } = require('mongodb');
const Service = require('./_service');
const { hashPassword, comparePassword } = require('./lib/password');
const sanitizeEmail = require('../lib/sanitizer').sanitizeEmail;

class User extends Service {
    constructor(db) {
        super(db);
        this.collection = "users"
        this.fields_white_list = new Set([
            "_id",
            "firstname",
            "email",
            "password",
            "timezone",
            "companies",
            "language",
            "resetPasswordToken",
            "resetPasswordExpires",
            "google_id",
            "picture"
        ]);
    }

    async create(data) {
        const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
        if (!filteredData.password) return await super.create(filteredData);
        try {
            filteredData.password = await hashPassword(filteredData.password);
            return await super.create(filteredData);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    // Get a user by their email address
    async getByEmail(email) {
        // RegExp(^${email}$, 'i') creates a new regular expression object that matches the input email exactly and case-insensitive
        return await this.getBy({ email: email });
    }

    async getByResetPasswordToken(token) {
        return await this.getBy({ resetPasswordToken: token });
    }

    // Update a user by their email address
    async updateByEmail(email, data) {
        try {
            email = email.trim();
            const result = await this.updateBy('email', { $regex: new RegExp(`^${email}$`, 'i') }, data);
            return result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async deleteByEmail(email) {
        try {
            email = email.trim();
            const result = await this.deleteBy('email', { $regex: new RegExp(`^${email}$`, 'i') });
            return result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }


    async existsById(id) {
        if (!(id instanceof ObjectId)) {
            id = ObjectId(id);
        }

        try {
            return await this.existsBy('_id', id);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async existsByEmail(email) {
        try {
            return await this.existsBy('email', { $regex: new RegExp(`^${email}$`, 'i') });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async comparePassword(plainPassword, hashedPassword) {
        try {
            return await comparePassword(plainPassword, hashedPassword);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async hashPassword(password) {
        try {
            return await hashPassword(password);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    // get user from database by issuer and profile.id
    async getByIssuerAndId(issuer, id) {
        try {
            return await this.getBy({ issuer, id });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async existsByFederatedCredentials(issuer, id) {
        try {
            return await this.existsBy({ issuer, id });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async createFederatedUser(issuer, id, email, firstname, lastname) {
        try {
            return await this.create({ issuer, id, email, firstname, lastname });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }



}

module.exports = User