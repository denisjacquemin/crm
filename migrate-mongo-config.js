require('dotenv').config();
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const database = process.env.MONGO_DATABASE;
const clusterUrl = process.env.MONGO_CLUSTER_URL;
const replicaSet = process.env.MONGO_REPLICA_SET;
const mongoHosts = process.env.MONGO_HOSTS;

let mongoDbUrl;
if (clusterUrl) {
    mongoDbUrl = `mongodb://${username}:${password}@${clusterUrl}/${database}?replicaSet=${replicaSet}`;
} else {
    mongoDbUrl = `mongodb://${username}:${password}@${mongoHosts}/${database}`;
}
console.log(mongoDbUrl);

const config = {
  mongodb: {
    url: mongoDbUrl,

    // TODO Change this to your database name:
    databaseName: database,

    options: {
      maxPoolSize: process.env.MONGO_POOL_SIZE || 10,
      minPoolSize: 1,
      waitQueueTimeoutMS: 10000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
};

module.exports = config;
