const { get } = require('../services/mongo');
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

    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection.
    let document = await documentService.findOrCreateById(docId);

    var scripts = [{ script: '/documents/edit.js' }];
    res.render("documents/edit", {
        layout: 'app',
        scripts: scripts,
        documentid: document._id,
        config: document.config,
    });
};

module.exports = {
    index,
    edit
};