const { Router } = require("express");
const router = Router();
const path = require('path');




router.get("/preferences", (req, res) => {
  res.render("preferences", {
    API_URL: process.env.API_URL,
  });
});

router.get("/templates", (req, res) => {
  res.sendFile(path.join(__dirname, '../invoice1.html'));
});


router.post("/preferences", async (req, res) => {

  // if user is authenticated, save preferences in db

  // const response = await fetch(process.env.API_URL + "/api/users/preferences", {
  //     method: "POST",
  //     headers: {
  //         "Content-Type": "application/json",
  //         "Accept": "application/json"
  //     },
  //     body: formDataJsonString,
  // });
  // if (response.ok) {
  //     window.location.replace("/app");
  // };
  // if (!response.ok) {
  //     const {
  //         code,
  //         message
  //     } =
  //     await response.json();
  //     throw new Error(message);
  // }

  req.i18n.changeLanguage(req.body.lng);



  res.render("preferences", {
    API_URL: process.env.API_URL,
  });
});

module.exports = router;