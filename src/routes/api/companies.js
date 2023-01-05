const Company = require("../../models/company");

const { Router } = require("express");
const router = Router();

// GET /companies
// GET /companies/new
// POST /companies
// GET /companies/:id
// GET /companies/:id/edit
// PUT /companies/:id
// DELETE /companies/:id

// GET /companies
router.get("/", async (req, res) => {
    const companies = await Company.getAll();
    res.render("companies/index", {
        companies,
    });
});

// GET /companies/new
router.get("/companies/new", (req, res) => {
    res.render("companies/new");
});

// POST /companies
router.post("/companies", async (req, res) => {
    const { name } = req.body;
    const company = await Company.create(name);
    res.redirect(`/app`);
});

// GET /companies/:id
router.get("/companies/:id", async (req, res) => {
    const company = await Company.getById(req.params.id);
    res.render("companies/show", { company });
});

// GET /companies/:id/edit
router.get("/companies/:id/edit", async (req, res) => {
    const company = await Company.getById(req.params.id);
    res.render("companies/edit", { company });
});

// PUT /companies/:id
router.put("/companies/:id", async (req, res) => {
    const { name, address, city, state, zip, phone, email, website } = req.body;
    const company = await Company.update(req.params.id, name, address, city, state, zip, phone, email, website);
    res.redirect(`/companies/${company.id}`);
});

// DELETE /companies/:id
router.delete("/companies/:id", async (req, res) => {
    await Company.delete(req.params.id);
    res.redirect("/companies");
});




module.exports = router;



