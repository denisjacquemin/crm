const UserService = require("../services/users.service");
const CompanyService = require("../services/companies.service");
const crypto = require("crypto");
const validator = require("validator");
const Mailer = require("./utils/mailer");
const { ObjectId } = require("mongodb");
const {
  getOAuthGoogleURL,
  handleGoogleCallback,
} = require("../services/lib/oauth.google");
const { use } = require("../services/lib/mailer");
const { sanitizeEmail } = require("../lib/sanitizer");
const DateHelper = require("../lib/date-helpers");
const mongo = require("../services/lib/mongo");
const session = require("express-session");
const geoip = require("geoip-lite");
const mongoose = require("mongoose");

async function signup1(req, res, next) {
  // Check if the user is already authenticated
  if (req.session.isAuth) {
    // If the user is already authenticated, redirect to the app page
    return res.redirect("/app");
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
    return res.redirect("/app");
  }

  // Destructure the crm-email, crm-password, and firstname fields from the request body
  const { title, firstname, lastname, email, password } = req.body;

  // Trim the whitespace from the email, password, and passwordConfirmation fields
  const trimmedTitle = title && title.trim();
  const trimmedFirstname = firstname && firstname.trim();
  const trimmedLastname = lastname && lastname.trim();
  const trimmedEmail = email && email.trim().toLowerCase();
  const trimmedPassword = password && password.trim();

  req.session.signup = req.session.signup || {};
  req.session.signup.user = {
    title: trimmedTitle,
    firstname: trimmedFirstname,
    lastname: trimmedLastname,
    email: trimmedEmail,
    password: trimmedPassword,
  };

  // Check if any of the required fields are empty
  if (
    !trimmedTitle ||
    !trimmedFirstname ||
    !trimmedLastname ||
    !trimmedEmail ||
    !trimmedPassword
  ) {
    // If any of the fields are empty, render the signup page again with an error message
    return res.render("users/signup1", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.all_fields_required"),
        },
      ],
    });
  }

  // Check if the email is valid
  if (!validator.isEmail(trimmedEmail)) {
    // If the email is not valid, render the signup page again with an error message
    return res.render("users/signup1", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_invalid", {
            email: trimmedEmail,
          }),
          subcontent: req.i18n.t("users.controller.email_invalid_sub"),
        },
      ],
    });
  }

  // check if password is strong, customize isStrongPassword() to your needs
  if (
    !validator.isStrongPassword(trimmedPassword, {
      minLength: process.env.PASSWORD_MIN_LENGTH,
      minLowercase: process.env.PASSWORD_MIN_LOWERCASE,
      minUppercase: process.env.PASSWORD_MIN_UPPERCASE,
      minNumbers: process.env.PASSWORD_MIN_NUMBERS,
      minSymbols: process.env.PASSWORD_MIN_SYMBOLS,
      returnScore: false,
    })
  ) {
    // If the password is not strong enough, render the signup page again with an error message
    return res.render("users/signup1", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.password_not_strong_enough"),
          submessage: req.i18n.t(
            "users.controller.password_not_strong_enough_sub",
            {
              minLength: process.env.PASSWORD_MIN_LENGTH,
              minLowercase: process.env.PASSWORD_MIN_LOWERCASE,
              minUppercase: process.env.PASSWORD_MIN_UPPERCASE,
              minNumbers: process.env.PASSWORD_MIN_NUMBERS,
              minSymbols: process.env.PASSWORD_MIN_SYMBOLS,
            }
          ),
        },
      ],
    });
  }

  // Check if a user already exists with the given email address
  const userExist = await UserService.existsByEmail(
    sanitizeEmail(trimmedEmail)
  );
  if (userExist) {
    // If a user already exists, render the signup page again with an error message
    return res.render("users/signup1", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.user_already_exists"),
        },
      ],
    });
  }

  // Go to signup2 - new company page
  res.redirect("/users/signup-2");
}

