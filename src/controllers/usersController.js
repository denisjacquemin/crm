const { get } = require('../services/mongo');
const UserService = require('../services/users.service');
const CompanyService = require('../services/companies.service');
const transport = require('../services/mailer');
const crypto = require('crypto');
const validator = require('validator');


async function signup1(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        req.flash('messages', req.i18n.t('signin.already_authenticated'));
        return res.redirect('/app');
    }

    try {
        // Render the signup page
        res.render("users/signup1");
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signup1 `, err.message);
        next(err);
    }
}


async function signup1Post(req, res, next) {
    // Destructure the email, password, and passwordConfirmation fields from the request body
    const { firstname, email, password, passwordConfirmation } = req.body;

    // Trim the whitespace from the email, password, and passwordConfirmation fields
    const trimmedFirstname = firstname && firstname.trim();
    const trimmedEmail = email && email.trim();
    const trimmedPassword = password && password.trim();
    const trimmedPasswordConfirmation = passwordConfirmation && passwordConfirmation.trim();

    // Check if any of the required fields are empty
    if (!trimmedFirstname || !trimmedEmail || !trimmedPassword || !trimmedPasswordConfirmation) {
        // If any of the fields are empty, render the signup page again with an error message
        return res.render('users/signup1', { notification: { type: 'error', message: req.i18n.t('signup.all_fields_required') } })
    }

    // Check if the password and password confirmation fields match
    if (trimmedPassword !== trimmedPasswordConfirmation) {
        // If the passwords do not match, render the signup page again with an error message
        return res.render('users/signup1', {
            notification: { type: 'error', message: req.i18n.t('signup.passwords_do_not_match') }
        })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user already exists with the given email address
    const user = await userService.getByEmail(trimmedEmail);
    if (user) {
        // If a user already exists, render the signup page again with an error message
        return res.render('users/signup1', {
            notification: { type: 'error', message: req.i18n.t('signup.user_already_exists') }
        })
    }

    // Create a new user with the given email and password
    // const newUser = await userService.create(trimmedEmail, trimmedPassword);

    // Set the isAuth, email, and timestamps fields on the user's session
    req.session.signup = req.session.signup || {};
    req.session.signup.user = {
        firstname: trimmedFirstname,
        email: trimmedEmail,
        password: trimmedPassword,
    }

    // Redirect the user to the new company page
    res.redirect('/users/signup-2');
};

async function signup2(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        req.flash('messages', req.i18n.t('signin.already_authenticated'));
        return res.redirect('/app');
    }

    try {
        // Render the signup page
        res.render("users/signup2");
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signupNewCompany `, err.message);
        next(err);
    }
}

