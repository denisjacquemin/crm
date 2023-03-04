// Prevent a user from accessing a secured page after they have logged out.
// When a user logs out, the session and authentication data is typically cleared, 
// and the user should no longer have access to any pages that require authentication.
// However, if the browser has cached the content of a secured page, 
// the user may be able to access it again by using the back button or refreshing the page.

// By setting appropriate cache control headers
// for secured pages, such as no - cache or no - store, 
// the middleware can ensure that the browser does not cache the content of those pages.
// This helps to prevent users from accessing secured pages after they have logged out, or after their session has expired.

module.exports = function cacheControl(req, res, next) {
    if (req.session.isAuth) {
        // Set cache control headers to prevent caching
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.set('Expires', '-1');
        res.set('Pragma', 'no-cache');
    } else {
        // Use default cache control headers for non-authenticated users
        res.set('Cache-Control', 'public, max-age=300');
        res.set('Expires', new Date(Date.now() + 300 * 1000).toUTCString());
    }
    next();
}