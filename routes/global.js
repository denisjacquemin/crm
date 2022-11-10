const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.render("index", {
    API_URL: process.env.API_URL,
  });
});

module.exports = router;