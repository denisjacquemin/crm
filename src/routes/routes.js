const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');
const userController = require('../controllers/userController');

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

router.get("/")

module.exports = router;