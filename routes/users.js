const { Router } = require("express");
const router = Router();

router.get("/users/signup", (req, res) => {
  res.render("users/signup", {
    API_URL: process.env.API_URL,
  });
});

router.get("/users/signin", (req, res) => {
  res.render("users/signin", {
    API_URL: process.env.API_URL,
  });
});
// router.post("/login", userController.login);

// router.get("/private/users", userController.getAll);

module.exports = router;
