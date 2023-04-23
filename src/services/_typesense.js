const Typesense = require('typesense');

class TypesenseService {

    constructor(collectionName, schema, connectionOptions = {}) {
        const apiKey = process.env.TYPESENSE_API_KEY;
        let nodes = [];
        const nodesEnv = process.env.TYPESENSE_NODES;

        if (!apiKey) {
            throw new Error('TYPESENSE_API_KEY environment variable not set');
        }

        if (nodesEnv) {
            try {
                nodes = JSON.parse(nodesEnv);
            } catch (error) {
                throw new Error(`Failed to parse TYPESENSE_NODES: ${error}`);
            }
        }

        this.client = new Typesense.Client({
            nodes,
            apiKey,
            ...connectionOptions,
        });

        this.collectionName = collectionName;
        this.isConnected = false;
        this.connectionRetryInterval = 5000;
        this.connect(schema);
    }

    async connect(schema) {
        try {
            await this.client.health.retrieve();
            console.log('Connected to Typesense');

            const collections = await this.client.collections().retrieve();
            const existingCollection = collections.find(collection => collection.name === this.collectionName);

            if (!existingCollection) {
                await this.client.collections().create(schema);
                console.log(`Created collection ${this.collectionName}`);
            } else {
                console.log(`Using existing collection ${this.collectionName}`);
            }

            this.isConnected = true;
        } catch (error) {
            console.error(`Failed to connect to Typesense: ${error.message}`);
            setTimeout(() => this.connect(schema), this.connectionRetryInterval);
        }
    }

    async createDocument(document) {
        return await this.client.collections(this.collectionName).documents().create(document);
    }

    async getDocument(documentId) {
        return await this.client.collections(this.collectionName).documents(documentId).retrieve();
    }

    async updateDocument(documentId, document) {
        return await this.client.collections(this.collectionName).documents(documentId).update(document);
    }

    async deleteDocument(documentId) {
        return await this.client.collections(this.collectionName).documents(documentId).delete();
    }

    async searchDocuments(query, searchParameters = {}) {
        return await this.client.collections(this.collectionName).documents().search(query, searchParameters);
    }
}

module.exports = TypesenseService;