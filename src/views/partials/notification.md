# Display Notificatioon witn res.render

```javascript
return res.render('users/forgot-password', {
    notification: {
        type: 'error',
        message: req.i18n.t('forgot_password.email_invalid'),
        submessage: req.i18n.t('forgot_password.email_invalid_sub')
    }
});

# Display Notificatioon witn res.redirect

```javascript
req.flash('info', {
    message: req.i18n.t('reset_password.token_required'),
    submessage: 'this is a sub'
});
return res.redirect('/users/forgotpassword');


## Valid types

- **Info:** Used to provide additional information or clarification about a specific topic or action. Examples include instructions, help text, or explanations.
- **Warning:** Used to alert the user to potential issues or problems that may arise from a specific action or situation. Examples include low battery warnings, data validation errors, or potential security risks.
- **Error:** Used to indicate that an action has failed or that an error has occurred. Examples include failed login attempts, missing required fields, or system crashes.
- **Success:** Used to indicate that an action has been completed successfully. Examples include successful login, successful file upload, or successful form submission.