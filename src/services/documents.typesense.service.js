const TypesenseService = require('./_typesense');

const collectionName = 'documents';
const schema = {
    "name": collectionName,
    "enable_nested_fields": true,
    "fields": [
        { "name": "_id", "type": "string", "facet": false, "optional": false },
        { "name": "company_id", "type": "string", "facet": false, "optional": false },
        { "name": "config", "type": "object", "facet": false, "optional": false },
        { "name": "created_at", "type": "int64", "facet": false, "optional": false },
        { "name": "updated_at", "type": "int64", "facet": false, "optional": false },
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

    async deleteDocument(documentId) {
        return await super.deleteDocument(documentId);
    }

    async searchDocuments(query, searchParameters = {}) {
        return await super.searchDocuments(query, searchParameters);
    }

    _convertDatesToUnixTimestamps(document) {
        const documentWithUnixTimestamps = {...document };
        if (document.created_at) {
            documentWithUnixTimestamps.created_at = Math.floor(new Date(document.created_at).getTime() / 1000);
        }
        if (document.updated_at) {
            documentWithUnixTimestamps.updated_at = Math.floor(new Date(document.updated_at).getTime() / 1000);
        }
        return documentWithUnixTimestamps;
    }
}

module.exports = {
    collectionName,
    schema,
    DocumentTypesenseService
}