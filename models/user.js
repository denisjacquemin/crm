const db = require("../lib/db/mongo");
const bcrypt = require("bcrypt");

function setPassword(value) {
  return bcrypt.hashSync(value, 10);
}

const user = {
  email: "",
  password: setPassword,
};

async function create(user) {
  const { email, password } = user;

  userToInsert = {
    email,
    password: setPassword(password),
  };

  const result = await db.get().collection("users").insertOne(userToInsert);

  return userToInsert;
}

async function getAll() {
  const result = await db.get().collection("users").find({}).toArray();

  return result;
}

module.exports = { create, getAll };
