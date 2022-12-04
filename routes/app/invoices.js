const { Router } = require("express");
const Invoice = require("../../models/invoice");
const router = Router();

router.get("/invoices/edit/:invoiceId?", async(req, res) => {
    // get invoiceId from req.params.invoiceId
    let invoiceId = req.params.invoiceId;
    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection.
    let invoice = await Invoice.findOrCreateById(invoiceId);

    var scripts = [{ script: '/invoices/edit.js' }];
    res.render("app/invoices/edit", {
        layout: 'app',
        scripts: scripts,
        invoiceid: invoice._id,
        config: invoice.config,
    });
});

// update an invoice config
router.post("/invoices/edit/:invoiceId?", async(req, res) => {
    // get invoiceId from req.params.invoiceId
    let invoiceId = req.params.invoiceId;
    // get invoice from MongoDB, invoices/invoiceId collection with a given userId.
    let invoice = await Invoice.findById(invoiceId);

    // merge invoice config with req.body.configUpdate
    invoice.config = Object.assign(invoice.config, req.body.configUpdate);
    // save invoice config to MongoDB
    await Invoice.save(invoice);
});



module.exports = router;