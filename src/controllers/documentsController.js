const DocumentService = require('../services/documents.service');
const CompanyService = require('../services/companies.service');
const FileService = require('../services/files.service');
const { performance } = require('perf_hooks');
const _ = require('lodash');
const { jsPDF } = require('jspdf');
const puppeteer = require('puppeteer');
const dayjs = require('dayjs');
const Mailer = require('./utils/mailer');
const { htmlToText } = require('html-to-text');

function getDefaultDocumentTypeShort(req) {
  return {
    invoice: req.i18n.t('common.invoice_short'),
    credit_note: req.i18n.t('common.credit_note_short'),
    quote: req.i18n.t('common.quote_short'),
  };
}

function buildDocumentPrefix(documentType, companySettings, req) {
  let prefix = '';

  const defaultShorts = getDefaultDocumentTypeShort(req);
  if (documentType === 'invoice') {
    prefix = companySettings.invoice.prefix ?? process.env.DEFAULT_INVOICE_PREFIX_FORMAT;
    prefix = prefix.replaceAll('[DOCUMENT_TYPE]', defaultShorts.invoice);
  } else if (documentType === 'credit_note') {
    prefix = companySettings.credit_note.prefix ?? process.env.DEFAULT_CREDIT_NOTE_PREFIX_FORMAT;
    prefix = prefix.replaceAll('[DOCUMENT_TYPE]', defaultShorts.credit_note);
  } else if (documentType === 'quote') {
    prefix = companySettings.quote.prefix ?? process.env.DEFAULT_QUOTE_PREFIX_FORMAT;
    prefix = prefix.replaceAll('[DOCUMENT_TYPE]', defaultShorts.quote);
  }

  if (prefix.includes('YY')) {
    const year = new Date().getFullYear();
    prefix = prefix.replaceAll('YYYY', year.toString()).replaceAll('YY', year.toString().slice(-2));
  }
  console.log('prefix', prefix);
  return prefix;
}

