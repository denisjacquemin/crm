const User = require("../models/user");

async function create(req, res) {
  const { email, password } = req.body;

  const user = await User.create({
    email,
    password,
  });

  res.json({
    user,
    message: "create user successfully",
  });
}

async function getAll(req, res) {
  const users = await User.getAll();

  res.json({
    users,
    message: "users found",
  });
}

function signup(req, res) {
  const { email, password, passwordConfirmation } = req.body;

  // email, password and passwordConfirmation must be present
  if (!email || !password || !passwordConfirmation)
    res.status(400).json({
      message: "email, password and passwordConfirmation are required",
    });

  res.status(200).json({
    message: "User signed up",
  });
}

function signin(req, res) {
  const { email, password } = req.body;

  res.status(200).json({
    message: "User logged in",
  });
}

module.exports = {
  create,
  getAll,
  signup,
};
