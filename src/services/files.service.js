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

        try {
            const updatedFile = await File.findOneAndUpdate(
                { _id: id, company_id: companyId },
                data,
                { new: true }
            );
            console.log('updatedFile', updatedFile);
            return updatedFile;
        } catch (error) {
            throw new Error(`Failed to update file: ${error.message}`);
        }
    }

    static async findOneAndUpdate(query, data, options = {}) {
        return await File.findOneAndUpdate
            (query, data, options);
    }

    static async delete(id, userId) {
        return await File.findByIdAndUpdate(id, {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: userId
        }, { new: true });
    }

    static async getFileIdsByCompanyIdAndDocumentType(companyId, documentType) {
        return await File.find({
            company_id: companyId,
            default_attached_document_types: { $elemMatch: { $eq: documentType } }
        }).select('_id');
    }
}
module.exports = FileService