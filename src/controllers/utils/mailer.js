const transport = require('../../services/lib/mailer');


async function sendDocument(req, mailOptions, next) {

    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`, mailOptions);
    } catch (err) {
        console.error(`Error in mailer.sendDocument `, err.message);
        next(err);
    }

}

async function sendForgotPasswordMessage(req, user, token, next) {

    const html = `
  <p>${req.i18n.t('users.views.forgotpassword.email_content.hello')}</p>
  <p>${req.i18n.t('users.views.forgotpassword.email_content.password_reset_request')}</p>
  <p><a href="${process.env.HOST}/users/resetpassword/${token}">${req.i18n.t('users.views.forgotpassword.email_content.reset_password_link')}</a></p>
  <p>${req.i18n.t('users.views.forgotpassword.email_content.password_unchanged')}</p>
  <p>${req.i18n.t('users.views.forgotpassword.email_content.thanks')}</p>
`;

    const text = `
${req.i18n.t('users.views.forgotpassword.email_content.hello')}

${req.i18n.t('users.views.forgotpassword.email_content.password_reset_request')}

${process.env.HOST}/users/resetpassword/${token}

${req.i18n.t('users.views.forgotpassword.email_content.password_unchanged')}

${req.i18n.t('users.views.forgotpassword.email_content.thanks')}
  `;
    // Send an email to the user with a link to reset their password
    // define the email options
    const mailOptions = {
        from: process.env.DEFAULT_SENDER_EMAIL,
        to: user.email,
        subject: req.i18n.t('users.views.forgotpassword.email_content.email_subject'),
        charset: 'utf-8',
        text: text,
        html: html
    };

    // send the email
    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
    } catch (err) {
        console.error(`Error in mailer.forgotPasswordPost `, err.message);
        next(err);
    }
}

module.exports = {
    sendForgotPasswordMessage,
    sendDocument
};