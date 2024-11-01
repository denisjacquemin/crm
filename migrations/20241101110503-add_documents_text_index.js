module.exports = {
  async up(db) {
    await db.collection('documents').createIndex(
        {
            'config.subject': 'text',
            'config.reference': 'text',
            'config.invoice_number': 'text',
            'config.credit_note_number': 'text',
            'config.buyer.name': 'text',
            'config.buyer.vat_number': 'text',
        },
        {
            weights: {
                'config.invoice_number': 10,
                'config.credit_note_number': 10,
                'config.reference': 8,
                'config.subject': 7,
                'config.buyer.name': 6,
                'config.buyer.vat_number': 5,
            },
            name: "documents_text_index",
            default_language: "english",
            language_override: "none"
        }
    );
},

async down(db) {
    await db.collection('documents').dropIndex("documents_text_index");
}
};
