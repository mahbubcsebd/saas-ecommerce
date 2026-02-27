const shippingService = require('../services/shipping.service');
const prisma = require('../config/prisma');

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
        const zones = await shippingService.getAllZones();
        res.json({ success: true, data: zones });
    } catch (error) {
        next(error);
    }
};

exports.getZoneById = async (req, res, next) => {
    try {
        const zone = await shippingService.getZoneById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
        res.json({ success: true, data: zone });
    } catch (error) {
        next(error);
    }
};

exports.createZone = async (req, res, next) => {
    try {
        const zone = await shippingService.createZone(req.body);
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        next(error);
    }
};

exports.updateZone = async (req, res, next) => {
    try {
        const zone = await shippingService.updateZone(req.params.id, req.body);
        res.json({ success: true, data: zone });
    } catch (error) {
        next(error);
    }
};

exports.deleteZone = async (req, res, next) => {
    try {
        await shippingService.deleteZone(req.params.id);
        res.json({ success: true, message: 'Zone deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.createRate = async (req, res, next) => {
    try {
        const rate = await shippingService.createRate(req.params.zoneId, req.body);
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        next(error);
    }
};

exports.updateRate = async (req, res, next) => {
    try {
        const rate = await shippingService.updateRate(req.params.id, req.body);
        res.json({ success: true, data: rate });
    } catch (error) {
        next(error);
    }
};

exports.deleteRate = async (req, res, next) => {
    try {
        await shippingService.deleteRate(req.params.id);
        res.json({ success: true, message: 'Rate deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getPackagings = async (req, res, next) => {
    try {
        const packagings = await prisma.packaging.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: packagings });
    } catch (error) {
        next(error);
    }
};

exports.getPackagingById = async (req, res, next) => {
    try {
        const packaging = await prisma.packaging.findUnique({
            where: { id: req.params.id }
        });
        if (!packaging) return res.status(404).json({ success: false, message: 'Packaging not found' });
        res.json({ success: true, data: packaging });
    } catch (error) {
        next(error);
    }
};

exports.createPackaging = async (req, res, next) => {
    try {
        const packaging = await prisma.packaging.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: packaging });
    } catch (error) {
        next(error);
    }
};

exports.updatePackaging = async (req, res, next) => {
    try {
        const packaging = await prisma.packaging.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: packaging });
    } catch (error) {
        next(error);
    }
};

exports.deletePackaging = async (req, res, next) => {
    try {
        await prisma.packaging.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Packaging deleted successfully' });
    } catch (error) {
        next(error);
    }
};
