const { ObjectId } = require('mongodb');
const BuyersService = require('../services/buyers.service');
const { BuyersTypesenseService } = require('../services/buyers.typesense.service');
const DateHelper = require('../lib/date-helpers');
// rquire _.extend from underscore
const mergeObjects = require('../lib/object-helper').mergeObjects;
const _ = require('lodash');
const { updateMany } = require('../models/document.model');
const mongoose = require('mongoose');


async function index(req, res, next) {
    try {
        const buyersTypesenseService = new BuyersTypesenseService();
        const results = await buyersTypesenseService.search({ 
            'q': '*',
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: 'createdAt:desc',
            per_page: 30,
            query_by: 'name,address1,address2,city,vat_number,contact_name,email,phone'
        });
        const buyers = results.hits.map(hit => hit.document);
        console.log('buyers', buyers);
        res.render('buyers/index', {
            layout: false,
            buyers: buyers,
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
        const buyersTypesenseService = new BuyersTypesenseService();
        const searchParameters = {
            q: req.query.q,
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: sortBy,
            per_page: 30,
            query_by: 'name,address1,address2,city,vat_number,zip,contact_name,email,phone'
        };

        const searchResults = await buyersTypesenseService.search(searchParameters);
         // Extract the document property from each hit and return an array of buyers
        const buyers = searchResults.hits.map(hit => hit.document);
        res.status(200).json(buyers);
    } catch (err) {
        next(error);
    }
}

async function editAjax(req, res, next) {

    try {
        const buyer = await BuyersService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);
        if (!buyer) {
            return next({ 
                status: 404, 
                message: 'Buyer not found', 
                notification: { message: 'Buyer not found', type: 'error'}
            });
        }

        res.status(200).json(buyer.toObject());

    } catch (error) {
        next(error);
    }
};

async function deleteAjax(req, res, next) {

    try {
        const buyerToDelete = await BuyersService.getBySlugAndCompanyId(req.params.slug, req.session.current_company._id);

        if (!buyerToDelete) {
            return next({ 
                status: 404, 
                message: 'Buyer not found', 
                notification: { message: 'Buyer not found', type: 'error'}
            });
        }

        const buyerDeleted = await BuyersService.delete(buyerToDelete._id, req.session.current_company._id);

        res.status(200).json(buyerDeleted.toObject());

    } catch (error) {
        next(error);
    }
};


async function newBuyerAjax(req, res, next) {
    try {
        const buyer = await createNewBuyerInMongoAndTypesense(req);
        res.status(200).json(buyer);
    } catch (error) {
        next(error);
    }
}

async function createNewBuyerInMongoAndTypesense(req) {
    // automatically sync in Typense by a mongoose's hook in models/buyer.model.js
    try {
        console.log('req.session.current_company._id', req.session.current_company._id);
        const buyerCreated = await BuyersService.create({
            company_id: req.session.current_company._id,
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: 'Choose a name',
        });
        
        return buyerCreated ? buyerCreated.toObject() : null;

    } catch (err) {
        throw new Error('Failed to create buyer in MongoDB', err);
    }
}

async function update(req, res, next) {
    try {
        let buyer = await BuyersService.getBySlugAndCompanyId(req.body.value.slug, req.session.current_company._id);

        if (!buyer) {
            return next({ status: 404, message: 'Buyer not found' });
        }
        let updatedBuyer = await BuyersService.update(buyer._id, req.body.value);
        updatedBuyer = updatedBuyer.toObject();

        updatedBuyer.autosave_updated_at = req.body.value.autosave_updated_at;
        res.status(200).json(updatedBuyer);

    } catch (error) {
        next(error);
    }
}

module.exports = {
    index,
    search,
    editAjax,
    deleteAjax,
    newBuyerAjax,
    update,
};