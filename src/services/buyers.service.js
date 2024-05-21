const Buyer = require('../models/buyer.model');
const fetch = require('node-fetch');
const { Parser, Generator } = require('sparqljs');


class BuyersService {

    async create(data) {
        try {
            const buyer = new Buyer(data);
            const buyerCreated = await buyer.save();
            return buyerCreated ? buyerCreated : null;
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        const buyer = await Buyer.findOne({ _id: id });
        Object.assign(buyer, data);
        const updatedBuyer = await buyer.save();
        return buyer && updatedBuyer ? updatedBuyer : null;
    }
    
    async delete(id, company_id) {
        const buyer = await Buyer.findOne({ _id: id, company_id });
        const buyerDeleted = await buyer.deleteOne();
        return buyer && buyerDeleted ? buyerDeleted : null;
    }

    async getById(id, company_id) {
        const buyer = await Buyer.findOne({ _id: id, company_id });
        return buyer ? buyer : null;

    }

    async getBySlugAndCompanyId(slug, company_id, projection = '') {
        const buyer = await Buyer.findOne({ slug, company_id }, projection).exec();
        return buyer ? buyer : null;
    }
    
}

module.exports = new BuyersService;