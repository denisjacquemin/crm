const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const documentsController = require('../controllers/documentsController');


// render views/test.hbs template
router.get("/test", (req, res) => {
    res.render("test");
});

router.post("/preferences/changelang", globalController.changeLang);

router.get("/users/signup", userController.signup);
router.post("/users/signup", userController.signupPost);
router.get("/users/signin", userController.signin);
router.post("/users/signin", userController.signinPost);
router.get("/users/signout", userController.signout);
router.get("/users/forgotpassword", userController.forgotPassword);
router.post("/users/forgotpassword", userController.forgotPasswordPost);


// Needs authentication and ACL
router.get(["/", "/app", "/dashboard"], dashboardController.index);

router.get("/documents", documentsController.index);

router.get("/documents/new", documentsController.edit);
router.get("/documents/edit/:id?", documentsController.edit);


module.exports = router;