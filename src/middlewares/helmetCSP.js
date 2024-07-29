const helmet = require("helmet");

module.exports = helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        "default-src": ["'self'", process.env.DOMAIN],
        "script-src": ["'self'", process.env.DOMAIN, "'unsafe-eval'", "https://npmcdn.com"],
        "style-src": ["'self'", process.env.DOMAIN, "'unsafe-inline'"],
        "img-src": ["'self'", "data:"]
    }
});