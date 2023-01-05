// write a mail service
//
//

// Path: src/services/mail.js

// Import the nodemailer package
const nodemailer = require('nodemailer');

// Create a new transport object
const transport = nodemailer.createTransport({
    // Set the host and port of the SMTP server
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,

    // Set the secure option to true
    // This enables TLS encryption
    secure: process.env.NODE_ENV === 'production',

    // Set the auth option to an object containing the username and password
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
});

// Export the transport object
module.exports = transport;