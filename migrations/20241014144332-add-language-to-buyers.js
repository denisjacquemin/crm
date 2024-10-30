module.exports = {
  async up(db, client) {
    await db.collection('buyers').updateMany({}, { $set: { language: "" } });
  },

  async down(db, client) {
    await db.collection('buyers').updateMany({}, { $unset: { language: "" } });
  }
};
