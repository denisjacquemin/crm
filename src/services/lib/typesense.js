const Typesense = require('typesense');
const fs = require('fs');
const path = require('path');
const documentsTypesenseService = require('../documents.typesense.service');

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
    await createCollections();
}

async function createCollections() {

    // get the schema const value form documentsTypesenseService
    const collectionName = documentsTypesenseService.collectionName;
    const schema = documentsTypesenseService.schema;

    const collections = await client.collections().retrieve();
    const existingCollection = collections.find((collection) => collection.name === collectionName);

    if (!existingCollection) {
        await client.collections().create(schema);
        console.log(`Created collection ${collectionName}`);
    } else {
        console.log(`Using existing collection ${collectionName}`);
    }
}

module.exports = {
    connectToTypesense: () => {
        createClient();
        return connectToTypesense();
    },
    get: () => client,
};