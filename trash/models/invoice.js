const db = require("../../lib/db/mongo");

const invoice = {
    id: "",
    userId: "",
    config: {},
};

// Find invoice by ID
// Should be own by the user
async function getById(id, compannyId) {
    return await db.get().collection("invoices").findOne({ _id: id, compannyId });
}

// Find or create invoice by ID
// Should be own by the user
async function findOrCreateById(id, compannyId) {
    let invoice = await getById(id, compannyId);
    if (!invoice) {
        // create a new invoice in mongoDB
        invoice = Object.create(invoice);
        invoice.compannyId = compannyId;
        result = await db.get().collection("invoices").insertOne(invoice);
        invoice.id = result._id;
        invoice.config = result.config;
    }
    return invoice;
}

// async function save(invoice, userId) {
//     if (invoice && invoice.id && invoice.userId === userId) {
//         // update invoice in mongoDB
//         const result = await db.get().collection("invoices").updateOne({ _id: invoice.id, userId }, { $set: { config: invoice.config } });
//         return result;

module.exports = { getById, findOrCreateById };