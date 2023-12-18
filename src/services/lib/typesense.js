const Typesense = require('typesense');

const typesenseApiKey = process.env.TYPESENSE_API_KEY;
const nodesEnv = process.env.TYPESENSE_NODES;

let client = null;

function createClient() {
    client = new Typesense.Client({
        nodes: JSON.parse(nodesEnv),
        apiKey: typesenseApiKey,
        connectionTimeoutSeconds: 2,
        retryIntervalSeconds: 1,
    });
}

async function connectToTypesense(retryCount = 0) {
    try {
        createClient();
        await client.health.retrieve();
        console.log(`😀 Successfully connected to Typesense @ ${nodesEnv}`);
    } catch (error) {
        console.error(`🤬 Error connecting to Typesense: ${error}`);

        // Retry up to 5 times
        if (retryCount < 5) {
            console.log(`Retrying in 1 second... (retry ${retryCount + 1} of 5)`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await connectToTypesense(retryCount + 1);
        } else {
            console.error(`❌ Failed to connect to Typesense after ${retryCount} retries`);
            process.exit(1);
        }
        return;
    }
}

// Create a singleton object
const typesense = {
    connectToTypesense: () => {
        return connectToTypesense();
    },
    getTypesenseClient: () => {
        return client;
    },
};

module.exports = typesense;
