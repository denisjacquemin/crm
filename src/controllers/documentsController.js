const { ObjectId } = require('mongodb');
const DocumentService = require('../services/documents.service');
const { DocumentTypesenseService } = require('../services/documents.typesense.service');
const DateHelper = require('../lib/date-helpers');
// rquire _.extend from underscore
const mergeObjects = require('../lib/object-helper').mergeObjects;
const _ = require('lodash');


const emptyDoc = {
    config: {
        "invoiceNumber": "INV-1234",
        "invoiceDate": "2022-04-01",
        "dueDate": "2022-04-30",
        "currency": "EUR",
        "seller": {
            "name": "ABC Company",
            "address": "1 Main Street",
            "city": "Brussels",
            "country": "BE",
            "vatNumber": "BE0123456789"
        },
        "buyer": {
            "name": "XYZ Company",
            "address": "2 High Street",
            "city": "Paris",
            "country": "FR",
            "vat_number": "FR0123456789"
        },
        "items": [{
                "name": "Product 1",
                "description": "This is a product",
                "quantity": 2,
                "price": 10.00,
                "taxRate": 21.00,
                "taxAmount": 4.20,
                "totalAmount": 24.20
            },
            {
                "name": "Product 2",
                "description": "This is another product",
                "quantity": 1,
                "price": 5.00,
                "taxRate": 21.00,
                "taxAmount": 1.05,
                "totalAmount": 6.05
            }
        ],
        "subtotalAmount": 29.00,
        "taxableAmount": 29.00,
        "taxAmount": 5.25,
        "totalAmount": 34.25,
        "notes": "Thank you for your business"
    },
    created_at: ''
}

async function index(req, res) {
    try {
        // const documents = await getLatestDocument(req.session.current_company._id);

        const documentsTypesenseService = new DocumentTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({ q: '*' }, {
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': 'created_at:desc',
            'per_page': 30
        });


        res.render('documents/index', {
            layout: 'app',
            documents: result.hits.map(hit => hit.document)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function newDocument(req, res) {

    try {
        const documentService = await DocumentService.getInstance();
        const documentTypesenseService = new DocumentTypesenseService();

        const document = await documentService.create(mergeObjects(
            emptyDoc, {
                company_id: ObjectId(req.session.current_company._id),
                config: {
                    updated_at: DateHelper.toISO8601(DateHelper.nowUtc()),
                },
                created_by_user_id: ObjectId(req.session.user._id)
            }));

        await documentTypesenseService.createDocument(document);

        const documents = await getLatestDocument(req.session.current_company._id);

        res.render("documents/index", {
            layout: 'app',
            documents: documents,
            selectedDocument: document
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }

}

async function newDocumentAjax(req, res) {
    try {
        const documentService = await DocumentService.getInstance();
        const document = await documentService.create(mergeObjects(
            emptyDoc, {
                company_id: ObjectId(req.session.current_company._id),
                config: {
                    updated_at: DateHelper.toISO8601(DateHelper.nowUtc()),
                },
                created_by_user_id: ObjectId(req.session.user._id)
            }));
        const documentTypesenseService = new DocumentTypesenseService();
        // create the document in Typesense
        await documentTypesenseService.createDocument(document);

        res.json(document);
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function edit(req, res) {

    try {
        const documentService = await DocumentService.getInstance();

        const documentsTypesenseService = new DocumentTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({ q: '*' }, {
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': 'created_at:desc',
            'per_page': 30
        });

        const selectedDocument = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!selectedDocument) {
            req.flash('error', {
                message: req.i18n.t('documents.document_not_found'),
                submessage: req.i18n.t('documents.document_not_found_sub')

            });
            return res.redirect('/documents');
        }

        res.render("documents/index", {
            layout: 'app',
            documents: result.hits.map(hit => hit.document),
            selectedDocument: mergeObjects(emptyDoc, selectedDocument)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};

async function editAjax(req, res) {

    try {
        const documentService = await DocumentService.getInstance();
        const document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!document) {
            return res.status(404).send();
        }

        res.json(mergeObjects(emptyDoc, document));
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};



// add update function that respond to router.patch("/document/:slug?"
async function update(req, res) {
    try {
        const documentService = await DocumentService.getInstance();
        let document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        console.log('document', document);
        console.log('Date.now', Date.now());
        console.log('DateHelper.nowUtc()', DateHelper.nowUtc());
        const newUpdatedAt = DateHelper.toISO8601(DateHelper.nowUtc());
        const updatedDocument = _.merge({}, document, req.body.document, {
            updated_at: newUpdatedAt,
        });

        await documentService.update(document._id, updatedDocument);

        const documentTypesenseService = new DocumentTypesenseService();
        await documentTypesenseService.updateDocument(document._id, updatedDocument);

        res.json({
            updated_at: newUpdatedAt,
            slug: document.slug
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

// write a private method that get the latest document
async function getLatestDocument(company_id) {
    const documentService = await DocumentService.getInstance();
    return await documentService.getLatest(30, company_id);
}

async function search(req, res) {
    try {
        const documentsTypesenseService = new DocumentTypesenseService();
        const searchParameters = {
            q: req.query.q,
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: 'created_at:desc',
            per_page: 30,
            query_by: 'config.buyer.name'
        };

        const searchResults = await documentsTypesenseService.searchDocuments(searchParameters);
        res.json(searchResults.hits.map(hit => hit.document));
    } catch (err) {
        console.error(err.stack);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}


module.exports = {
    index,
    edit,
    editAjax,
    newDocument,
    newDocumentAjax,
    update,
    search
};