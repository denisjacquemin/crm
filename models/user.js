const db = require("../lib/db/mongo");
const bcrypt = require("bcrypt");


function encryptedPassword(value) {
  return bcrypt.hashSync(value, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

const user = {
  email: "",
  password: "",
};


// create a new user in mongodb
async function create(email, password) {
  const newUser = Object.create(user);
  newUser.email = email;
  newUser.password = encryptedPassword(password);
  const result = await db.get().collection("users").insertOne(newUser);
  return result.ops[0];
}



async function getAll() {
  const result = await db.get().collection("users").find({}).toArray();

  return result;
}

async function getByEmail(email) {
  return await db.get().collection("users").findOne({ email });
}

module.exports = { create, getAll, getByEmail, comparePassword };
