const { ObjectId } = require('mongodb');

class Service {

    constructor(db) {
        this.db = db;
        this.collection = "";
        this.fields_white_list = new Set();
    }

    async getBy(query, options = {}) {
        try {
            const projection = options.projection || {};
            return await this.db.collection(this.collection).findOne(query, {...options, projection });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async getBy(query, options = {}) {
        try {
            const projection = options.projection || {};
            return await this.db.collection(this.collection).findOne(query, {...options, projection });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async getList(query, options = {}) {
        try {
            const { sort = {}, limit = 0, skip = 0, projection = {} } = options;

            const cursor = this.db.collection(this.collection).find(query, { projection });

            if (Object.keys(sort).length > 0) {
                cursor.sort(sort);
            }

            if (limit > 0) {
                cursor.limit(limit);
            }

            if (skip > 0) {
                cursor.skip(skip);
            }

            const result = await cursor.toArray();

            return result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    getById(id) {
        if (!(id instanceof ObjectId)) {
            id = ObjectId(id);
        }
        return this.getBy({ _id: id });
    }

    async updateBy(field, value, data) {
        try {
            // if it exist remove _id field from data, the _id field cannot be updated for security reasons
            if (data._id) {
                delete data._id;
            }

            // if it exist remove slug field from data, the slug field cannot be updated for security reasons
            if (data.slug) {
                delete data.slug;
            }

            // if it exist remove created_at field from data, the created_at field cannot be updated for security reasons
            if (data.created_at) {
                delete data.created_at;
            }

            if (data.company_id) {
                data.company_id = new ObjectId(data.company_id);
            }

            if (data.created_by_user_id) {
                data.created_by_user_id = new ObjectId(data.created_by_user_id);
            }

            if (data.updated_at) {
                data.updated_at = new Date(); // now
            }


            return await this.db.collection(this.collection).updateOne({
                [field]: value
            }, { $set: data });
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async create(data, options = {}) {
        try {
            const session = options.session;
            const now = new Date(); // driver create ISODate objects in MongoDB
            const filteredData = {
                ...this.filterWhiteListedFields(data, this.fields_white_list),
                slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
                updated_at: now, 
                created_at: now,
            };

            let result = null;
            if (session) {
                result = await this.db.collection(this.collection).insertOne(filteredData, { session });
            } else {
                result = await this.db.collection(this.collection).insertOne(filteredData);
            }
            filteredData._id = result.insertedId;
            return filteredData;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }


    async deleteBy(field, value) {
        try {
            const result = await this.db.collection(this.collection).deleteOne({
                [field]: value
            });
            return result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }

    async existsBy(field, value) {
        try {
            const result = await this.db.collection(this.collection).findOne({
                [field]: value
            });
            return !!result;
        } catch (err) {
            console.error(err.stack);
            throw err;
        }
    }


    filterWhiteListedFields(data, fields_white_list) {

        const filteredData = {};

        for (const field of Object.keys(data)) {
            if (!fields_white_list.has(field)) {
                console.log(`Field filtered out by filterWhiteListedFields: ${field}`);
            } else {
                filteredData[field] = data[field];
            }
        }

        return filteredData;
    }
}

module.exports = Service;