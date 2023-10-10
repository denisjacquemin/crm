const { ObjectId } = require('mongodb');
const DocumentService = require('../services/documents.service');
const { DocumentTypesenseService } = require('../services/documents.typesense.service');
// rquire _.extend from underscore
const mergeObjects = require('../lib/object-helper').mergeObjects;
const _ = require('lodash');
const {jsPDF} = require('jspdf');
const puppeteer = require('puppeteer')




const emptyDoc = {
    config: {
        "template_name": "template3",
        "invoice_number": "INV-1234",
        "invoice_date": "2022-04-01",
        "due_date": "2022-04-30",
        "currency": "EUR",
        "seller": {
            "name": "ABC Company",
            "address": "1 Main Street",
            "city": "Brussels",
            "PostalCode": "1000",
            "country": "BE",
            "vat_number": "BE0123456789",
            "phone": "+32 2 123 45 67",
            "email": "info@abc.example.com",
        },
        "buyer": {
            "name": "XYZ Company",
            "address": "2 High Street",
            "city": "Paris",
            "PostalCode": "1000",
            "country": "FR",
            "vat_number": "FR0123456789",
            "phone": "+32 2 123 45 67",
            "email": "info@xyz.example.com",
        },
        "items": [{
                "name": "Product 1",
                "order": 1,
                "description": "This is a product",
                "quantity": 2,
                "price": 10.00,
                "tax_rate": 21.00,
                "tax_amount": 4.20,
                "total_amount": 24.20
            },
            {
                "name": "Product 2",
                "order": 2,
                "description": "This is another product",
                "quantity": 1,
                "price": 5.00,
                "tax_rate": 21.00,
                "tax_amount": 1.05,
                "total_amount": 6.05
            },
            {
                "name": "Product 3",
                "order": 3,
                "description": "This is a product",
                "quantity": 2,
                "price": 10.00,
                "tax_rate": 21.00,
                "tax_amount": 4.20,
                "total_amount": 24.20
            },
            {
                "name": "Product 4",
                "order": 4,
                "description": "This is another product",
                "quantity": 1,
                "price": 5.00,
                "tax_rate": 21.00,
                "tax_amount": 1.05,
                "total_amount": 6.05
            }
        ],
        "subtotal_amount": 29.00,
        "taxable_amount": 29.00,
        "tax_amount": 5.25,
        "total_amount": 34.25,
        "notes": "Thank you for your business"
    },
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

        const documents = result.hits.map(hit => hit.document);

        res.render('documents/index', {
            layout: 'app',
            documents: documents,
            selectedDocument: documents[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function newDocument(req, res) {

    try {
        const document = createNewDocumentInMongoAndTypesense(req)

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
        const document = await createNewDocumentInMongoAndTypesense(req);

        res.json(document);
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function createNewDocumentInMongoAndTypesense(req) {
    const documentService = await DocumentService.getInstance();
    const document = await documentService.create(mergeObjects(
        emptyDoc, {
        company_id: ObjectId(req.session.current_company._id),
        // config: {
        //     updated_at: new Date(),
        // },
        created_by_user_id: ObjectId(req.session.user._id)
    }));
    const documentTypesenseService = new DocumentTypesenseService();
    // create the document in Typesense
    await documentTypesenseService.createDocument(document);
    return document;
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
            selectedDocument: selectedDocument //mergeObjects(emptyDoc, selectedDocument)
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

        res.json(document);
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};



async function update(req, res) {
    try {
        console.log('DocumentController.update slug:', req.params.slug);
        console.log('DocumentController.update req.body.document:', req.body.document);
        console.log('DocumentController.update req.session.current_company._id:', req.session.current_company._id);

        const documentService = await DocumentService.getInstance();
        let document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!document) {
            return res.status(404).send(req.i18n.t('common.not_found'));
        }

        const updatedDocument = _.merge({}, document, req.body.document, {
            updated_at: new Date(),
        });

        await documentService.update(document._id, updatedDocument);

        const documentTypesenseService = new DocumentTypesenseService();
        await documentTypesenseService.updateDocument(document._id, updatedDocument);

        res.json({
            updated_at: new Date(),
            slug: document.slug
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

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
            sort_by: req.query.sort,
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


async function preview(req, res) {
    const documentService = await DocumentService.getInstance();
    const document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

    if (!document) {
        return res.status(404).send();
    }

    res.render("documents/preview", {
        layout: 'preview',
        selectedDocument: document
    });

}


async function toPDFWithPuppeteer(req, res) {
    const documentService = await DocumentService.getInstance();
    const document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

    if (!document) {
        return res.status(404).send();
    }

    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();

    // get cookie and pass the cookie to the page
    const cookies = req.cookies;
    await page.setCookie(...Object.keys(cookies).map(key => ({       
        name: key,
        value: cookies[key],
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
    })));               

    await page.goto(`http://localhost:3000/document/preview/${document.slug}`, {waitUntil: 'load'});

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Disposition', `attachment; filename="${document.slug}.pdf"`);
    
    res.type('application/pdf');
    res.send(pdfBuffer);
}

async function toPDF(req, res) {
    try {
        // const documentService = await DocumentService.getInstance();
        // const document = await documentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        // if (!document) {
        //     return res.status(404).send();
        // }

        // use jsPdf to generate the PDF, send doc generated back to the browser for download
        const doc = new jsPDF();
        doc.text('Hello', 10, 10);
        doc.text('World', 10, 20);

        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Disposition', 'attachment; filename="dummy.pdf"');
        // res.setHeader('Content-Type', 'application/pdf');

        // set header content-type to application/pdf, make sure nothing else is sent before and afer this
        res.type('application/pdf');
        // Send the PDF buffer as a response
        res.send(pdfBuffer);

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
    newDocumentAjax,
    update,
    search,
    preview,
    toPDF,
    toPDFWithPuppeteer
};