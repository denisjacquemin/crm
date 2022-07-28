module.exports = function (req, res, next) {
  console.log("In auth middleware");

  next();
};
