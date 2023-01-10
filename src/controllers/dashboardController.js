async function index(req, res) {
    // Render the dashboard/index view
    res.render('dashboard/index', { layout: 'app', });
}

module.exports = {
    index
};