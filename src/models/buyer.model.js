const mongoose = require('mongoose');
const {validateEmail} = require('./_helper.model');
const {BuyersTypesenseService} = require('../services/buyers.typesense.service');
const BuyerService = require('../services/buyers.service');


const buyerSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    address1: { type: String, required: false },
    address2: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false },
    vat_number: { type: String, required: false },
    contact_name: { type: String, required: false },
    phone: { type: String, required: false },
    email: {
        type: String,
        required: false,
        validate: {
            validator: validateEmail,
            message: props => `${props.value} is not a valid email address!`
        }
    },
}, { timestamps: true });

buyerSchema.post(['save', 'updateOne', 'updateMany', 'findOneAndUpdate'], async function (doc, next) {
    try {
        const buyersTypesenseService = new BuyersTypesenseService();
        await buyersTypesenseService.upsert(doc);
        console.log('Buyer.post(save) ' + '%s has been saved in Typesense', doc._id);
        next(); // Continue with the save/update operation in MongoDB
    } catch (error) {
        console.error('Error saving/updating document in Typesense:', error.message);
        // Handle error - For simplicity, removing the document from MongoDB
        try {
            await BuyerService.delete(doc._id);
                console.log('Document removed from MongoDB due to Typesense error:', doc._id);
            } catch (deleteError) {
            console.error('Error deleting document from MongoDB:', deleteError.message);
        }
        next(error); // Abort the save/update operation in MongoDB
    }
});


  
buyerSchema.pre(['remove', 'deleteOne', 'delete'], { document: true }, async function(next) {
    try {
      const deletedBuyerId = this._id;
      const buyersTypesenseService = new BuyersTypesenseService();
      await buyersTypesenseService.delete(deletedBuyerId);  
    } catch (error) {
      console.error(`Failed to delete document from Typesense: ${error.message}`);
      next(error); // Abort the remove operation in MongoDB
    }
});

const Buyer = mongoose.model('Buyer', buyerSchema);

module.exports = Buyer;