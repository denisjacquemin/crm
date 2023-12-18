const TypesenseService = require('./_typesense');

const collectionName = 'documents';
const schema = {
    "name": collectionName,
    "enable_nested_fields": true,
    "fields": [
        { "name": "_id", "type": "string", "facet": false, "optional": false },
        { "name": "company_id", "type": "string", "facet": false, "optional": false },
        { "name": "config", "type": "object", "facet": false, "optional": false },
        { "name": "config.payment", "type": "object[]", "facet": false, "optional": false },
        { "name": "createdAt", "type": "int64", "facet": false, "optional": false },
        { "name": "updatedAt", "type": "int64", "facet": false, "optional": false },
        { "name": "created_by_user_id", "type": "string", "facet": false, "optional": false },
        { "name": "slug", "type": "string", "facet": false, "optional": false }
    ]
};

class DocumentTypesenseService extends TypesenseService {

    constructor() {
        super(collectionName, schema);
    }

    async createDocument(document) {
        return await super.createDocument(this._convertDatesToUnixTimestamps(document));
    }

    async getDocument(documentId) {
        return await super.getDocument(documentId);
    }

    async updateDocument(documentId, document) {
        return await super.updateDocument(documentId, this._convertDatesToUnixTimestamps(document));
    }

    async upsertDocument(document) {
        console.log('TYPESENSE ### upsertDocument', document);
        return await super.upsertDocument(this._convertDatesToUnixTimestamps(document));
    }

    async deleteDocument(documentId) {
        return await super.deleteDocument(documentId);
    }

    async searchDocuments(searchParameters = {}) {
        return await super.searchDocuments(searchParameters);
    }

    // why, because Dates need to be converted into Unix timestamps (opens new window)and stored as int64 fields in Typesense
    // see https://typesense.org/docs/0.25.1/api/collections.html#notes-on-indexing-common-types-of-data


    // write a _convertDatesToUnixTimestamps(document) function that return the document with the dates converted to Unix timestamps
    _convertDatesToUnixTimestamps(document) {
        let documentToReturn = JSON.parse(JSON.stringify(document));

        if (document.createdAt) {
            documentToReturn.createdAt = Math.floor(new Date(document.createdAt).getTime() / 1000);
        }
        if (document.updatedAt) {
            documentToReturn.updatedAt = Math.floor(new Date(document.updatedAt).getTime() / 1000);
        }

        return documentToReturn;
    }

    
}

module.exports = {
    collectionName,
    schema,
    DocumentTypesenseService
}