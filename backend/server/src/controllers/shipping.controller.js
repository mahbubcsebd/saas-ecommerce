const shippingService = require('../services/shipping.service');

exports.calculateShipping = async (req, res, next) => {
    try {
        const { country, state, city, postalCode, cartTotal, cartWeight } = req.body;

        if (!country) {
            return res.status(400).json({ success: false, message: 'Country is required' });
        }

        const options = await shippingService.calculateShipping({
            country,
            state,
            city,
            postalCode,
            cartTotal,
            cartWeight
        });

        res.json({
            success: true,
            options
        });

    } catch (error) {
        next(error);
    }
};

exports.getZones = async (req, res, next) => {
    try {
        const zones = await shippingService.getActiveZones();
        res.json({
            success: true,
            data: zones
        });
    } catch (error) {
        next(error);
    }
};
