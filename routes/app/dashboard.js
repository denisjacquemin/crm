const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.render("app/dashboard", {
    messages: req.flash('messages'),
  });
});

module.exports = router;

