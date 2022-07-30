const express = require("express");
const path = require("path");
const db = require("./lib/db/mongo");
const app = express();
const userRouter = require("./routes/users");
const { create } = require("express-handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const hbs = create({
  extname: ".hbs",
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("home");
});

app.use("/private", require("./middlewares/auth"));

app.use("/", userRouter);

// handling 404 error
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts("html")) {
    res.render("404", { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts("json")) {
    res.json({ error: "Not found" });
    return;
  }

  // default to plain-text. send()
  res.type("txt").send("Not found");
});

// handling errors
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status).render("error", { error: err });
});

db.connect(() => {
  app.listen(8000, () => {
    console.log("server run successfully");
  });
});
