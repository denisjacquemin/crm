const { get } = require('../services/lib/mongo');
const DocumentService = require('../services/documents.service');


async function index(req, res) {
    // Render the dashboard/index view
    res.render('documents/index', { layout: 'app', });
}

async function edit(req, res) {
    // get invoiceId from req.params.invoiceId
    let docId = req.params.docId;

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const documentService = new DocumentService(db);

    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection, parameters the id and the current company id.
    const result = await documentService.findOrCreateById(docId, req.session.current_company.id);

    // const result = await documentService.findOrCreateById(docId, );
    const insertedDocument = await documentService.getById(result.insertedId);

    res.render("documents/edit", {
        layout: 'app',
        documentid: insertedDocument._id,
        config: insertedDocument.config,
    });
};

module.exports = {
    index,
    edit
};