const BuyersService = require('../services/buyers.service');
const geoip = require('geoip-lite');

async function index(req, res, next) {
    try {
        const buyers = await BuyersService.search({ 
            q: '*',
            company_id: req.session.current_company._id,
            sort: { createdAt: -1 },
            limit: 30
        });
        const geo = geoip.lookup(req.ip);

        res.render('buyers/index', {
            layout: false,
            buyers,
            defaultCountry: geo && geo.country,
        });
    } catch (err) {
        next(err);
    }
}

async function search(req, res, next) {
    try {
        let sort = { createdAt: -1 };
        if (req.query.sort === 'nameasc') {
            sort = { name: 1 };
        }

        const buyers = await BuyersService.search({
            q: req.query.q,
            company_id: req.session.current_company._id,
            sort,
            limit: 30
        });

        res.status(200).json(buyers);
    } catch (error) {
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
}

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
}

async function newBuyerAjax(req, res, next) {
    try {
        const buyer = await createNewBuyer(req);
        res.status(200).json(buyer);
    } catch (error) {
        next(error);
    }
}

async function createNewBuyer(req) {
    try {
        const buyerData = {
            company_id: req.session.current_company._id,
            created_by_user_id: req.session.user._id,
            slug: `${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`,
            name: req.i18n.t('buyers.controller.default_company_name'),
            country: req.session.current_company.country
        };

        const buyerCreated = await BuyersService.create(buyerData);
        return buyerCreated ? buyerCreated.toObject() : null;
    } catch (error) {
        console.error('Failed to create buyer:', error);
        throw error;
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