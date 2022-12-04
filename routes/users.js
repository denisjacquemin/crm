const User = require("../models/user");

const { Router } = require("express");
const router = Router();

router.get("/users/signup", (req, res) => {
  if (req.session.isAuth) {
    req.flash('messages', req.i18n.t('signin.already_authenticated'));
    return res.redirect('/app');
  }  
  res.render("users/signup", {});
});

router.post("/users/signup", async (req, res) => {
  const { email, password, passwordConfirmation } = req.body;

  // Prevent empty input
  if (email.trim() === '' || password.trim() === '' || passwordConfirmation.trim() === '') {
    return res.render('users/signup', { messages: req.i18n.t('signup.all_fields_required') })
  }

  // check if password and password confirmation match
  if (password !== passwordConfirmation) {
    return res.render('users/signup', { messages: req.i18n.t('signup.passwords_do_not_match') })
  }

  // check if user already exists
  const user = await User.getByEmail(email);
  if (user) {
    return res.render('users/signup', { messages: req.i18n.t('signup.user_already_exists') })
  } 
  
  // create user
  const newUser = await User.create(email, password);
    
  req.session.isAuth = true 
  req.session.email = newUser.email
  req.session.timestamps = []

  // redirect to new company url
  res.redirect('/companies/new');
});


router.get("/users/signin", (req, res) => {
  if (req.session.isAuth) {
    req.flash('messages', req.i18n.t('signin.already_authenticated'));
    return res.redirect('/app');
  }  
  res.render("users/signin", {
    messages: req.flash('messages'),
  });
}); 

router.post("/users/signin", async (req, res) => {
  const { email, password } = req.body;
  
  // Prevent empty input
  if (email.trim() === '' || password.trim() === '') {
    return res.render('users/signin', { messages: req.i18n.t('signin.all_fields_required') })
  }

  const user = await User.getByEmail(email.trim());

  if (!user) {
    return res.render('users/signin', { messages: req.i18n.t('signin.email_or_password_invalid') })
  }

  if (!User.comparePassword(password, user.password)) {
    return res.render('users/signin', { messages: req.i18n.t('signin.email_or_password_invalid') })
  }




  // async function onSigninFormSubmit(event) {
  //       event.preventDefault();
  //       const form = event.currentTarget;
  //       try {
  //           const formData = new FormData(form);
  //           const plainFormData =
  //               Object.fromEntries(formData.entries());
  //           const formDataJsonString =
  //               JSON.stringify(plainFormData);
  //           const response = await fetch("{{API_URL}}/api/signin", {
  //               method: "POST",
  //               headers: {
  //                   "Content-Type": "application/json",
  //                   "Accept": "application/json"
  //               },
  //               body: formDataJsonString,
  //           });
  //           if (response.ok) {
  //               window.location.replace("/app");
  //           };
  //           if (!response.ok) {
  //               const {
  //                   code
  //               } =
  //               await response.json();
  //               throw new Error(code);
  //           }
  //           return response.json();
  //       } catch (error) {
  //           console.log(error)
  //           switch (error.message) {
  //               case 'ALL_FIELDS_REQUIRED':
  //                   showAlert("{{ t 'signin.all_fields_required' }}");
  //                   breaks;
  //               case 'USER_NOT_FOUND':
  //                   showAlert("{{ t 'signin.user_not_found' }}");
  //                   breaks;
  //               default:
  //                   showAlert("{{ t 'common.unknown_error' }}");
  //                   breaks;

  //           }
  //       }

  req.session.isAuth = true
  req.session.email = user.email
  req.session.userId = user._id
  req.session.timestamps = []
  req.session.user = user
  req.session.currentCompany = '1'
  res.redirect('/app')
});

router.get("/users/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/app')
    }
  })
  res.clearCookie(process.env.CONNECT_SID_NAME)

  res.redirect('/users/signin')
});


// router.get("/private/users", userController.getAll);

module.exports = router;
