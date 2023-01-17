const { get } = require('../services/mongo');
const CompanyService = require('../services/companies.service');


async function index(req, res) {
    // Render the dashboard/index view
    res.render('companies/index', { layout: 'app', });
}

async function edit(req, res) {
    // get invoiceId from req.params.invoiceId
    let companyId = req.params.companyId;

    // Get a reference to the MongoDB database
    const db = get();

    // Create a new User instance
    const companyService = new CompanyService(db);

    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection, parameters the id and the current company id.
    const result = await companyService.findOrCreateById(req.sessions.current_company.id, companyId);

    // const result = await documentService.findOrCreateById(docId, );
    const insertedCompany = await companyService.getById(req.sessions.current_company.id, result.insertedId);

    res.render("companies/edit", {
        layout: 'app',
        company: insertedCompany,
    });
};

async function newCompany(req, res) {

    const db = get();

    const companyService = new CompanyService(db);

    const result = await companyService.create(req.sessions.current_company.id);

    const insertedCompany = await companyService.getById(req.sessions.current_company.id, result.insertedId);

    res.render("companies/edit", {
        layout: 'app',
        company: insertedCompany,
    });
}


module.exports = {
    index,
    edit,
    newCompany
};