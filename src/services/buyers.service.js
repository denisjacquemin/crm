const Buyer = require('../models/buyer.model');

class BuyersService {

    async create(data) {
       const buyer = new Buyer(data);
       await buyer.save();
       return buyer;
    }

    async update(id, data) {
        return await Buyer.findOneAndUpdate({ _id: id }, data, { new: true });
    }

    async delete(id) {
        await Buyer.deleteOne({ _id: id });

    }

    async getById(id, company_id) {
        return await Document.findOne({ _id: id, company_id });
    }
}

module.exports = BuyersService;