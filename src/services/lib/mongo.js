const { MongoClient } = require('mongodb');

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const database = process.env.MONGO_DATABASE;
const clusterUrl = process.env.MONGO_CLUSTER_URL;
const replicaSet = process.env.MONGO_REPLICA_SET;
const mongoHosts = process.env.MONGO_HOSTS

let mongoDbUrl;
if (clusterUrl) {
    mongoDbUrl = `mongodb+srv://${username}:${password}@${clusterUrl}/${database}?replicaSet=${replicaSet}`;
} else {

    mongoDbUrl = `mongodb://${username}:${password}@${mongoHosts}/${database}`;
    console.log(mongoDbUrl);
}

const options = {
    maxPoolSize: process.env.MONGO_POOL_SIZE || 10,
    minPoolSize: 1,
    waitQueueTimeoutMS: 10000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const client = new MongoClient(mongoDbUrl, options);

async function connectToDatabase() {
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log(`😀 Successfully connected to MongoDB @ ${mongoDbUrl}`);
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        throw error;
    }
}

async function closeDatabaseConnection() {
    try {
        await client.close();
    } catch (error) {
        console.error('Error closing connection to MongoDB', error);
        throw error;
    }
}

async function startTransaction() {
    try {
        const session = client.startSession();
        await session.startTransaction({
            readConcern: { level: 'majority' },
            writeConcern: { w: 'majority' },
            maxTransactionTime: 60000,
        });
        return session;
    } catch (error) {
        console.error('Error starting session', error);
        throw error;
    }
}

async function commitTransaction(session) {
    try {
        await session.commitTransaction();
        await session.endSession();
    } catch (error) {
        console.error('Error committing transaction', error);
        throw error;
    }
}

async function abortTransaction(session) {
    try {
        await session.abortTransaction();
        await session.endSession();
    } catch (error) {
        console.error('Error aborting transaction', error);
        throw error;
    }
}

async function endSession(session) {
    try {
        await session.endSession();
    } catch (error) {
        console.error('Error ending session', error);
        throw error;
    }
}

module.exports = {
    connectToDatabase,
    closeDatabaseConnection,
    startTransaction,
    commitTransaction,
    abortTransaction,
    endSession,
    get: () => client.db(),
};