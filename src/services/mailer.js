const nodemailer = require('nodemailer');

// Create a new transport object
const transport = nodemailer.createTransport({
    // Set the host and port of the SMTP server
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,

    // This enables TLS encryption only in production
    secure: process.env.NODE_ENV === 'production',

    // Set the auth option to an object containing the username and password
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
});

// Export the transport object
module.exports = transport;