const path = require("path");

module.exports = async function (req, res, next) {

  const skipRoutes = [
    "/",
    "/users/signup",
    "/users/signin",
    "/forgot-password",
    "/companies/new",
    "/companies",
  ];
  if (skipRoutes.includes(req.path)) {
    next();
  } else {
    // Check that the current company id is present in the user's companies
    if (req.session.currentCompany && req.session.user.companies.includes(req.session.currentCompany)) {
      next();
    } else {
        res.sendFile(path.join(__dirname+'../../public/403.html'));
    }
  }
};