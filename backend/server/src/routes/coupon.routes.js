const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// Public
router.post('/validate', couponController.validateCoupon);
router.get('/generate-code', couponController.generateCode);

// Admin only
router.use(authMiddleware, isManager);
router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.get('/:id', couponController.getCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id/toggle', couponController.toggleCoupon);

module.exports = router;
