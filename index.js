require("dotenv").config();
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const mongo = require("./src/services/lib/mongo");



// enable rate limiter
// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 // limit each IP to 100 requests per windowMs
// });

// creates expres app using csrf and ratelimit protection
// file deepcode ignore UseCsurfForExpress: CSRF is used later in the file
const app = express();

// enable rate limiter



require("./src/lib/response-helpers")(app);

app.use(helmet());
app.use(require('./src/middlewares/helmetCSP'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./src/middlewares/session'));

app.use(flash())


app.use(cookieParser());
app.use(require('./src/middlewares/i18next'));

const { create } = require("express-handlebars");
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

app.use(function(req, res, next) {
    // push value of req.originalUrl to req.session.originalUrl array
    if (req.session.originalUrl) {
        req.session.originalUrl.push(req.originalUrl);
    } else {
        req.session.originalUrl = [req.originalUrl];
    }
    next();
});

app.use(require('./src/middlewares/csrf'));
app.use(function(req, res, next) {
    res.locals.notifications = req.flash();
    res.locals.session = req.session;
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use(require('./src/middlewares/cacheControl'));
app.use('/dist', express.static(path.join(__dirname, "/dist")));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/", require("./src/middlewares/languages.dropdown"));
app.use("/", require("./src/routes"));
app.use(function(err, req, res, next) {
    if (res.headersSent) {
        console.log("headers sent", res.headersSent);
        return next(err);
    }
    console.error(err);
    res.status(500).render("error", { error: err });
});


mongo.run().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
});