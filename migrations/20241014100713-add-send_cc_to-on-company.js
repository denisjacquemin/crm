module.exports = {
  async up(db, client) {
    // add send_cc_to and send_bcc_to to company schema
    await db.collection('companies').updateMany({}, { $set: { 'settings.send_cc_to': '', 'settings.send_bcc_to': '' } });
  },

  async down(db, client) {
    // remove send_cc_to and send_bcc_to from company schema
    await db.collection('companies').updateMany({}, { $unset: { 'settings.send_cc_to': '', 'settings.send_bcc_to': '' } });
  }
};
