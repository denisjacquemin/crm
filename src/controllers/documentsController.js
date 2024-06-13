const DocumentService = require('../services/documents.service');
const CompanyService = require('../services/companies.service');
const { DocumentsTypesenseService } = require('../services/documents.typesense.service');
const mergeObjects = require('../lib/object-helper').mergeObjects;
const _ = require('lodash');
const { jsPDF } = require('jspdf');
const puppeteer = require('puppeteer')

async function index(req, res) {
    try {
        const documentsTypesenseService = new DocumentsTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({ 
            'q': '*',
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': 'createdAt:desc',
            'include_fields': 'slug, createdAt, updatedAt, config.invoice_number, config.invoice_date, config.amounts.total, config.buyer.name, config.template_name',
            'per_page': 30
        });

        let documents = [];
        let selectedDocumentIndex = -1;
        let selectedDocument = null;

        if (result.hits.length !== 0) {
            documents = result.hits.map(hit => hit.document);
            selectedDocument = await DocumentService.getBySlugAndCompanyId(documents[0].slug, req.session.current_company._id);
            selectedDocumentIndex = 0;
            selectedDocument = selectedDocument.toObject();
        }

        res.render('documents/index', {
            layout: 'app',
            documents: documents,
            selectedDocumentIndex: selectedDocumentIndex,
            selectedDocument: selectedDocument
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

    let invoice_date = new Date();
    invoice_date.setHours(0, 0, 0, 0);

    // get default_payment_terms from company 
    console.log('req.session.current_company:', req.session.current_company);
    let default_invoice_due_date_terms_type = req.session.current_company.settings.default_invoice_due_date_terms_type;
    let invoice_due_date_value;

    if (default_invoice_due_date_terms_type.startsWith('+')) {
        let daysToAdd = parseInt(default_invoice_due_date_terms_type.slice(1));
        invoice_due_date_value = new Date(invoice_date.getTime());
        invoice_due_date_value.setDate(invoice_date.getDate() + daysToAdd);
    } else {
        invoice_due_date_value = default_invoice_due_date_terms_type;
    }

    const invoiceSequenceValue = await CompanyService.getNextInvoiceSequenceValue(req.session.current_company._id);
    req.session.current_company.settings.current_invoice_sequence = invoiceSequenceValue;
    const documentCreated = await DocumentService.create({
        company_id: req.session.current_company._id,
        created_by_user_id: req.session.user._id,
        slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
        items: [],
        subtotal_amount: 0,
        taxable_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        config: {
            invoice_date: invoice_date.toISOString(), // .toISOString(); ensure UTC time
            invoice_due_date: {
                value: invoice_due_date_value.toISOString(), // .toISOString(); ensure UTC time
                terms_type: default_invoice_due_date_terms_type
            },
            seller: {
                name: req.session.current_company.name,
                address1: req.session.current_company.address1,
                address2: req.session.current_company.address2,
                city: req.session.current_company.city,
                zip: req.session.current_company.zip,
                country: req.session.current_company.country,
                vat_number: req.session.current_company.vat_number,
                phone: req.session.current_company.phone,
                email: req.session.user.email
            },
            buyer: {
                name: 'Choose a buyer',
            },
            invoice_number: `${new Date().getFullYear()}#${String(req.session.current_company.settings.current_invoice_sequence).padStart(5, '0')}`,   
        }
    });
    return documentCreated.toObject();
}

async function edit(req, res) {

    try {
        const documentsTypesenseService = new DocumentsTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({
            'q': '*',
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': 'createdAt:desc',
            'include_fields': 'slug, createdAt, updatedAt, config.invoice_number, config.invoice_date, config.amounts.total, config.buyer.name, config.template_name',
            'per_page': 30
        });

        const selectedDocument = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!selectedDocument) {
            return res.redirect('/documents');
        }

        const documents = result.hits.map(hit => hit.document);

        res.render("documents/index", {
            layout: 'app',
            documents: documents,
            selectedDocumentIndex: documents.length > 0 ? 0 : -1,
            selectedDocument: selectedDocument.toObject()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};

async function editAjax(req, res) {

    try {
        const document = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!document) {
            return res.status(404).send();
        }

        res.json(document.toObject());
        
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
};



async function update(req, res, next) {
    try {
        let document = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);
        if (!document) {
            const error = new Error('Document not found');
            error.status = 404;
            throw error;
        }

        let updatedDocument = await DocumentService.update(document._id, req.body.value);
        updatedDocument = updatedDocument.toObject();
        updatedDocument.autosave_updated_at = req.body.value.autosave_updated_at;
        res.status(200).json(updatedDocument);

    } catch (error) {
        console.log('Error in update', error)
        next(error);
    }
}

async function getLatestDocument(company_id) {
    try {
        const { limit, company_id } = req.query;
        const documents = await DocumentsService.getLatest(limit, company_id);
        res.status(200).json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function search(req, res) {
    try {
        const documentsTypesenseService = new DocumentsTypesenseService();
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
    const document = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

    if (!document) {
        return res.status(404).send();
    }

    const layout = req.query.nl === 'true' ? false : 'preview';

    console.log('layout:', layout);
    res.render("documents/preview", {
        layout,
        document: document.toObject(),
        template_name: document.config.template_name 
    });
}


async function toPDFWithPuppeteer(req, res) {
 
    const browser = await puppeteer.launch({ headless: "new" });
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
        sameSite: 'Lax',
        preferCSSPageSize: true,

    })));

    await page.goto(`http://localhost:3000/document/preview/${req.params.slug}`, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' }, preferCSSPageSize: true});
    await browser.close();

    res.setHeader('Content-Disposition', `attachment; filename="${req.params.slug}.pdf"`);

    res.type('application/pdf');
    res.send(pdfBuffer);
}

async function toPDF(req, res) {
    try {
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