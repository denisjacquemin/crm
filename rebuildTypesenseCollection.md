# How to Use `rebuildTypesenseCollection.js`

This script allows you to recreate a Typesense collection with a new schema and reindex the data. It's useful when you need to update the schema of a collection.

## Prerequisites

- Node.js installed on your machine.
- Typesense service running and accessible.
- Typesense service modules following the naming convention `[collectionName].typesense.service.js`.

## Usage

1. Open your terminal.

2. Navigate to the directory where `rebuildTypesenseCollection.js` is located.

3. Run the script with the name of the collection you want to recreate as a command line argument:

```bash
node rebuildTypesenseCollection.js [collectionName]