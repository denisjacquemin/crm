    const crypto = require('crypto');
    const argon2 = require('argon2');

    async function hashPassword(plainPassword) {
        if (typeof plainPassword !== 'string') {
            throw new TypeError('Input must be a string');
        }
        if (plainPassword.length > process.env.PASSWORD_MAX_INPUT_LENGTH) {
            throw new Error(`Input length exceeds maximum allowed length of ${process.env.PASSWORD_MAX_INPUT_LENGTH}`);
        }

        const pepper = process.env.PASSWORD_PEPPER;
        return await argon2.hash(plainPassword + pepper);
    }

    async function comparePassword(plainPassword, hashedPassword) {
        console.log('plain', typeof plainPassword);
        console.log('hashed', typeof hashedPassword);
        if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
            throw new TypeError('Both arguments must be strings');
        }
        if (plainPassword.length > process.env.PASSWORD_MAX_INPUT_LENGTH) {
            throw new Error(`Input length exceeds maximum allowed length of ${process.env.PASSWORD_MAX_INPUT_LENGTH}`);
        }

        const pepper = process.env.PASSWORD_PEPPER;
        try {
            return await argon2.verify(hashedPassword, plainPassword + pepper);
        } catch (err) {
            console.error(err.stack);
            return false;
        }
    }

    module.exports = {
        hashPassword,
        comparePassword
    };