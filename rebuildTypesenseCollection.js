require("dotenv").config();
const process = require('process');
const Typesense = require('./src/services/lib/typesense');


async function recreateCollection(collectionName) {
  // Capitalize the first letter of the collection name
  const serviceName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1) + 'TypesenseService';

  // Dynamically require the Typesense service module
  const typesenseServiceModule = require(`./src/services/${collectionName}.typesense.service`);
  const TypesenseService = typesenseServiceModule[serviceName];
  // console.log('process.env', process.env);
  await Typesense.connectToTypesense();
  // Initialize TypesenseService with your collection name and schema
  const typesenseService = new TypesenseService();

  // Export data from existing collection
  const sourceDocuments = await typesenseService.client.collections(collectionName).documents().search({q: '*'});
  const documents = sourceDocuments.hits.map(hit => hit.document);
  // Drop existing collection
  await typesenseService.client.collections(collectionName).delete();

  // Create new collection with updated schema
  await typesenseService.createCollection();

  // Import data back into new collection
  for (const document of documents) {
    await typesenseService.createDocument(document);
  }
}

// Get the collection name from the command line arguments
const collectionName = process.argv[2];
if (!collectionName) {
  console.error('Please provide a collection name as a command line argument.');
  process.exit(1);
}

recreateCollection(collectionName).catch(console.error);