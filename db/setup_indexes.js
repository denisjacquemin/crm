require("dotenv").config();
const { MongoClient } = require("mongodb");
const fs = require("fs");

// Load the JSON file
const indexes = JSON.parse(fs.readFileSync("./db/indexes.json"));

// Connect to the MongoDB database
const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;
const client = new MongoClient(mongoDbUrl, { useNewUrlParser: true });

async function createIndexes() {
    await client.connect();
    const db = client.db();

    // Loop through each index in the JSON file and create the corresponding index in MongoDB
    for (let i = 0; i < indexes.length; i++) {
        const index = indexes[i];

        if (!index.collection || !index.field) {
            console.log("Invalid index format: ", index);
            continue;
        }

        const options = {};
        if (index.unique) {
            options.unique = true;
        }

        const fields = {};
        if (index.fields) {
            for (let j = 0; j < index.fields.length; j++) {
                const field = index.fields[j];
                fields[field.field] = field.weight;
            }

            options.weights = fields;
            options.default_language = index.language || "english";
        }

        db.collection(index.collection).createIndex({
                [index.field]: 1,
            },
            options,
            function(err, result) {
                if (err) throw err;

                console.log(
                    `Index created for collection ${index.collection} and field ${index.field}`
                );
            }
        );
    }

    // Close the MongoDB client connection
    client.close();
}

createIndexes();