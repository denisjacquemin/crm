module.exports = async function (req, res, next) {

  // fetch AMIAuthenticated from api/auth/amiauthenticated
  // if it's true, continue to next middleware
  // if it's false, redirect to login page

  const cookies = req.cookies;

  await fetch(`${process.env.API_URL}/api/auth/amiauthenticated`)
    .then((response) => response.text())
    .then((body) => {
        const data = JSON.parse(body)
        if (!data.authenticated) {
          res.redirect('/users/signin');
        } else {
          next();
        }
    }
    // .then(res => {
    //   const json = await res.json();
    //   if (!json.authenticated) {
    //     res.redirect('/users/signin');
    //   }
    // }
  ).catch(function (err) {
    console.log("Unable to fetch -", err);
    next(err);
  });
};
