const { ObjectId } = require('mongodb');
const mongoService = require('./lib/mongo');
const Service = require('./_service');

let buyerServiceInstance = null;
// based on the model ./documents.service.js, build a crud service for buyers
class BuyerService extends Service {
    constructor(db) {
        super(db);
        this.collection = 'buyers';
        this.fields_white_list = new Set([
            '_id',
            'company_id',
            'name',
            'address',
            'city',
            'country',
            'vat_number',
            'email',
            'phone',
            'created_at',
            'updated_at',
            'created_by_user_id',
            'slug',
        ]);
    }

    static async getInstance() {
        if (!buyerServiceInstance) {
            const db = await mongoService.get();
            buyerServiceInstance = new BuyerService(db);
        }

        return buyerServiceInstance;
    }

    async create(data) {
        try {
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
            return await super.create(filteredData);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async update(id, data) {
        try {
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
            return await super.updateBy('_id', ObjectId(id), filteredData);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async delete(id) {
        try {
            return await super.deleteBy('_id', ObjectId(id));
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async getById(id) {
        try {
            return await super.getBy('_id', ObjectId(id));
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }
}

module.exports = BuyerService;