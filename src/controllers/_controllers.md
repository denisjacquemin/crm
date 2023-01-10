# Controllers

The best practice for controllers is to keep them free of business logic. Their single job is to get any relevant data from the req object and dispatch it to services. The returned value should be ready to be sent in a response using res.

Make sure you don’t pass any web layer objects (i.e. req, res, headers, etc) into your services. Instead, unwrap any values like URL parameters, header values, body data, etc before dispatching to the service layer.

Here’s an example controller module.

    const { getProduct } = require('../services/products')

    module.exports = () => {
        getProduct: async (req, res) => {
            try {
                const id = req.params.id
                const product = await getProduct(id)
                res.json(product)
            }
            catch (err) {
            res.status(500).send(err)
            }
        }
    }