async function signup2(req, res, next) {
  // Check if the user is already authenticated
  if (req.session.isAuth) {
    return res.redirect("/app");
  }

  // Check if we have user data from signup1
  if (!req.session.signup || !req.session.signup.user) {
    return res.redirect("/users/signup-1");
  }

  try {
    // Get default country from user's IP or fallback to env variable
    const geo = geoip.lookup(req.ip);
    const defaultCountry = geo?.country || process.env.DEFAULT_COUNTRY;

    // Get default language from browser or fallback to env variable
    const defaultLanguage =
      req.i18n.language.split("-")[0] || process.env.DEFAULT_LANGUAGE;

    // Initialize default company data
    const defaultCompany = {
      country: defaultCountry,
      language: defaultLanguage,
      without_vat: false,
      contact_title: req.session.signup.user.title || "",
      contact_firstname: req.session.signup.user.firstname || "",
      contact_lastname: req.session.signup.user.lastname || "",
    };

    // Merge with any existing company data in session
    const company = {
      ...defaultCompany,
      ...(req.session.signup.company || {}),
    };

    // Store in session
    req.session.signup.company = company;

    // Render the signup page with initial data
    res.render("users/signup2", {
      defaultCountry,
      defaultLanguage,
      session: {
        signup: {
          user: req.session.signup.user,
          company,
        },
      },
    });
  } catch (err) {
    console.error(`Error in userController.signup2:`, err);
    next(err);
  }
}

async function signup2Post(req, res, next) {
  if (req.session.isAuth) {
    return res.redirect("/app");
  }

  if (!req.session.signup?.user) {
    return res.redirect("/users/signup-1");
  }

  try {
    // Sanitize and validate input
    const companyData = sanitizeCompanyData(req.body);
    const validationErrors = validateCompanyData(companyData);

    if (validationErrors.length > 0) {
      return res.render("users/signup2", {
        notifications: validationErrors.map((error) => ({
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t(error.message, error.params),
        })),
        session: {
          signup: {
            user: req.session.signup.user,
            company: companyData,
          },
        },
      });
    }

    // Store sanitized data in session
    req.session.signup.company = {
      ...companyData,
      settings: { email_subject_templates: {} },
    };

    // Create user and company
    const { user, company } = await createUserAndCompany(req.session.signup);

    // Set session data
    req.session.isAuth = true;
    req.session.user = user;
    req.session.current_company = company;
    delete req.session.signup;

    res.redirect("/app");
  } catch (err) {
    console.error("Error in signup2Post:", err);
    next(err);
  }
}

// Helper functions
function sanitizeCompanyData(body) {
  return {
    name: body.name?.trim(),
    address1: body.address1?.trim(),
    address2: body.address2?.trim(),
    zip: body.zip?.trim(),
    city: body.city?.trim(),
    country: body.country?.trim(),
    vat_number: body.vat_number?.trim(),
    registration_number: body.registration_number?.trim(),
    without_vat: body.without_vat === "on",
    contact_title: body.contact_title?.trim(),
    contact_firstname: body.contact_firstname?.trim(),
    contact_lastname: body.contact_lastname?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim()?.toLowerCase(),
    website: body.website?.trim(),
    language: body.language?.trim(),
  };
}

function validateCompanyData(data) {
  const errors = [];

  if (!data.name) {
    errors.push({
      message: "users.controller.name_is_required",
    });
  }

  if (data.email && !validator.isEmail(data.email)) {
    errors.push({
      message: "users.controller.email_invalid",
      params: { email: data.email },
    });
  }

  return errors;
}

async function createUserAndCompany(signupData) {
  if (process.env.MONGO_USE_TRANSACTIONS === "true") {
    return await createUserAndCompanyWithTransaction(signupData);
  } else {
    return await createUserAndCompanyWithoutTransaction(signupData);
  }
}

