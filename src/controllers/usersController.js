const {get, startSession } = require('../services/lib/mongo');
const UserService = require('../services/users.service');
const CompanyService = require('../services/companies.service');
const crypto = require('crypto');
const validator = require('validator');
const Mailer = require('./utils/mailer');
const moment = require('moment-timezone');
const { ObjectId } = require('mongodb');
const { getOAuthGoogleURL, handleGoogleCallback } = require('../services/lib/oauth.google');
const { use } = require('../services/lib/mailer');


async function signup1(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, redirect to the app page
        return res.redirect('/app');
    }

    try {
        res.render("users/signup1");
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signup1 `, err.message);
        next(err);
    }
}


async function signup1Post(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        return res.redirect('/app');
    }

    // Destructure the crm-email, crm-password, and firstname fields from the request body
    const { firstname, 'crm-email': crmEmail, 'crm-password': crmPassword } = req.body;

    // Trim the whitespace from the email, password, and passwordConfirmation fields
    const trimmedFirstname = firstname && firstname.trim();
    const trimmedEmail = crmEmail && crmEmail.trim();
    const trimmedPassword = crmPassword && crmPassword.trim();

    req.session.signup = req.session.signup || {};
    req.session.signup.user = {
        firstname: trimmedFirstname,
        email: trimmedEmail,
        password: trimmedPassword
    }

    // Check if any of the required fields are empty
    if (!trimmedFirstname || !trimmedEmail || !trimmedPassword) {
        // If any of the fields are empty, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('signup.all_fields_required')
        });

        return res.render('users/signup1', {
            notifications: req.flash()
        })
    }

    // Check if the email is valid
    if (!validator.isEmail(trimmedEmail)) {
        // If the email is not valid, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('forgot_password.email_invalid'),
            submessage: req.i18n.t('forgot_password.email_invalid_sub')
        });

        return res.render('users/signup1', {
            notifications: req.flash()
        })
    }

    // check if password is strong, customize isStrongPassword() to your needs
    if (!validator.isStrongPassword(trimmedPassword, {
            minLength: process.env.PASSWORD_MIN_LENGTH,
            minLowercase: process.env.PASSWORD_MIN_LOWERCASE,
            minUppercase: process.env.PASSWORD_MIN_UPPERCASE,
            minNumbers: process.env.PASSWORD_MIN_NUMBERS,
            minSymbols: process.env.PASSWORD_MIN_SYMBOLS,
            returnScore: false
        })) {
        // If the password is not strong enough, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('signup.password_not_strong_enough'),
            submessage: req.i18n.t('signup.password_not_strong_enough_sub')
        });

        return res.render('users/signup1', {
            notifications: req.flash()
        })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user already exists with the given email address
    const userExist = await userService.existsByEmail(trimmedEmail);
    if (userExist) {
        // If a user already exists, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('signup.user_already_exists')
        });

        // return res.render('users/signup1', {
        //     notifications: { type: 'error', message: req.i18n.t('signup.user_already_exists') }
        // })
        return res.render('users/signup1', {
            notifications: req.flash()
        })
    }

    // Create a new user with the given email and password
    // const newUser = await userService.create(trimmedEmail, trimmedPassword);

    // Go to signup2 - new company page
    res.redirect('/users/signup-2');
    // res.render('users/signup2');

};

async function signup2(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        return res.redirect('/app');
    }

    // req.session.signup or req.session.signup.user are empty, redirect to signup1
    if (!req.session.signup || !req.session.signup.user) {
        return res.redirect('/users/signup-1');
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
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        return res.redirect('/app');
    }

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
    req.session.signup = req.session.signup || {};
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
        req.flash('error', {
            message: req.i18n.t('signup2.name_required')
        });

        return res.render('users/signup2', { notifications: req.flash() })
    }

    // Get a reference to the MongoDB database
    const db = get();

    const userService = new UserService(db);
    const companyService = new CompanyService(db);

    // Check if a user already exists with the given email address
    const userExist = await userService.existsByEmail(req.session.signup.user.email);
    if (userExist) {
        // If a user already exists, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('signup.user_already_exists')
        });

        // return res.render('users/signup1', {
        //     notifications: { type: 'error', message: req.i18n.t('signup.user_already_exists') }
        // })
        return res.redirect('/users/signup1');
    }

    // Start a transaction
    const session = startSession();
    session.startTransaction();

    let newUser = null;
    let newCompany = null;

    try {
        // Generate ObjectId for the user and the company
        const userId = new ObjectId();
        const companyId = new ObjectId();

        // Get the current user in session.signup
        const user = req.session.signup.user;
        user._id = userId;
        user.language = req.i18n.language;
        user.companies = [companyId];
        user.timezone = moment.tz.guess();

        // Create the user
        await userService.create(user, { session });

        // Get the company
        const company = req.session.signup.company;
        company._id = companyId;
        company.users = [userId];

        // Create the company
        await companyService.create(company, { session });

        // Commit the transaction
        await session.commitTransaction();

        newUser = user;
        newCompany = company;
    } catch (err) {
        // If there's an error, abort the transaction and throw an error
        await session.abortTransaction();
        return next(err);
    } finally {
        // End the session
        session.endSession();
    }

    // Set the isAuth, email, and timestamps fields on the user's session
    req.session.isAuth = true
    const { password, ...saferUser } = newUser;
    req.session.user = saferUser
    req.session.current_company = newCompany

    delete req.session.signup

    // Redirect the user to the app page
    res.redirect('/app');
};

async function signin(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        return res.redirect('/app');
    }

    try {
        // Render the signin page
        res.render("users/signin");
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.signin `, err.message);
        next(err);
    }
}

