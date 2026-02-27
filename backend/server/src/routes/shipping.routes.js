const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Public/Common
router.post('/calculate', shippingController.calculateShipping);
router.get('/zones', shippingController.getZones);

// Admin Only
router.get('/zones/:id', authenticate, isAdmin, shippingController.getZoneById);
router.post('/zones', authenticate, isAdmin, shippingController.createZone);
router.put('/zones/:id', authenticate, isAdmin, shippingController.updateZone);
router.delete('/zones/:id', authenticate, isAdmin, shippingController.deleteZone);

// Rates
router.post('/zones/:zoneId/rates', authenticate, isAdmin, shippingController.createRate);
router.put('/rates/:id', authenticate, isAdmin, shippingController.updateRate);
router.delete('/rates/:id', authenticate, isAdmin, shippingController.deleteRate);

// Packaging
router.get('/packaging', authenticate, isAdmin, shippingController.getPackagings);
router.get('/packaging/:id', authenticate, isAdmin, shippingController.getPackagingById);
router.post('/packaging', authenticate, isAdmin, shippingController.createPackaging);
router.put('/packaging/:id', authenticate, isAdmin, shippingController.updatePackaging);
router.delete('/packaging/:id', authenticate, isAdmin, shippingController.deletePackaging);

module.exports = router;
