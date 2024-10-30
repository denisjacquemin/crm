module.exports = {
  async up(db, client) {
    await db.collection('companies').updateMany(
      {},
      {
        $unset: { contact_name: "" }
      }
    );
  },

  async down(db, client) {
    // Note: This down migration can't restore the original values of contact_name
    // It will just add the field back with a null value
    await db.collection('companies').updateMany(
      {},
      {
        $set: { contact_name: null }
      }
    );
  }
};
