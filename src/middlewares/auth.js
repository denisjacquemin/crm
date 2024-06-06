const UserService = require('../services/users.service');

module.exports = async function(req, res, next) {

    console.log(req.originalUrl + ' Session is valid? ', JSON.stringify(req.session.isAuth), req.session.user);

    let redirect = false;

    if (!req.session.isAuth || !req.session.user) { 
        req.session.isAuth = false; // isAuth is true and session.user is empty then set isAuth to false
        req.session.destroy(); // and make sure the session is destroyed

        redirect = true;
    } else {
        const userExists = await UserService.existsByEmail(req.session.user.email);
        if (!userExists) {
            req.session.isAuth = false; // isAuth is true and session.user is empty then set isAuth to false
            req.session.destroy(); // and make sure the session is destroyed
            redirect = true;
        }
    }

    if (redirect) {
        if (req.xhr) {
            // Return a 401 error for AJAX requests
            res.status(401).send("Unauthorized");
        } else {
            console.log('No Auth for: ', req.originalUrl);
            res.redirect('/users/signin');
        }
    } else {
        next();
    }
};