require("dotenv").config();
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const compression = require("compression");
const mongooseHelper = require("./src/services/lib/mongoose");
const i18next = require("i18next");
const fs = require("fs");
const { i18nMiddleware } = require("./src/middlewares/i18next");
const { formatBytes } = require("./src/lib/formatBytes");

// enable rate limiter
// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 // limit each IP to 100 requests per windowMs
// });

// creates expres app using csrf and ratelimit protection
// file deepcode ignore UseCsurfForExpress: CSRF is used later in the file
const app = express();

app.get("/json/list", (req, res) => {
  res.json({ message: "This route does not create a session." });
});

app.get("/json/version", (req, res) => {
  res.json({ message: "This route does not create a session." });
});

app.use(compression());

require("./src/lib/response-helpers")(app);
app.use(
  helmet({
    referrerPolicy: { policy: "same-origin" },
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  })
);
app.use(require("./src/middlewares/helmetCSP"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require("./src/middlewares/session"));

app.use(flash());

app.use(cookieParser());
app.use(i18nMiddleware);
// app.use(formatBytes);
// app.use(require('./src/middlewares/checkAndUpdateUserLanguage'));

// TODO only to debug the language detection
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] - ${req.language} - ${req.method} - ${
      req.originalUrl
    }`
  );
  next();
});

const { create } = require("express-handlebars");
const hbs = create({
  extname: ".hbs",
  helpers: {
    i18n: function (key, lang) {
      const result = i18next.t(key, { lng: lang });
      return result;
    },
    API_HOSTNAME: function () {
      return process.env.API_HOSTNAME;
    },
    json: function (context) {
      return JSON.parse(context);
    },
    stringify: function (context) {
      return JSON.stringify(context);
    },
    parse: function (context) {
      return JSON.parse(context);
    },
    add: function (variable, addend) {
      return variable + addend;
    },
    equal: function (a, b, options) {
      if (a === b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    formatDate: function (date, format = "M/D/YYYY") {
      return formatDate(date, format);
    },
    chunk: function (array, chunkSize, options) {
      var result = [];
      for (var i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
      }
      return result;
    },
    concat: function () {
      var args = Array.prototype.slice.call(arguments);
      args.pop(); // Handlebars options
      return args.join("");
    },
    formatAddress: function (address, zip, city, country, options) {
      var formattedAddress = address ? address + "," : "";
      var formattedZip = zip || "";
      var formattedCity = city || "";
      var formattedCountry = country || "";
      return `${formattedAddress} ${formattedZip} ${formattedCity} ${formattedCountry}`;
    },
    slice: function (array, start, end) {
      if (!Array.isArray(array)) {
        throw new Error(
          "The first argument to the `slice` helper must be an array."
        );
      }

      start = start || 0;
      end = end || array.length;

      return array.slice(start, end);
    },
    startsWith: function (str, prefix) {
      return str.startsWith(prefix);
    },
    switch: function (value, options) {
      this.switch_value = value;
      this.switch_break = false;
      return options.fn(this);
    },
    case: function (value, options) {
      if (
        value == this.switch_value ||
        (value == "default" && this.switch_break == false)
      ) {
        this.switch_break = true;
        return options.fn(this);
      }
    },
    or: function (v1, v2) {
      return v1 || v2;
    },
    formatBytes: function (bytes) {
      return formatBytes(bytes);
    },
  },
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "/src/views"));

// app.use(function(req, res, next) {
//     // push value of req.originalUrl to req.session.originalUrl array
//     if (req.session.originalUrl) {
//         req.session.originalUrl.push(req.originalUrl);
//     } else {
//         req.session.originalUrl = [req.originalUrl];
//     }
//     next();
// });

app.use(require("./src/middlewares/csrf"));
app.use((req, res, next) => {
  delete req.body._csrf; // remove _csrf from the request body
  next();
});

// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path} `);
//     next();
// });

app.use(function (req, res, next) {
  let notifications = [];
  let flash = { ...req.flash() };
  if (flash) {
    for (let type in flash) {
      flash[type].forEach((message) => {
        notifications.push({
          id: new Date().getTime(),
          type: type,
          content: message.message,
          subcontent: message.submessage,
        });
      });
    }
  }
  res.locals.notifications = notifications;
  res.locals.session = req.session;

  res.locals.csrfToken = req.csrfToken();
  next();
});

// app.use(require('./src/middlewares/cacheControl')); // commented out because it was causing issues with the login page
app.use("/dist", express.static(path.join(__dirname, "/dist")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/", require("./src/middlewares/languages.dropdown"));
app.use("/", require("./src/routes"));

// app.use((req, res, next) => {
//     const timestamp = new Date().toUTCString();
//     const logMessage = `🏎️  ${timestamp} | ${req.method} | ${req.originalUrl}`;
//     console.log(logMessage);
//     next(); // Call the next middleware in the chain
// });

app.use(function (err, req, res, next) {
  // Check if the request is an AJAX request
  if (req.headers["x-requested-with"] === "XMLHttpRequest") {
    // Handle AJAX request
    let responseJson = { message: err.message };
    if (err.notification) {
      responseJson.notification = err.notification;
    }
    console.error("Error catched", err);

    res.status(err.status || 500).json(responseJson);
  } else {
    console.error("Error catched", err);
    // Handle "normal" request
    res.status(err.status || 500).render("500", { error: err });
  }
});

async function startServer() {
  try {
    await mongooseHelper.connect();
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
  }
}

async function stopServer() {
  try {
    await mongooseHelper.disconnect();
    console.log("🛑 Server stopped");
  } catch (error) {
    console.error("Error stopping server", error);
    process.exit(1);
  }
}

startServer();
// process.on('SIGINT', stopServer);
// process.on('SIGTERM', stopServer);
