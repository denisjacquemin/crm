function sanitizeEmail(email) {
    // Remove leading and trailing white space
    email = email.trim();

    // Convert the email to lowercase
    email = email.toLowerCase();

    // Remove any invalid characters from the email
    email = validator.blacklist(email, '\\<\\>\\(\\)\\[\\]\\;\\:\\\\"\\,\\@');

    // Validate that the email is in a valid format
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }

    return email;
}

module.exports = {
    sanitizeEmail
};