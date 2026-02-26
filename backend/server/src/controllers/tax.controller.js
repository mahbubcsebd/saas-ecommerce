const prisma = require('../config/prisma');

// Tax Rates
exports.getTaxRates = async (req, res, next) => {
    try {
        const rates = await prisma.taxRate.findMany({
            include: { taxClasses: true }
        });
        res.json({ success: true, data: rates });
    } catch (error) {
        next(error);
    }
};

exports.createTaxRate = async (req, res, next) => {
    try {
        const rate = await prisma.taxRate.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: rate });
    } catch (error) {
        next(error);
    }
};

exports.updateTaxRate = async (req, res, next) => {
    try {
        const rate = await prisma.taxRate.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: rate });
    } catch (error) {
        next(error);
    }
};

exports.deleteTaxRate = async (req, res, next) => {
    try {
        await prisma.taxRate.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Tax rate deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Tax Classes
exports.getTaxClasses = async (req, res, next) => {
    try {
        const classes = await prisma.taxClass.findMany({
            include: { taxRates: true }
        });
        res.json({ success: true, data: classes });
    } catch (error) {
        next(error);
    }
};

exports.createTaxClass = async (req, res, next) => {
    try {
        const taxClass = await prisma.taxClass.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: taxClass });
    } catch (error) {
        next(error);
    }
};

exports.updateTaxClass = async (req, res, next) => {
    try {
        const taxClass = await prisma.taxClass.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: taxClass });
    } catch (error) {
        next(error);
    }
};

exports.deleteTaxClass = async (req, res, next) => {
    try {
        await prisma.taxClass.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Tax class deleted successfully' });
    } catch (error) {
        next(error);
    }
};