async function index(req, res) {
  const startTime = performance.now();
  try {
    const documents = await DocumentService.search({
      q: '*',
      company_id: req.session.current_company._id,
      sort: { createdAt: -1 },
      limit: 30,
    });

    let selectedDocumentIndex = -1;
    let selectedDocument = null;

    if (documents.length > 0) {
      selectedDocument = documents[0].toObject();
      selectedDocumentIndex = 0;
    }

    const duration = performance.now() - startTime;

    res.render('documents/index', {
      layout: 'app',
      documents,
      selectedDocumentIndex,
      selectedDocument,
      sizes: req.i18n.t('common.sizes', { returnObjects: true }),
      queryTime: duration.toFixed(2), // Add performance info
    });
  } catch (err) {
    console.error('Index error:', err);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

async function search(req, res) {
  const startTime = performance.now();
  try {
    let sort = { createdAt: -1 };
    if (req.query.sort === 'subject:asc') {
      sort = { 'config.subject': 1 };
    }

    const documents = await DocumentService.search({
      q: req.query.q,
      company_id: req.session.current_company._id,
      sort,
      limit: 30,
    });

    const duration = performance.now() - startTime;

    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    res.json(documents);
  } catch (err) {
    console.error('Search error:', err.stack);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

function validateEmailList(emailList) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = emailList.split(',').map((email) => email.trim());
  return emails.every((email) => emailRegex.test(email));
}

async function sendDocumentByMail(req, res, next) {
  try {
    const document = await DocumentService.getBySlugAndCompanyId(
      req.body.slug,
      req.session.current_company._id
    );
    if (!document) {
      return res.status(404).json({
        notification: { message: 'Document not found', type: 'error' },
      });
    }

    const { recipients, cc, bcc, subject } = req.body.data;
    let body = req.body.data.body.trim();

    if (!recipients || !subject || !body) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t('documents.controller.required_fields_missing'),
          submessage: req.i18n.t('documents.controller.fields_required'),
          type: 'error',
        },
      });
    }

    // Validate email lists
    if (!validateEmailList(recipients)) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t('documents.controller.recipients_invalid'),
          submessage: req.i18n.t('documents.controller.recipients_invalid_sub'),
          type: 'error',
        },
      });
    }
    if (cc && !validateEmailList(cc)) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t('documents.controller.cc_invalid'),
          submessage: req.i18n.t('documents.controller.cc_invalid_sub'),
          type: 'error',
        },
      });
    }
    if (bcc && !validateEmailList(bcc)) {
      return res.status(400).json({
        notification: {
          message: req.i18n.t('documents.controller.bcc_invalid'),
          submessage: req.i18n.t('documents.controller.bcc_invalid_sub'),
          type: 'error',
        },
      });
    }

    // add linked files to the body if any, each link should be separated by new lines
    if (document.config.files.length > 0) {
      body += `<br><br>--<br>${document.config.files
        .map((file) => `<a href="${process.env.HOST}/file/download/${file.slug}">${file.name}</a>`)
        .join('<br>')}`;
    }

    // Convert HTML body to plain text
    const text = htmlToText(body, {
      wordwrap: 130, // Wrap text at 130 characters
      preserveNewlines: true, // Preserve newlines
    });

    const pdfBuffer = await generatePDFBuffer(req.body.slug, req.cookies);

    const mailOptions = {
      from: `${process.env.DEFAULT_SENDER_NAME} <${process.env.DEFAULT_SENDER_EMAIL}>`,
      to: recipients,
      bcc: bcc,
      subject: subject,
      charset: 'utf-8',
      text: text,
      html: body,
      attachments: [
        {
          filename: `${req.params.slug}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await Mailer.sendDocument(req, mailOptions, next);

    res.status(200).json({
      notification: {
        message: req.i18n.t('documents.controller.email_sent_to') + ' ' + req.body.data.recipients,
        type: 'success',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

async function generateDocumentNumber(companyId, documentType, prefix, settings) {
  let sequenceValue;
  let nextSequenceValue;
  let sequenceIncrement;

  // Get the appropriate sequence value and increment based on document type
  if (documentType === 'credit_note') {
    sequenceValue = await CompanyService.getNextCreditNoteSequenceValue(companyId);
    sequenceIncrement = settings.credit_note.sequence_increment || 1;
    nextSequenceValue = sequenceValue + sequenceIncrement - 1;

    // Update company settings with new sequence value
    settings.current_credit_note_sequence = nextSequenceValue;
    await CompanyService.update(companyId, {
      $set: {
        'settings.current_credit_note_sequence': nextSequenceValue,
      },
    });
  } else if (documentType === 'invoice') {
    sequenceValue = await CompanyService.getNextInvoiceSequenceValue(companyId);
    sequenceIncrement = settings.invoice.sequence_increment || 1;
    nextSequenceValue = sequenceValue + sequenceIncrement - 1;
    settings.current_invoice_sequence = nextSequenceValue;
    await CompanyService.update(companyId, {
      $set: {
        'settings.current_invoice_sequence': nextSequenceValue,
      },
    });
  } else if (documentType === 'quote') {
    sequenceValue = await CompanyService.getNextQuoteSequenceValue(companyId);
    sequenceIncrement = settings.quote.sequence_increment || 1;
    nextSequenceValue = sequenceValue + sequenceIncrement - 1;
    settings.current_quote_sequence = nextSequenceValue;
    await CompanyService.update(companyId, {
      $set: {
        'settings.current_quote_sequence': nextSequenceValue,
      },
    });
  }

  // Format the number with leading zeros
  return `${prefix}${String(nextSequenceValue).padStart(5, '0')}`;
}

async function duplicateAjax(req, res) {
  try {
    // 1. Get the source document
    const sourceDocument = await DocumentService.getBySlugAndCompanyId(
      req.body.slug,
      req.session.current_company._id
    );

    if (!sourceDocument) {
      return res.status(404).json({
        notification: {
          message: req.i18n.t('documents.controller.document_not_found'),
          type: 'error',
        },
      });
    }

    // 2. Create base document structure
    const duplicatedDocument = {
      company_id: req.session.current_company._id,
      created_by_user_id: req.session.user._id,
      slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
      items: sourceDocument.items,
      subtotal_amount: sourceDocument.subtotal_amount,
      taxable_amount: sourceDocument.taxable_amount,
      tax_amount: sourceDocument.tax_amount,
      total_amount: sourceDocument.total_amount,
      config: {
        // Copy most config fields
        ...sourceDocument.config,
        // Reset date-specific fields
        invoice_date: dayjs().startOf('day').format('YYYY-MM-DD'),
        invoice_delivery_date: null,
        invoice_due_date: {
          value: req.session.current_company.settings.invoice.default_due_date_terms_type,
          terms_type: req.session.current_company.settings.invoice.default_due_date_terms_type,
        },
      },
    };

    // 3. Handle document number based on type
    if (duplicatedDocument.config.document_type === 'invoice') {
      duplicatedDocument.config.invoice_number = await generateDocumentNumber(
        req.session.current_company._id,
        'invoice',
        buildDocumentPrefix('invoice', req.session.current_company.settings, req),
        req.session.current_company.settings
      );
      delete duplicatedDocument.config.credit_note_number;
    } else {
      duplicatedDocument.config.credit_note_number = await generateDocumentNumber(
        req.session.current_company._id,
        'credit_note',
        buildDocumentPrefix('credit_note', req.session.current_company.settings, req),
        req.session.current_company.settings
      );
      delete duplicatedDocument.config.invoice_number;
    }

    // 4. Create the new document
    const newDocument = await DocumentService.create(duplicatedDocument);

    // 5. Return the created document
    res.json(newDocument.toObject());
  } catch (err) {
    console.error('Document duplication error:', err);
    res.status(500).json({
      notification: {
        message: req.i18n.t('documents.controller.duplication_failed'),
        submessage: req.i18n.t('common.try_again'),
        type: 'error',
      },
    });
  }
}

async function deleteAjax(req, res) {
  try {
    const document = await DocumentService.getBySlugAndCompanyId(
      req.params.slug,
      req.session.current_company._id
    );

    if (!document) {
      return res.status(404).json({
        notification: { message: 'Document not found', type: 'error' },
      });
    }

    const documentDeleted = await DocumentService.delete(
      document._id,
      req.session.current_company._id
    );
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
        type: 'error',
      },
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
        type: 'error',
      },
    });
  }
}

async function createQuoteAjax(req, res) {
  try {
    const document = await createCommonDocument(req, 'quote');
    res.json(document);
  } catch (err) {
    console.error('catching:', err);
    res.status(500).json({
      notification: {
        message: req.i18n.t('common.unknown_error'),
        submessage: req.i18n.t('common.try_again'),
        type: 'error',
      },
    });
  }
}

async function createCreditNoteFromAlreadyExistingDocumentAjax(req, res) {
  try {
    // 1. Fetch and validate original document
    const originalDocument = await DocumentService.getBySlugAndCompanyId(
      req.body.slug,
      req.session.current_company._id
    );

    if (!originalDocument) {
      return res.status(404).json({
        notification: {
          message: req.i18n.t('documents.controller.document_not_found'),
          type: 'error',
        },
      });
    }

    // 2. Create base credit note
    const newDocument = await createCommonDocument(req, 'credit_note');

    // 3. Prepare data to copy from original document
    const dataToCopy = {
      items: originalDocument.items,
      subtotal_amount: originalDocument.subtotal_amount,
      taxable_amount: originalDocument.taxable_amount,
      tax_amount: originalDocument.tax_amount,
      total_amount: originalDocument.total_amount,
      config: {
        ...originalDocument.config,
        // Override specific fields
        document_type: 'credit_note',
        invoice_date: dayjs().startOf('day').format('YYYY-MM-DD'),
        credit_note_number: await generateDocumentNumber(
          req.session.current_company._id,
          'credit_note',
          buildDocumentPrefix('credit_note', req.session.current_company.settings, req),
          req.session.current_company.settings
        ),
        target_invoice_number: originalDocument.config.invoice_number,
        show_target_invoice: true,
        // Clear fields that shouldn't be copied
        invoice_number: undefined,
        invoice_due_date: undefined,
        show_invoice_due_date: false,
        invoice_delivery_date: undefined,
        show_invoice_delivery_date: false,
        files: [],
        notes_on_invoice: undefined,
      },
    };

    // 4. Update the new document with copied data
    const updatedDocument = await DocumentService.update(newDocument._id, dataToCopy);

    res.json(updatedDocument.toObject());
  } catch (err) {
    console.error('Error creating credit note from document:', err);
    res.status(500).json({
      notification: {
        message: req.i18n.t('common.unknown_error'),
        submessage: req.i18n.t('common.try_again'),
        type: 'error',
      },
    });
  }
}

async function createCommonDocument(req, document_type) {
  try {
    let invoice_date = dayjs().startOf('day');

    // get default_payment_terms from company
    let default_due_date_terms_type =
      req.session.current_company.settings.invoice.default_due_date_terms_type;
    let invoice_due_date_value;

    if (default_due_date_terms_type.startsWith('+')) {
      let daysToAdd = parseInt(default_due_date_terms_type.slice(1));
      invoice_due_date_value = invoice_date.add(daysToAdd, 'day');
    } else {
      invoice_due_date_value = default_due_date_terms_type;
    }

    const number = await generateDocumentNumber(
      req.session.current_company._id,
      document_type,
      buildDocumentPrefix(document_type, req.session.current_company.settings, req),
      req.session.current_company.settings
    );

    // Get the appropriate default notes based on document type
    let notes_on_document = '';
    if (document_type === 'invoice') {
      notes_on_document = req.session.current_company.settings.invoice.default_notes;
    } else if (document_type === 'credit_note') {
      notes_on_document = req.session.current_company.settings.credit_note.default_notes;
    } else if (document_type === 'quote') {
      notes_on_document = req.session.current_company.settings.quote.default_notes;
    }

    const files_ids = await FileService.getFileIdsByCompanyIdAndDocumentType(
      req.session.current_company._id,
      document_type
    );

    // document language is the language of the current company
    // but should be in the list i18n.languages
    // if not present in i18n.languages, i18n.language is used
    const documentLanguage = process.env.TRANSLATION_i18_CODE.split(',').includes(req.session.current_company.language)
      ? req.session.current_company.language
      : req.i18n.language;

    // Get show/hide settings based on document type
    let showHideSettings = {};
    if (document_type === 'credit_note') {
      showHideSettings = {
        show_delivery_date: req.session.current_company.settings.credit_note.show_delivery_date,
        show_target_invoice: req.session.current_company.settings.credit_note.show_target_invoice,
        show_contact_person: req.session.current_company.settings.credit_note.show_contact_person,
        show_seller_email: req.session.current_company.settings.credit_note.show_seller_email,
        show_seller_website: req.session.current_company.settings.credit_note.show_seller_website,
        show_seller_phone: req.session.current_company.settings.credit_note.show_seller_phone,
        show_iban: req.session.current_company.settings.credit_note.show_iban,
      };
    } else if (document_type === 'quote') {
      showHideSettings = {
        show_delivery_date: req.session.current_company.settings.quote.show_delivery_date,
        show_contact_person: req.session.current_company.settings.quote.show_contact_person,
        show_seller_email: req.session.current_company.settings.quote.show_seller_email,
        show_seller_website: req.session.current_company.settings.quote.show_seller_website,
        show_seller_phone: req.session.current_company.settings.quote.show_seller_phone,
        show_iban: req.session.current_company.settings.quote.show_iban,
      };
    } else if (document_type === 'invoice') {
      showHideSettings = {
        show_invoice_due_date: req.session.current_company.settings.invoice.show_invoice_due_date,
        show_delivery_date: req.session.current_company.settings.invoice.show_delivery_date,
        show_contact_person: req.session.current_company.settings.invoice.show_contact_person,
        show_seller_email: req.session.current_company.settings.invoice.show_seller_email,
        show_seller_website: req.session.current_company.settings.invoice.show_seller_website,
        show_seller_phone: req.session.current_company.settings.invoice.show_seller_phone,
        show_iban: req.session.current_company.settings.invoice.show_iban,
      };
    }

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
        language: documentLanguage,
        invoice_date: invoice_date.format('YYYY-MM-DD'),
        invoice_due_date: {
          value:
            invoice_due_date_value instanceof dayjs
              ? invoice_due_date_value.format('YYYY-MM-DD')
              : invoice_due_date_value,
          terms_type: default_due_date_terms_type,
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
          email: req.session.current_company.email,
          logo: req.session.current_company.logo,
          contact_title: req.session.current_company.contact_title,
          contact_lastname: req.session.current_company.contact_lastname,
          contact_firstname: req.session.current_company.contact_firstname,
          contact_email: req.session.current_company.contact_email,
          contact_phone: req.session.current_company.contact_phone,
          website: req.session.current_company.website,
          registration_number: req.session.current_company.registration_number,
          bank_accounts: req.session.current_company.bank_accounts,
        },
        buyer: {
          name: req.i18n.t('documents.controller.choose_a_customer'),
          country: req.session.current_company.country,
        },
        invoice_number: document_type === 'invoice' ? number : undefined,
        credit_note_number: document_type === 'credit_note' ? number : undefined,
        quote_number: document_type === 'quote' ? number : undefined,
        currency: req.session.current_company.settings.default_currency,
        notes_on_document: notes_on_document,
        document_type: document_type,
        files: files_ids,
        ...showHideSettings,
      },
    });
    return documentCreated.toObject();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function edit(req, res) {
  try {
    const documents = await DocumentService.search({
      q: '*',
      company_id: req.session.current_company._id,
      sort: { createdAt: -1 },
      limit: 30,
    });

    const selectedDocument = await DocumentService.getBySlugAndCompanyId(
      req.params.slug,
      req.session.current_company._id
    );

    if (!selectedDocument) {
      return res.redirect('/documents');
    }

    const selectedDocumentIndex = documents.findIndex((document) => {
      return document.slug === req.params.slug;
    });

    res.render('documents/index', {
      layout: 'app',
      documents,
      sizes: req.i18n.t('common.sizes', { returnObjects: true }),
      selectedDocumentIndex: selectedDocumentIndex,
      selectedDocument: selectedDocument.toObject(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

async function editAjax(req, res) {
  try {
    const document = await DocumentService.getBySlugAndCompanyId(
      req.params.slug,
      req.session.current_company._id
    );

    if (!document) {
      return res.status(404).json({
        notification: { message: 'Document not found', type: 'error' },
      });
    }

    res.json(document.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).send(req.i18n.t('common.unknown_error'));
  }
}

async function update(req, res, next) {
  try {
    let document = await DocumentService.getBySlugAndCompanyId(
      req.params.slug,
      req.session.current_company._id
    );
    if (!document) {
      const error = new Error('Document not found');
      error.status = 404;
      throw error;
    }

    // Ensure vat fields in config.items are embedded documents if they exist
    if (req.body.value.config && Array.isArray(req.body.value.config.items)) {
      req.body.value.config.items = req.body.value.config.items.map((item) => {
        if (item.vat && typeof item.vat === 'string') {
          item.vat = JSON.parse(item.vat);
        }
        return item;
      });
    }

    let updatedDocument = await DocumentService.update(document._id, req.body.value);
    updatedDocument = updatedDocument.toObject();
    updatedDocument.autosave_updated_at = req.body.value.autosave_updated_at;

    res.status(200).json(updatedDocument);
  } catch (error) {
    console.log('Error in update', error);
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

async function preview(req, res) {
  const document = await DocumentService.getBySlugAndCompanyId(
    req.params.slug,
    req.session.current_company._id
  );
  if (!document) {
    return res.status(404).send();
  }

  const layout = req.query.nl === 'true' ? false : 'preview';

  res.render('documents/preview', {
    layout,
    document: document.toObject(),
    doc_lang: req.query.lang || document.config.language,
    template_name: document.config.template_name,
  });
}

async function toPDFWithPuppeteer(req, res) {
  try {
    const pdfBuffer = await generatePDFBuffer(req.params.slug, req.cookies);

    // Set headers
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.slug}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the buffer directly without JSON conversion
    res.end(pdfBuffer, 'binary');
  } catch (err) {
    console.error(`Error in toPDFWithPuppeteer: ${err.message}`);
    next(err);
  }
}

async function generatePDFBuffer(slug, cookies) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    const cookieArray = Object.entries(cookies).map(([key, value]) => ({
      name: key,
      value: value,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }));
    await page.setCookie(...cookieArray);

    await page.goto(`http://localhost:3000/document/preview/${slug}`, {
      waitUntil: 'networkidle2', // Changed from 'load' to ensure all resources are loaded
      timeout: 30000, // 30 second timeout
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' },
      preferCSSPageSize: true,
    });
    return pdfBuffer;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await browser.close();
  }
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
  createInvoiceAjax,
  createCreditNoteAjax,
  createQuoteAjax,
  duplicateAjax,
  createCreditNoteFromAlreadyExistingDocumentAjax,
  deleteAjax,
  update,
  search,
  preview,
  toPDF,
  toPDFWithPuppeteer,
  sendDocumentByMail,
};
