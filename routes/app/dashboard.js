const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  if (!req.session.isAuth) {
    req.flash('messages', req.i18n.t('signin.already_authenticated'));
    return res.redirect('/app');
  }  
  res.render("app/dashboard", {
    messages: req.flash('messages'),
    layout: 'app'
  });
});

module.exports = router;

