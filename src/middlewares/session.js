const session = require('express-session');
const { redisClient, RedisStore } = require('../services/lib/redis')


module.exports = session({
    name: process.env.CONNECT_SID_NAME,
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // only if you use https
        httpOnly: true,
        domain: process.env.DOMAIN,
        path: '/',
        sameSite: 'lax',
        //expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        maxAge: 60 * 60 * 1000 // 1 hour
    }
});