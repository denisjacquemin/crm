require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();


const { create } = require("express-handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const hbs = create({
  extname: ".hbs",
  helpers: {
    API_HOSTNAME: function () {
      return process.env.API_HOSTNAME;
    },
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
