module.exports = async function (req, res, next) {

  // if routes match an array of routes, skip auth middleware
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
    if (req.session.isAuth) {
      next();
    } else {
      res.redirect('/users/signin');
    }
  }


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
};
