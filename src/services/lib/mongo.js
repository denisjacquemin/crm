// Import the required MongoDB libraries
const { MongoClient } = require('mongodb');

// Create a MongoDB connection string using environment variables
const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;

// Create a connection pool with the desired options
const options = {
    maxPoolSize: process.env.MONGO_POOL_SIZE || 10,
    minPoolSize: 1,
    waitQueueTimeoutMS: 10000, // 10 seconds
};
const pool = new MongoClient(mongoDbUrl, options);

// Function to get a database connection from the pool
async function getDb() {
    try {
        // Get a connection from the pool
        const conn = await pool.connect();
        // Return a reference to the database
        return conn.db();
    } catch (error) {
        console.error('Error getting database connection from pool', error);
        throw error;
    }
}

// Export the run, get, and close functions
module.exports = {
    run: async() => {
        try {
            // Connect the client to the server (optional starting in v4.7)
            await pool.connect();
            // Establish and verify the connection to the MongoDB server
            await pool.db('admin').command({ ping: 1 });
            console.log(`😀 Successfully connected to MongoDB @ ${process.env.MONGO_URL}`);
        } catch (error) {
            console.error('Error connecting to MongoDB', error);
            throw error;
        }
    },
    get: () => getDb(),
    close: async() => {
        try {
            // Close the connection pool
            await pool.close();
        } catch (error) {
            console.error('Error closing connection pool', error);
            throw error;
        }
    },
    startSession: async() => {
        try {
            // Start a new client session
            const session = await pool.startSession();
            // Start a transaction with the session
            await session.startTransaction();
            // Return the session
            return session;
        } catch (error) {
            console.error('Error starting session', error);
            throw error;
        }
    },
};