module.exports = {
  async up(db, client) {
    await db.collection('companies').updateMany(
      { 'settings.email_subject_templates': { $exists: false } },
      {
        $set: {
          'settings.email_subject_templates': {}
        }
      }
    );
  },

  async down(db, client) {
    await db.collection('companies').updateMany(
      {},
      { $unset: { 'settings.email_subject_templates': '' } }
    );
  }
};
