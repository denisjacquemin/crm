const { ObjectId } = require('mongodb');
const mongoService = require('./lib/mongo');
const { hashPassword, comparePassword } = require('./lib/password');
const sanitizeEmail = require('../lib/sanitizer').sanitizeEmail;

const User = require('../models/user.model');


class UserService  {

    static async create(data) {
        const user = new User(data);
        user.password = await hashPassword(filteredData.password);
        await user.save();
        return user;
    }


    // Get a user by their email address
    static async getByEmail(email) {
        return await User.findOne({ email });
    }

    static async getByResetPasswordToken(resetPasswordToken) {
        return await User.findOne({ resetPasswordToken });
    }

    static async updateById(id, data) {
        return await User.findOneAndUpdate({_id: id}, data, { new: true });
    }

    // Update a user by their email address
    static async updateByEmail(email, data) {
        return await User.findOneAndUpdate({ email }, data, { new: true });
    }

    static async deleteByEmail(email) {
        await User.deleteOne({ email });
    }

    static async existsById(id) {
        return await User.exists({ _id: id });
    }

    static async existsByEmail(email) {
        return await User.exists({ email });
    }

    static async comparePassword(plainPassword, hashedPassword) {
        try {
            return await comparePassword(plainPassword, hashedPassword);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    static async hashPassword(password) {
        try {
            return await hashPassword(password);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    // get user from database by issuer and profile.id
    static async getByIssuerAndId(issuer, id) {
        try {
            return await User.findOne({ issuer, _id: id });
        } catch (err) {
            console.error(err.stack);
            throw new Error("Error: " + err.message);
        }
    }

    static async existsByFederatedCredentials(issuer, id) {
        try {
            return await User.exists({ issuer, _id: id });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    static async createFederatedUser(issuer, id, email, firstname, lastname) {
        try {
            const user = new User({ issuer, id, email, firstname, lastname });
            await user.save();
            return user;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }
}

module.exports = UserService;