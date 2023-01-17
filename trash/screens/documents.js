const { Router } = require("express");
const router = Router();

router.get("/edit/:docId?", async(req, res) => {
    // get invoiceId from req.params.invoiceId
    let docId = req.params.docId;
    // get or create invoice from MongoDB, usersid/invoices/invoiceId collection.
    let document = await Document.findOrCreateById(docId);

    var scripts = [{ script: '/invoices/edit.js' }];
    res.render("app/invoices/edit", {
        layout: 'app',
        scripts: scripts,
        invoiceid: invoice._id,
        config: invoice.config,
    });
});

// update an invoice config
router.post("/edit/:docId?", async(req, res) => {
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