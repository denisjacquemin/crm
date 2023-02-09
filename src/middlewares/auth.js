const { get } = require('../services/lib/mongo');
const UsersService = require('../services/users.service');

module.exports = async function(req, res, next) {

    // An array of routes that do not require authentication
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

    // check if the req.path starts with one of the elements in the skiproutes array
    if (skipRoutes.some(route => req.path.startsWith(route))) {
        next();
    } else {
        const db = get();
        const usersService = new UsersService(db);

        let redirect = false;

        if (!req.session.isAuth) {
            redirect = true;
        } else {
            const userExists = await usersService.existsById(req.session.user._id);
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
    }
};



// fetch AMIAuthenticated from api/auth/amiauthenticated
// if it's true, continue to next middleware
// if it's false, redirect to login page
// const cookies = req.cookies;

// await fetch(`${process.env.API_URL}/api/auth/amiauthenticated`)
//   .then((response) => response.text())
//   .then((body) => {
//       const data = JSON.parse(body)
//       if (!data.authenticated) {
//         req.session.message = 'Not authenticated';
//         res.redirect('/users/signin');
//       } else {
//         req.session.message = 'Authenticated';
//         next();
//       }
//   }
//   // .then(res => {
//   //   const json = await res.json();
//   //   if (!json.authenticated) {
//   //     res.redirect('/users/signin');
//   //   }
//   // }
// ).catch(function (err) {
//   console.log("Unable to fetch -", err);
//   next(err);
// });