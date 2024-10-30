module.exports = {
  async up(db, client) {
    await db.collection('companies').updateMany(
      {},
      {
        $set: {
          contact_title: '',
          contact_firstname: '',
          contact_lastname: ''
        }
      }
    );
  },

  async down(db, client) {
    await db.collection('companies').updateMany(
      {},
      {
        $unset: {
          contact_title: '',
          contact_firstname: '',
          contact_lastname: ''
        }
      }
    );
  }
};