async function signinPost(req, res, next) {

    // Check if the user is already authenticated
    if (req.session.isAuth) {
        // If the user is already authenticated, set a flash message and redirect to the app page
        return res.redirect('/app');
    }

    // Destructure the crm-email and crm-password fields   
    const { 'crm-email': crmEmail, 'crm-password': crmPassword } = req.body;


    // Trim the whitespace from the email and password fields
    const trimmedEmail = crmEmail && crmEmail.trim();
    const trimmedPassword = crmPassword && crmPassword.trim();

    req.session.signin = req.session.signin || {};
    req.session.signin.user = {
        email: trimmedEmail,
        password: trimmedPassword
    }

    // Check if any of the required fields are empty
    if (!trimmedEmail || !trimmedPassword) {
        // If any of the fields are empty, render the signin page again with an error message
        req.flash('error', {
            message: req.i18n.t('signin.all_fields_require')
        });

        return res.render('users/signin', {
            notifications: req.flash()
        })
    }

    // Check if the email is valid
    if (!validator.isEmail(trimmedEmail)) {
        // If the email is not valid, render the signup page again with an error message
        req.flash('error', {
            message: req.i18n.t('forgot_password.email_invalid'),
            submessage: req.i18n.t('forgot_password.email_invalid_sub')
        });

        return res.render('users/signin', {
            notifications: req.flash()
        });
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given email address
    const user = await userService.getByEmail(trimmedEmail);
    if (!user) {
        req.flash('error', {
            message: req.i18n.t('signin.email_or_password_invalid'),
        });

        // If a user does not exist, render the signin page again with an error message
        return res.render('users/signin', {
            notifications: req.flash()
        })
    }

    // Check if the given password matches the user's password
    const isMatch = await userService.comparePassword(trimmedPassword, user.password || '123');
    if (!isMatch) {

        // If the passwords do not match, render the signin page again with an error message
        req.flash('error', {
            message: req.i18n.t('signin.email_or_password_invalid'),
        });

        return res.render('users/signin', {
            notifications: req.flash()
        });
    }

    // get company by user.companies[0]
    const companyService = new CompanyService(db);
    const current_company = await companyService.getById(user.companies[0]);

    // Set the isAuth, email, and timestamps fields on the user's session
    req.session.isAuth = true
    req.session.current_company = current_company
    const { password, ...saferUser } = user; // remove password key from user object
    req.session.user = saferUser
    req.session.timestamps = []

    delete req.session.signin

    // Redirect the user to the app page
    res.disableBackButtonRedirect(req.session.returnTo || '\'');
}

async function signout(req, res, next) {
    // Check if the user is authenticated
    if (!req.session.isAuth) {
        // If the user is not authenticated, redirect to the signin pages
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

        // If the user is already authenticated, redirect to the app page
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
        req.flash('error', {
            message: req.i18n.t('forgot_password.email_required'),
        });

        return res.render('users/forgot-password', {
            notifications: req.flash()
        })
    }

    // Check if email is valid
    if (!validator.isEmail(trimmedEmail)) {
        // If the email is not valid, render the forgot password page again with an error message
        req.flash('error', {
            message: req.i18n.t('forgot_password.email_invalid'),
            submessage: req.i18n.t('forgot_password.email_invalid_sub')
        });

        return res.render('users/forgot-password', {
            notifications: req.flash()
        })
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given email address
    const user = await userService.getByEmail(trimmedEmail);
    if (!user) {
        // If a user does not exist, render the forgot password page again with an error message
        req.flash('error', {
            message: req.i18n.t('forgot_password.user_does_not_exist'),
        });

        return res.render('users/forgot-password', {
            notifications: req.flash()
        });
    }

    // Generate a random token
    const token = crypto.randomBytes(20).toString('hex');

    // Set the resetPasswordToken and resetPasswordExpires fields on the user
    await userService.updateByEmail(user.email, { resetPasswordToken: token, resetPasswordExpires: Date.now() + 3600000 });


    await Mailer.sendForgotPasswordMessage(req, user, token, next);

    // Set a flash message and redirect to the signin page
    req.flash('info', {
        'message': req.i18n.t('forgot_password.email_sent')
    });

    res.redirect('/users/resetpasswordsent');
}

// function resetPasswordSent

async function resetPasswordSent(req, res, next) {
    // Check if the user is already authenticated
    if (req.session.isAuth) {

        // If the user is already authenticated, redirect to the app page
        return res.redirect('/app');
    }

    try {
        // Render the reset password sent page
        res.render("users/reset-password-sent", {});
    } catch (err) {
        // If an error occurs, log the error and pass it to the next middleware
        console.error(`Error in userController.resetPasswordSent `, err.message);
        next(err);
    }
}



async function resetPassword(req, res, next) {
    // Destructure the token field from the request body
    const { token } = req.params;

    // Check if the token field is empty
    if (!token) {
        req.flash('error', {
            message: req.i18n.t('reset_password.user_does_not_exist'),
            submessage: req.i18n.t('reset_password.request_new_token')
        });
        return res.redirect('/users/forgotpassword');
    }

    req.session.resetpassword = req.session.resetpassword || {};
    req.session.resetpassword = {
        token: token
    }

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given token
    const user = await userService.getByResetPasswordToken(token);
    if (!user) {
        // If a user does not exist, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.user_does_not_exist'),
            submessage: req.i18n.t('reset_password.request_new_token')
        });
        return res.redirect('/users/forgotpassword');
    }

    // test if the token has expired
    if (user.resetPasswordExpires < Date.now()) {
        // If the reset password token has expired, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.token_expired'),
            // include date in submessage

            // submessage: req.i18n.t(‘reset_password.token_expired_sub’, { date: moment(user.resetPasswordExpires).format(‘DD / MM / YYYY HH: mm’) })
        });

        return res.redirect('/users/forgotpassword');
    }
    // Check if the reset password token has expired
    if (user.resetPasswordExpires < Date.now()) {
        // If the reset password token has expired, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.token_expired'),
            submessage: req.i18n.t('reset_password.request_new_token')
        });

        return res.redirect('/users/forgotpassword');
    }

    // Render the reset password page
    res.render("users/reset-password");
}

