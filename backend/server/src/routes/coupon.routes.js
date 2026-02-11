const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
// Add middleware if authentication required, though validateAndApply handles missing user gracefully
// but for perUserLimit to work, we need user.

router.post('/validate', couponController.validateCoupon);

module.exports = router;
