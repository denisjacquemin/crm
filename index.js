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

db.connect(() => {
  app.listen(8000, () => {
    console.log("server run successfully");
  });
});
