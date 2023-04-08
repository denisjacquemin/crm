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

// variable to keep track of the number of reconnection attempts
let reconnectAttempts = 0;

// Function to connect to Redis
const connectToRedis = async() => {
    try {
        // Connect to Redis
        await redisClient.connect()
        console.log(`😀 Successfully connected to Redis @ ${process.env.REDIS_URL}`)
    } catch (err) {
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            console.log('Error connecting to Redis', err)
                // check if reconnection attempts are less than 3
            if (reconnectAttempts < process.env.REDIS_MAX_RECONNECT_ATTEMPTS) {
                console.log('Reconnecting to Redis...')
                reconnectAttempts++
                // wait for 5 seconds before attempting to reconnect
                setTimeout(connectToRedis, 5000)
            }
        }
    }
}

// call the connectToRedis function
connectToRedis()

// listen for errors on the redisClient 
redisClient.on('error', (err) => {
    console.log('Redis error:', err)
    if (err.code === 'ECONNRESET' ||
        err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        // check if reconnection attempts are less than 3
        if (reconnectAttempts < process.env.REDIS_MAX_RECONNECT_ATTEMPTS) {
            console.log('Reconnecting to Redis...')
            reconnectAttempts++
            // wait for 5 seconds before attempting to reconnect
            setTimeout(connectToRedis, 5000)
        }
    }
});

// Export the Redis client and RedisStore objects
module.exports = { redisClient, RedisStore }