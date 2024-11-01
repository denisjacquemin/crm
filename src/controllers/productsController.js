const mongoose = require('mongoose');
const ProductsService = require('../services/products.service');
const { MongoServerError } = require('mongodb');
const { performance } = require('perf_hooks');

async function index(req, res, next) {
    const startTime = performance.now();
    try {
        const products = await ProductsService.search({ 
            q: '*',
            company_id: req.session.current_company._id,
            sort: { createdAt: -1 },
            limit: 30
        });

        const duration = performance.now() - startTime;
        
        res.render('products/index', {
            layout: false,
            products,
            defaultCountry: req.session.current_company.country,
            queryTime: duration.toFixed(2)
        });
    } catch (err) {
        next(err);
    }
}

async function search(req, res, next) {
    const startTime = performance.now();
    try {
        let sort = { createdAt: -1 };
        if (req.query.sort === 'nameasc') {
            sort = { name: 1 };
        }

        const products = await ProductsService.search({
            q: req.query.q,
            company_id: req.session.current_company._id,
            sort,
            limit: 30
        });

        const duration = performance.now() - startTime;
        res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
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

        res.status(200).json({
            product: product.toObject()
        });
    } catch (error) {
        next(error);
    }
}

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
}

async function newProductAjax(req, res, next) {
    try {
        const product = await createNewProduct(req);
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
}

async function createNewProduct(req) {
    try {
        const companyCountry = req.session.current_company.country;
        const countryData = req.i18n.t(`countries:countries.${companyCountry}`, { returnObjects: true });
        
        let defaultTaxrate = getDefaultTaxrate(req.session.current_company, countryData);

        const productData = {
            company_id: req.session.current_company._id,
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: req.i18n.t('products.controller.default_product_name'),
            vat: new mongoose.Types.ObjectId(defaultTaxrate),
        };

        const productCreated = await ProductsService.create(productData);
        return productCreated ? productCreated.toObject() : null;
    } catch (err) {
        console.error('Failed to create product:', err);
        throw new Error('Failed to create product');
    }
}

function getDefaultTaxrate(company, countryData) {
    if (company.default_taxrate) {
        const foundTaxrate = countryData.taxrates.find(
            taxrate => taxrate._id === company.default_taxrate
        );
        if (foundTaxrate) {
            return foundTaxrate._id;
        }
    }
    return countryData.default_taxrate;
}

async function update(req, res, next) {
    try {
        let product = await ProductsService.getBySlugAndCompanyId(req.body.value.slug, req.session.current_company._id);

        if (!product) {
            return next({ status: 404, message: 'Product not found' });
        }

        if (req.body.value.vat) {
            req.body.value.vat = new mongoose.Types.ObjectId(req.body.value.vat);
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
                notification: { 
                    message: req.i18n.t('products.controller.reference_must_be_unique'), 
                    submessage: req.i18n.t('products.controller.reference_must_be_unique_sub'), 
                    type: 'error'
                }
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