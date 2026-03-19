const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { authMiddleware: protect, isAdmin } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(isAdmin);

router.route('/').get(supplierController.getSuppliers).post(supplierController.createSupplier);

router
  .route('/:id')
  .get(supplierController.getSupplier)
  .put(supplierController.updateSupplier)
  .delete(supplierController.deleteSupplier);

module.exports = router;
