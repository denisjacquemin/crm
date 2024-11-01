module.exports = {
  async up(db) {
    await db.collection('products').createIndex(
      {
        name: 'text',
        reference: 'text',
        description: 'text'
      },
      {
        weights: {
          name: 10,
          reference: 5,
          description: 1
        },
        name: "products_text_index"
      }
    );
  },

  async down(db) {
    await db.collection('products').dropIndex("products_text_index");
  }
};