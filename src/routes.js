const express = require('express');
const router = express.Router();
// const csrfProtection = require('./middlewares/csrf');
const auth = require('./middlewares/auth');
const globalController = require('./controllers/globalController');
const userController = require('./controllers/usersController');
const dashboardController = require('./controllers/dashboardController');
const documentsController = require('./controllers/documentsController');
const companiesController = require('./controllers/companiesController');
const buyersController = require('./controllers/buyersController');

// render views/test.hbs template
router.get("/test", (req, res) => {
    res.render("test");
});

router.post("/preferences/changelang", globalController.changeLang);
router.get("/settings", auth, globalController.settings);


router.get("/users/signup-1", userController.signup1);
router.post("/users/signup-1", userController.signup1Post);
router.get("/users/signup-2", userController.signup2);
router.post("/users/signup-2", userController.signup2Post);
router.get("/users/signin", userController.signin);
router.post("/users/signin", userController.signinPost);
router.get("/users/signout", userController.signout);
router.get("/users/forgotpassword", userController.forgotPassword);
router.post("/users/forgotpassword", userController.forgotPasswordPost);
router.get("/users/resetpasswordsent", userController.resetPasswordSent);
router.get("/users/resetpassword/:token", userController.resetPassword);
router.post("/users/resetpassword", userController.resetPasswordPost);
router.get("/oauth/google/url", userController.OAuthGoogleURL);
router.get("/oauth/google/callback", userController.OAuthGoogleCallback);
router.patch("/user/resetemail", auth, userController.resetEmail);
router.get("/isStillAuthenticated", auth, userController.isStillAuthenticated);

// Needs authentication and ACL
router.get(["/", "/app", "/dashboard"], auth, dashboardController.index);


router.get("/documents", auth, documentsController.index);

router.post("/document/new", auth, documentsController.newDocument);
router.post("/document/newAjax", auth, documentsController.newDocumentAjax);

router.get("/document/edit/:slug?", auth, documentsController.edit);
router.get("/document/editAjax/:slug?", auth, documentsController.editAjax);
router.patch("/document/:slug?", auth, documentsController.update); // autosave for documents

router.get("/document/preview/:slug", auth, documentsController.preview);
router.get("/document/:slug.pdf", auth, documentsController.toPDFWithPuppeteer); 
router.get("/documents/search:querystring?", auth, documentsController.search);

router.get("/buyers", auth, buyersController.index);
router.get("/buyers/editAjax/:slug?", auth, buyersController.editAjax);
router.delete("/buyers/deleteAjax/:slug?", auth, buyersController.deleteAjax);
router.get("/buyers/search:querystring?", auth, buyersController.search);
router.post("/buyers/newAjax", auth, buyersController.newBuyerAjax);
router.patch("/buyer/:slug?", auth, buyersController.update); // autosave for buyers




router.patch("/company/currentInvoiceSequence", auth, companiesController.updateInvoiceSequence);

// router.get("/companies/new", companiesController.newCompany);




module.exports = router;