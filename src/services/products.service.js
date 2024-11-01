const Product = require('../models/product.model');
const PerformanceMonitor = require('../lib/performanceMonitor');
const { performance } = require('perf_hooks');

class ProductsService {

    constructor() {
        this.performanceThreshold = process.env.SEARCH_PERFORMANCE_THRESHOLD_MS || 100;
    }

    async getCollectionStats() {
        try {
            const stats = await Product.collection.aggregate([
                { $collStats: { storageStats: {} } },
                { 
                    $project: {
                        count: '$storageStats.count',
                        size: '$storageStats.size',
                        avgObjSize: '$storageStats.avgObjSize',
                        storageSize: '$storageStats.storageSize',
                        totalIndexSize: '$storageStats.totalIndexSize',
                        nindexes: '$storageStats.nindexes'
                    }
                }
            ]).toArray();

            return stats[0];
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return null;
        }
    }

    async monitorQueryPerformance(queryName, startTime, details = {}) {
        const duration = performance.now() - startTime;
        
        if (duration > this.performanceThreshold) {
            const collectionStats = await this.getCollectionStats();
            
            PerformanceMonitor.logPerformanceIssue(
                queryName,
                duration,
                this.performanceThreshold,
                {
                    ...details,
                    collectionStats
                }
            );
        }
        return duration;
    }

    async create(data) {
        const startTime = performance.now();
        try {
            const product = new Product(data);
            const productCreated = await product.save();
            await this.monitorQueryPerformance('products.create', startTime);
            return productCreated || null;
        } catch (error) {
            console.error('Create error:', error);
            throw error;
        }
    }

    async update(id, data) {
        const startTime = performance.now();
        try {
            const product = await Product.findOne({ _id: id });
            if (!product) return null;
            
            Object.assign(product, data);
            const updatedProduct = await product.save();
            await this.monitorQueryPerformance('products.update', startTime);
            return updatedProduct || null;
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    async delete(id, company_id) {
        const startTime = performance.now();
        try {
            const product = await Product.findOne({ _id: id, company_id });
            if (!product) return null;
            
            const productDeleted = await product.deleteOne();
            await this.monitorQueryPerformance('products.delete', startTime);
            return productDeleted || null;
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }

    async getById(id, company_id) {
        const startTime = performance.now();
        try {
            const product = await Product.findOne({ _id: id, company_id });
            await this.monitorQueryPerformance('products.getById', startTime);
            return product || null;
        } catch (error) {
            console.error('GetById error:', error);
            throw error;
        }
    }

    async getBySlugAndCompanyId(slug, company_id, projection = '') {
        const startTime = performance.now();
        try {
            const product = await Product.findOne({ slug, company_id }, projection).exec();
            await this.monitorQueryPerformance('products.getBySlug', startTime);
            return product || null;
        } catch (error) {
            console.error('GetBySlug error:', error);
            throw error;
        }
    }

    async search({ q = '', company_id, sort = { createdAt: -1 }, limit = 30 }) {
        const startTime = performance.now();
        try {
            let query = { company_id };
            
            if (q && q !== '*') {
                const searchRegex = new RegExp(q, 'i');
                query.$or = [
                    { name: searchRegex },
                    { reference: searchRegex },
                    { description: searchRegex }
                ];
            }

            const products = await Product.find(query)
                .sort(sort)
                .limit(limit)
                .exec();

            await this.monitorQueryPerformance('products.search', startTime, {
                query: q,
                company_id,
                sort,
                limit,
                resultsCount: products.length
            });

            return products;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
}

module.exports = new ProductsService();