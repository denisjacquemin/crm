const Document = require('../models/document.model');

class DocumentsService {

    async getLatest(limit = 30, company_id = null) {
        const query = company_id
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
        try {
            const updatedDocument = await Document.findOneAndUpdate({ _id: id }, data, { new: true });

            if (!updatedDocument) {
                const error = new Error('Document not found');
                error.status = 404;
                throw error;
            }

            return updatedDocument;
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        const documentDeleted = await Document.deleteOne({ _id: id });
        return documentDeleted;
    }
}

module.exports = new DocumentsService;

