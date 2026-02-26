const courierService = require('../services/courier.service');

exports.getAllCouriers = async (req, res, next) => {
    try {
        const couriers = await courierService.getAllCouriers();
        res.json({ success: true, data: couriers });
    } catch (error) {
        next(error);
    }
};

exports.getCourierById = async (req, res, next) => {
    try {
        const courier = await courierService.getCourierById(req.params.id);
        if (!courier) return res.status(404).json({ success: false, message: 'Courier not found' });
        res.json({ success: true, data: courier });
    } catch (error) {
        next(error);
    }
};

exports.createCourier = async (req, res, next) => {
    try {
        const courier = await courierService.createCourier(req.body);
        res.status(201).json({ success: true, data: courier });
    } catch (error) {
        next(error);
    }
};

exports.updateCourier = async (req, res, next) => {
    try {
        const courier = await courierService.updateCourier(req.params.id, req.body);
        res.json({ success: true, data: courier });
    } catch (error) {
        next(error);
    }
};

exports.deleteCourier = async (req, res, next) => {
    try {
        await courierService.deleteCourier(req.params.id);
        res.json({ success: true, message: 'Courier deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
