// Import the MongoClient class from the mongodb driver
const { MongoClient } = require("mongodb");

// Create a MongoDB connection string using environment variables
const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;

// Create a new MongoClient instance
const client = new MongoClient(mongoDbUrl);

// variable to keep track of the number of reconnection attempts
let reconnectAttempts = 0;

// Asynchronously connect to the MongoDB server and verify the connection
async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();

        // Establish and verify the connection to the MongoDB server
        await client.db("admin").command({ ping: 1 });
        console.log(`Successfully connected to MongoDB @ ${process.env.MONGO_URL}`);
    } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            console.log('Error connecting to MongoDB', err)
                // check if reconnection attempts are less than 3
            if (reconnectAttempts < process.env.MONGO_MAX_RECONNECT_ATTEMPTS) {
                console.log('Reconnecting to MongoDB...')
                reconnectAttempts++
                // wait for 5 seconds before attempting to reconnect
                setTimeout(run, 5000)
            }
        }
    }
}

// Export the run, get, and close functions
module.exports = {
    run,
    get: () => client.db(),
    close: () => client.close(),
    startSession: () => client.startSession()
};