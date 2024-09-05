const Document = require('../models/document.model');
const _ = require('lodash');


class DocumentsService {

    async getLatest(limit = 30, company_id = null) {
        const query = company_id ? { company_id } : {};
        const documents = await Document.find(query).sort({ createdAt: -1 }).limit(limit);
        return documents;
    }

    async getByIdAndCompanyId(id, company_id) {
        const document = await Document.findOne({ _id: id, company_id });
        return document;
    }

    async getBySlugAndCompanyId(slug, company_id, projection = '') {
        const document = await Document.findOne({ slug, company_id }, projection)
        .populate('config.files')
        .populate('config.documentFiles')
        .populate('config.seller.logo')
        .exec();
        return document;
    }

    async create(data) {
        const document = new Document(data);
        const documentCreated = await document.save();
        const populatedDocument = await Document.findById(documentCreated._id)
            .populate('config.files')
            .populate('config.documentFiles')
            .populate('config.seller.logo')
            .exec();
        return populatedDocument;
    }

    async update(id, data) {
        const dbDocument = await Document.findById(id)
        
        if (!dbDocument) {
            const error = new Error('Document not found');
            error.status = 404;
            throw error;
        }

        function customMerge(objValue, srcValue) {
            if (_.isArray(objValue)) {
                return srcValue;
            }
        }
    
        _.mergeWith(dbDocument, data, customMerge);

        const updatedDocument = await dbDocument.save();

        const populatedDocument = await Document.findById(updatedDocument._id)
        .populate('config.files')
        .populate('config.documentFiles')
        .exec();

        return populatedDocument;
    }

    async delete(id, company_id) {
        const document = await Document.findOne({ _id: id, company_id });
        if (!document) {
            return null; // Or throw an error, depending on desired behavior
        }
        const documentDeleted = await document.deleteOne();
        return documentDeleted;    }
}

module.exports = new DocumentsService;

