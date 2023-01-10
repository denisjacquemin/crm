const path = require("path");

module.exports = async function(req, res, next) {

    const skipRoutes = [
        "/favicon.ico",
        "/preferences",
        "/preferences/changelang",
        "/test",
        "/users/signup",
        "/users/signin",
        "/users/forgotpassword",
    ];
    if (skipRoutes.includes(req.path)) {
        next();
    } else {
        // Check that the current company id is present in the user's companies
        if (req.session.current_company && req.session.user.companies.includes(req.session.current_company)) {
            next();
        } else {
            res.sendFile(path.join(__dirname + '../../public/403.html'));
        }
    }
};