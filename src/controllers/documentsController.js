const { get } = require('../services/lib/mongo');
const { ObjectId } = require('mongodb');
const DocumentService = require('../services/documents.service');
const DateHelper = require('../lib/date-helpers');



async function index(req, res) {

    // get documents latest first from mongo
    // get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const documentService = new DocumentService(db);

    // get the latest 30 documents
    const documents = await documentService.getLatest(30, req.session.current_company.id);

    // Render the dashboard/index view
    res.render('documents/index', { layout: 'app', documents: documents });
}


async function newDocument(req, res) {

    // get a new id and redirect to edit/:id
    const db = get();
    const documentService = new DocumentService(db);

    // get a new id
    const result = await documentService.create({
        company_id: ObjectId(req.session.current_company._id),
        config: {
            updated_at: DateHelper.toISO8601(DateHelper.nowUtc()),
        },
        created_by_user_id: ObjectId(req.session.user._id)
    });

    res.redirect('/documents/edit/' + result.slug);

}

async function edit(req, res) {
    // get invoiceId from req.params.invoiceId
    let slug = req.params.slug;

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const documentService = new DocumentService(db);

    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection, parameters the id and the current company id.
    const document = await documentService.getBySlugAndCompanyId(slug, req.session.current_company._id);

    req.session.current_document_id = document._id;

    res.render("documents/index", {
        layout: 'app',
        document: document
    });
};

// add update function that respond to router.put("/documents/:id?"
async function update(req, res) {

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const documentService = new DocumentService(db);

    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection, parameters the id and the current company id.
    const document = await documentService.getByIdAndCompanyId(req.session.current_document_id, req.session.current_company._id);

    document.config = req.body.config;
    document.config.updated_at = DateHelper.toISO8601(DateHelper.nowUtc());

    // save the document
    await documentService.update(document._id, document);

    res.json({ updated_at: document.config.updated_at });
}


module.exports = {
    index,
    edit,
    newDocument,
    update
};