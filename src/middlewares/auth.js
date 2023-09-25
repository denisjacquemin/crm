const UserService = require('../services/users.service');

module.exports = async function(req, res, next) {

    console.log(req.originalUrl + ' Session: ', JSON.stringify(req.session.isAuth));

    let redirect = false;

    if (!req.session.isAuth) {
        redirect = true;
    } else {
        const userService = await UserService.getInstance();

        const userExists = await userService.existsByEmail(req.session.user.email);
        if (!userExists) {
            redirect = true;
        }
    }

    if (redirect) {
        if (req.xhr) {
            // Return a 401 error for AJAX requests
            res.status(401).send("Unauthorized");
        } else {
            req.flash('error', {
                message: req.i18n.t('signin.not_authenticated')
            });
            req.session.returnTo = req.originalUrl;
            console.log('No Auth for: ', req.originalUrl);
            res.redirect('/users/signin');
        }
    } else {
        next();
    }
};