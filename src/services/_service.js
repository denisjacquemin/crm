const { ObjectId } = require('mongodb');

class Service {

    constructor(db) {
        this.db = db;
        this.collection = "";
        this.fields_white_list = [];
    }

    async getBy(query) {
        try {
            return await this.db.collection(this.collection).findOne(query);
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
            // if it exist remove _id field from data
            if (data._id) {
                delete data._id;
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
            const filteredData = this.filterWhiteListedFields(data);
            const session = options.session || null;

            let result = null;
            if (session) {
                result = await this.db.collection(this.collection).insertOne(filteredData, { session });
            } else {
                result = await this.db.collection(this.collection).insertOne(filteredData);
            }

            return result.insertedId;
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


    filterWhiteListedFields(data) {
        const filteredData = {};
        const filteredOut = [];
        for (const field in data) {
            if (this.fields_white_list.includes(field)) {
                filteredData[field] = data[field];
            } else {
                filteredOut.push(field);
            }
        }
        // if fileteredOut is not empty, log it
        if (filteredOut.length > 0)
            console.log(`Fields filtered out by filterWhiteListedFields: ${filteredOut.join(", ")}`);
        return filteredData;
    }
}

module.exports = Service;