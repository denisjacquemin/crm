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
const productsController = require('./controllers/productsController');

// render views/test.hbs template
router.get("/test", (req, res) => {
    res.render("test");
});

router.post("/preferences/changelang", globalController.changeLang);
router.get("/settings/:tabid?", auth, globalController.settings);
router.post("/taxRates", globalController.getTaxRatesByCountryCodes);


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
// router.patch("/user/changelanguage", auth, userController.changeLanguage);
router.patch("/user/resetpasswordfromsettings", auth, userController.resetPasswordFromSettings);

// Needs authentication and ACL
router.get(["/", "/app", "/dashboard"], auth, dashboardController.index);


router.get("/documents", auth, documentsController.index);

// router.post("/document/new", auth, documentsController.newDocument);
router.post("/document/newAjax", auth, documentsController.newDocumentAjax);

router.get("/document/edit/:slug?", auth, documentsController.edit);
router.get("/document/editAjax/:slug?", auth, documentsController.editAjax);
router.patch("/document/:slug?", auth, documentsController.update); // autosave for documents

router.get("/document/preview/:slug", auth, documentsController.preview);
router.get("/document/:slug.pdf", auth, documentsController.toPDFWithPuppeteer); 
router.get("/documents/search:querystring?", auth, documentsController.search);
router.post("/document/duplicateAjax", auth, documentsController.duplicateAjax);
router.post("/document/createCreditNoteAjax", auth, documentsController.createCreditNoteAjax);
router.delete("/document/deleteAjax/:slug", auth, documentsController.deleteAjax);


router.get("/buyers", auth, buyersController.index);
router.get("/buyers/editAjax/:slug?", auth, buyersController.editAjax);
router.delete("/buyers/deleteAjax/:slug?", auth, buyersController.deleteAjax);
router.get("/buyers/search:querystring?", auth, buyersController.search);
router.post("/buyers/newAjax", auth, buyersController.newBuyerAjax);
router.patch("/buyer/:slug?", auth, buyersController.update); // autosave for buyers

router.get("/products", auth, productsController.index);
router.get("/products/editAjax/:slug?", auth, productsController.editAjax);
router.delete("/products/deleteAjax/:slug?", auth, productsController.deleteAjax);
router.get("/products/search:querystring?", auth, productsController.search);
router.post("/products/newAjax", auth, productsController.newProductAjax);
router.patch("/product/:slug?", auth, productsController.update); // autosave for buyers



router.patch("/company/defaultinvoiceduedatetermstype", auth, companiesController.setDefaultInvoiceDueDateTermsType);
router.patch("/company/defaultcurrency", auth, companiesController.setDefaultCurrency);
router.patch("/company/showdeliverydate", auth, companiesController.showdeliverydate);

router.patch("/company/currentInvoiceSequence", auth, companiesController.updateInvoiceSequence);
router.get("/companies/editAjax/:slug?", auth, companiesController.editAjax);
router.post("/company/newAjax", auth, companiesController.newCompanyAjax);
router.patch("/company/:slug?", auth, companiesController.update); // autosave for buyers
router.get("/companies/currentusercompanies", auth, companiesController.getCurrentUserCompanies);
router.delete("/companies/deleteAjax/:slug?", auth, companiesController.deleteAjax);
router.post("/companies/changeCurrentCompany", auth, companiesController.changeCurrentCompany);

// router.get("/companies/new", companiesController.newCompany);




module.exports = router;