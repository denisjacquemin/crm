const redis = require('redis')
const session = require('express-session')

// Import the RedisStore class from the connect-redis module
const RedisStore = require('connect-redis')(session)

// Create a Redis client
const redisClient = redis.createClient({
    // Set the enable_offline_queue option to false
    // This disables the offline queue feature, which is not needed for this application
    enable_offline_queue: false,

    // Set the legacyMode option to true
    // This enables compatibility with older versions of the redis module
    legacyMode: true,

    // Set the URL of the Redis server using environment variables
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}`,
})

let reconnectAttempts = 0;

const connectToRedis = async() => {
    try {
        await redisClient.connect()
        console.log(`Successfully connect to Redis @ ${process.env.REDIS_URL}`)
    } catch (err) {
        redisClient.close();
        console.log('Redis error', err)
        if (err.code === 'ETIMEDOUT' && reconnectAttempts < 3) {
            console.log('Reconnecting to Redis...')
            reconnectAttempts++
            setTimeout(connectToRedis, 1000)
        }
    }
}

connectToRedis()

// Export the Redis client and RedisStore objects
module.exports = { redisClient, RedisStore }