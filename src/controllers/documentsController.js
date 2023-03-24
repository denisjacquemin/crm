const { ObjectId } = require('mongodb');
const DocumentService = require('../services/documents.service');
const DateHelper = require('../lib/date-helpers');
// rquire _.extend from underscore
const addMissingProperties = require('../lib/object-helper').addMissingProperties;

const emptyDoc = {
    config: {
        client: {
            name: ''
        }
    },
    created_at: ''
}

async function index(req, res) {
    try {
        const documentService = await DocumentService.getInstance();
        const documents = await documentService.getLatest(30, req.session.current_company._id);

        res.render('documents/index', {
            layout: 'app',
            documents: documents
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function newDocument(req, res) {

    try {
        const documentService = await DocumentService.getInstance();

        // get a new id
        const result = await documentService.create({
            company_id: ObjectId(req.session.current_company._id),
            config: {
                updated_at: DateHelper.toISO8601(DateHelper.nowUtc()),
            },
            created_by_user_id: ObjectId(req.session.user._id)
        });

        res.redirect('/documents/edit/' + result.slug);
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }

}

async function edit(req, res) {

    try {
        const documentService = await DocumentService.getInstance();

        const documents = await documentService.getLatest(30, req.session.current_company._id);

        const selectedDocument = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!selectedDocument) {
            req.flash('error', {
                message: req.i18n.t('documents.document_not_found'),
                submessage: req.i18n.t('documents.document_not_found_sub')

            });
            return res.redirect('/documents');
        }

        if (!selectedDocument.config || !selectedDocument.config.client || !selectedDocument.config.client.name) {
            selectedDocument.config = { client: { name: '' } };
        }

        req.session.current_document_id = selectedDocument._id;

        res.render("documents/index", {
            layout: 'app',
            documents: documents,
            selectedDocument: addMissingProperties(emptyDoc, selectedDocument)
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

        req.session.current_document_id = document._id;

        if (!document.config || !document.config.client || !document.config.client.name) {
            document.config = { client: { name: '' } };
        }

        res.json(addMissingProperties(emptyDoc, document));
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};



// add update function that respond to router.put("/document/:slug?"
async function update(req, res) {
    try {
        const documentService = await DocumentService.getInstance();
        let document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        await documentService.update(document._id,
            Object.assign(document,
                Object.assign(req.body.document, { updated_at: DateHelper.toISO8601(DateHelper.nowUtc()) })
            )
        );

        res.json({
            updated_at: document.updated_at,
            slug: document.slug
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}


module.exports = {
    index,
    edit,
    editAjax,
    newDocument,
    update
};