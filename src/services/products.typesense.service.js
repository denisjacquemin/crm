const TypesenseService = require('./_typesense');

const collectionName = 'products';
const schema = {
    "name": collectionName,
    "enable_nested_fields": true,
    "fields": [
        { "name": "_id", "type": "string", "facet": false, "optional": false },
        { "name": "company_id", "type": "string", "facet": false, "optional": false },
        { "name": "reference", "type": "string", "facet": false, "optional": true },
        { "name": "name", "type": "string", "facet": false, "optional": false, "sort": true },
        { "name": "description", "type": "string", "facet": false, "optional": false },
        { "name": "unit_price", "type": "int64", "facet": false, "optional": true },
        { "name": "vat", "type": "string", "facet": false, "optional": true },
        { "name": "custom_vat_rate", "type": "object", "facet": false, "optional": true },
        { "name": "unit", "type": "string", "facet": false, "optional": true },
        { "name": "createdAt", "type": "int64", "facet": false, "optional": false, "sort": true },
        { "name": "updatedAt", "type": "int64", "facet": false, "optional": false },
        { "name": "created_by_user_id", "type": "string", "facet": false, "optional": false },
        { "name": "slug", "type": "string", "facet": false, "optional": false }
    ]
};

class ProductsTypesenseService extends TypesenseService {

    constructor() {
        try {
            super(collectionName, schema);
        } catch (error) {
            console.error(`An error occurred while creating the ProductsTypesenseService: ${error.message}`);
        }
    }

    async create(product) {
        return await super.createDocument(this._convertDatesToUnixTimestamps(product));
    }

    async get(productId) {
        return await super.getDocument(productId);
    }

    async update(productId, product) {
        return await super.updateDocument(productId, this._convertDatesToUnixTimestamps(product));
    }

    async delete(productId) {
        return await super.deleteDocument(productId);
    }

    async search(query, searchParameters = {}) {
        try {
            console.log('in searcg', query, searchParameters)
            return await super.searchDocuments(query, searchParameters);
        } catch(error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    async upsert(product) {
        return await super.upsertDocument(this._convertDatesToUnixTimestamps(product));
    }

    _convertDatesToUnixTimestamps(product) {
        let documentToReturn = JSON.parse(JSON.stringify(product));

        if (product.createdAt) {
            documentToReturn.createdAt = Math.floor(new Date(product.createdAt).getTime() / 1000);        }
        if (product.updatedAt) {
            documentToReturn.updatedAt = Math.floor(new Date(product.updatedAt).getTime() / 1000);
        }
        return documentToReturn;
    }
}

module.exports = {
    collectionName,
    schema,
    ProductsTypesenseService
}