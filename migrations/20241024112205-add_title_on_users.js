module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany({}, { $set: { title: "" } });
  },

  async down(db, client) {
    await db.collection('users').updateMany({}, { $unset: { title: "" } });
  }
};
