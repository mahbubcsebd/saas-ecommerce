const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { authMiddleware: protect, isAdmin: admin } = require('../middlewares/auth.middleware');

// Public: None? Maybe specific check for validity
// Admin: CRUD

router
  .route('/')
  .post(protect, admin, discountController.createDiscount)
  .get(protect, admin, discountController.getDiscounts);

router
  .route('/:id')
  .get(protect, admin, discountController.getDiscount)
  .put(protect, admin, discountController.updateDiscount)
  .delete(protect, admin, discountController.deleteDiscount);

module.exports = router;
