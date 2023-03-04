const blacklist = require('validator/lib/blacklist');
const isURL = require('validator/lib/isURL');

function sanitizeEmail(email) {
    // if email is empty return empty string
    if (!email) {
        return '';
    }

    // Remove leading and trailing white space
    email = email.trim();

    // Convert the email to lowercase
    email = email.toLowerCase();

    // Remove any invalid characters from the email
    email = blacklist(email, '\\<\\>\\(\\)\\[\\]\\;\\:\\\\"\\,');

    return email;
}


module.exports = {
    sanitizeEmail
};