const mongoose = require('mongoose');
const {ProductsTypesenseService} = require('../services/products.typesense.service');
const { Schema } = require('mongoose');

const schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    }
};

const taxrateSchema = new mongoose.Schema({
    is_custom: { type: Boolean, required: false, default: false },
    value: { type: String, required: false },
    label: { type: String, required: false },
}, { _id: false });

const productSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, required: true, unique: true, default: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}` },
    name: { type: String, required: true },
    reference: { type: String, required: false, unique: true, sparse: true }, // sparse: true  This allows multiple documents with null values
    description: { type: String, required: false, default: '' },
    unit_price: { type: Number, required: false, default: 0 },
    vat: { type: Schema.Types.ObjectId, required: false },
    custom_vat_rate: { type: taxrateSchema, required: false, default: { is_custom: false, value: '', label: '' } },
    unit: { type: String, required: false },
}, schemaOptions);


productSchema.post(['save', 'updateOne', 'updateMany', 'findOneAndUpdate'], async function (doc, next) {
    try {
        const productsTypesenseService = new ProductsTypesenseService();
        await productsTypesenseService.upsert(doc);
        next(); // Continue with the save/update operation in MongoDB
    } catch (error) {
        console.error('Error saving/updating product in Typesense:', error.message);
        // Handle error - For simplicity, removing the document from MongoDB
        try {
            await ProductService.delete(doc._id);
                console.log('Product removed from MongoDB due to Typesense error:', doc._id);
            } catch (deleteError) {
            console.error('Error deleting product from MongoDB:', deleteError.message);
        }
        next(error); // Abort the save/update operation in MongoDB
    }
});

productSchema.pre(['remove', 'deleteOne', 'delete'], { document: true }, async function(next) {
    try {
      const deletedProductId = this._id;
      const productsTypesenseService = new ProductsTypesenseService();
      await productsTypesenseService.delete(deletedProductId);  
    } catch (error) {
      console.error(`Failed to delete product from Typesense: ${error.message}`);
      next(error); // Abort the remove operation in MongoDB
    }
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;