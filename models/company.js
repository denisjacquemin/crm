const db = require("../lib/db/mongo");


// generate company model
const company = {
    id: "",
    name: "",
    userId: "",
    config: {},
};

// create a new company in mongodb
async function create(name, userId) {
    const newCompany = Object.create(company);
    newCompany.name = name;
    newCompany.userId = userId;
    const result = await db.get().collection("companies").insertOne(newCompany);
    return result;
}

// update a company in mongodb
async function update(id, name, userId, config = {}) {
    const result = await db.get().collection("companies").updateOne({ _id: id }, { $set: { name, userId, config } });
    return result;
}

// create or update company in mongodb
async function upsert(name, userId, config) {
    const company = await getByName(name);
    if (company) {
        return await update(company._id, name, userId, config);
    } else {
        return await create(name, userId);
    }
}

// get all companies
async function getAll() {
    const result = await db.get().collection("companies").find({}).toArray();

    return result;
}

// get company by name
async function getByName(name) {
    return await db.get().collection("companies").findOne
    ({ name });
}

// get company by id
async function getById(id) {
    return await db.get().collection("companies").findOne
    ({ _id: id });
}

module.exports = { create, getAll, getByName, getById, upsert };
