const TypesenseService = require('./_typesense');

const collectionName = 'buyers';
const schema = {
    "name": collectionName,
    "enable_nested_fields": true,
    "fields": [
        { "name": "_id", "type": "string", "facet": false, "optional": false },
        { "name": "company_id", "type": "string", "facet": false, "optional": false },
        { "name": "name", "type": "string", "facet": false, "optional": false, "sort": true },
        { "name": "address1", "type": "string", "facet": false, "optional": true },
        { "name": "address2", "type": "string", "facet": false, "optional": true },
        { "name": "zip", "type": "string", "facet": false, "optional": true },
        { "name": "city", "type": "string", "facet": false, "optional": true },
        { "name": "vat_number", "type": "string", "facet": false, "optional": true },
        { "name": "contact_name", "type": "string", "facet": false, "optional": true },
        { "name": "email", "type": "string", "facet": false, "optional": true },
        { "name": "phone", "type": "string", "facet": false, "optional": true },
        { "name": "createdAt", "type": "int64", "facet": false, "optional": false },
        { "name": "updatedAt", "type": "int64", "facet": false, "optional": false },
        { "name": "created_by_user_id", "type": "string", "facet": false, "optional": false },
        { "name": "slug", "type": "string", "facet": false, "optional": false }
    ]
};

class BuyersTypesenseService extends TypesenseService {

    constructor() {
        try {
            super(collectionName, schema);
        } catch (error) {
            console.error(`An error occurred while creating the BuyersTypesenseService: ${error.message}`);
        }
    }

    async create(buyer) {
        return await super.createDocument(this._convertDatesToUnixTimestamps(buyer));
    }

    async get(buyerId) {
        return await super.getDocument(buyerId);
    }

    async update(buyerId, buyer) {
        return await super.updateDocument(buyerId, this._convertDatesToUnixTimestamps(buyer));
    }

    async delete(buyerId) {
        return await super.deleteDocument(buyerId);
    }

    async search(query, searchParameters = {}) {
        return await super.searchDocuments(query, searchParameters);
    }

    async upsert(buyer) {
        return await super.upsertDocument(this._convertDatesToUnixTimestamps(buyer));
    }

    _convertDatesToUnixTimestamps(buyer) {
        let documentToReturn = JSON.parse(JSON.stringify(buyer));

        if (buyer.createdAt) {
            documentToReturn.createdAt = Math.floor(new Date(buyer.createdAt).getTime() / 1000);        }
        if (buyer.updatedAt) {
            documentToReturn.updatedAt = Math.floor(new Date(buyer.updatedAt).getTime() / 1000);
        }
        return documentToReturn;
    }
}

module.exports = {
    collectionName,
    schema,
    BuyersTypesenseService
}