// function restePasswordPost

async function resetPasswordPost(req, res, next) {
    // Destructure the token field from the request body

    // Destructure the password and confirmPassword fields from the request body
    const { token, password, confirmPassword } = req.body;

    // Trim the whitespace from the password and confirmPassword fields
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    req.session.resetpassword = req.session.resetpassword || {};
    req.session.resetpassword = {
        token: token,
        password: trimmedPassword,
        confirmPassword: trimmedConfirmPassword
    }

    // Check if the password field is empty
    if (!trimmedPassword) {
        // If the password field is empty, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.password_required'),
        });

        return res.render('users/reset-password', {
            token,
            notifications: req.flash()
        })
    }

    // Check if the confirmPassword field is empty
    if (!trimmedConfirmPassword) {
        // If the confirmPassword field is empty, render the reset password page again with an error message    
        req.flash('error', {
            message: req.i18n.t('reset_password.confirm_password_required'),
        });

        return res.render('users/reset-password', {
            token,
            notifications: req.flash()
        })
    }

    // Check if the password and confirmPassword fields match
    if (trimmedPassword !== trimmedConfirmPassword) {
        // If the password and confirmPassword fields do not match, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.passwords_do_not_match'),
        });

        return res.render('users/reset-password', {
            token,
            notifications: req.flash()
        })
    }

    // Get a reference to the MongoDB database
    const db = get();


    // Create a new User instance
    const userService = new UserService(db);

    // Check if a user exists with the given token
    const user = await userService.getByResetPasswordToken(token);
    if (!user) {
        // If a user does not exist, render the reset password page again with an error message
        req.flash('error', {
            message: req.i18n.t('reset_password.user_does_not_exist'),
            submessage: req.i18n.t('reset_password.request_new_token')
        });
        return res.redirect('/users/forgotpassword');
    }

    // Check if the reset password token has expired
    if (user.resetPasswordExpires < Date.now()) {
        // If the reset password token has expired, render the reset password page again with an error message  
        req.flash('error', {
            message: req.i18n.t('reset_password.token_expired'),
            submessage: req.i18n.t('reset_password.request_new_token')
        });

        return res.redirect('/users/forgotpassword');
    }

    // Hash the password
    const hashedPassword = await userService.hashPassword(trimmedPassword);

    // Update the user's password and reset password token
    await userService.updateBy('user_id', user._id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
    });

    req.flash('info', {
        message: req.i18n.t('reset_password.password_updated'),
        submessage: req.i18n.t('reset_password.please_sign_in')
    });

    res.redirect("users/signin");
}

