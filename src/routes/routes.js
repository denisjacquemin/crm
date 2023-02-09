const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');
const userController = require('../controllers/usersController');
const dashboardController = require('../controllers/dashboardController');
const documentsController = require('../controllers/documentsController');
// const companiesController = require('../controllers/companiesController');



// render views/test.hbs template
router.get("/test", (req, res) => {
    res.render("test");
});

router.post("/preferences/changelang", globalController.changeLang);

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


// Needs authentication and ACL
router.get(["/", "/app", "/dashboard"], dashboardController.index);

router.get("/documents", documentsController.index);

router.get("/documents/new", documentsController.edit);
router.get("/documents/edit/:id?", documentsController.edit);

// router.get("/companies/new", companiesController.newCompany);



module.exports = router;