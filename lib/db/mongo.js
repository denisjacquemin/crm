// https://www.mongodb.com/docs/drivers/node/current/

const { MongoClient } = require("mongodb");
const mongoDbUrl =
  "mongodb+srv://" + process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_URL;
        let mongodb;

const client = new MongoClient(mongoDbUrl);


async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connect to MongoDB");
  } catch (err) {
    console.log(err.stack);
    await client.close();
    // Ensures that the client will close when you error
  }
}

// run().catch(console.dir);


function get() {
  return client.db("akindofcrm-dev");
}

function close() {
  mongodb.close();
}

module.exports = {
  run,
  get,
  close,
};
