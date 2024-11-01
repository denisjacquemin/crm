const Buyer = require('../models/buyer.model');
const PerformanceMonitor = require('../lib/performanceMonitor');
const { performance } = require('perf_hooks');

class BuyersService {
    constructor() {
        this.performanceThreshold = Number(process.env.SEARCH_PERFORMANCE_THRESHOLD_MS || 100);
    }

    async getCollectionStats() {
        try {
            const stats = await Buyer.collection.aggregate([
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
            const buyer = new Buyer(data);
            const buyerCreated = await buyer.save();
            await this.monitorQueryPerformance('buyers.create', startTime);
            return buyerCreated || null;
        } catch (error) {
            console.error('Create error:', error);
            throw error;
        }
    }

    async update(id, data) {
        const startTime = performance.now();
        try {
            const buyer = await Buyer.findOne({ _id: id });
            if (!buyer) return null;
            
            Object.assign(buyer, data);
            const updatedBuyer = await buyer.save();
            await this.monitorQueryPerformance('buyers.update', startTime);
            return updatedBuyer || null;
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    async delete(id, company_id) {
        const startTime = performance.now();
        try {
            const buyer = await Buyer.findOne({ _id: id, company_id });
            if (!buyer) return null;
            
            const buyerDeleted = await buyer.deleteOne();
            await this.monitorQueryPerformance('buyers.delete', startTime);
            return buyerDeleted || null;
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }

    async getById(id, company_id) {
        const startTime = performance.now();
        try {
            const buyer = await Buyer.findOne({ _id: id, company_id });
            await this.monitorQueryPerformance('buyers.getById', startTime);
            return buyer || null;
        } catch (error) {
            console.error('GetById error:', error);
            throw error;
        }
    }

    async getBySlugAndCompanyId(slug, company_id, projection = '') {
        const startTime = performance.now();
        try {
            const buyer = await Buyer.findOne({ slug, company_id }, projection).exec();
            await this.monitorQueryPerformance('buyers.getBySlug', startTime);
            return buyer || null;
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
                    { address1: searchRegex },
                    { address2: searchRegex },
                    { city: searchRegex },
                    { zip: searchRegex },
                    { vat_number: searchRegex },
                    { registration_number: searchRegex },
                    { contact_firstname: searchRegex },
                    { contact_lastname: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ];
            }

            const buyers = await Buyer.find(query)
                .sort(sort)
                .limit(limit)
                .exec();

            await this.monitorQueryPerformance('buyers.search', startTime, {
                query: q,
                company_id,
                sort,
                limit,
                resultsCount: buyers.length
            });

            return buyers;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
}

module.exports = new BuyersService();