async function createUserAndCompanyWithTransaction(signupData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = new ObjectId();
    const companyId = new ObjectId();

    // Create user
    const userData = {
      ...signupData.user,
      _id: userId,
      companies: [companyId],
      timezone: DateHelper.guess(),
      language: signupData.company.language,
    };
    const user = await UserService.create(userData, { session });

    // Create company
    const companyData = {
      ...signupData.company,
      _id: companyId,
      users: [userId],
      taxrates: [],
    };
    const company = await CompanyService.create(companyData, { session });

    await session.commitTransaction();

    return {
      user: user.toObject(),
      company: company.toObject(),
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function createUserAndCompanyWithoutTransaction(signupData) {
  try {
    const userId = new ObjectId();
    const companyId = new ObjectId();

    // Create user
    const userData = {
      ...signupData.user,
      _id: userId,
      companies: [companyId],
      timezone: DateHelper.guess(),
      language: signupData.company.language,
    };
    const user = await UserService.create(userData);

    // Create company
    const companyData = {
      ...signupData.company,
      _id: companyId,
      users: [userId],
      taxrates: [],
    };
    const company = await CompanyService.create(companyData);

    return {
      user: user.toObject(),
      company: company.toObject(),
    };
  } catch (err) {
    // If user was created but company creation failed, cleanup the user
    if (err.code !== 11000) {
      // Skip cleanup on duplicate key error
      try {
        await UserService.deleteById(userId);
      } catch (cleanupErr) {
        console.error("Cleanup failed:", cleanupErr);
      }
    }
    throw err;
  }
}

async function signin(req, res, next) {
  // Check if the user is already authenticated
  if (req.session.isAuth) {
    // If the user is already authenticated, set a flash message and redirect to the app page
    return res.redirect("/app");
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
    return res.redirect("/app");
  }

  // Destructure the crm-email and crm-password fields
  const { "crm-email": crmEmail, "crm-password": crmPassword } = req.body;

  // Trim the whitespace from the email and password fields
  const emailSanitized = crmEmail && sanitizeEmail(crmEmail);
  const trimmedPassword = crmPassword && crmPassword.trim();

  // req.session.signin = req.session.signin || {};
  // req.session.signin.user = {
  //     email: trimmedEmail,
  //     password: trimmedPassword
  // }

  // Check if any of the required fields are empty
  if (!emailSanitized || !trimmedPassword) {
    // If any of the fields are empty, render the signin page again with an error message
    return res.render("users/signin", {
      email: crmEmail,
      password: trimmedPassword,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.all_fields_required"),
        },
      ],
    });
  }

  // Check if the email is valid
  if (!validator.isEmail(emailSanitized)) {
    // If the email is not valid, render the signup page again with an error message
    return res.render("users/signin", {
      email: crmEmail,
      password: trimmedPassword,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_invalid", {
            email: crmEmail,
          }),
          subcontent: req.i18n.t("users.controller.email_invalid_sub"),
        },
      ],
    });
  }

  const user = await UserService.getByEmail(emailSanitized);
  if (!user) {
    // If a user does not exist, render the signin page again with an error message
    return res.render("users/signin", {
      email: crmEmail,
      password: trimmedPassword,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_or_password_invalid"),
        },
      ],
    });
  }

  // Check if the user has a password
  if (!user.password) {
    // If the user does not have a password, they signed up with an OAuth provider. Show an error message telling them to sign in with the correct provider.
    let provider;
    if (user.google_id !== "") {
      provider = "google";
    } else if (user.microsoft_id !== "") {
      provider = "microsoft";
    } else if (user.twitter_id !== "") {
      provider = "twitter";
    }
    return res.render("users/signin", {
      email: crmEmail,
      password: trimmedPassword,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t(`users.controller.signin_with_${provider}`),
        },
      ],
    });
  }

  // Check if the given password matches the user's password
  const isMatch = await UserService.comparePassword(
    trimmedPassword,
    user.password
  );
  if (!isMatch) {
    // If the passwords do not match, render the signin page again with an error message
    return res.render("users/signin", {
      email: crmEmail,
      password: trimmedPassword,
      message: req.i18n.t("users.controller.email_or_password_invalid"),
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_or_password_invalid"),
        },
      ],
    });
  }

  const current_company = await CompanyService.getById(user.companies[0]);

  // Set the isAuth, email, and timestamps fields on the user's session
  req.session.isAuth = true;
  req.session.current_company = current_company;
  let saferUser = user.toObject();
  delete saferUser.password;
  req.session.user = saferUser;
  req.session.timestamps = [];

  // Redirect the user to the app page
  const returnTo = req.session.returnTo;
  delete req.session.returnTo;
  res.disableBackButtonRedirect(req.session.returnTo || "/");
}

