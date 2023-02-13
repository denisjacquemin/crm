const { get } = require('../services/lib/mongo');
const UsersService = require('../services/users.service');

module.exports = async function(req, res, next) {

    const db = get();
    const usersService = new UsersService(db);

    let redirect = false;

    if (!req.session.isAuth) {
        redirect = true;
    } else {
        const userExists = await usersService.existsByEmail(req.session.user.email);
        if (!userExists) {
            redirect = true;
        }
    }

    if (redirect) {
        req.flash('error', {
            message: req.i18n.t('signin.not_authenticated')
        });
        req.session.returnTo = req.originalUrl;
        console.log('No Auth for: ', req.originalUrl);
        res.redirect('/users/signin');
    } else {
        next();
    }
};