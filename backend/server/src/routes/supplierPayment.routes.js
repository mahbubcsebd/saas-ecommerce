const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPayment.controller');
const { authMiddleware: protect, isAdmin } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(isAdmin);

router.post('/', supplierPaymentController.createPayment);
router.get('/ledger/:supplierId', supplierPaymentController.getSupplierLedger);

module.exports = router;
