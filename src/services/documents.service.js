const { Document } = require('../models/document.model');
const PerformanceMonitor = require('../lib/performanceMonitor');
const { performance } = require('perf_hooks');

class DocumentsService {
  constructor() {
    this.performanceThreshold = Number(process.env.SEARCH_PERFORMANCE_THRESHOLD_MS || 100);
  }

  async getCollectionStats() {
    try {
      const stats = await Document.collection
        .aggregate([
          { $collStats: { storageStats: {} } },
          {
            $project: {
              count: '$storageStats.count',
              size: '$storageStats.size',
              avgObjSize: '$storageStats.avgObjSize',
              storageSize: '$storageStats.storageSize',
              totalIndexSize: '$storageStats.totalIndexSize',
              nindexes: '$storageStats.nindexes',
            },
          },
        ])
        .toArray();

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

      PerformanceMonitor.logPerformanceIssue(queryName, duration, this.performanceThreshold, {
        ...details,
        collectionStats,
      });
    }
    return duration;
  }

  async getLatest(limit = 30, company_id = null) {
    const startTime = performance.now();
    try {
      const query = company_id ? { company_id } : {};
      const documents = await Document.find(query).sort({ createdAt: -1 }).limit(limit);

      await this.monitorQueryPerformance('documents.getLatest', startTime, {
        limit,
        company_id,
        resultsCount: documents.length,
      });

      return documents;
    } catch (error) {
      console.error('GetLatest error:', error);
      throw error;
    }
  }

  async getByIdAndCompanyId(id, company_id) {
    const startTime = performance.now();
    try {
      const document = await Document.findOne({ _id: id, company_id });
      await this.monitorQueryPerformance('documents.getById', startTime);
      return document || null;
    } catch (error) {
      console.error('GetById error:', error);
      throw error;
    }
  }

  async getBySlugAndCompanyId(slug, company_id, projection = '') {
    const startTime = performance.now();
    try {
      const document = await Document.findOne({ slug, company_id }, projection)
        .populate('config.files')
        .populate('config.documentFiles')
        .populate({
          path: 'config.seller.logo',
          select: '-key -url',
        })
        .exec();

      await this.monitorQueryPerformance('documents.getBySlug', startTime);
      return document || null;
    } catch (error) {
      console.error('GetBySlug error:', error);
      throw error;
    }
  }

  async create(data) {
    const startTime = performance.now();
    try {
      const document = new Document(data);
      const documentCreated = await document.save();
      const populatedDocument = await Document.findById(documentCreated._id)
        .populate('config.files')
        .populate('config.documentFiles')
        .populate({
          path: 'config.seller.logo',
          select: '-key -url',
        })
        .exec();

      await this.monitorQueryPerformance('documents.create', startTime);
      return populatedDocument || null;
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }

  async update(id, data) {
    const startTime = performance.now();
    try {
      const dbDocument = await Document.findById(id);

      if (!dbDocument) {
        const error = new Error('Document not found');
        error.status = 404;
        throw error;
      }

      Object.assign(dbDocument, data);
      const updatedDocument = await dbDocument.save();

      const populatedDocument = await Document.findById(updatedDocument._id)
        .populate('config.files')
        .populate('config.documentFiles')
        .populate({
          path: 'config.seller.logo',
          select: '-key -url',
        })
        .exec();

      await this.monitorQueryPerformance('documents.update', startTime);
      return populatedDocument || null;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  async delete(id, company_id) {
    const startTime = performance.now();
    try {
      const document = await Document.findOne({ _id: id, company_id });
      if (!document) return null;

      const documentDeleted = await document.deleteOne();
      await this.monitorQueryPerformance('documents.delete', startTime);
      return documentDeleted;
    } catch (error) {
      console.error('Delete error:', error);
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
          { 'config.subject': searchRegex },
          { 'config.reference': searchRegex },
          { 'config.invoice_number': searchRegex },
          { 'config.credit_note_number': searchRegex },
          { 'config.buyer.name': searchRegex },
          { 'config.buyer.email': searchRegex },
          { 'config.buyer.vat_number': searchRegex },
        ];
      }

      const documents = await Document.find(query)
        .sort(sort)
        .limit(limit)
        .populate('config.files')
        .populate('config.documentFiles')
        .populate({
          path: 'config.seller.logo',
          select: '-key -url',
        })
        .exec();

      await this.monitorQueryPerformance('documents.search', startTime, {
        query: q,
        company_id,
        sort,
        limit,
        resultsCount: documents.length,
      });

      return documents;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
}

module.exports = new DocumentsService();
