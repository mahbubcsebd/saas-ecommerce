const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { authMiddleware: protect, adminMiddleware: admin } = require('../middlewares/auth.middleware');

// Tax Rates
router.get('/rates', protect, taxController.getTaxRates);
router.post('/rates', protect, taxController.createTaxRate);
router.put('/rates/:id', protect, taxController.updateTaxRate);
router.delete('/rates/:id', protect, taxController.deleteTaxRate);

// Tax Classes
router.get('/classes', protect, taxController.getTaxClasses);
router.post('/classes', protect, taxController.createTaxClass);
router.put('/classes/:id', protect, taxController.updateTaxClass);
router.delete('/classes/:id', protect, taxController.deleteTaxClass);

module.exports = router;
