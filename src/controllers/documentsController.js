const DocumentService = require('../services/documents.service');
const CompanyService = require('../services/companies.service');
const FileService = require('../services/files.service');
const { DocumentsTypesenseService } = require('../services/documents.typesense.service');
const _ = require('lodash');
const { jsPDF } = require('jspdf');
const puppeteer = require('puppeteer');
const dayjs = require('dayjs');

const DEFAULT_SORT_BY = 'createdAt:desc';
const DEFAULT_INCLUDE_FIELDS = 'slug, createdAt, updatedAt, config.subject, config.reference, config.invoice_number, config.credit_note_number, config.document_type, config.amounts.total, config.buyer.name, config.template_name, config.invoice_date';
const DEFAULT_PER_PAGE = 30;

async function index(req, res) {
    try {
        const documentsTypesenseService = new DocumentsTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({ 
            'q': '*',
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': DEFAULT_SORT_BY,
            'include_fields': DEFAULT_INCLUDE_FIELDS,
            'per_page': DEFAULT_PER_PAGE
        });

        let documents = result.hits.map(hit => hit.document); // Adjust this line based on the actual structure of your result
        let selectedDocumentIndex = -1;
        let selectedDocument = null;

        for (let i = 0; i < documents.length; i++) {
            try {
                let tempDocument = await DocumentService.getBySlugAndCompanyId(documents[i].slug, req.session.current_company._id);
                if (tempDocument) {
                    selectedDocument = tempDocument.toObject();
                    selectedDocumentIndex = i;
                    break; // Document found, exit the loop
                } else {
                    // Document not found in MongoDB, remove it from the array
                    documents.splice(i, 1);
                    i--; // Adjust the index since we removed an element from the array
                }
            } catch (error) {
                console.error("Error fetching document:", error);
                // Optionally handle the error, e.g., by logging or removing the problematic document
                documents.splice(i, 1);
                i--; // Adjust the index since we removed an element from the array
            }
        }

        res.render('documents/index', {
            layout: 'app',
            documents: documents,
            selectedDocumentIndex: selectedDocumentIndex,
            selectedDocument: selectedDocument,
            sizes: req.i18n.t('common.sizes', { returnObjects: true }),
            currencies: req.i18n.t('currencies:currencies', { returnObjects: true }),
            frequentlySelectedCurrencies: req.i18n.t('currencies:frequently_selected_currencies', { returnObjects: true }),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}
// async function newDocument(req, res) {

//     try {
//         const document = createNewDocumentInMongoAndTypesense(req)

//         const documents = await getLatestDocument(req.session.current_company._id);

//         res.render("documents/index", {
//             layout: 'app',
//             documents: documents,
//             selectedDocument: document
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send(req.i18n.t('common.unknown_error'));
//     }

// }

async function newDocumentAjax(req, res) {
    try {
        const document = await createNewDocumentInMongoAndTypesense(req);

        res.json(document);
        
    } catch (err) {
        console.error('catching:', err);
        
        res.status(500).json({
            notification: {
                message: req.i18n.t('common.unknown_error'),
                submessage: req.i18n.t('common.try_again'),
                type: 'error'
            }
        });
    }
}

async function duplicateAjax(req, res) {
    try {
        // Fetch Original Document
        const originalDocument = await DocumentService.getBySlugAndCompanyId(req.body.slug, req.session.current_company._id);

        // Validate Document Existence
        if (!originalDocument) {
            return res.status(404).json({ 
                notification: { message: 'Document not found', type: 'error'}
            });
        }

        const newDocument = await createNewDocumentInMongoAndTypesense(req);

        // Deep copy originalDocument to manipulate data
        let dataToCopy = JSON.parse(JSON.stringify(originalDocument.toObject()));

        // Exclude fields from the top level
        delete dataToCopy._id;
        delete dataToCopy.created_by_user_id;
        delete dataToCopy.slug;
        delete dataToCopy.createdAt;
        delete dataToCopy.updatedAt;
        delete dataToCopy.company_id;
        delete dataToCopy.__v;

        // Exclude fields from the nested config object
        if (dataToCopy.config) {
            delete dataToCopy.config.invoice_date;
            delete dataToCopy.config.invoice_due_date;
            delete dataToCopy.config.invoice_delivery_date;
            delete dataToCopy.config.invoice_number;
        }

        // Merge the modified document into newDocument
        // Object.assign(newDocument, dataToCopy);

        // Update the document in the database
        const updatedDocument = await DocumentService.update(newDocument._id, dataToCopy);

        res.json(updatedDocument.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

// async function createCreditNoteAjax(req, res) {
//     try {
//         // Fetch Original Document
//         const originalDocument = await DocumentService.getBySlugAndCompanyId(req.body.slug, req.session.current_company._id);

//         // Validate Document Existence
//         if (!originalDocument) {
//             return res.status(404).json({ 
//                 notification: { message: 'Document not found', type: 'error'}
//             });
//         }

//         const newDocument = await createNewDocumentInMongoAndTypesense(req);

//         let dataToCopy = JSON.parse(JSON.stringify(originalDocument.toObject()));

//         // Exclude fields that should not be copied
//         delete dataToCopy._id;
//         delete dataToCopy.created_by_user_id;
//         delete dataToCopy.slug;
//         delete dataToCopy.createdAt;
//         delete dataToCopy.updatedAt;
//         delete dataToCopy.company_id;
//         delete dataToCopy.__v;

//         // Exclude fields from the nested config object
//         if (dataToCopy.config) {
//             delete dataToCopy.config.document_type;
//             delete dataToCopy.config.invoice_date;
//             delete dataToCopy.config.invoice_due_date;

//             delete dataToCopy.config.credit_note_number;
//         }


//         const creditNoteSequenceValue = await CompanyService.getNextCreditNoteSequenceValue(req.session.current_company._id);
//         req.session.current_company.settings.current_creadit_note_sequence = creditNoteSequenceValue;
//         dataToCopy.config.credit_note_number = `${dayjs().year()}#${String(req.session.current_company.settings.current_credit_note_sequence).padStart(5, '0')}`;
//         dataToCopy.config.document_type = 'credit_note';
//         dataToCopy.config.invoice_delivery_date = '';
//         // Update the document in the database
//         const updatedDocument = await DocumentService.update(newDocument._id, dataToCopy);

//         res.json(updatedDocument.toObject());
        
//     } catch (err) {
//         console.error(err);
//         res.status(500).send(req.i18n.t('common.unknown_error'));
//     }
// }

async function deleteAjax(req, res) {
    try {
        const document = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!document) {
            return res.status(404).json({ 
                notification: { message: 'Document not found', type: 'error'}
            });
        }

        const documentDeleted = await DocumentService.delete(document._id, req.session.current_company._id);
        res.status(204).send(documentDeleted.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function createInvoiceAjax(req, res) {
    try {
        const document = await createCommonDocument(req, 'invoice');
        res.json(document);
    } catch (err) {
        console.error('catching:', err);
        res.status(500).json({
            notification: {
                message: req.i18n.t('common.unknown_error'),
                submessage: req.i18n.t('common.try_again'),
                type: 'error'
            }
        });
    }
}

async function createCreditNoteAjax(req, res) {
    try {
        const document = await createCommonDocument(req, 'credit_note');
        res.json(document);
    } catch (err) {
        console.error('catching:', err);
        res.status(500).json({
            notification: {
                message: req.i18n.t('common.unknown_error'),
                submessage: req.i18n.t('common.try_again'),
                type: 'error'
            }
        });
    }
}

async function createCreditNoteFromAlreadyExistingDocumentAjax(req, res) {
    try {
        // Fetch Original Document
        const originalDocument = await DocumentService.getBySlugAndCompanyId(req.body.slug, req.session.current_company._id);

        // Validate Document Existence
        if (!originalDocument) {
            return res.status(404).json({ 
                notification: { message: 'Document not found', type: 'error'}
            });
        }

        const newDocument = await createCommonDocument(req, 'credit_note');

        let dataToCopy = JSON.parse(JSON.stringify(originalDocument.toObject()));

        // Exclude fields that should not be copied
        delete dataToCopy._id;
        delete dataToCopy.created_by_user_id;
        delete dataToCopy.slug;
        delete dataToCopy.createdAt;
        delete dataToCopy.updatedAt;
        delete dataToCopy.company_id;
        delete dataToCopy.__v;

        // Exclude fields from the nested config object
        if (dataToCopy.config) {
            delete dataToCopy.config.document_type;
            delete dataToCopy.config.invoice_date;
            delete dataToCopy.config.invoice_due_date;
            delete dataToCopy.config.credit_note_number;
            delete dataToCopy.config.files;
            delete dataToCopy.config.notes_on_invoice;
        }

        const creditNoteSequenceValue = await CompanyService.getNextCreditNoteSequenceValue(req.session.current_company._id);
        req.session.current_company.settings.current_credit_note_sequence = creditNoteSequenceValue;
        dataToCopy.config.credit_note_number = `${dayjs().year()}#${String(req.session.current_company.settings.current_credit_note_sequence).padStart(5, '0')}`;
        dataToCopy.config.document_type = 'credit_note';
        dataToCopy.config.invoice_delivery_date = '';
        delete dataToCopy.id;

        const updatedDocument = await DocumentService.update(newDocument._id, dataToCopy);

        res.json(updatedDocument.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function createCommonDocument(req, document_type) {
    try {
        let invoice_date = dayjs().startOf('day'); // Use dayjs for the current date at the start of the day

        // get default_payment_terms from company 
        let default_invoice_due_date_terms_type = req.session.current_company.settings.default_invoice_due_date_terms_type;
        let invoice_due_date_value;

        if (default_invoice_due_date_terms_type.startsWith('+')) {
            let daysToAdd = parseInt(default_invoice_due_date_terms_type.slice(1));
            invoice_due_date_value = invoice_date.add(daysToAdd, 'day'); // Step 3: Add days using dayjs
        } else {
            invoice_due_date_value = default_invoice_due_date_terms_type; // This might need additional handling if it's not a date
        }

        const sequenceValue = document_type === 'credit_note' 
            ? await CompanyService.getNextCreditNoteSequenceValue(req.session.current_company._id)
            : await CompanyService.getNextInvoiceSequenceValue(req.session.current_company._id);

        if (document_type === 'credit_note') {
            req.session.current_company.settings.current_credit_note_sequence = sequenceValue;
        } else {
            req.session.current_company.settings.current_invoice_sequence = sequenceValue;
        }

        const notes_on_invoice = document_type === 'invoice' 
            ? req.session.current_company.settings.default_notes_on_invoice 
            : req.session.current_company.settings.default_notes_on_credit_notes;
                                                    
        const files_ids = await FileService.getFileIdsByCompanyIdAndDocumentType(
            req.session.current_company._id,
            document_type
        );

        const number = `${dayjs().year()}#${String(document_type === 'credit_note' 
            ? req.session.current_company.settings.current_credit_note_sequence 
            : req.session.current_company.settings.current_invoice_sequence).padStart(5, '0')}`;
        

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
                invoice_date: invoice_date.format('YYYY-MM-DD'), // Step 2: Format date using dayjs
                invoice_due_date: {
                    value: invoice_due_date_value instanceof dayjs ? invoice_due_date_value.format('YYYY-MM-DD') : invoice_due_date_value, // Ensure formatting only if it's a dayjs object
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
                    email: req.session.user.email,
                    logo: req.session.current_company.logo
                },
                buyer: {
                    name: req.i18n.t('documents.controller.choose_a_customer'),
                },
                invoice_number: document_type === 'credit_note' ? undefined : number,
                credit_note_number: document_type === 'credit_note' ? number : undefined,
                currency: req.session.current_company.settings.default_currency,
                show_delivery_date: req.session.current_company.settings.show_delivery_date,
                show_target_invoice: req.session.current_company.settings.show_target_invoice,
                notes_on_invoice: notes_on_invoice,

                document_type: document_type,
                files: files_ids
            }
        });

        return documentCreated.toObject();
    } catch (err) {
        console.error(err);
        throw err;
    }
}


// async function createNewDocumentInMongoAndTypesense(req) {
//     try {
//         let invoice_date = dayjs().startOf('day'); // Use dayjs for the current date at the start of the day

//         // get default_payment_terms from company 
//         let default_invoice_due_date_terms_type = req.session.current_company.settings.default_invoice_due_date_terms_type;
//         let invoice_due_date_value;

//         if (default_invoice_due_date_terms_type.startsWith('+')) {
//             let daysToAdd = parseInt(default_invoice_due_date_terms_type.slice(1));
//             invoice_due_date_value = invoice_date.add(daysToAdd, 'day'); // Step 3: Add days using dayjs
//         } else {
//             invoice_due_date_value = default_invoice_due_date_terms_type; // This might need additional handling if it's not a date
//         }

//         const invoiceSequenceValue = await CompanyService.getNextInvoiceSequenceValue(req.session.current_company._id);
//         req.session.current_company.settings.current_invoice_sequence = invoiceSequenceValue;
//         const documentCreated = await DocumentService.create({
//             company_id: req.session.current_company._id,
//             created_by_user_id: req.session.user._id,
//             slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
//             items: [],
//             subtotal_amount: 0,
//             taxable_amount: 0,
//             tax_amount: 0,
//             total_amount: 0,
//             config: {
//                 invoice_date: invoice_date.format('YYYY-MM-DD'), // Step 2: Format date using dayjs
//                 invoice_due_date: {
//                     value: invoice_due_date_value instanceof dayjs ? invoice_due_date_value.format('YYYY-MM-DD') : invoice_due_date_value, // Ensure formatting only if it's a dayjs object
//                     terms_type: default_invoice_due_date_terms_type
//                 },
//                 seller: {
//                     name: req.session.current_company.name,
//                     address1: req.session.current_company.address1,
//                     address2: req.session.current_company.address2,
//                     city: req.session.current_company.city,
//                     zip: req.session.current_company.zip,
//                     country: req.session.current_company.country,
//                     vat_number: req.session.current_company.vat_number,
//                     phone: req.session.current_company.phone,
//                     email: req.session.user.email
//                 },
//                 buyer: {
//                     name: req.i18n.t('documents.controller.choose_a_customer'),
//                 },
//                 invoice_number: `${dayjs().year()}#${String(req.session.current_company.settings.current_invoice_sequence).padStart(5, '0')}`,
//                 currency: req.session.current_company.settings.default_currency,
//                 show_delivery_date: req.session.current_company.settings.show_delivery_date,
//             }
//         });

//         return documentCreated.toObject();
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }

async function edit(req, res) {

    try {
        const documentsTypesenseService = new DocumentsTypesenseService();
        const result = await documentsTypesenseService.searchDocuments({
            'q': '*',
            'filter_by': `company_id:${req.session.current_company._id}`,
            'sort_by': DEFAULT_SORT_BY,
            'include_fields': DEFAULT_INCLUDE_FIELDS,
            'per_page': DEFAULT_PER_PAGE
        });

        const selectedDocument = await DocumentService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!selectedDocument) {
            return res.redirect('/documents');
        }

        const documents = result.hits.map(hit => hit.document);

        const selectedDocumentIndex = documents.findIndex(document => {
            return document.slug === req.params.slug;
        });
               
        res.render("documents/index", {
            layout: 'app',
            documents: documents,
            sizes: req.i18n.t('common.sizes', { returnObjects: true }),
            selectedDocumentIndex: selectedDocumentIndex,
            selectedDocument: selectedDocument.toObject(),
            currencies: req.i18n.t('currencies:currencies', { returnObjects: true }),
            frequentlySelectedCurrencies: req.i18n.t('currencies:frequently_selected_currencies', { returnObjects: true }),

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
            return res.status(404).json({ 
                notification: { message: 'Document not found', type: 'error'}
            });
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
            include_fields: DEFAULT_INCLUDE_FIELDS,
            per_page: DEFAULT_PER_PAGE,
            query_by: 'config.subject, config.reference, config.invoice_number, config.buyer.name'
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
    // newDocument,
    createInvoiceAjax,
    createCreditNoteAjax,
    duplicateAjax,
    createCreditNoteFromAlreadyExistingDocumentAjax,
    deleteAjax,
    update,
    search,
    preview,
    toPDF,
    toPDFWithPuppeteer,
};