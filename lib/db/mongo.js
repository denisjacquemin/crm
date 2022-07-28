// https://www.mongodb.com/docs/drivers/node/current/

const mongoClient = require("mongodb").MongoClient;
const mongoDbUrl =
  "mongodb+srv://akindofcrm-dev:E0H5a8aEuKi6ywPd@cluster0.vauqn.mongodb.net/?retryWrites=true&w=majority";
let mongodb;

function connect(callback) {
  mongoClient.connect(mongoDbUrl, (err, db) => {
    if (err) {
      console.log("Error connecting to MongoDB", err);
      return;
    }
    mongodb = db;
    // try a mongodb ping to check if connection is successful
    try {
      mongodb.db("admin").command({ ping: 1 });
    } catch (err) {
      console.log("Error pinging MongoDB", err);
    }
    callback();
  });
}
function get() {
  return mongodb.db("akindofcrm-dev");
}

function close() {
  mongodb.close();
}

module.exports = {
  connect,
  get,
  close,
};