async function signout(req, res, next) {
  // Check if the user is authenticated
  if (!req.session.isAuth) {
    // If the user is not authenticated, redirect to the signin pages
    return res.redirect("/users/signin");
  }

  try {
    // Destroy the user's session
    req.session.destroy();

    // Redirect the user to the signin page
    res.redirect("/users/signin");
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
    return res.redirect("/app");
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
  const emailSanitized = sanitizeEmail(email);

  // Check if the email field is empty
  if (!emailSanitized) {
    // If the email field is empty, render the forgot password page again with an error message
    return res.render("users/forgot-password", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_required"),
        },
      ],
    });
  }

  // Check if email is valid
  if (!validator.isEmail(emailSanitized)) {
    // If the email is not valid, render the forgot password page again with an error message
    return res.render("users/forgot-password", {
      email: emailSanitized,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.email_invalid", {
            email: emailSanitized,
          }),
          subcontent: req.i18n.t("users.controller.email_invalid_sub"),
        },
      ],
    });
  }

  // Check if a user exists with the given email address
  const user = await UserService.getByEmail(emailSanitized);
  if (!user) {
    // If a user does not exist, render the forgot password page again with an error message
    return res.render("users/forgot-password", {
      email: emailSanitized,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.user_does_not_exist"),
        },
      ],
    });
  }

  // Generate a random token
  const token = crypto.randomBytes(20).toString("hex");

  // Set the resetPasswordToken and resetPasswordExpires fields on the user
  await UserService.updateByEmail(user.email, {
    resetPasswordToken: token,
    resetPasswordExpires: Date.now() + 3600000,
  });

  await Mailer.sendForgotPasswordMessage(req, user, token, next);

  // Set a flash message and redirect to the signin page
  // TODO is it working with flash messages?
  req.flash("info", {
    message: req.i18n.t("users.controller.email_sent"),
  });

  res.redirect("/users/resetpasswordsent");
}

// function resetPasswordSent

async function resetPasswordSent(req, res, next) {
  // Check if the user is already authenticated
  if (req.session.isAuth) {
    // If the user is already authenticated, redirect to the app page
    return res.redirect("/app");
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

  console.log("token", token);

  // Check if the token field is empty
  if (!token) {
    return res.redirect("/users/forgotpassword", {
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.link_invalid"),
          subcontent: req.i18n.t("users.controller.request_new_one"),
        },
      ],
    });
  }

  req.session.resetpassword = req.session.resetpassword || {};
  req.session.resetpassword = {
    token: token,
  };

  // Check if a user exists with the given token
  const user = await UserService.getByResetPasswordToken(token);
  if (!user) {
    // If a user does not exist, render the reset password page again with an error message
    req.flash("error", {
      message: req.i18n.t("users.controller.link_invalid"),
      submessage: req.i18n.t("users.controller.request_new_one"),
    });
    return res.redirect("/users/forgotpassword");
  }

  // test if the token has expired, the token is valid one hour
  if (user.resetPasswordExpires < Date.now()) {
    // If the reset password token has expired, render the reset password page again with an error message
    req.flash("error", {
      message: req.i18n.t("users.controller.token_expired"),
      // include date in submessage

      // submessage: req.i18n.t(‘reset_password.token_expired_sub’, { date: moment(user.resetPasswordExpires).format(‘DD / MM / YYYY HH: mm’) })
    });

    return res.redirect("/users/forgotpassword");
  }
  // Check if the reset password token has expired
  if (user.resetPasswordExpires < Date.now()) {
    // If the reset password token has expired, render the reset password page again with an error message
    req.flash("error", {
      message: req.i18n.t("users.controller.token_expired"),
      submessage: req.i18n.t("users.controller.request_new_token"),
    });

    return res.redirect("/users/forgotpassword");
  }

  // Render the reset password page
  res.render("users/reset-password");
}

// async function changeLanguage(req, res, next) {
//     try {
//         const language = req.body.language;
//         console.log('changeLanguage > language', language);
//         const codes = req.i18n.t('do_not_translate.languages', { returnObjects: true }).map(lang => lang.code_dnt);
//         if (!validator.isIn(language, codes)) {
//             return res.status(400).json({
//                 notification: {
//                     message: req.i18n.t('languages.invalid_language'),
//                     type: 'error'
//                 }
//             });
//         }

