require("dotenv").config();
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const Typesense = require('./src/services/lib/typesense');
const compression = require('compression');
const mongooseHelper = require('./src/services/lib/mongoose');


// enable rate limiter
// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 // limit each IP to 100 requests per windowMs
// });

// creates expres app using csrf and ratelimit protection
// file deepcode ignore UseCsurfForExpress: CSRF is used later in the file
const app = express();
app.use(compression());

// enable rate limiter



require("./src/lib/response-helpers")(app);
app.use(helmet({
    referrerPolicy: { policy: "same-origin" },
}));
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
            return JSON.parse(context);
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
        equal: function(a, b, options) {
            if (a === b) {
              return options.fn(this);
            } else {
              return options.inverse(this);
            }
        },
        chunk: function(array, chunkSize, options) {
            var result = [];
            for (var i = 0; i < array.length; i += chunkSize) {
                result.push(array.slice(i, i + chunkSize));
            }
            return result;
        },
        concat: function() {
            var outStr = '';
            for (var arg in arguments) {
               if (typeof arguments[arg] != 'object') {
                    outStr += arguments[arg];
                }
            }
            return outStr;
        },
        formatAddress: function(address, zip, city, country, options) {
            var formattedAddress = address ? address + ',' : '';
            var formattedZip = zip || '';
            var formattedCity = city || '';
            var formattedCountry = country || '';
            return `${formattedAddress} ${formattedZip} ${formattedCity} ${formattedCountry}`;
        },
        slice: function(array, start, end) {
            if (!Array.isArray(array)) {
              throw new Error('The first argument to the `slice` helper must be an array.');
            }
          
            start = start || 0;
            end = end || array.length;
          
            return array.slice(start, end);
        },
        startsWith: function(str, prefix) {
            return str.startsWith(prefix);
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

// app.use(require('./src/middlewares/cacheControl')); // commented out because it was causing issues with the login page
app.use('/dist', express.static(path.join(__dirname, "/dist")));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/", require("./src/middlewares/languages.dropdown"));
app.use("/", require("./src/routes"));

// app.use((req, res, next) => {
//     const timestamp = new Date().toUTCString();
//     const logMessage = `🏎️  ${timestamp} | ${req.method} | ${req.originalUrl}`;
//     console.log(logMessage);
//     next(); // Call the next middleware in the chain
// });

app.use(function(err, req, res, next) {
    // Check if the request is an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        // Handle AJAX request
        let responseJson = { message: err.message };
        if (err.notification) {
            responseJson.notification = err.notification;
        }
        console.error('Error catched', err);

        res.status(err.status || 500).json(responseJson);
    } else {
        console.error('Error catched', err);
        // Handle "normal" request
        res.status(err.status || 500).send(err.message);
    }
});


async function startServer() {
    try {
        await Promise.all([mongooseHelper.connect(), Typesense.connectToTypesense()]);
        app.listen(process.env.PORT, () => {
            console.log(`🚀 Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Error starting server', error);
        process.exit(1);
    }
}




async function stopServer() {
    try {
        await mongooseHelper.disconnect();
        console.log('🛑 Server stopped');
    } catch (error) {
        console.error('Error stopping server', error);
        process.exit(1);
    }
}

startServer();
// process.on('SIGINT', stopServer);
// process.on('SIGTERM', stopServer);