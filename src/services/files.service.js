const File = require('../models/file.model');
const { ObjectId } = require('mongoose').Types;

class FileService {

    static async getById(id) {
        return await File.findOne({
            _id: id
        });
    }

    static async getByCompanyId(id) {
        return await File.find({
            company_id: id
        }).sort({ createdAt: -1 });
    }

    static async getLinkedToACompanyId(id) {
        return await File.find({
            company_id: id,
            document_id: { $exists: false, $eq: null }
        });
    }

    static async getLinkedToADocumentId(id) {
        return await File.find({
            document_id: id
        });
    }

    static async getBySlug(slug) {
        return await File.findOne({
            slug: slug
        });
    }

    static async create(data, options = {}) {
        try {
            const file = new File(data);
            await file.save(options);
            return file;
        } catch (error) {
            throw error;
        }
    }
    static async update(id, companyId, data) {
        return await File.findOneAndUpdate({ _id: id, company_id: companyId }, data, { new: true });
    }

    static async findOneAndUpdate(query, data, options = {}) {
        return await File.findOneAndUpdate
            (query, data, options);
    }

    static async delete(id) {
        return await File.deleteOne({ _id: id });
    }

}
module.exports = FileService