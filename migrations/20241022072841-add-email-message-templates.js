module.exports = {
  async up(db, client) {
    await db.collection('companies').updateMany(
      { 'settings.email_message_templates': { $exists: false } },
      {
        $set: {
          'settings.email_message_templates': {}
        }
      }
    );
  },

  async down(db, client) {
    await db.collection('companies').updateMany(
      {},
      { $unset: { 'settings.email_message_templates': '' } }
    );
  }
};
