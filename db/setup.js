require("dotenv").config();

const { MongoClient } = require("mongodb");

const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;
const client = new MongoClient(mongoDbUrl, { useNewUrlParser: true });

async function run(indexConfigs) {
    try {
        await client.connect();
        console.log(`Successfully connected to MongoDB @ ${process.env.MONGO_URL}`);
        const db = client.db();

        for (const config of indexConfigs) {
            const { collection, field, unique } = config;
            const collectionObj = db.collection(collection);
            await collectionObj.createIndex({
                [field]: 1
            }, { unique: unique });
            console.log(`Successfully created unique index on "${field}" in "${collection}"`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

const fs = require("fs");
const file = process.argv[2];
const indexConfigs = JSON.parse(fs.readFileSync(file));

run(indexConfigs);