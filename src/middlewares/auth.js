const UserService = require("../services/users.service");

module.exports = async function (req, res, next) {
  let redirect = false;

  if (!req.session.isAuth || !req.session.user) {
    console.log("req.session: ", req.session);
    req.session.isAuth = false; // isAuth is true and session.user is empty then set isAuth to false
    req.session.destroy(); // and make sure the session is destroyed

    redirect = true;
  } else {
    const userExists = await UserService.existsByEmail(req.session.user.email);
    if (!userExists) {
      console.log("User does not exist: ", req.session.user.email);
      req.session.isAuth = false; // isAuth is true and session.user is empty then set isAuth to false
      req.session.destroy(); // and make sure the session is destroyed
      redirect = true;
    }
  }

  if (redirect) {
    if (req.xhr) {
      // Return a 401 error for AJAX requests
      res.status(401).send("unauthorized");
    } else {
      console.log("No Auth for: ", req.originalUrl);
      // Use protocol based on environment
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const baseUrl = `${protocol}://${req.get("host")}`;
      console.log("Redirecting to: ", `${baseUrl}/users/signin`);
      res.redirect(`${baseUrl}/users/signin`);
    }
  } else {
    // console.log(`${req.method} ${req.path} ${req.session.user.companies}`);
    next();
  }
};
