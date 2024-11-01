module.exports = {
  async up(db) {
      await db.collection('buyers').createIndex(
          { 
              name: 'text',
              address1: 'text',
              address2: 'text',
              city: 'text',
              zip: 'text',
              vat_number: 'text',
              registration_number: 'text',
              contact_firstname: 'text',
              contact_lastname: 'text',
              email: 'text',
              phone: 'text'
          },
          {
              weights: {
                  name: 10,
                  vat_number: 8,
                  registration_number: 8,
                  zip: 7,
                  contact_firstname: 5,
                  contact_lastname: 5,
                  email: 5,
                  phone: 3,
                  address1: 2,
                  address2: 1,
                  city: 1
              },
              name: "buyers_text_index",
              default_language: "english",
              language_override: "none"
          }
      );
  },

  async down(db) {
      await db.collection('buyers').dropIndex("buyers_text_index");
  }
}; 