const ProductsService = require('../services/products.service');
const { ProductsTypesenseService } = require('../services/products.typesense.service');
const { MongoServerError } = require('mongodb');


async function index(req, res, next) {
    try {
        const productsTypesenseService = new ProductsTypesenseService();
        const results = await productsTypesenseService.search({ 
            'q': '*',
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: 'createdAt:desc',
            per_page: 30,
            query_by: 'reference,name,description'
        });
        const products = results.hits.map(hit => hit.document);
        // const geo = geoip.lookup(req.ip);//geoip.lookup('178.51.244.142');

        res.render('products/index', {
            layout: false,
            products: products,
            // countries: req.i18n.t('countries:countries',  { returnObjects: true }),
            // frequentlySelectedCountries: req.i18n.t('countries:frequently_selected_countries',  { returnObjects: true }),
            defaultCountry: req.session.current_company.country,
            // ...getCompanyRegistrationNumberLabels(req)
        });
    } catch (err) {
        next(err);
    }
}

async function search(req, res, next) {
    try {
        console.log('searching for:', req.query);
        let sortBy = 'createdAt:desc';
        if (req.query.sort && req.query.sort === 'nameasc') {
            sortBy = 'name:asc';
        } 
        const productsTypesenseService = new ProductsTypesenseService();
        const searchParameters = {
            q: req.query.q,
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: sortBy,
            per_page: 30,
            query_by: 'reference,name,description'
        };

        const searchResults = await productsTypesenseService.search(searchParameters);
         // Extract the document property from each hit and return an array of buyers
        const products = searchResults.hits.map(hit => hit.document);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        next(error);
    }
}

async function editAjax(req, res, next) {

    try {
        const product = await ProductsService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);
        if (!product) {
            return next({ 
                status: 404, 
                message: 'Product not found', 
                notification: { message: 'Product not found', type: 'error'}
            });
        }

        res.status(200).json(product.toObject());

    } catch (error) {
        next(error);
    }
};

async function deleteAjax(req, res, next) {

    try {
        const productToDelete = await ProductsService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!productToDelete) {
            return next({ 
                status: 404, 
                message: 'Product not found', 
                notification: { message: 'Product not found', type: 'error'}
            });
        }

        const productDeleted = await ProductsService.delete(productToDelete._id, req.session.current_company._id);

        res.status(200).json(productDeleted.toObject());

    } catch (error) {
        next(error);
    }
};

async function newProductAjax(req, res, next) {
    try {
        const product = await createNewProductInMongoAndTypesense(req);
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
}

async function createNewProductInMongoAndTypesense(req) {
    // automatically sync in Typense by a mongoose's hook in models/product.model.js
    try {
        const productCreated = await ProductsService.create({
            company_id: req.session.current_company._id,
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: req.i18n.t('products.controller.default_product_name'),
        });
        
        return productCreated ? productCreated.toObject() : null;

    } catch (err) {
        throw new Error('Failed to create product in MongoDB', err);
    }
}

async function update(req, res, next) {
    try {
        let product = await ProductsService.getBySlugAndCompanyId(req.body.value.slug, req.session.current_company._id);

        if (!product) {
            return next({ status: 404, message: 'Product not found' });
        }
        let updatedProduct = await ProductsService.update(product._id, req.body.value);
        updatedProduct = updatedProduct.toObject();

        updatedProduct.autosave_updated_at = req.body.value.autosave_updated_at;
        res.status(200).json(updatedProduct);

    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            return next({ 
                status: 400, 
                message: 'Product not found', 
                notification: { message: req.i18n.t('products.controller.reference_must_be_unique'), submessage: req.i18n.t('products.controller.reference_must_be_unique_sub'), 
                type: 'error'}
            });
        } else {
            next(error);
        }
    }
}

module.exports = {
    index,
    search,
    editAjax,
    deleteAjax,
    newProductAjax,
    update
};