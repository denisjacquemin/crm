const db = require("../lib/db/mongo");
const bcrypt = require("bcrypt");

const user = {
  email: "",
  password: "",
};

function encryptedPassword(value) {
  return bcrypt.hashSync(value, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}




// create a new user in mongodb
async function create(email, password) {
  const newUser = Object.create(user);
  newUser.email = email;
  newUser.password = encryptedPassword(password);
  const result = await db.get().collection("users").insertOne(newUser);
  return result;
}

// update a user in mongodb
async function update(id, email, password, companies = []) {
  const result = await db.get().collection("users").updateOne({ _id: id }, { $set: { email, password, companies } });
  return result;
}

// create or update user in mongodb
async function upsert(email, password, companies) {
  const user = await getByEmail(email);
  if (user) {
    return await update(user._id, email, password, companies);
  } else {
    return await create(email, password);
  }
}


async function getAll() {
  const result = await db.get().collection("users").find({}).toArray();

  return result;
}

async function getByEmail(email) {
  return await db.get().collection("users").findOne({ email });
}

module.exports = { create, getAll, getByEmail, comparePassword };
