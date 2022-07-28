const { Router } = require("express");
const userController = require("../controllers/users");
const router = Router();

router.get("/users/signup", (req, res) => {
  res.render("users/signup");
});

router.post("/signup", userController.signup);

// router.post("/login", userController.login);

router.get("/private/users", userController.getAll);

module.exports = router;
