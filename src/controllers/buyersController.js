const { ObjectId } = require('mongodb');
const BuyerService = require('../services/buyers.service');
const { BuyerTypesenseService } = require('../services/buyers.typesense.service');
const DateHelper = require('../lib/date-helpers');
// rquire _.extend from underscore
const mergeObjects = require('../lib/object-helper').mergeObjects;
const _ = require('lodash');


async function newBuyerAjax(req, res) {
    try {
        const buyerFromReq = req.body;
        const buyerService = await BuyerService.getInstance();
        const buyerTypesenseService = new BuyerTypesenseService(req.db);
        const buyer = await buyerService.create(mergeObjects(
            buyerFromReq, {
                company_id: ObjectId(req.session.current_company._id),
                updated_at: DateHelper.toISO8601(DateHelper.nowUtc()),
                created_by_user_id: ObjectId(req.session.user._id)
            }));
        await buyerTypesenseService.create(buyer);
        res.json({ buyer });
    } catch (err) {
        console.error(err.stack);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

async function search(req, res) {
    try {
        const buyerTypesenseService = new BuyerTypesenseService();
        const searchParameters = {
            q: req.query.q,
            filter_by: `company_id:${req.session.current_company._id}`,
            sort_by: 'created_at:desc',
            per_page: 30,
            query_by: 'name,address,city,vat_number'
        };

        const searchResults = await buyerTypesenseService.search(searchParameters);
        
        // Extract the document property from each hit and return an array of buyers
        const buyers = searchResults.hits.map(hit => hit.document);

        res.json(buyers);
    } catch (err) {
        console.error(err.stack);
        res.status(500).send(req.i18n.t('common.unknown_error'));
    }
}

module.exports = {
    newBuyerAjax,
    search
};