function OAuthGoogleURL(req, res, next) {
    return res.redirect(getOAuthGoogleURL());
}

async function OAuthGoogleCallback(req, res, next) {
    /// get code from body
    const code = req.query.code;

    const googleUser = await handleGoogleCallback(code);

    const { email, firstname } = googleUser;

    const db = get();

    const userService = new UserService(db);

    const user = await userService.getByEmail(email);

    if (!user) {
        // make sure session.isAuth is false
        req.session.isAuth = false;

        req.session.signup = req.session.signup || {};
        req.session.signup.user = {
            email,
            firstname,
            language: googleUser.locale,
            timezone: moment.tz.guess(),
            google_id: googleUser.id,
            picture: googleUser.picture
        }
        return res.disableBackButtonRedirect('/users/signup-2');
    } else {
        // add google_id and picture to user variable if not exist 
        if (!user.google_id) {
            user.google_id = googleUser.id;
        }
        if (!user.picture) {
            user.picture = googleUser.picture;
        }

        await userService.updateBy('user_id', user._id, user);
    }

    req.session.isAuth = true
    req.session.user = {
        email: user.email,
        firstname: user.firstname,
        language: user.language,
        timezone: user.timezone,
        picture: user.picture
    }
    const companyService = new CompanyService(db);
    req.session.current_company = await companyService.getById(user.companies[0]);

    res.disableBackButtonRedirect('/');
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
    forgotPasswordPost,
    resetPassword,
    resetPasswordPost,
    resetPasswordSent,
    OAuthGoogleURL,
    OAuthGoogleCallback
};