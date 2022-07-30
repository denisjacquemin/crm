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

async function signup(req, res) {
  const { email, password, passwordConfirmation } = req.body;

  // email, password and passwordConfirmation must be present
  if (!email || !password || !passwordConfirmation)
    return res.status(400).json({
      message: "email, password and passwordConfirmation are required",
    });

  // check if user already exists
  const user = await User.getByEmail(email);
  if (user) return res.status(400).json({ message: "user already exists" });

  // check if password and passwordConfirmation match
  if (password !== passwordConfirmation)
    return res
      .status(400)
      .json({ message: "password and passwordConfirmation must match" });

  // create user
  const newUser = User.create({ email, password });

  return res.status(200).json({
    email: newUser.email,
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
