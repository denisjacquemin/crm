const session = require("express-session");
const MongoStore = require("connect-mongo");

const SESSION_DURATION = parseInt(process.env.SESSION_DURATION); // in seconds
const sessionConfig = {
  name: process.env.CONNECT_SID_NAME,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    domain: process.env.DOMAIN,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_DURATION * 1000, // convert to milliseconds for cookie
  },
};

if (process.env.SESSION_STORE === "mongodb") {
  console.log("🔌 Using MongoDB for session storage");
  sessionConfig.store = MongoStore.create({
    mongoUrl: `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOSTS}/${process.env.MONGO_DATABASE}`,
    collectionName: process.env.MONGODB_SESSION_COLLECTION || "sessions",
    ttl: SESSION_DURATION, // in seconds for MongoDB
  });
} else {
  console.log("🔌 Using Redis for session storage");
  // Only require Redis-related modules if we're using Redis
  const { redisClient, RedisStore } = require("../services/lib/redis");
  sessionConfig.store = new RedisStore({ client: redisClient });
}

module.exports = session(sessionConfig);
