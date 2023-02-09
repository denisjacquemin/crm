require("dotenv").config();
const i18next = require('i18next');
const i18Middleware = require('i18next-http-middleware');
const i18nBackend = require('i18next-fs-backend');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const helmet = require("helmet");


const express = require("express");
const path = require("path");
const mongo = require("./src/services/lib/mongo");
const { redisClient, RedisStore } = require('./src/services/lib/redis')


const app = express();
app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        "script-src": ["'self'", process.env.DOMAIN, "'unsafe-eval'"],
        "style-src": ["'self'", process.env.DOMAIN, "'unsafe-inline'"]
    },
}));



var session = require('express-session');
let sessionMiddleware = session({
    name: process.env.CONNECT_SID_NAME,
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // only if you use https
        httpOnly: true,
        domain: process.env.DOMAIN,
        path: '/',
        sameSite: 'strict',
        //expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        maxAge: 60 * 60 * 1000 // 1 hour
    }
})
app.use(sessionMiddleware)
app.use(flash())

i18next.use(i18nBackend)
    .use(i18Middleware.LanguageDetector)
    .init({
        partialBundledLanguages: true,
        // ns: ['translation', 'translated_by_hand'],
        // defaultNS: 'translation',
        detection: {
            lookupCookie: 'lng',
            caches: ['cookie']
        },
        backend: {
            loadPath: `${__dirname}/locales/{{lng}}/translation.json`,
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
        API_HOSTNAME: function() {
            return process.env.API_HOSTNAME;
        },
        json: function(context) {
            return JSON.stringify(context);
        },
        stringify: function(context) {
            return JSON.stringify(context);
        },
        parse: function(context) {
            return JSON.parse(context);
        },
        add: function(variable, addend) {
            return variable + addend;
        },
        ifEquals: function(arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        switch: function(value, options) {
            this.switch_value = value;
            this.switch_break = false;
            return options.fn(this);
        },
        case: function(value, options) {
            if (value == this.switch_value || (value == 'default' && this.switch_break == false)) {
                this.switch_break = true;
                return options.fn(this);
            }
        }
    },
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "/src/views"));

// make req.session available in templates
app.use(function(req, res, next) {
    res.locals.notifications = req.flash();
    res.locals.session = req.session;
    next();
});



// apply auth middleware to all routes except an array of routes




app.use('/dist', express.static(path.join(__dirname, "/dist")));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use("/", require("./src/middlewares/auth"));
app.use("/", require("./src/middlewares/acl"));
app.use("/", require("./src/middlewares/languages.dropdown"));
app.use("/", require("./src/routes/routes"));
// app.use("/", require("./routes/users"));
// app.use("/", require("./routes/companies"));

// app.use("/app", require("./routes/app/dashboard"));
// app.use("/app", require("./routes/app/invoices"));



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
app.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).render("error", { error: err });
});


mongo.run().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
});