const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');

router.post('/calculate', shippingController.calculateShipping);
router.get('/zones', shippingController.getZones);

module.exports = router;
