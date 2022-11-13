require("dotenv").config();
const i18next = require('i18next');
const i18Middleware = require('i18next-http-middleware');
const i18nBackend = require('i18next-fs-backend');
const cookieParser = require('cookie-parser')

const express = require("express");
const path = require("path");
const app = express();

i18next.use(i18nBackend)
       .use(i18Middleware.LanguageDetector)
       .init({
          detection: {
            lookupCookie: 'lng',
            caches: ['cookie']
          },
          backend: {
              // eslint-disable-next-line no-path-concat
              loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
              // eslint-disable-next-line no-path-concat
              addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
            },
            fallbackLng: 'en',
            // nonExplicitSupportedLngs: true,
            // supportedLngs: ['en', 'de'],
            load: 'languageOnly',
            saveMissing: true,
            nonExplicitSupportedLngs: true
       });

const { create } = require("express-handlebars");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(i18Middleware.handle(i18next));

app.get('/lang', (req, res) => {
  res.send(JSON.stringify({
    'req.language': req.language,
    'req.i18n.language': req.i18n.language,
    'req.i18n.languages': req.i18n.languages,
    'req.i18n.languages[0]': req.i18n.languages[0],
    'req.t("home.title")': req.t('home.title')
  }, null, 2))
})

const hbs = create({
  extname: ".hbs",
  helpers: {
    API_HOSTNAME: function () {
      return process.env.API_HOSTNAME;
    }
  },
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));


app.use("/", require("./routes/global"));
app.use("/", require("./routes/users"));

app.use("/app", require("./middlewares/auth"));

app.get("/app", (req, res) => {
  res.render("home");
});

// app.use("/app", dashboardRouter);
// app.use("/app", invoicingRouter);
// app.use("/app", customerRouter);

// handling 404 error
// app.use(function (req, res, next) {
//   debugger;

//   res.status(404);

//   // respond with html page
//   if (req.accepts("html")) {
//     res.render("404", { url: req.url });
//     return;
//   }

//   // respond with json
//   if (req.accepts("json")) {
//     res.json({ error: "Not found" });
//     return;
//   }

//   // default to plain-text. send()
//   res.type("txt").send("Not found");
// });

// handling errors
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).render("error", { error: err });
});

app.listen(3000, () => {
  console.log("server run successfully");
});
