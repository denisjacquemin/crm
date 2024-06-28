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
        { "name": "config.invoice_date", "type": "int64", "facet": false, "optional": false },
        { "name": "config.invoice_due_date", "type": "object", "facet": false, "optional": false },
        { "name": "config.invoice_due_date.value", "type": "string", "facet": false, "optional": false },
        { "name": "createdAt", "type": "int64", "facet": false, "optional": false, "sort": true },
        { "name": "updatedAt", "type": "int64", "facet": false, "optional": false, "sort": true },
        { "name": "created_by_user_id", "type": "string", "facet": false, "optional": false },
        { "name": "slug", "type": "string", "facet": false, "optional": false }
    ]
};

class DocumentsTypesenseService extends TypesenseService {

    constructor() {
        try {
            super(collectionName, schema);
        } catch (error) {
            console.error(`An error occurred while creating the DocumentsTypesenseService: ${error.message}`);
        }
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

        if (document.config.invoice_date) {
            documentToReturn.config.invoice_date = Math.floor(new Date(document.config.invoice_date).getTime() / 1000);
        }
        console.log('document.config.invoice_date', document.config.invoice_date, Math.floor(new Date(document.config.invoice_date).getTime() / 1000));

        console.log('document.config.invoice_due_date.value', new Date(document.config.invoice_due_date.value).getTime(), Number(Math.floor(document.config.invoice_due_date.value)));

        if (!isNaN(new Date(document.config.invoice_due_date.value).getTime())) {
            documentToReturn.config.invoice_due_date.value = Math.floor(new Date(document.config.invoice_due_date.value).getTime() / 1000).toString();
        } else if (typeof document.config.invoice_due_date.value === 'string') {
            documentToReturn.config.invoice_due_date.value = document.config.invoice_due_date.value;
        }

        return documentToReturn;
    }

    
}

module.exports = {
    collectionName,
    schema,
    DocumentsTypesenseService
}