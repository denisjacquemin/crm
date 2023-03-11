const { get } = require('../services/lib/mongo');
const UserService = require('../services/users.service');

// Change current language with i18n.changeLanguage and store it session and db if logged in
async function changeLang(req, res) {
    // Get the lang parameter from the request body
    const { lng } = req.body;

    // Check if the lang parameter is valid
    // if (!validator.isIn(lang, ['en', 'es', 'fr'])) {
    //     // If the lang parameter is not valid, set a flash message and redirect to the home page
    //     req.flash('messages', req.i18n.t('languages.invalid_language'));

    //     return res.status(200).send();
    // }

    // update in db only if user is logged in
    if (req.session.isAuth) {
        // Get a reference to the MongoDB database
        const db = get();

        // Create a new User instance
        const userService = new UserService(db);

        // Get the user by their id
        const user = await userService.getById(req.session
            .userId);

        // Update the user's language in db
        await userService.updateLanguage(user._id, lang);
    }

    const referer = req.get('referer');
    const redirectUrl = referer.includes('lng=') ? referer.replace(/lng=\w+/g, `lng=${lng}`) : `${referer}?lng=${lng}`;

    res.redirect(redirectUrl);


}

module.exports = {
    changeLang
};