const Product = require('../models/product.model');

class ProductsService {

    async create(data) {
        try {
            console.log('data', data);
            const product = new Product(data);
            const productCreated = await product.save();
            return productCreated ? productCreated : null;
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async update(id, data) {
        const product = await Product.findOne({ _id: id });
        Object.assign(product, data);
        const updatedProduct = await product.save();
        return product && updatedProduct ? updatedProduct : null;
    }

    async delete(id, company_id) {
        const product = await Product.findOne({ _id: id, company_id });
        const productDeleted = await product.deleteOne();
        return product && productDeleted ? productDeleted : null;
    }

    async getById(id, company_id) {
        const product = await Product.findOne({ _id: id, company_id });
        return product ? product : null;

    }

    async getBySlugAndCompanyId(slug, company_id, projection = '') {
        const product = await Product.findOne({ slug, company_id }, projection).exec();
        return product ? product : null;
    }
}

module.exports = new ProductsService;