//         const user = await UserService.getById(req.session.user._id);
//         await UserService.updateById(user._id, { language: language });
//         req.session.user.language = language;

//         return res.status(200).json({
//             notification: {
//                 message: req.i18n.t('languages.language_changed'),
//                 type: 'success'
//             }
//         });
//     } catch (err) {
//         console.error(`Error in userController.changeLanguage `, err.message);
//         next(err);
//     }
// }

async function resetEmail(req, res, next) {
  const email = req.body.email;
  try {
    const emailSanitized = sanitizeEmail(email);
    if (!emailSanitized || !validator.isEmail(emailSanitized)) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t("users.controller.email_invalid", {
            email: emailSanitized,
          }),
          type: "error",
        },
      });
    }

    const user = await UserService.getByEmail(emailSanitized);
    if (user) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t("users.controller.email_taken", {
            email: emailSanitized,
          }),
          type: "error",
        },
      });
    }

    const userUpdated = await UserService.updateById(req.session.user._id, {
      email: emailSanitized,
    });
    req.session.user.email = emailSanitized;

    return res.status(200).json({
      notification: {
        message: req.i18n.t("users.controller.email_updated"),
        type: "success",
      },
    });
  } catch (err) {
    console.error(`Error in userController.resetEmail `, err.message);
    next(err);
  }
}

async function resetPasswordFromSettings(req, res, next) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const trimmedCurrentPassword = currentPassword.trim();
  const trimmedNewPassword = newPassword.trim();
  const trimmedConfirmPassword = confirmPassword.trim();

  if (
    !trimmedCurrentPassword ||
    !trimmedNewPassword ||
    !trimmedConfirmPassword
  ) {
    return res.status(400).json({
      notification: {
        message: req.i18n.t("users.controller.all_fields_required"),
        type: "error",
      },
    });
  }

  if (trimmedNewPassword !== trimmedConfirmPassword) {
    return res.status(400).json({
      notification: {
        message: req.i18n.t("users.controller.passwords_do_not_match"),
        type: "error",
      },
    });
  }

  if (
    !validator.isStrongPassword(trimmedNewPassword, {
      minLength: process.env.PASSWORD_MIN_LENGTH,
      minLowercase: process.env.PASSWORD_MIN_LOWERCASE,
      minUppercase: process.env.PASSWORD_MIN_UPPERCASE,
      minNumbers: process.env.PASSWORD_MIN_NUMBERS,
      minSymbols: process.env.PASSWORD_MIN_SYMBOLS,
      returnScore: false,
    })
  ) {
    return res.status(400).json({
      notification: {
        message: req.i18n.t("users.controller.password_not_strong_enough"),
        submessage: req.i18n.t(
          "users.controller.password_not_strong_enough_sub",
          {
            minLength: process.env.PASSWORD_MIN_LENGTH,
            minLowercase: process.env.PASSWORD_MIN_LOWERCASE,
            minUppercase: process.env.PASSWORD_MIN_UPPERCASE,
            minNumbers: process.env.PASSWORD_MIN_NUMBERS,
            minSymbols: process.env.PASSWORD_MIN_SYMBOLS,
          }
        ),
        type: "error",
      },
    });
  }

  const user = await UserService.getById(req.session.user._id);
  console.log("resetPasswordFromSettings > user", user, trimmedCurrentPassword);
  const isMatch = await UserService.comparePassword(
    trimmedCurrentPassword,
    user.password
  );
  if (!isMatch) {
    return res.status(400).json({
      notification: {
        message: req.i18n.t("users.controller.current_password_invalid"),
        type: "error",
      },
    });
  }

  const hashedPassword = await UserService.hashPassword(trimmedNewPassword);
  const userUpdated = await UserService.updateById(user._id, {
    password: hashedPassword,
  });

  return res.status(200).json({
    notification: {
      message: req.i18n.t("users.controller.password_updated"),
      type: "success",
    },
  });
}

