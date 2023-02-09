const transport = require('../../services/lib/mailer');

async function sendForgotPasswordMessage(req, user, token, next) {

    const html = `
  <p>${req.i18n.t('forgot_password.email_content.hi_name', {name: user.name})}</p>
  <p>${req.i18n.t('forgot_password.email_content.password_reset_request')}</p>
  <p><a href="${process.env.HOST}/users/resetpassword/${token}">${req.i18n.t('forgot_password.email_content.reset_password_link')}</a></p>
  <p>${req.i18n.t('forgot_password.email_content.password_unchanged')}</p>
  <p>${req.i18n.t('forgot_password.email_content.thanks')}</p>
`;

    const text = `
${req.i18n.t('forgot_password.email_content.hi_name', {name: user.name})}

${req.i18n.t('forgot_password.email_content.password_reset_request')}

${process.env.HOST}/users/resetpassword/${token}

${req.i18n.t('forgot_password.email_content.password_unchanged')}

${req.i18n.t('forgot_password.email_content.thanks')}
  `;
    // Send an email to the user with a link to reset their password
    // define the email options
    const mailOptions = {
        from: process.env.DEFAULT_SENDER_EMAIL,
        to: user.email,
        subject: req.i18n.t('forgot_password.email_subject'),
        charset: 'utf-8',
        text: text,
        html: html
    };

    // send the email
    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
    } catch (err) {
        console.error(`Error in userController.forgotPasswordPost `, err.message);
        next(err);
    }
}

module.exports = {
    sendForgotPasswordMessage
};