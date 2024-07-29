// Assuming UserService is already defined and has a method to update the user's language
const UserService = require('../services/users.service');

module.exports = function(req, res, next) {
  // Ensure there is a user in session and a language detected in the request
  if (req.session.user && req.language) {
    const sessionLanguage = req.session.user.language;
    const requestLanguage = req.language;

    // Check if the session language is different from the request language
    if (sessionLanguage !== requestLanguage) {
      // Update the user's language using UserService
      UserService.updateById(req.session.user._id, { language: requestLanguage })
        .then(() => {
          req.session.user.language = requestLanguage;
          console.log('User language updated in checkAndUpdateUserLanguage:', req.session.user._id, requestLanguage);
          next();
        })
        .catch(error => {
          console.error('Error updating user language:', error);
          next(error); // Proceed with error handling middleware
        });
    } else {
      // Languages match, proceed to the next middleware
      next();
    }
  } else {
    // No user in session or language not detected, proceed to the next middleware
    next();
  }
}