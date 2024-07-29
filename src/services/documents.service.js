const Document = require('../models/document.model');

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
        const document = await Document.findOne({ slug, company_id }, projection).exec();
        return document;
    }

    async create(data) {
        const document = new Document(data);
        const documentCreated = await document.save();
        return documentCreated;
    }

    async update(id, data) {
        const updatedDocument = await Document.findOneAndUpdate({ _id: id }, data, { new: true });
        if (!updatedDocument) {
            const error = new Error('Document not found');
            error.status = 404;
            throw error;
        }
        return updatedDocument;
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

