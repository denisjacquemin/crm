const { ObjectId } = require('mongodb');
const Service = require('./_service');

// create a DocumentService class that extends the Service class
class Document extends Service {
    constructor(db) {
        super(db);
        this.collection = 'documents';
        this.fields_white_list = new Set([
            '_id',
            'company_id',
            'config', // json object that contains all the parameters and values of a document
            'created_at', // the user that created the document, later an history of all updates will contains the 
            'updated_at',
            'created_by_user_id',
            'slug',
        ]);
    }

    async getLatest(limit = 30, company_id = null) {
        try {
            const query = { company_id: ObjectId(company_id) };
            const options = {
                sort: { created_at: -1 },
                limit: limit,
            };
            const result = await this.getList(query, options);
            return result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async create(data) {
        try {
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
            return await super.create(filteredData);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async update(id, data) {
        try {
            const filteredData = this.filterWhiteListedFields(data, this.fields_white_list);
            return await super.updateBy('_id', ObjectId(id), filteredData);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }


    // getByEmail
    async getByIdAndCompanyId(id, company_id) {
        try {
            const query = { _id: ObjectId(id), company_id: ObjectId(company_id) };
            return await this.getBy(query);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async getBySlugAndCompanyId(slug, company_id) {
        try {
            const query = { slug: slug, company_id: ObjectId(company_id) };
            return await this.getBy(query);
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }


}

module.exports = Document;