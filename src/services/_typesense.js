const Typesense = require('typesense');
const TypesenseHelper = require('./lib/typesense');

class TypesenseService {

    constructor(collectionName, schema, connectionOptions = {}) {

        this.client = TypesenseHelper.getTypesenseClient();
        this.schema = schema;

        this.collectionName = collectionName;
        this.isConnected = false;
        this.connectionRetryInterval = 5000;
        this.createCollection();
    }

    async createCollection() {

        const existingCollections = await this.client.collections().retrieve();

        const existingCollection = existingCollections.find((c) => c.name === this.collectionName);

        if (!existingCollection) {
            await this.client.collections().create(this.schema);
            console.log(`Created collection ${this.collectionName}`);
        } else {
            console.log(`Using existing collection ${this.collectionName}`);
        }
    }


    async createDocument(document) {
        try {
            const docToCreate = { ...document, id: document._id };
            return await this.client.collections(this.collectionName).documents().create(docToCreate);
        } catch (error) {
            console.error(`Failed to create document: ${error.message}`);
            throw error;
        }
    }

    async upsertDocument(document) {
        console.log('### upsertDocument', document);
        try {
            const docToCreate = { ...document, id: document._id };
            // console.log('Document.post(save) doc to save: ', docToCreate);

            return await this.client.collections(this.collectionName).documents().upsert(docToCreate);
        } catch (error) {
            console.error(`Failed to upsert document: ${error.message}`);
            throw error;
        }
    }

    async getDocument(documentId) {
        try {
            return await this.client.collections(this.collectionName).documents(documentId).retrieve();
        } catch (error) {
            console.error(`Failed to retrieve document: ${error.message}`);
            throw error;
        }
    }

    async updateDocument(documentId, document) {
        try {
            return await this.client.collections(this.collectionName).documents(documentId).update(document);
        } catch (error) {
            console.error(`Failed to update document: ${error.message}`);
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            return await this.client.collections(this.collectionName).documents(documentId).delete();
        } catch (error) {
            console.error(`Failed to delete document: ${error.message}`);
            throw error;
        }
    }

    // add searchDocuments method
    async searchDocuments(searchParameters = {}) {
        try {
            console.log('### searchDocuments', searchParameters);
            return await this.client.collections(this.collectionName).documents().search(searchParameters);
        } catch (error) {
            console.error(`Failed to search documents: ${error.message}`);
            throw error;
        }
    }
}

module.exports = TypesenseService;