const TypesenseService = require('./_typesense');

const collectionName = 'buyers';
const schema = {
    "name": collectionName,
    "enable_nested_fields": true,
    "fields": [
        { "name": "_id", "type": "string", "facet": false, "optional": false },
        { "name": "company_id", "type": "string", "facet": false, "optional": false },
        { "name": "name", "type": "string", "facet": false, "optional": false },
        { "name": "address", "type": "string", "facet": false, "optional": true },
        { "name": "city", "type": "string", "facet": false, "optional": true },
        { "name": "vat_number", "type": "string", "facet": false, "optional": true },
        { "name": "email", "type": "string", "facet": false, "optional": true },
        { "name": "phone", "type": "string", "facet": false, "optional": true },
        { "name": "created_at", "type": "int64", "facet": false, "optional": false },
        { "name": "updated_at", "type": "int64", "facet": false, "optional": false },
        { "name": "created_by_user_id", "type": "string", "facet": false, "optional": false },
        { "name": "slug", "type": "string", "facet": false, "optional": false }
    ]
};

class BuyerTypesenseService extends TypesenseService {

    constructor() {

        super(collectionName, schema);
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

    _convertDatesToUnixTimestamps(buyer) {
        const buyerWithUnixTimestamps = {...buyer };
        if (buyer.created_at) {
            buyerWithUnixTimestamps.created_at = Math.floor(new Date(buyer.created_at).getTime() / 1000);
        }
        if (buyer.updated_at) {
            buyerWithUnixTimestamps.updated_at = Math.floor(new Date(buyer.updated_at).getTime() / 1000);
        }
        return buyerWithUnixTimestamps;
    }
}

module.exports = {
    collectionName,
    schema,
    BuyerTypesenseService
}