async function resetPasswordPost(req, res, next) {
  // Destructure the password and confirmPassword fields from the request body
  const { token, password, confirmPassword } = req.body;

  // Trim the whitespace from the password and confirmPassword fields
  const trimmedPassword = password.trim();
  const trimmedConfirmPassword = confirmPassword.trim();

  req.session.resetpassword = req.session.resetpassword || {};
  req.session.resetpassword = {
    token: token,
    password: trimmedPassword,
    confirmPassword: trimmedConfirmPassword,
  };

  // Check if the password field is empty
  if (!trimmedPassword) {
    // If the password field is empty, render the reset password page again with an error message
    return res.render("users/reset-password", {
      token,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.password_required"),
        },
      ],
    });
  }

  // Check if the confirmPassword field is empty
  if (!trimmedConfirmPassword) {
    // If the confirmPassword field is empty, render the reset password page again with an error message
    return res.render("users/reset-password", {
      token,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.confirm_password_required"),
        },
      ],
    });
  }

  // Check if the password and confirmPassword fields match
  if (trimmedPassword !== trimmedConfirmPassword) {
    // If the password and confirmPassword fields do not match, render the reset password page again with an error message
    return res.render("users/reset-password", {
      token,
      notifications: [
        {
          id: new Date().getTime(),
          type: "error",
          content: req.i18n.t("users.controller.passwords_do_not_match"),
        },
      ],
    });
  }

  // Check if a user exists with the given token
  const user = await UserService.getByResetPasswordToken(token);
  if (!user) {
    // If a user does not exist, render the reset password page again with an error message
    req.flash("error", {
      message: req.i18n.t("users.controller.link_invalid"),
      submessage: req.i18n.t("users.controller.request_new_one"),
    });
    return res.redirect("/users/forgotpassword");
  }

  // Check if the reset password token has expired
  if (user.resetPasswordExpires < Date.now()) {
    // If the reset password token has expired, render the reset password page again with an error message
    req.flash("error", {
      message: req.i18n.t("users.controller.token_expired"),
      submessage: req.i18n.t("users.controller.request_new_token"),
    });

    return res.redirect("/users/forgotpassword");
  }

  // Hash the password
  const hashedPassword = await UserService.hashPassword(trimmedPassword);

  // Update the user's password and reset password token
  await UserService.updateById(user._id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  req.flash("info", {
    message: req.i18n.t("users.controller.password_updated"),
    submessage: req.i18n.t("users.controller.please_sign_in"),
  });

  res.redirect("/users/signin");
}

function OAuthGoogleURL(req, res, next) {
  return res.redirect(getOAuthGoogleURL());
}

async function OAuthGoogleCallback(req, res, next) {
  /// get code from body
  const code = req.query.code;

  const googleUser = await handleGoogleCallback(code);

  const { email, firstname } = googleUser;

  console.log("OAuthGoogleCallback googleUser", googleUser);

  emailSanitized = sanitizeEmail(email);
  const user = await UserService.getByEmail(emailSanitized);

  if (!user) {
    // make sure session.isAuth is false
    req.session.isAuth = false;

    req.session.signup = req.session.signup || {};
    req.session.signup.user = {
      email,
      firstname: googleUser.given_name,
      language: googleUser.locale,
      timezone: DateHelper.guess(),
      google_id: googleUser.id,
      picture: googleUser.picture,
    };
    console.log(
      "OAuthGoogleCallback req.session.signup.user",
      req.session.signup.user
    );
    return res.disableBackButtonRedirect("/users/signup-2");
  } else {
    // add google_id and picture to user variable if not exist
    if (!user.google_id) {
      user.google_id = googleUser.id;
    }
    if (!user.picture) {
      user.picture = googleUser.picture;
    }

    await UserService.updateById(user._id, user);
  }
  req.session.isAuth = true;
  req.session.user = user;

  req.session.current_company = await CompanyService.getById(user.companies[0]);

  res.disableBackButtonRedirect("/");
}

function getCountrySelect(req) {
  //req.ip;
  const geo = geoip.lookup(req.ip); //geoip.lookup('178.51.244.142');
  return {
    defaultCountry: geo && geo.country,
  };
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
  resetEmail,
  // changeLanguage,
  resetPasswordFromSettings,
  OAuthGoogleURL,
  OAuthGoogleCallback,
};