async function signup2Post(req, res, next) {
    // Destructure company fields: name, description, address, phone_number, email, website
    const {
        name,
        description,
        address,
        phone_number,
        email,
        website
    } = req.body;

    // Trim the whitespace from the company fields
    const trimmedName = name && name.trim();
    const trimmedDescription = description && description.trim();
    const trimmedAddress = address && address.trim();
    const trimmedPhoneNumber = phone_number && phone_number.trim();
    const trimmedEmail = email && email.trim();
    const trimmedWebsite = website && website.trim();

    // put the company fields into session.signup.company
    req.session.signup.company = {
        name: trimmedName,
        description: trimmedDescription,
        address: trimmedAddress,
        phone_number: trimmedPhoneNumber,
        email: trimmedEmail,
        website: trimmedWebsite,
    }

    // Check if any of the required fields are empty
    if (!trimmedName) {
        // If any of the fields are empty, render the signup page again with an error message
        return res.render('users/signup2', { notification: { type: 'error', message: req.i18n.t('signup.all_fields_required') } })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new Company instance
    const companyService = new CompanyService(db);

    // Create a new company with the given name, description, address, phone_number, email, and website
    const company = {
        name: trimmedName,
        description: trimmedDescription,
        address: trimmedAddress,
        phone_number: trimmedPhoneNumber,
        email: trimmedEmail,
        website: trimmedWebsite,
    }

    const newCompany = await companyService.create(company);

    // add company id to current user
    const userService = new UserService(db);

    // Get the current user in session.signup
    const user = req.session.signup.user;
    user.language = req.i18n.language;

    // add company id to user companies array
    user.companies = user.companies || [];
    user.companies.push(newCompany._id);

    // create user
    const newUser = await userService.create(user);

    newCompany.users = newCompany.users || [];
    newCompany.users.push(newUser._id);
    companyService.update(newCompany._id, newCompany);

    // Set the isAuth, email, and timestamps fields on the user's session
    req.session.isAuth = true
    req.session.user = newUser
    req.session.current_company = newCompany

    delete req.session.signup

    // Redirect the user to the app page
    res.redirect('/app');
};

async function signin(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        req.flash('messages', req.i18n.t('signin.already_authenticated'));
        return res.redirect('/app');
    }

    try {
        // Render the signin page
        res.render("users/signin", {});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signin `, err.message);
        next(err);
    }
}

async function signinPost(req, res, next) {

    // Destructure the email and password fields from the request body
    const { email, password } = req.body;

    // Trim the whitespace from the email and password fields
    const trimmedEmail = email && email.trim();
    const trimmedPassword = password && password.trim();

    // Check if any of the required fields are empty
    if (!trimmedEmail || !trimmedPassword) {
        // If any of the fields are empty, render the signin page again with an error message
        return res.render('users/signin', {
            notification: { type: 'error', message: req.i18n.t('signin.all_fields_required') }
        })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given email address
    const user = await userService.getByEmail(trimmedEmail);
    if (!user) {
        // If a user does not exist, render the signin page again with an error message
        return res.render('users/signin', {
            notification: { type: 'error', message: req.i18n.t('signin.user_does_not_exist') }
        })
    }

    // Check if the given password matches the user's password
    const isMatch = await userService.comparePassword(trimmedPassword, user.password);
    if (!isMatch) {
        // If the passwords do not match, render the signin page again with an error message
        return res.render('users/signin', {
            notification: { type: 'error', message: req.i18n.t('signin.email_or_password_invalid') }
        })
    }

    // get company by user.companies[0]
    const companyService = new CompanyService(db);
    const current_company = await companyService.getById(user.companies[0]);

    // Set the isAuth, email, and timestamps fields on the user's session
    req.session.isAuth = true
    req.session.current_company = current_company
    req.session.user = user
    req.session.timestamps = []

    // Redirect the user to the app page
    res.redirect(req.session.returnTo || '/');
}

async function signout(req, res, next) {
    // Check if the user is authenticated
    if (!req.session.isAuth) {
        // If the user is not authenticated, set a flash message and redirect to the signin page
        req.flash('messages', req.i18n.t('signout.not_authenticated'));
        return res.redirect('/users/signin');
    }

    try {
        // Destroy the user's session
        req.session.destroy();

        // Redirect the user to the signin page
        res.redirect('/users/signin');
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signout `, err.message);
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        req.flash('messages', req.i18n.t('forgot_password.already_authenticated'));
        return res.redirect('/app');
    }

    try {
        // Render the forgot password page
        res.render("users/forgot-password", {});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.forgotPassword `, err.message);
        next(err);
    }
}

async function forgotPasswordPost(req, res, next) {
    // Destructure the email field from the request body
    const { email } = req.body;

    // Trim the whitespace from the email field
    const trimmedEmail = email.trim();

    // Check if the email field is empty
    if (!trimmedEmail) {
        // If the email field is empty, render the forgot password page again with an error message
        return res.render('users/forgot-password', { type: 'error', message: req.i18n.t('forgot_password.email_required') })
    }

    // Check if email is valid
    if (!validator.isEmail(trimmedEmail)) {
        // If the email is not valid, render the forgot password page again with an error message
        return res.render('users/forgot-password', { type: 'error', message: req.i18n.t('forgot_password.email_invalid') })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given email address
    const user = await userService.getByEmail(trimmedEmail);
    if (!user) {
        // If a user does not exist, render the forgot password page again with an error message
        return res.render('users/forgot-password', { type: 'error', message: req.i18n.t('forgot_password.user_does_not_exist') })
    }

    // Generate a random token
    const token = crypto.randomBytes(20).toString('hex');

    // Set the resetPasswordToken and resetPasswordExpires fields on the user
    await userService.updateByEmail(user.email, { resetPasswordToken: token, resetPasswordExpires: Date.now() + 3600000 });


    const html = `
  <p>${req.i18n.t('forgot_password.email_content.hi_name', { name: user.name })}</p>
  <p>${req.i18n.t('forgot_password.email_content.password_reset_request')}</p>
  <p><a href="${ process.env.HOST }/reset-password/${ token }">${req.i18n.t('forgot_password.email_content.reset_password_link')}</a></p>
  <p>${req.i18n.t('forgot_password.email_content.password_unchanged')}</p>
  <p>${req.i18n.t('forgot_password.email_content.thanks')}</p>
`;

    const text = `
${req.i18n.t('forgot_password.email_content.hi_name', { name: user.name })}

${req.i18n.t('forgot_password.email_content.password_reset_request')}

${process.env.HOST}/reset-password/${token}

${req.i18n.t('forgot_password.email_content.password_unchanged')}

${req.i18n.t('forgot_password.email_content.thanks')}
  `
        // Send an email to the user with a link to reset their password
        // define the email options
    const mailOptions = {
        from: process.env.DEFAULT_SENDER_EMAIL,
        to: user.email,
        subject: req.i18n.t('forgot_password.email_subject'),
        charset: 'utf-8',
        text: text,
        html: html
    }

    // send the email
    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
    } catch (err) {
        console.error(`Error in userController.forgotPasswordPost `, err.message);
        next(err);
    }

    // Set a flash message and redirect to the signin page
    req.flash('messages', req.i18n.t('forgot_password.email_sent'));
    res.redirect('/users/signin');
}


module.exports = {
    signup1,
    signup1Post,
    signup2,
    signup2Post,
    signin,
    signinPost,
    signout,
    forgotPassword,
    forgotPasswordPost
};