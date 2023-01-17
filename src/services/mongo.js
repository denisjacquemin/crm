// Import the MongoClient class from the mongodb driver
const { MongoClient } = require("mongodb");

// Create a MongoDB connection string using environment variables
const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;

// Create a new MongoClient instance
const client = new MongoClient(mongoDbUrl);

// Asynchronously connect to the MongoDB server and verify the connection
async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();

        // Establish and verify the connection to the MongoDB server
        await client.db("admin").command({ ping: 1 });
        console.log(`Successfully connect to MongoDB @ ${process.env.MONGO_URL}`);
    } catch (err) {
        // Log the error and close the client if the connection fails
        console.log(err.stack);
        await client.close();
    }
}

// Export the run, get, and close functions
module.exports = {
    run,
    get: () => client.db(),
    close: () => client.close(),
};