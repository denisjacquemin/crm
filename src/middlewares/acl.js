const path = require("path");

module.exports = async function(req, res, next) {

    const skipRoutes = ["/favicon.ico",
        "/preferences",
        "/preferences/changelang",
        "/users/signup-1",
        "/users/signup-2",
        "/users/signin",
        "/users/forgotpassword",
        "/users/resetpassword",
        "/users/resetpasswordsent"
    ];

    if (skipRoutes.some(route => req.path.startsWith(route))) {
        next();
    } else {
        // Check that the current company id is present in the user's companies
        if (req.session.current_company._id && req.session.user.companies.includes(req.session.current_company._id)) {
            next();
        } else {
            res.sendFile(path.join(__dirname + '../../public/403.html'));
        }
    }
};