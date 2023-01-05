const { Router } = require("express");
const Invoice = require("../../models/invoice");
const router = Router();
// write a complete REST API for an invoice Model
// GET /invoices
// GET /invoices/:id
// POST /invoices
// PUT /invoices/:id
// DELETE /invoices/:id

// GET /invoices
router.get("/", async (req, res) => {
    const invoices = await Invoice.getAll();
    res.json(invoices);
});

// GET /invoices/:id
router.get("/:id", async (req, res) => {
    const invoice = await Invoice.getById(req.params.id);
    res.json(invoice);
});

// POST /invoices
router.post("/", async (req, res) => {
    const invoice = await Invoice.create(req.body);
    res.json(invoice);
});

// PUT /invoices/:id
router.put("/:id", async (req, res) => {
    const invoice = await Invoice.update
    (req.params.id, req.body);
    res.json(invoice);
});

// DELETE /invoices/:id
router.delete("/:id", async (req, res) => {
    const invoice = await Invoice.delete(req.params.id);
    res.json(invoice);
});






module.exports = router;